import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PdfBlockProps } from '../types';

const styles = StyleSheet.create({
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  text: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
});

interface FooterData {
  text: string;
}

export const PdfFooter: React.FC<PdfBlockProps<FooterData>> = ({ data, config }) => {
  const text = data?.text || 'Generado automáticamente';

  return (
    <View style={styles.footer}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};