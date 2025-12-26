import GLib from 'gi://GLib';

export class GPUSensor {
    private _gpuType: 'nvidia' | 'amd' | 'none' = 'none';

    constructor() {
        this._detectGPU();
    }

    /**
     * Detect available GPU type using GLib.find_program_in_path
     * This prevents SpawnErrors because it doesn't execute a process.
     */
    private _detectGPU(): void {
        if (GLib.find_program_in_path('nvidia-smi')) {
            this._gpuType = 'nvidia';
        } else if (GLib.find_program_in_path('radeontop')) {
            this._gpuType = 'amd';
        } else {
            this._gpuType = 'none';
        }
    }

    /**
     * Get current GPU utilization (0-100)
     */
    getValue(): number {
        // If no GPU was detected during init, don't even try to run commands
        if (this._gpuType === 'none') return 0;

        switch (this._gpuType) {
            case 'nvidia':
                return this._getNvidiaUsage();
            case 'amd':
                return this._getAMDUsage();
            default:
                return 0;
        }
    }

    private _getNvidiaUsage(): number {
        try {
            // We already verified nvidia-smi exists in _detectGPU,
            // but we use a try-catch just in case of unexpected runtime issues.
            const [success, stdout] = GLib.spawn_command_line_sync(
                'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits'
            );

            if (!success || !stdout) return 0;

            const output = new TextDecoder().decode(stdout).trim();
            const usage = parseInt(output);

            return isNaN(usage) ? 0 : Math.max(0, Math.min(100, usage));
        } catch (e) {
            // If it fails once, you might want to set type to none to stop the loop
            console.error(`VitalsWidget: NVIDIA query failed: ${e}`);
            return 0;
        }
    }

    private _getAMDUsage(): number {
        // Placeholder for future radeontop parsing
        return 0;
    }

    destroy(): void {
        this._gpuType = 'none';
    }
}