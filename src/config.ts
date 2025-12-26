/**
 * VitalsConfig - Configuration types and constants
 * 
 * Defines all configuration options and types for the extension
 */

/**
 * Available vital types
 */
export enum VitalType {
    CPU = 'cpu',
    RAM = 'ram',
    STORAGE = 'storage',
    TEMP = 'temp',
    GPU = 'gpu',
}

/**
 * Bar orientation options
 */
export enum Orientation {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    // Position (percentage of screen)
    positionX: 85, // X position (0-100%)
    positionY: 50, // Y position (0-100%)

    // Appearance
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    vitalSpacing: 12,

    // Icons
    showIcons: true,
    iconColor: 'rgba(255, 255, 255, 0.9)',

    // Labels
    showLabels: true,

    // Vital visibility
    showCpu: true,
    showRam: true,
    showStorage: true,
    showTemp: true,
    showGpu: true,

    // Vital colors
    cpuColor: '#3498db',
    ramColor: '#2ecc71',
    storageColor: '#f39c12',
    tempColor: '#e74c3c',
    gpuColor: '#9b59b6',

    // ringsettings
    ringDiameter: 64, // Diameter of each circular progress
    ringWidth: 4,       // Width of the progress ring

    // Update interval (ms)
    updateInterval: 2000,
    cpuUpdateInterval: 2000,
    ramUpdateInterval: 2000,
    storageUpdateInterval: 5000,
    tempUpdateInterval: 2000,
    gpuUpdateInterval: 2000,
};

/**
 * Configuration interface
 */
export interface VitalsConfig {
    positionX: number;
    positionY: number;
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    vitalSpacing: number;
    showIcons: boolean;
    iconColor: string;
    showLabels: boolean;
    showCpu: boolean;
    showRam: boolean;
    showStorage: boolean;
    showTemp: boolean;
    showGpu: boolean;
    cpuColor: string;
    ramColor: string;
    storageColor: string;
    tempColor: string;
    gpuColor: string;
    ringDiameter: number;
    ringWidth: number;
    updateInterval: number;
    cpuUpdateInterval: number;
    ramUpdateInterval: number;
    storageUpdateInterval: number;
    tempUpdateInterval: number;
    gpuUpdateInterval: number;
}

/**
 * Helper to get vital display name
 */
export function getVitalDisplayName(type: VitalType): string {
    const names: Record<VitalType, string> = {
        [VitalType.CPU]: 'CPU',
        [VitalType.RAM]: 'RAM',
        [VitalType.STORAGE]: 'Storage',
        [VitalType.TEMP]: 'Temperature',
        [VitalType.GPU]: 'GPU',
    };
    return names[type];
}

/**
 * Helper to get default color for vital type
 */
export function getDefaultColor(type: VitalType): string {
    return DEFAULT_CONFIG[`${type}Color` as keyof typeof DEFAULT_CONFIG] as string;
}