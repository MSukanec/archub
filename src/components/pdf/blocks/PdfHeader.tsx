import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PdfBlockProps } from '../types';

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    marginBottom: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
});

interface HeaderData {
  title: string;
}

export const PdfHeader: React.FC<PdfBlockProps<HeaderData>> = ({ data, config }) => {
  const title = data?.title || 'Documento PDF';

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};