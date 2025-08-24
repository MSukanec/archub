import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { PdfBlock } from './types';
import { pdfBlocks } from './pdfService';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
});

interface PdfConfig {
  pageSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  margin: number;
}

interface FooterConfig {
  text: string;
  showDivider: boolean;
}

interface PdfDocumentProps {
  blocks: PdfBlock[];
  config?: PdfConfig;
  footerConfig?: FooterConfig;
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({ blocks, config, footerConfig }) => {
  const pageConfig = config || { pageSize: 'A4', orientation: 'portrait', margin: 20 };
  
  // Apply margin as padding
  const pageStyle = {
    ...styles.page,
    padding: pageConfig.margin,
  };

  return (
    <Document>
      <Page 
        size={pageConfig.pageSize} 
        orientation={pageConfig.orientation}
        style={pageStyle}
      >
        {blocks.map((block, index) => {
          if (!block.enabled) return null;
          
          const BlockComponent = pdfBlocks[block.type as keyof typeof pdfBlocks];
          if (!BlockComponent) return null;
          
          // Pass footerConfig to footer blocks
          const blockData = block.type === 'footer' && footerConfig 
            ? { ...block.data, text: footerConfig.text, showDivider: footerConfig.showDivider }
            : block.data;
          
          return (
            <BlockComponent 
              key={index} 
              data={blockData} 
              config={block.config} 
            />
          );
        })}
      </Page>
    </Document>
  );
};