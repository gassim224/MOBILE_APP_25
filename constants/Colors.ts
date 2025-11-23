/**
 * Color constants for the application
 * Provides a centralized color palette for consistent theming
 */

export const Colors = {
  // Primary Colors
  primary: '#1E3A5F',           // Academic Blue (main brand color)
  primaryLight: '#EBF0F5',      // Light blue background
  secondary: '#FFD700',         // Gold/Yellow (accent color)
  accent: '#17A2B8',            // Teal/Cyan (info/progress)

  // Background Colors
  background: '#F8F9FA',        // Main background (light gray)
  backgroundWhite: '#FFFFFF',   // White background

  // Text Colors
  textPrimary: '#2C2C2C',       // Dark text (main content)
  textSecondary: '#5A5A5A',     // Medium gray text
  textTertiary: '#A0A0A0',      // Light gray text (metadata)
  textWhite: '#FFFFFF',         // White text (on dark backgrounds)

  // Border & Divider Colors
  border: '#E0E0E0',            // Light gray borders
  borderDark: '#5A5A5A',        // Dark borders

  // Status Colors
  success: '#28A745',           // Green (success states)
  error: '#DC3545',             // Red (errors, delete)
  warning: '#FFC107',           // Yellow (warnings)
  info: '#17A2B8',              // Teal (informational)

  // Special Backgrounds
  errorLight: '#FFEBEE',        // Light red background
  successLight: '#E8F5E9',      // Light green background
  infoLight: '#EBF0F5',         // Light blue background
  warningLight: '#FFF9E6',      // Light yellow background

  // Transparent Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',         // Dark overlay (50%)
  overlayLight: 'rgba(0, 0, 0, 0.3)',    // Light dark overlay (30%)
  overlayBlue: 'rgba(30, 58, 95, 0.75)', // Blue overlay (Academic Blue with 75% opacity)

  // Shadow Colors
  shadow: '#000000',            // Black for shadows
  shadowLight: 'rgba(0, 0, 0, 0.1)', // Light shadow
} as const;

// Export individual color sets for convenience
export const PrimaryColors = {
  main: Colors.primary,
  light: Colors.primaryLight,
} as const;

export const BackgroundColors = {
  main: Colors.background,
  white: Colors.backgroundWhite,
  light: Colors.primaryLight,
} as const;

export const TextColors = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  tertiary: Colors.textTertiary,
  white: Colors.textWhite,
} as const;

export const StatusColors = {
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
  info: Colors.info,
} as const;

// Export default
export default Colors;
