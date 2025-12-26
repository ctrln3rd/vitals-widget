/**
 * TempSensor - CPU temperature monitoring
 * 
 * Reads from thermal zones to get CPU temperature
 * Maps temperature to 0-100 scale (30°C-90°C range)
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class TempSensor {
    private _thermalPaths: string[] = [];
    private readonly MIN_TEMP = 30; // 30°C = 0%
    private readonly MAX_TEMP = 90; // 90°C = 100%

    constructor() {
        this._findThermalZones();
    }

    /**
     * Find available thermal zones
     */
    private _findThermalZones(): void {
        const basePath = '/sys/class/thermal';
        
        try {
            const dir = Gio.File.new_for_path(basePath);
            const enumerator = dir.enumerate_children(
                'standard::name',
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const name = fileInfo.get_name();
                
                // Look for thermal zones
                if (name.startsWith('thermal_zone')) {
                    const typePath = `${basePath}/${name}/type`;
                    const tempPath = `${basePath}/${name}/temp`;
                    
                    // Check if this is a CPU-related zone
                    try {
                        const typeFile = Gio.File.new_for_path(typePath);
                        const [success, contents] = typeFile.load_contents(null);
                        
                        if (success && contents) {
                            const type = new TextDecoder().decode(contents).trim().toLowerCase();
                            
                            // Look for CPU/processor related thermal zones
                            if (type.includes('cpu') || 
                                type.includes('processor') || 
                                type.includes('x86_pkg_temp')) {
                                this._thermalPaths.push(tempPath);
                            }
                        }
                    } catch (e) {
                        // Skip this zone
                    }
                }
            }

            enumerator.close(null);
        } catch (e) {
            logError(e as Error, 'TempSensor - finding zones');
        }

        // Fallback to common paths if none found
        if (this._thermalPaths.length === 0) {
            this._thermalPaths = [
                '/sys/class/thermal/thermal_zone0/temp',
                '/sys/class/hwmon/hwmon0/temp1_input',
                '/sys/class/hwmon/hwmon1/temp1_input',
            ];
        }
    }

    /**
     * Get current temperature as percentage (0-100)
     */
    getValue(): number {
        let maxTemp = 0;

        // Try each thermal path
        for (const path of this._thermalPaths) {
            try {
                const file = Gio.File.new_for_path(path);
                
                if (!file.query_exists(null)) {
                    continue;
                }

                const [success, contents] = file.load_contents(null);
                
                if (!success || !contents) {
                    continue;
                }

                const data = new TextDecoder().decode(contents).trim();
                const temp = parseInt(data) / 1000; // Convert from millidegrees

                if (!isNaN(temp) && temp > maxTemp) {
                    maxTemp = temp;
                }
            } catch (e) {
                // Try next path
            }
        }

        // Map temperature to 0-100 scale
        if (maxTemp === 0) {
            return 0;
        }

        const percentage = ((maxTemp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // No cleanup needed
    }
}