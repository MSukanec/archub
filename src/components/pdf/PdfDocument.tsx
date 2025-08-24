import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { PdfBlock } from './types';
import { pdfBlocks } from './pdfService';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
});

interface PdfDocumentProps {
  blocks: PdfBlock[];
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({ blocks }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, index) => {
          if (!block.enabled) return null;
          
          const BlockComponent = pdfBlocks[block.type as keyof typeof pdfBlocks];
          if (!BlockComponent) return null;
          
          return (
            <BlockComponent 
              key={index} 
              data={block.data} 
              config={block.config} 
            />
          );
        })}
      </Page>
    </Document>
  );
};