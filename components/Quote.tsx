import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface QuoteProps {
  text: string;
  author?: string;
  style?: any;
}

export default function Quote({ text, author, style }: QuoteProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, style]}>
      <ThemedText style={[styles.quoteText, { color: colors.text }]}>
        "{text}"
      </ThemedText>
      {author && (
        <ThemedText style={[styles.author, { color: colors.primary }]}>
          — {author}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  author: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
}); 