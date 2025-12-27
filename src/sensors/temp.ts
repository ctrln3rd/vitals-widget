/**
 * TempSensor - CPU temperature monitoring
 * * Reads from thermal zones to get CPU temperature
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
        this._thermalPaths = [];
        
        try {
            const dir = Gio.File.new_for_path(basePath);
            
            // Check if directory exists before enumerating
            if (!dir.query_exists(null)) {
                console.warn('TempSensor: Thermal directory not found');
                return;
            }

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
                            
                            // Improved filter: Look for CPU/processor/core related thermal zones
                            // Added k10temp, tctl, tdie for AMD support
                            if (type.includes('cpu') || 
                                type.includes('processor') || 
                                type.includes('x86_pkg_temp') ||
                                type.includes('k10temp') ||
                                type.includes('tctl') ||
                                type.includes('tdie') ||
                                type.includes('core')) {
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
            console.warn(`TempSensor error finding zones: ${e}`);
        }

        // Fallback to common paths if none found
        if (this._thermalPaths.length === 0) {
            const commonPaths = [
                '/sys/class/thermal/thermal_zone0/temp',
                '/sys/class/hwmon/hwmon0/temp1_input', // Often CPU on some systems
                '/sys/class/hwmon/hwmon1/temp1_input',
                '/sys/class/hwmon/hwmon2/temp1_input',
                '/sys/class/hwmon/hwmon0/device/temp1_input'
            ];
            
            for (const path of commonPaths) {
                if (Gio.File.new_for_path(path).query_exists(null)) {
                    this._thermalPaths.push(path);
                }
            }
        }
        
        console.log(`TempSensor: Found ${this._thermalPaths.length} thermal zones: ${this._thermalPaths.join(', ')}`);
    }

    /**
     * Get current temperature as percentage (0-100)
     * Calculates the AVERAGE temperature of all detected sensors.
     */
    getValue(): number {
        let totalTemp = 0;
        let count = 0;

        // Try each thermal path
        for (const path of this._thermalPaths) {
            try {
                const file = Gio.File.new_for_path(path);
                const [success, contents] = file.load_contents(null);
                
                if (!success || !contents) {
                    continue;
                }

                const data = new TextDecoder().decode(contents).trim();
                const tempMillidegrees = parseInt(data);

                if (!isNaN(tempMillidegrees)) {
                    const tempCelsius = tempMillidegrees / 1000;
                    
                    // Sanity check: Discard implausible values (often 0, -273, or 1000+)
                    // A running CPU should generally be between 5°C and 150°C
                    if (tempCelsius > 5 && tempCelsius < 150) {
                        totalTemp += tempCelsius;
                        count++;
                    }
                }
            } catch (e) {
                // Try next path
            }
        }

        // Return 0 if no valid sensors read
        if (count === 0) {
            return 0;
        }

        const avgTemp = totalTemp / count;

        // Map average temperature to 0-100 scale
        const percentage = ((avgTemp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // No cleanup needed
    }
}