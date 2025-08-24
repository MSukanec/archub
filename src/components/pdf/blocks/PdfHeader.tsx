import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfBlockProps } from '../types';

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logoSection: {
    marginRight: 20,
  },
  logo: {
    // Dynamic width/height will be set by config
  },
  contentSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    color: '#000',
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 10,
  },
});

interface HeaderData {
  title?: string;
  subtitle?: string;
  organizationName?: string;
  projectName?: string;
  projectAddress?: string;
  budgetDate?: string;
  budgetNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  showLogo?: boolean;
  logoUrl?: string;
  logoSize?: number;
  showDivider?: boolean;
  layout?: 'row' | 'column';
}

export const PdfHeader: React.FC<PdfBlockProps<HeaderData>> = ({ data, config }) => {
  const headerConfig = {
    title: data?.title || config?.title || 'Presupuesto de Construcción',
    subtitle: data?.subtitle || config?.subtitle || '',
    organizationName: data?.organizationName || config?.organizationName || '',
    projectName: data?.projectName || config?.projectName || '',
    projectAddress: data?.projectAddress || config?.projectAddress || '',
    budgetDate: data?.budgetDate || config?.budgetDate || new Date().toLocaleDateString('es-AR'),
    budgetNumber: data?.budgetNumber || config?.budgetNumber || '',
    contactPerson: data?.contactPerson || config?.contactPerson || '',
    phone: data?.phone || config?.phone || '',
    email: data?.email || config?.email || '',
    showLogo: data?.showLogo !== false && config?.showLogo !== false,
    logoUrl: data?.logoUrl || config?.logoUrl || '',
    logoSize: data?.logoSize || config?.logoSize || 60,
    showDivider: data?.showDivider !== false && config?.showDivider !== false,
    layout: data?.layout || config?.layout || 'row',
  };

  const logoStyle = {
    ...styles.logo,
    width: headerConfig.logoSize,
    height: headerConfig.logoSize,
  };

  if (headerConfig.layout === 'column') {
    return (
      <View style={styles.header}>
        {/* Logo centrado arriba */}
        {headerConfig.showLogo && headerConfig.logoUrl && (
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            <Image style={logoStyle} src={headerConfig.logoUrl} />
          </View>
        )}
        
        {/* Título centrado */}
        <Text style={[styles.title, { textAlign: 'center', fontSize: 22 }]}>
          {headerConfig.title}
        </Text>
        
        {headerConfig.subtitle && (
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            {headerConfig.subtitle}
          </Text>
        )}
        
        {/* Información en dos columnas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 20 }}>
            {headerConfig.organizationName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Empresa:</Text>
                <Text style={styles.infoValue}>{headerConfig.organizationName}</Text>
              </View>
            )}
            {headerConfig.projectName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Proyecto:</Text>
                <Text style={styles.infoValue}>{headerConfig.projectName}</Text>
              </View>
            )}
            {headerConfig.budgetNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nº Presup.:</Text>
                <Text style={styles.infoValue}>{headerConfig.budgetNumber}</Text>
              </View>
            )}
          </View>
          
          <View style={{ flex: 1 }}>
            {headerConfig.projectAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{headerConfig.projectAddress}</Text>
              </View>
            )}
            {headerConfig.budgetDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha:</Text>
                <Text style={styles.infoValue}>{headerConfig.budgetDate}</Text>
              </View>
            )}
            {headerConfig.contactPerson && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contacto:</Text>
                <Text style={styles.infoValue}>{headerConfig.contactPerson}</Text>
              </View>
            )}
          </View>
        </View>
        
        {headerConfig.showDivider && <View style={styles.divider} />}
      </View>
    );
  }

  // Layout horizontal (por defecto)
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        {/* Logo a la izquierda */}
        {headerConfig.showLogo && headerConfig.logoUrl && (
          <View style={styles.logoSection}>
            <Image style={logoStyle} src={headerConfig.logoUrl} />
          </View>
        )}
        
        {/* Contenido principal */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>{headerConfig.title}</Text>
          
          {headerConfig.subtitle && (
            <Text style={styles.subtitle}>{headerConfig.subtitle}</Text>
          )}
          
          {/* Información del proyecto */}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 15 }}>
              {headerConfig.organizationName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Empresa:</Text>
                  <Text style={styles.infoValue}>{headerConfig.organizationName}</Text>
                </View>
              )}
              {headerConfig.projectName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Proyecto:</Text>
                  <Text style={styles.infoValue}>{headerConfig.projectName}</Text>
                </View>
              )}
              {headerConfig.budgetNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nº Presup.:</Text>
                  <Text style={styles.infoValue}>{headerConfig.budgetNumber}</Text>
                </View>
              )}
            </View>
            
            <View style={{ flex: 1 }}>
              {headerConfig.projectAddress && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dirección:</Text>
                  <Text style={styles.infoValue}>{headerConfig.projectAddress}</Text>
                </View>
              )}
              {headerConfig.budgetDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{headerConfig.budgetDate}</Text>
                </View>
              )}
              {headerConfig.contactPerson && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contacto:</Text>
                  <Text style={styles.infoValue}>{headerConfig.contactPerson}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {headerConfig.showDivider && <View style={styles.divider} />}
    </View>
  );
};