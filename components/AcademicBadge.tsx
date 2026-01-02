import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getBadgeColor, getCourseInitial, getAuthorInitials } from '@/utils/thumbnailUtils';

interface AcademicBadgeProps {
  id: string;
  type: 'course' | 'book';
  title?: string;
  author?: string;
  size?: number;
  fontSize?: number;
  style?: ViewStyle;
}

/**
 * AcademicBadge - A professional badge component displaying initials
 * Features:
 * - Courses: Display first letter of title with slightly rounded squares
 * - Books: Display author initials with clean square style
 * - Uses rotating professional color palette
 * - High contrast white text on dark backgrounds
 */
export const AcademicBadge: React.FC<AcademicBadgeProps> = ({
  id,
  type,
  title,
  author,
  size = 80,
  fontSize,
  style,
}) => {
  const backgroundColor = getBadgeColor(id);

  // Determine initials based on type
  const displayText = type === 'course'
    ? getCourseInitial(title || '')
    : getAuthorInitials(author || '');

  // Calculate font size based on badge size if not provided
  const calculatedFontSize = fontSize || (displayText.length > 1 ? size * 0.35 : size * 0.5);

  // Determine border radius based on type
  const borderRadius = type === 'course' ? size * 0.15 : size * 0.08;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: calculatedFontSize,
            letterSpacing: displayText.length > 1 ? 2 : 0,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default AcademicBadge;
