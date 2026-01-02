import Gio from 'gi://Gio';

Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");

export class CPUSensor {
    private _lastTotal: number = 0;
    private _lastIdle: number = 0;

    constructor() {
        this._updateStats();
    }

    async getValue(): Promise<number> {
        return await this._updateStats();
    }

    private async _updateStats(): Promise<number> {
        try {
            const file = Gio.File.new_for_path('/proc/stat');
            const [contents] = await file.load_contents_async(null);
            if (!contents) return 0;
            const data = new TextDecoder().decode(contents as unknown as Uint8Array);
            const lines = data.split('\n');
            const cpuLine = lines[0];

            if (!cpuLine.startsWith('cpu ')) return 0;

            const times = cpuLine
                .split(/\s+/)
                .slice(1)
                .map(x => parseInt(x))
                .filter(x => !isNaN(x));

            if (times.length < 4) return 0;

            const idle = times[3];
            const total = times.reduce((acc, val) => acc + val, 0);

            const totalDelta = total - this._lastTotal;
            const idleDelta = idle - this._lastIdle;

            let usage = 0;
            if (totalDelta > 0) {
                usage = ((totalDelta - idleDelta) / totalDelta) * 100;
            }

            this._lastTotal = total;
            this._lastIdle = idle;

            return Math.max(0, Math.min(100, usage));
        } catch (e) {
            return 0;
        }
    }
}