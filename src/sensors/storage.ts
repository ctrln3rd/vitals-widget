/**
 * StorageSensor - Disk usage monitoring
 * 
 * Uses df command to get root filesystem usage
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class StorageSensor {
    constructor() {}

    /**
     * Get current storage utilization (0-100)
     */
    getValue(): number {
        try {
            // Execute df command for root filesystem
            const [success, stdout] = GLib.spawn_command_line_sync('df -h /');
            
            if (!success || !stdout) {
                return 0;
            }

            const output = new TextDecoder().decode(stdout);
            const lines = output.split('\n');

            // Skip header line, get data line
            if (lines.length < 2) {
                return 0;
            }

            const dataLine = lines[1];
            const columns = dataLine.split(/\s+/);

            // Column 4 typically contains the usage percentage (e.g., "45%")
            if (columns.length >= 5) {
                const usageStr = columns[4];
                const match = usageStr.match(/(\d+)%/);
                
                if (match) {
                    return parseInt(match[1]);
                }
            }

            return 0;
        } catch (e) {
            logError(e as Error, 'StorageSensor');
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