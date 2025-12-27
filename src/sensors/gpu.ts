import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class GPUSensor {
    private _gpuType: 'nvidia' | 'amd_sysfs' | 'amd_radeontop' | 'none' = 'none';
    private _sysfsPath: string = '';
    private _errorCount: number = 0;
    private _maxErrors: number = 5;
    private _disabled: boolean = false;
    private _lastError: string = '';

    constructor() {
        console.log('VitalsWidget: GPUSensor constructor called');
        this._detectGPU();
    }

    /**
     * Detect available GPU type.
     * Priority:
     * 1. NVIDIA (nvidia-smi)
     * 2. AMD Sysfs (native kernel file, no root needed)
     * 3. AMD Radeontop (fallback, often needs root)
     */
    private _detectGPU(): void {
        console.log('VitalsWidget: Starting GPU detection...');
        
        // 1. Check for NVIDIA
        const nvidiaSmiPath = GLib.find_program_in_path('nvidia-smi');
        if (nvidiaSmiPath) {
            this._gpuType = 'nvidia';
            console.log(`VitalsWidget: ✓ NVIDIA GPU detected at ${nvidiaSmiPath}`);
            return;
        }

        // 2. Check for AMD via Sysfs (Preferred Method - No root required)
        for (let i = 0; i < 10; i++) {
            const path = `/sys/class/drm/card${i}/device/gpu_busy_percent`;
            const file = Gio.File.new_for_path(path);
            if (file.query_exists(null)) {
                this._gpuType = 'amd_sysfs';
                this._sysfsPath = path;
                console.log(`VitalsWidget: ✓ AMD GPU detected via Sysfs (${path})`);
                return;
            }
        }
        
        // 3. Check for AMD radeontop (Fallback)
        const amdPaths = ['radeontop', '/usr/sbin/radeontop', '/usr/local/bin/radeontop'];
        for (const path of amdPaths) {
            const foundPath = GLib.find_program_in_path(path);
            if (foundPath) {
                this._gpuType = 'amd_radeontop';
                console.log(`VitalsWidget: ✓ AMD GPU tool detected (${foundPath})`);
                console.log('VitalsWidget: ⚠ Note: radeontop usually requires root permissions.');
                return;
            }
        }
        
        console.log('VitalsWidget: ✗ No supported GPU monitoring detected');
        this._gpuType = 'none';
    }

    /**
     * Get current GPU utilization (0-100)
     */
    getValue(): number {
        if (this._disabled) return 0;
        if (this._gpuType === 'none') return 0;

        switch (this._gpuType) {
            case 'nvidia':
                return this._getNvidiaUsage();
            case 'amd_sysfs':
                return this._getAmdSysfsUsage();
            case 'amd_radeontop':
                return this._getAmdRadeontopUsage();
            default:
                return 0;
        }
    }

    private _getNvidiaUsage(): number {
        try {
            const [success, stdout, stderr] = GLib.spawn_command_line_sync(
                'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits'
            );

            if (!success) {
                // Check if stderr exists before decoding
                const err = stderr ? new TextDecoder().decode(stderr).trim() : 'Unknown error';
                console.debug(`VitalsWidget: NVIDIA Check Failed: ${err}`);
                return 0;
            }

            // Check if stdout exists before decoding
            if (!stdout) {
                return 0;
            }

            const output = new TextDecoder().decode(stdout).trim();
            const usage = parseInt(output.split('\n')[0]); 

            if (isNaN(usage)) {
                return 0;
            }

            this._errorCount = 0; 
            return Math.max(0, Math.min(100, usage));

        } catch (e) {
            this._handleError(`NVIDIA exception: ${e}`);
            return 0;
        }
    }

    private _getAmdSysfsUsage(): number {
        try {
            const file = Gio.File.new_for_path(this._sysfsPath);
            const [success, contents] = file.load_contents(null);
            
            if (!success || !contents) {
                this._handleError('Failed to read AMD sysfs file');
                return 0;
            }

            // contents is Uint8Array, explicitly decode it
            const output = new TextDecoder().decode(contents).trim();
            const usage = parseInt(output);

            if (isNaN(usage)) {
                this._handleError(`Invalid AMD sysfs value: ${output}`);
                return 0;
            }

            this._errorCount = 0;
            return Math.max(0, Math.min(100, usage));

        } catch (e) {
            this._handleError(`AMD Sysfs exception: ${e}`);
            return 0;
        }
    }

    private _getAmdRadeontopUsage(): number {
        try {
            const [success, stdout, stderr] = GLib.spawn_command_line_sync('radeontop -d - -l 1');
            
            if (!success) {
                 const err = stderr ? new TextDecoder().decode(stderr) : '';
                 if (err.includes('Permission denied') || err.includes('root')) {
                     this._handleError('Radeontop permission denied (needs root)');
                 }
                 return 0;
            }

            // Explicit null check for stdout
            if (!stdout) {
                return 0;
            }

            const output = new TextDecoder().decode(stdout);
            const match = output.match(/gpu\s+(\d+(?:\.\d+)?)%/);

            if (match && match[1]) {
                this._errorCount = 0;
                return Math.round(parseFloat(match[1]));
            }
            
            return 0;
        } catch (e) {
            return 0;
        }
    }

    private _handleError(message: string): void {
        this._errorCount++;
        this._lastError = message;
        
        if (this._errorCount % 5 === 0) {
            console.warn(`VitalsWidget GPU Error: ${message}`);
        }
        
        if (this._errorCount >= this._maxErrors) {
            console.error(`VitalsWidget: GPU monitoring disabled after ${this._maxErrors} failures.`);
            this._disabled = true;
        }
    }

    reset(): void {
        this._errorCount = 0;
        this._disabled = false;
        this._detectGPU();
    }
    
    destroy(): void {
        this._disabled = true;
    }
}