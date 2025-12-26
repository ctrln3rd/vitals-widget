/**
 * VitalItem - Circular vital indicator with icon inside
 */

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import { VitalType } from './config.js';
import { RingProgress } from './ring.js';

// Define instance type
type RingProgressInstance = InstanceType<typeof RingProgress>;

export const VitalItem = GObject.registerClass(
class VitalItem extends St.BoxLayout {
    private _type: VitalType;
    private _settings: any;
    private _container!: St.Widget;
    private _ringProgress!: RingProgressInstance;
    private _icon?: St.Icon;
    private _label?: St.Label;
    private _currentValue: number = 0;

    constructor(type: VitalType, settings: any) {
        super({
            style_class: 'vital-item',
            vertical: true,
            reactive: false,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._type = type;
        this._settings = settings;

        this._buildUI();
        this._connectSettings();
        this._updateStyle();
    }

    private _buildUI(): void {
        const isVertical = this._settings.get_string('vital-orientation') === 'vertical';
        this.vertical = isVertical
        this._container = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._ringProgress = new RingProgress(this._type, this._settings) as RingProgressInstance;
        this._container.add_child(this._ringProgress);

        if (this._settings.get_boolean('show-icons')) {
            this._icon = this._createIcon();
            this._container.add_child(this._icon);
        }

        this.add_child(this._container);

        if (this._settings.get_boolean('show-labels')) {
            this._label = new St.Label({
                text: '0%',
                style_class: 'vital-label',
                x_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(this._label);
        }
    }

    private _createIcon(): St.Icon {
        const iconPath = this._getIconPath();
        const gicon = Gio.icon_new_for_string(iconPath);
        const diameter = this._settings.get_int('ring-diameter');
        const iconSize = Math.round(diameter * 0.5);
        
        return new St.Icon({
            gicon,
            style_class: 'vital-icon',
            icon_size: iconSize,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true,
        });
    }

    private _getIconPath(): string {
        const extension = this._settings.get_string('extension-path');
        const iconMap: Record<VitalType, string> = {
            [VitalType.CPU]: 'cpu.svg',
            [VitalType.RAM]: 'ram.svg',
            [VitalType.STORAGE]: 'storage.svg',
            [VitalType.TEMP]: 'temp.svg',
            [VitalType.GPU]: 'gpu.svg',
        };
        return `${extension}/svg/${iconMap[this._type]}`;
    }

    private _connectSettings(): void {
        this._settings.connect('changed::show-icons', () => this._rebuildUI());
        this._settings.connect('changed::show-labels', () => this._rebuildUI());
        this._settings.connect(`changed::${this._type}-color`, () => this._updateStyle());
        this._settings.connect('changed::icon-color', () => this._updateStyle());
        this._settings.connect('changed::ring-diameter', () => this._rebuildUI());
        this._settings.connect('changed::vital-orientation', () => this._rebuildUI());
        this._settings.connect('changed::inactive-ring-color', () => this._updateStyle());
        this._settings.connect('changed::show-labels', () => this._rebuildUI());
        this._settings.connect('changed::label-font-size', () => this._updateStyle());
    }

    private _updateStyle(): void {
        const vitalColor = this._settings.get_string(`${this._type}-color`);
        const iconColor = this._settings.get_string('icon-color');
        const fontSize = this._settings.get_int('label-font-size'); // Fetch new setting

        if (this._icon) {
            this._icon.set_style(`color: ${iconColor};`);
        }

        if (this._label) {
            this._label.set_style(`
                color: ${vitalColor};
                font-size: ${fontSize}px;
                font-weight: 500;
                margin-top: 4px;
            `);
        }
    }

    private _rebuildUI(): void {
        this.destroy_all_children();
        this._buildUI();
        this.update(this._currentValue);
    }

    update(value: number): void {
        this._currentValue = Math.min(100, Math.max(0, value));
        this._ringProgress.setValue(this._currentValue);
        if (this._label) {
            this._label.text = `${Math.round(this._currentValue)}%`;
        }
    }

    destroy(): void {
        this._ringProgress?.destroy();
        super.destroy();
    }
});