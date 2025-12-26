/**
 * RAMSensor - Memory utilization monitoring
 * 
 * Reads /proc/meminfo to calculate RAM usage percentage
 */

import Gio from 'gi://Gio';

export class RAMSensor {
    constructor() {}

    /**
     * Get current RAM utilization (0-100)
     */
    getValue(): number {
        try {
            const file = Gio.File.new_for_path('/proc/meminfo');
            const [success, contents] = file.load_contents(null);
            
            if (!success || !contents) {
                return 0;
            }

            const data = new TextDecoder().decode(contents);
            const lines = data.split('\n');

            let memTotal = 0;
            let memAvailable = 0;

            // Parse memory information
            for (const line of lines) {
                if (line.startsWith('MemTotal:')) {
                    memTotal = this._parseMemValue(line);
                } else if (line.startsWith('MemAvailable:')) {
                    memAvailable = this._parseMemValue(line);
                }

                // Stop once we have both values
                if (memTotal > 0 && memAvailable > 0) {
                    break;
                }
            }

            if (memTotal === 0) {
                return 0;
            }

            // Calculate usage percentage
            const memUsed = memTotal - memAvailable;
            const usage = (memUsed / memTotal) * 100;

            return Math.max(0, Math.min(100, usage));
        } catch (e) {
            logError(e as Error, 'RAMSensor');
            return 0;
        }
    }

    /**
     * Parse memory value from line (in kB)
     */
    private _parseMemValue(line: string): number {
        const match = line.match(/:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // No cleanup needed
    }
}