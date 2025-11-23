/**
 * Layout constants for the application
 * Provides consistent spacing, sizing, and dimensions
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Layout = {
  // Screen Dimensions
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Padding
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Margin
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Border Radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 9999, // Fully rounded
  },

  // Border Width
  borderWidth: {
    thin: 1,
    medium: 2,
    thick: 3,
  },

  // Icon Sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },

  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },

  // Font Weights (as strings for React Native)
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Common Component Sizes
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    paddingHorizontal: {
      sm: 16,
      md: 24,
      lg: 32,
    },
  },

  input: {
    height: 48,
    paddingHorizontal: 16,
  },

  card: {
    padding: 16,
    borderRadius: 12,
  },

  // Header Heights
  header: {
    height: 60,
    paddingTop: 60,
    paddingBottom: 20,
  },

  // Tab Bar
  tabBar: {
    height: 60,
  },

  // Thumbnail/Avatar Sizes
  thumbnail: {
    xs: 40,
    sm: 60,
    md: 80,
    lg: 100,
    xl: 120,
  },

  // Shadow Presets (for elevation)
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // Z-Index Layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 100,
    modal: 1000,
    popover: 1500,
    tooltip: 2000,
  },
} as const;

// Helper function to get responsive font size
export const getResponsiveFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base on iPhone X width
  const newSize = size * scale;
  return Math.round(newSize);
};

// Helper function to get responsive spacing
export const getResponsiveSpacing = (spacing: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base on iPhone X width
  const newSpacing = spacing * scale;
  return Math.round(newSpacing);
};

// Export default
export default Layout;
