# VitalsWidget Project Structure

## Directory Layout

```
vitalswidget/
├── src/                          # TypeScript source files
│   ├── extension.ts              # Main extension entry point
│   ├── vitals.ts                 # Individual vital item components
│   ├── config.ts                 # Configuration types and defaults
│   ├── progress.ts               # Progress bar drawing component
│   ├── prefs.ts                  # Preferences UI (Adwaita)
│   ├── ambient.d.ts              # TypeScript ambient declarations
│   └── sensors/                  # Sensor implementations
│       ├── cpu.ts                # CPU utilization sensor
│       ├── ram.ts                # Memory utilization sensor
│       ├── storage.ts            # Disk usage sensor
│       ├── temp.ts               # Temperature sensor
│       └── gpu.ts                # GPU utilization sensor
│
├── svg/                          # Icon assets (SVG format)
│   ├── cpu.svg                   # CPU icon
│   ├── ram.svg                   # RAM icon
│   ├── storage.svg               # Storage/disk icon
│   ├── temp.svg                  # Temperature icon
│   └── gpu.svg                   # GPU icon
│
├── schemas/                      # GSettings schema
│   └── org.gnome.shell.extensions.vitalswidget.gschema.xml
│
├── tests/                        # Test files
│   └── env_check.js              # Environment verification test
│
├── dist/                         # Compiled JavaScript (gitignored)
│   ├── extension.js
│   ├── vitals.js
│   ├── config.js
│   ├── progress.js
│   ├── prefs.js
│   └── sensors/
│       ├── cpu.js
│       ├── ram.js
│       ├── storage.js
│       ├── temp.js
│       └── gpu.js
│
├── metadata.json                 # Extension metadata
├── stylesheet.css                # Extension styles
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # NPM dependencies and scripts
├── Makefile                      # Build automation
├── .eslintrc.json               # ESLint configuration
├── .prettierrc.json             # Prettier configuration
├── .gitignore                   # Git ignore rules
├── LICENSE                       # GPL-3.0 license
├── README.md                     # Main documentation
└── PROJECT_STRUCTURE.md          # This file
```

## File Descriptions

### Core Extension Files

#### `src/extension.ts`
- **Purpose**: Main extension entry point
- **Exports**: `VitalsWidgetExtension` class
- **Responsibilities**:
  - Creates and manages the desktop widget container
  - Initializes all sensor instances
  - Manages update intervals
  - Handles drag-and-drop positioning
  - Handles settings connections
  - Lifecycle management (enable/disable)
  - Adds widget to desktop chrome layer (not panel)

#### `src/vitals.ts`
- **Purpose**: Individual circular vital indicator component
- **Exports**: `VitalItem` class
- **Responsibilities**:
  - Displays circular progress ring with icon inside and label below
  - Handles per-vital settings
  - Updates visual representation based on sensor data
  - Manages icon sizing relative to circle diameter
  - Uses BinLayout to overlay icon on circular progress

#### `src/config.ts`
- **Purpose**: Configuration types and constants
- **Exports**: 
  - `VitalType` enum
  - `Orientation` enum
  - `DEFAULT_CONFIG` object
  - `VitalsConfig` interface
  - Helper functions
- **Responsibilities**:
  - Defines all configuration options
  - Provides default values
  - Type safety for settings

#### `src/progress.ts`
- **Purpose**: Circular progress ring visualization
- **Exports**: `CircularProgress` class
- **Responsibilities**:
  - Draws circular progress rings using Cairo
  - Animates progress from 0-100%
  - Handles color parsing and styling
  - Responsive sizing based on diameter setting
  - Draws background ring and colored progress arc

#### `src/prefs.ts`
- **Purpose**: Preferences UI for desktop widget
- **Exports**: `VitalsWidgetPreferences` class
- **Responsibilities**:
  - Creates Adwaita-based settings window
  - Binds UI controls to GSettings
  - Organizes settings into logical groups
  - Provides X/Y position controls
  - Provides circle diameter and ring width controls

#### `src/ambient.d.ts`
- **Purpose**: TypeScript type declarations
- **Responsibilities**:
  - Provides types for GJS globals
  - Augments module types for GNOME Shell resources
  - Ensures type safety across the project

### Sensor Files

#### `src/sensors/cpu.ts`
- Reads `/proc/stat`
- Calculates CPU utilization percentage
- Tracks idle vs active time

#### `src/sensors/ram.ts`
- Reads `/proc/meminfo`
- Calculates memory usage percentage
- Uses MemTotal and MemAvailable

#### `src/sensors/storage.ts`
- Executes `df` command
- Parses disk usage for root filesystem
- Returns percentage used

#### `src/sensors/temp.ts`
- Reads thermal zones from `/sys/class/thermal/`
- Detects CPU temperature sensors
- Maps temperature to 0-100 scale (30°C-90°C)

#### `src/sensors/gpu.ts`
- Detects GPU type (NVIDIA/AMD)
- Uses `nvidia-smi` for NVIDIA GPUs
- Placeholder for AMD support via `radeontop`

### Configuration Files

#### `metadata.json`
- Extension UUID
- Name and description
- Compatible GNOME Shell versions
- Settings schema ID

#### `schemas/*.gschema.xml`
- Defines all GSettings keys
- Specifies types and defaults
- Provides descriptions for each setting

#### `tsconfig.json`
- TypeScript compiler options
- Target ES2022
- Strict mode enabled
- Output to `dist/`

#### `package.json`
- NPM dependencies (@girs packages)
- Build scripts (compile, watch, lint)
- Project metadata

### Build and Development Files

#### `Makefile`
- `make install`: Compile and install extension
- `make nested`: Launch nested GNOME Shell
- `make test`: Run GJS tests
- `make logs`: View extension logs
- `make clean`: Remove build artifacts
- `make dev`: Full development cycle

#### `.eslintrc.json`
- TypeScript ESLint configuration
- Coding standards enforcement

#### `.prettierrc.json`
- Code formatting rules
- Consistent style across project

## Data Flow

```
┌─────────────────┐
│  extension.ts   │
│  (Main Entry)   │
└────────┬────────┘
         │
         ├─── Creates ───► VitalsWidget (Desktop Widget)
         │                      │
         │                      ├─── Contains ───► VitalItem (CPU) ───► CircularProgress + Icon
         │                      ├─── Contains ───► VitalItem (RAM) ───► CircularProgress + Icon
         │                      ├─── Contains ───► VitalItem (Storage) ───► CircularProgress + Icon
         │                      ├─── Contains ───► VitalItem (Temp) ───► CircularProgress + Icon
         │                      └─── Contains ───► VitalItem (GPU) ───► CircularProgress + Icon
         │
         ├─── Manages ───► Sensors
         │                    ├─── CPUSensor
         │                    ├─── RAMSensor
         │                    ├─── StorageSensor
         │                    ├─── TempSensor
         │                    └─── GPUSensor
         │                            │
         │                            └─── Updates ───► VitalItem
         │                                                   │
         │                                                   └─── Renders ───► CircularProgress
         │
         └─── Handles ───► Drag & Drop (saves position as %)
```

## Settings Flow

```
┌──────────────┐
│   prefs.ts   │  ◄─── User Interaction
│  (Settings)  │
└──────┬───────┘
       │
       └─── Writes to ───► GSettings (schemas/)
                                │
                                └─── Signals ───► extension.ts
                                                        │
                                                        └─── Updates ───► UI Components
```

## Build Process

```
Source (.ts)  ──►  TypeScript Compiler  ──►  JavaScript (.js)  ──►  Installation
    │                                             │                      │
    └─── src/*.ts                                 └─── dist/*.js         └─── ~/.local/share/
                                                                              gnome-shell/
                                                                              extensions/
                                                                              vitalswidget@
```

## Development Workflow

1. **Edit source**: Modify `.ts` files in `src/`
2. **Compile**: Run `npm run compile` or `make install`
3. **Test**: Use `make nested` for safe testing
4. **Debug**: Check logs with `make logs`
5. **Iterate**: Repeat until satisfied
6. **Format**: Run `npm run format` before commit

## Key Design Patterns

### Desktop Widget Architecture
- Widget floats on desktop via `Main.layoutManager.addChrome()`
- Not attached to panel - independent positioning
- Draggable with mouse (click and drag)
- Position saved as screen percentage (responsive to resolution changes)

### Circular Progress Design
- Each vital has circular progress ring with icon inside
- Icon size scales with circle diameter (50% of diameter)
- Cairo-based drawing for smooth animations
- BinLayout overlays icon on top of progress ring

### Component Architecture
- Each vital is a self-contained component
- Sensors are decoupled from UI
- Clear separation of concerns

### Settings Management
- GSettings for persistence
- Reactive updates via signals
- Type-safe configuration

### Sensor Pattern
- Common interface across all sensors
- `getValue()` returns 0-100 percentage
- Error handling with graceful fallbacks

### Modern TypeScript
- Strict typing throughout
- ES2022 features
- Proper imports/exports

## Extension Points

To add a new vital:
1. Add enum to `VitalType` in `config.ts`
2. Create sensor in `src/sensors/`
3. Add settings to schema
4. Add UI group in `prefs.ts`
5. Create SVG icon in `svg/`
6. Update default config

## Performance Considerations

- Update interval: 2 seconds (configurable)
- Sensor reads are lightweight
- Progress bars use Cairo for efficiency
- No memory leaks (proper cleanup in destroy())

## Dependencies

### Runtime
- GNOME Shell 45/46/47
- GJS (JavaScript bindings for GLib/GTK)
- Standard Linux tools (df, /proc filesystem)

### Development
- TypeScript 5.3+
- @girs packages for type definitions
- Node.js 18+ for build tools

### Optional
- nvidia-smi (NVIDIA GPU monitoring)
- radeontop (AMD GPU monitoring)