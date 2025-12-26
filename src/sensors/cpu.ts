/**
 * CPUSensor - CPU utilization monitoring
 * 
 * Reads /proc/stat to calculate CPU usage percentage
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class CPUSensor {
    private _lastTotal: number = 0;
    private _lastIdle: number = 0;

    constructor() {
        // Initialize with first reading
        this._updateStats();
    }

    /**
     * Get current CPU utilization (0-100)
     */
    getValue(): number {
        return this._updateStats();
    }

    /**
     * Read and calculate CPU usage from /proc/stat
     */
    private _updateStats(): number {
        try {
            const file = Gio.File.new_for_path('/proc/stat');
            const [success, contents] = file.load_contents(null);
            
            if (!success || !contents) {
                return 0;
            }

            const data = new TextDecoder().decode(contents);
            const lines = data.split('\n');
            
            // First line contains aggregate CPU stats
            const cpuLine = lines[0];
            if (!cpuLine.startsWith('cpu ')) {
                return 0;
            }

            // Parse CPU times
            const times = cpuLine
                .split(/\s+/)
                .slice(1)
                .map(x => parseInt(x))
                .filter(x => !isNaN(x));

            if (times.length < 4) {
                return 0;
            }

            // Calculate total and idle time
            const idle = times[3]; // idle time
            const total = times.reduce((acc, val) => acc + val, 0);

            // Calculate usage percentage
            const totalDelta = total - this._lastTotal;
            const idleDelta = idle - this._lastIdle;

            let usage = 0;
            if (totalDelta > 0) {
                usage = ((totalDelta - idleDelta) / totalDelta) * 100;
            }

            // Store for next calculation
            this._lastTotal = total;
            this._lastIdle = idle;

            return Math.max(0, Math.min(100, usage));
        } catch (e) {
            logError(e as Error, 'CPUSensor');
            return 0;
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // No cleanup needed
    }
}