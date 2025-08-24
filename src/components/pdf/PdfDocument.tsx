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

interface TableConfig {
  titleSize: number;
  bodySize: number;
  showTableBorder: boolean;
  showRowDividers: boolean;
  groupBy: 'fase' | 'rubro' | 'fases-y-rubros';
}

interface PdfDocumentProps {
  blocks: PdfBlock[];
  config?: PdfConfig;
  footerConfig?: FooterConfig;
  tableConfig?: TableConfig;
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({ blocks, config, footerConfig, tableConfig }) => {
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
          
          // Pass footerConfig to footer blocks and tableConfig to table blocks
          let blockData = block.data;
          let blockConfig = block.config;
          
          if (block.type === 'footer' && footerConfig) {
            blockData = { ...block.data, text: footerConfig.text, showDivider: footerConfig.showDivider };
          }
          
          if ((block.type === 'tableHeader' || block.type === 'tableContent' || block.type === 'totals') && tableConfig) {
            blockData = { ...block.data, ...tableConfig };
            blockConfig = { ...block.config, ...tableConfig };
          }
          
          return (
            <BlockComponent 
              key={index} 
              data={blockData} 
              config={blockConfig} 
            />
          );
        })}
      </Page>
    </Document>
  );
};