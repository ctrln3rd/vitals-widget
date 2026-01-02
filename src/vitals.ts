import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib'
import { VitalType } from './config.js';
import { RingProgress } from './ring.js';
import { ICONS } from './icons.js';

type RingProgressInstance = InstanceType<typeof RingProgress>;

export const VitalItem = GObject.registerClass(
class VitalItem extends St.BoxLayout {
    private _type: VitalType;
    private _settings: any;
    private _ringProgress: RingProgressInstance | null = null;
    private _icon: St.Icon | null = null;
    private _label: St.Label | null = null;
    private _handlerIds: number[] = [];
    private _currentValue: number = 0;

    constructor(type: VitalType, settings: any) {
        super({
            style_class: 'vital-item',
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._type = type;
        this._settings = settings;

        this._buildUI();
        this._connectSettings();
        this._updateStyle();
    }

    private _getGIcon(color: string): Gio.Icon {
        const svgFunc = ICONS[this._type as keyof typeof ICONS];
        const svgString = svgFunc ? svgFunc(color) : '';
        
        const encoder = new TextEncoder();
        const data = encoder.encode(svgString);
        const bytes = new GLib.Bytes(data);
        
        return Gio.BytesIcon.new(bytes);
    }

    private _buildUI(): void {
        this.vertical = this._settings.get_string('vital-orientation') === 'vertical';
        const container = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
        });

        this._ringProgress = new RingProgress(this._type, this._settings) as RingProgressInstance;
        container.add_child(this._ringProgress);

        if (this._settings.get_boolean('show-icons')) {
            this._icon = this._createIcon();
            container.add_child(this._icon);
        }

        this.add_child(container);

        if (this._settings.get_boolean('show-labels')) {
            this._label = new St.Label({
                text: '',
                style_class: 'vital-label',
                x_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(this._label);
        }
    }

    private _createIcon(): St.Icon {
        const diameter = this._settings.get_int('ring-diameter');
        const iconColor = this._settings.get_string('icon-color');
        return new St.Icon({
            gicon: this._getGIcon(iconColor),
            style_class: 'vital-icon',
            icon_size: Math.round(diameter * 0.5),
            style: 'stroke-width: 1px;',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true, y_expand: true,
        });
    }

    private _connectSettings(): void {
        const keys = ['show-icons', 'show-labels', 'ring-diameter', 'vital-orientation'];
        keys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => {
                this._rebuildUI();
            }));
        });

        const styleKeys = [`${this._type}-color`, 'icon-color', 'inactive-ring-color', 'label-font-size'];
        styleKeys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => {
                this._updateStyle();
            }));
        });
    }

    private _updateStyle(): void {
        const iconColor = this._settings.get_string('icon-color');
        
        if (this._icon) {
            this._icon.gicon = this._getGIcon(iconColor);
        }

        if (this._label) {
            this._label.set_style(`color: ${iconColor}; font-size: ${this._settings.get_int('label-font-size')}px;`);
        }
    }

    private _rebuildUI(): void {
        if (this._ringProgress) {
            this._ringProgress.destroy();
        }
        
        this.destroy_all_children();

        this._label = null;
        this._icon = null;
        this._ringProgress = null;

        this._buildUI();
        
        if (this._ringProgress) {
            this.update(this._currentValue);
        }
    }

    update(value: number): void {
        try {
            // Fix: Handle NaN, null, undefined values properly
            const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
            this._currentValue = Math.min(100, Math.max(0, safeValue));
            
            if (this._ringProgress) {
                this._ringProgress.setValue(this._currentValue);
            }
            
            if (this._label) {
                this._label.set_text(`${Math.round(this._currentValue)}%`);
            }
        } catch (e) {
            console.debug(`[VitalsWidget] Update error: ${e}`);
        }
    }

    destroy(): void {
        this._handlerIds.forEach(id => this._settings.disconnect(id));
        this._handlerIds = [];
        
        if (this._ringProgress) {
            this._ringProgress.destroy();
            this._ringProgress = null;
        }
        
        this._label = null;
        this._icon = null;
        
        super.destroy();
    }
});