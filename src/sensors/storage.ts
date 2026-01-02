import Gio from "gi://Gio";

Gio._promisify(Gio.Subprocess.prototype, "communicate_utf8_async", "communicate_utf8_finish");

export class StorageSensor {
  async getValue(): Promise<number> {
    try {
      // Async subprocess for df command
      const path = "/";
      const proc = Gio.Subprocess.new(
        ["df", path],
        Gio.SubprocessFlags.STDOUT_PIPE
      );
      const [stdout] = await proc.communicate_utf8_async(null, null);

      if (!stdout) return 0;
      const lines = stdout.split("\n");
      if (lines.length < 2) return 0;

      const columns = lines[1].split(/\s+/);
      const usageStr = columns.find((c) => c.includes("%"));
      return usageStr ? parseInt(usageStr) : 0;
    } catch (e) {
      return 0;
    }
  }
}
