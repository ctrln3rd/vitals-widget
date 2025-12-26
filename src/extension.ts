/**
 * VitalsWidget - Desktop Widget Extension
 */

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { VitalItem } from './vitals.js';
import { VitalType } from './config.js';
import { CPUSensor } from './sensors/cpu.js';
import { RAMSensor } from './sensors/ram.js';
import { StorageSensor } from './sensors/storage.js';
import { TempSensor } from './sensors/temp.js';
import { GPUSensor } from './sensors/gpu.js';

// Define instance types for GObject registered classes
type VitalItemInstance = InstanceType<typeof VitalItem>;

const VitalsWidget = GObject.registerClass(
class VitalsWidget extends St.BoxLayout {
    private _vitals: Map<VitalType, VitalItemInstance>;
    private _sensors: Map<VitalType, any>;
    private _settings: any;
    private _updateInterval?: number;
    private _intervals: Map<VitalType, number> = new Map();
    private _dragStartX: number = 0;
    private _dragStartY: number = 0;
    private _isDragging: boolean = false;

    constructor(settings: any) {
        super({
            style_class: 'vitals-widget-container',
            vertical: false,
            reactive: true,
            track_hover: true,
            can_focus: true,
        });

        this._settings = settings;
        this._vitals = new Map();
        this._sensors = new Map();

        this._buildUI();
        this._initializeSensors();
        this._connectSettings();
        this._updatePosition();
        //this._setupDragging();
        this._startUpdates();
    }

    private _buildUI(): void {
        this._updateContainerStyle();
    }

    /*private _setupDragging(): void {
        this.connect('button-press-event', (_actor: any, event: any) => {
            if (event.get_button() === 1) {
                this._isDragging = true;
                const [x, y] = event.get_coords();
                this._dragStartX = x - this.x;
                this._dragStartY = y - this.y;
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('button-release-event', () => {
            if (this._isDragging) {
                this._isDragging = false;
                this._savePosition();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('motion-event', (_actor: any, event: any) => {
            if (this._isDragging) {
                const [x, y] = event.get_coords();
                this.set_position(
                    x - this._dragStartX,
                    y - this._dragStartY
                );
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
    }*/

    /*private _savePosition(): void {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) return;

        const xPercent = (this.x / monitor.width) * 100;
        const yPercent = (this.y / monitor.height) * 100;
        
        this._settings.set_double('position-x', xPercent);
        this._settings.set_double('position-y', yPercent);
    }*/

    private _initializeSensors(): void {
        this._sensors.set(VitalType.CPU, new CPUSensor());
        this._sensors.set(VitalType.RAM, new RAMSensor());
        this._sensors.set(VitalType.STORAGE, new StorageSensor());
        this._sensors.set(VitalType.TEMP, new TempSensor());
        this._sensors.set(VitalType.GPU, new GPUSensor());

        Object.values(VitalType).forEach((type) => {
            const vital = new VitalItem(type, this._settings) as VitalItemInstance;
            this._vitals.set(type, vital);
            this.add_child(vital);
        });

        this._updateVitalsVisibility();
    }

    private _connectSettings(): void {
        this._settings.connect('changed::position-x', () => this._updatePosition());
        this._settings.connect('changed::position-y', () => this._updatePosition());

        const styleKeys = [
            'background-color', 'border-color', 'border-radius', 
            'vital-spacing', 'padding-horizontal', 'padding-vertical', 'orientation'
        ];
        styleKeys.forEach(key => {
            this._settings.connect(`changed::${key}`, () => {
                this._updateContainerStyle();
                // Update BoxLayout orientation
                this.vertical = this._settings.get_string('orientation') === 'vertical';
            });
        });

        Object.values(VitalType).forEach((type) => {
            this._settings.connect(`changed::show-${type}`, () => this._updateVitalsVisibility());
            
            // NEW: Listen for interval changes for each specific vital
            this._settings.connect(`changed::${type}-update-interval`, () => {
                this._restartVitalTimer(type);
            });
        });
    }

    private _updateContainerStyle(): void {
        const bgColor = this._settings.get_string('background-color');
        const borderColor = this._settings.get_string('border-color');
        const borderRadius = this._settings.get_int('border-radius');
        const spacing = this._settings.get_int('vital-spacing');
        const padH = this._settings.get_int('padding-horizontal');
        const padV = this._settings.get_int('padding-vertical');

        this.set_style(`
            background-color: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: ${borderRadius}px;
            padding: ${padV}px ${padH}px;
            spacing: ${spacing}px;
        `);
    }

    private _updateVitalsVisibility(): void {
        this._vitals.forEach((vital, type) => {
            const isEnabled = this._settings.get_boolean(`show-${type}`);
            vital.visible = isEnabled;
        });
    }

    private _updatePosition(): void {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) return;

        const xPercent = this._settings.get_double('position-x');
        const yPercent = this._settings.get_double('position-y');

        const x = (monitor.width * xPercent) / 100;
        const y = (monitor.height * yPercent) / 100;

        this.set_position(Math.round(x), Math.round(y));
    }

    private _startUpdates(): void {
        // Clear any old intervals
        this._intervals?.forEach(id => GLib.source_remove(id));
        this._intervals = new Map();

        this._sensors.forEach((sensor, type) => {
            const interval = this._settings.get_int(`${type}-update-interval`);
            const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
                const vital = this._vitals.get(type);
                if (vital && vital.visible) {
                    vital.update(sensor.getValue());
                }
                return GLib.SOURCE_CONTINUE;
            });
            this._intervals.set(type, id);
        });
    }

    private _restartVitalTimer(type: VitalType): void {
        // Clear existing interval for this type
        const oldId = this._intervals.get(type);
        if (oldId) {
            GLib.source_remove(oldId);
        }

        // Start new interval with updated value
        const interval = this._settings.get_int(`${type}-update-interval`);
        const newId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
            const vital = this._vitals.get(type);
            const sensor = this._sensors.get(type);
            if (vital && vital.visible && sensor) {
                vital.update(sensor.getValue());
            }
            return GLib.SOURCE_CONTINUE;
        });

        this._intervals.set(type, newId);
    }

    /*private _updateSensors(): void {
        this._sensors.forEach((sensor, type) => {
            const vital = this._vitals.get(type);
            if (vital && vital.visible) {
                const value = sensor.getValue();
                vital.update(value);
            }
        });
    }*/

    destroy(): void {
        if (this._updateInterval) {
            GLib.source_remove(this._updateInterval);
            this._updateInterval = undefined;
        }
        this._sensors.forEach(sensor => sensor.destroy?.());
        this._vitals.forEach(vital => vital.destroy());
        super.destroy();
    }
});

type VitalsWidgetInstance = InstanceType<typeof VitalsWidget>;

export default class VitalsWidgetExtension extends Extension {
    private _widget?: VitalsWidgetInstance;

    enable(): void {
        const settings = this.getSettings();
        settings.set_string('extension-path', this.path);
        
        this._widget = new VitalsWidget(settings) as VitalsWidgetInstance;
        
        Main.layoutManager.addChrome(this._widget, {
            affectsStruts: false,
            trackFullscreen: false,
        });
    }

    disable(): void {
        if (this._widget) {
            Main.layoutManager.removeChrome(this._widget);
            this._widget.destroy();
            this._widget = undefined;
        }
    }
}