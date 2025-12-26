# VitalsWidget Setup Guide

Complete guide to setting up and developing the VitalsWidget desktop widget extension.

## Quick Start

```bash
# 1. Clone/create project directory
mkdir vitalswidget && cd vitalswidget

# 2. Create the directory structure
mkdir -p src/sensors svg schemas tests

# 3. Install dependencies
npm install

# 4. Build and install
make install

# 5. Enable extension
gnome-extensions enable vitalswidget@ctrln3rd.vercel.app

# 6. Restart GNOME Shell
# X11: Alt+F2, type 'r', press Enter
# Wayland: Log out and log back in
```

## Project Structure Setup

Create the following files in your project directory:

### Root Level Files
- `metadata.json` - Extension metadata
- `stylesheet.css` - Widget styles
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies
- `Makefile` - Build automation (you already have this)
- `.eslintrc.json` - Linting rules
- `.prettierrc.json` - Code formatting
- `.gitignore` - Git ignore rules
- `LICENSE` - GPL-3.0 license
- `README.md` - Documentation
- `PROJECT_STRUCTURE.md` - Architecture docs

### Source Files (`src/`)
- `extension.ts` - Main desktop widget
- `vitals.ts` - Circular vital components
- `config.ts` - Configuration types
- `progress.ts` - Circular progress rings
- `prefs.ts` - Settings UI
- `ambient.d.ts` - Type declarations

### Sensor Files (`src/sensors/`)
- `cpu.ts` - CPU monitoring
- `ram.ts` - Memory monitoring
- `storage.ts` - Disk monitoring
- `temp.ts` - Temperature monitoring
- `gpu.ts` - GPU monitoring

### Asset Files (`svg/`)
- `cpu.svg` - CPU icon
- `ram.svg` - RAM icon
- `storage.svg` - Storage icon
- `temp.svg` - Temperature icon
- `gpu.svg` - GPU icon

### Schema Files (`schemas/`)
- `org.gnome.shell.extensions.vitalswidget.gschema.xml` - Settings schema

### Test Files (`tests/`)
- `env_check.js` - Environment verification

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- GJS type definitions (@girs packages)
- ESLint and Prettier
- Other dev dependencies

### 2. Compile TypeScript

```bash
npm run compile
# or
make install
```

This compiles `.ts` files in `src/` to `.js` files in `dist/`.

### 3. Install Extension

```bash
make install
```

This:
1. Compiles TypeScript
2. Copies files to `~/.local/share/gnome-shell/extensions/vitalswidget@ctrln3rd.vercel.app/`
3. Compiles GSettings schema
4. Copies SVG icons

### 4. Enable Extension

```bash
gnome-extensions enable vitalswidget@ctrln3rd.vercel.app
```

### 5. Restart GNOME Shell

**X11:**
- Press `Alt+F2`
- Type `r`
- Press Enter

**Wayland:**
- Log out
- Log back in

## Development Workflow

### Method 1: Quick Iteration

```bash
# In terminal 1: Watch for TypeScript changes
npm run watch

# In terminal 2: Install and restart
make install
# Then restart GNOME Shell
```

### Method 2: Nested GNOME Shell (Safest)

```bash
# Build and launch nested shell
make nested
```

This creates a separate GNOME Shell window for testing without affecting your main session.

**Benefits:**
- Safe testing environment
- No need to restart main session
- Can easily kill and restart
- Logs visible in terminal

**Usage in nested shell:**
1. Window opens with fresh GNOME Shell
2. Extension is automatically enabled
3. Test your changes
4. Close window when done
5. Make changes, run `make nested` again

### Method 3: Development Cycle

```bash
# Full development cycle
make dev
```

This:
1. Uninstalls extension
2. Cleans build artifacts
3. Recompiles everything
4. Reinstalls extension
5. Launches nested shell

## Debugging

### View Logs

```bash
# In real-time
make logs

# Or manually
journalctl -f -o cat /usr/bin/gnome-shell | grep vitalswidget
```

### Common Issues

#### Extension doesn't appear
```bash
# Check if installed
ls ~/.local/share/gnome-shell/extensions/vitalswidget@ctrln3rd.vercel.app/

# Check if enabled
gnome-extensions list --enabled | grep vitalswidget

# View errors
make logs
```

#### TypeScript compilation errors
```bash
# Check TypeScript
npm run compile

# View specific errors
npx tsc --noEmit
```

#### Schema errors
```bash
# Recompile schema
glib-compile-schemas ~/.local/share/gnome-shell/extensions/vitalswidget@ctrln3rd.vercel.app/schemas/
```

#### Widget not showing on desktop
```bash
# Check logs for errors
make logs

# Try disabling and re-enabling
gnome-extensions disable vitalswidget@ctrln3rd.vercel.app
gnome-extensions enable vitalswidget@ctrln3rd.vercel.app

# Restart GNOME Shell
```

## Customization

### Changing Widget Position

**Via Settings:**
1. Open Settings: `gnome-extensions prefs vitalswidget@ctrln3rd.vercel.app`
2. Adjust "Horizontal Position" (0-100%)
3. Adjust "Vertical Position" (0-100%)
4. Widget moves immediately

**Via Dragging:**
1. Click and hold on widget
2. Drag to desired position
3. Release mouse
4. Position saved automatically

### Customizing Appearance

**In Settings UI:**
- General → Appearance section
- Adjust colors, borders, spacing
- Changes apply immediately

**Via GSettings (command line):**
```bash
# Change circle diameter
gsettings set org.gnome.shell.extensions.vitalswidget circle-diameter 80

# Change ring width
gsettings set org.gnome.shell.extensions.vitalswidget ring-width 6

# Change CPU color
gsettings set org.gnome.shell.extensions.vitalswidget cpu-color '#ff0000'
```

### Adding New Vitals

To add a new vital type:

1. **Add to config.ts:**
```typescript
export enum VitalType {
    // ... existing
    NETWORK = 'network',
}
```

2. **Create sensor** (`src/sensors/network.ts`):
```typescript
export class NetworkSensor {
    getValue(): number {
        // Return 0-100 percentage
        return 0;
    }
}
```

3. **Add to schema** (`schemas/*.gschema.xml`):
```xml
<key name="show-network" type="b">
  <default>true</default>
</key>
<key name="network-color" type="s">
  <default>'#00ff00'</default>
</key>
```

4. **Create icon** (`svg/network.svg`)

5. **Update extension.ts** to initialize sensor

6. **Recompile and install:**
```bash
make install
```

## Testing

### Environment Check

```bash
make test
```

Runs `tests/env_check.js` to verify:
- GJS environment
- File system access
- Command execution
- Library availability

### Manual Testing Checklist

- [ ] Widget appears on desktop after enable
- [ ] Widget is draggable
- [ ] Position persists after restart
- [ ] All vitals update every 2 seconds
- [ ] Settings UI opens without errors
- [ ] Setting changes apply immediately
- [ ] Icons visible and correct colors
- [ ] Labels show correct percentages
- [ ] Circles progress smoothly
- [ ] Enable/disable vitals works
- [ ] Color changes work
- [ ] Diameter/ring width changes work

## Performance Tuning

### Reduce Update Frequency

Currently hardcoded to 2 seconds. To change, edit `extension.ts`:

```typescript
// Change 2000 to desired milliseconds
this._updateInterval = GLib.timeout_add(
    GLib.PRIORITY_DEFAULT,
    2000, // <-- Change this
    () => {
        this._updateSensors();
        return GLib.SOURCE_CONTINUE;
    }
);
```

### Optimize Sensor Reads

Edit individual sensor files to optimize reads:
- Cache values when possible
- Skip reads when vital is hidden
- Use more efficient system calls

## Distribution

### Creating Release Package

```bash
# Create zip for distribution
cd ~/.local/share/gnome-shell/extensions/vitalswidget@ctrln3rd.vercel.app/
zip -r vitalswidget.zip .

# Share vitalswidget.zip
```

### Installation from Package

Users can install by:
```bash
gnome-extensions install vitalswidget.zip
gnome-extensions enable vitalswidget@ctrln3rd.vercel.app
```

## Tips and Tricks

### Quick Position Reset
```bash
# Reset to default position (85%, 50%)
gsettings reset org.gnome.shell.extensions.vitalswidget position-x
gsettings reset org.gnome.shell.extensions.vitalswidget position-y
```

### Disable Specific Vitals
```bash
# Hide GPU if you don't have one
gsettings set org.gnome.shell.extensions.vitalswidget show-gpu false
```

### Backup Your Settings
```bash
# Export settings
dconf dump /org/gnome/shell/extensions/vitalswidget/ > vitalswidget-settings.conf

# Import settings
dconf load /org/gnome/shell/extensions/vitalswidget/ < vitalswidget-settings.conf
```

### Hot Reload in Nested Shell
In nested shell, you can reload without restarting:
1. Make code changes
2. Run `make install` in separate terminal
3. Press `Alt+F2`, type `r`, press Enter (in nested shell)
4. Changes applied

## Troubleshooting by Symptom

### Widget is invisible
- Check logs: `make logs`
- Verify extension enabled: `gnome-extensions list --enabled`
- Check position isn't off-screen: Reset position settings
- Verify schema compiled: Check for `.gschemas.compiled` file

### Widget doesn't update
- Check sensor permissions (especially `/proc/` access)
- Verify update interval is running (check logs)
- Test individual sensors in isolation

### Drag doesn't work
- Ensure `reactive: true` in widget constructor
- Check event handlers connected properly
- Verify widget is in chrome layer

### Settings don't apply
- Check GSettings schema compiled
- Verify setting keys match between schema and code
- Restart GNOME Shell after schema changes

### High CPU usage
- Reduce update interval
- Optimize sensor reads
- Check for memory leaks in update loop

## Getting Help

If you encounter issues:

1. Check logs: `make logs`
2. Verify installation: Files present, schema compiled
3. Test in nested shell: Isolate from main session
4. Review TypeScript errors: `npm run compile`
5. Check GNOME Shell version compatibility

## Next Steps

After setup:
1. Test basic functionality
2. Customize appearance to your liking
3. Position widget where you want it
4. Enable/disable vitals as needed
5. Consider contributing improvements!

Happy monitoring! 🎉