import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Organization {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  logoUrl: string | null;
  pdfConfig?: {
    logoPosition: "left" | "center" | "right";
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showTaxId: boolean;
    primaryColor: string;
    secondaryColor: string;
  };
}

interface PdfConfigPreviewProps {
  organization: Organization;
}

export function PdfConfigPreview({ organization }: PdfConfigPreviewProps) {
  const pdfConfig = organization.pdfConfig || {
    logoPosition: "left",
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    showTaxId: true,
    primaryColor: "#92c900",
    secondaryColor: "#f0f0f0",
  };
  
  // Determinar el hexcolor que será utilizado para componentes PDF
  const primaryColor = pdfConfig.primaryColor || "#92c900";
  const secondaryColor = pdfConfig.secondaryColor || "#f0f0f0";
  
  // Estilos del PDF
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      padding: 30,
      fontFamily: 'Helvetica',
    },
    headerLeft: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    headerRight: {
      flexDirection: 'row-reverse',
      marginBottom: 20,
    },
    headerCenter: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain',
      marginRight: 15,
    },
    logoCenter: {
      width: 100,
      height: 100,
      objectFit: 'contain',
      marginBottom: 10,
    },
    orgInfo: {
      flex: 1,
    },
    orgName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: primaryColor,
    },
    orgDetails: {
      fontSize: 9,
      marginBottom: 2,
      color: '#555555',
    },
    dateText: {
      fontSize: 10,
      marginBottom: 15,
      textAlign: 'right',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
      color: primaryColor,
    },
    subtitle: {
      fontSize: 12,
      marginBottom: 10,
      color: '#555555',
    },
    section: {
      marginBottom: 15,
    },
    infoBox: {
      padding: 10,
      backgroundColor: secondaryColor,
      borderRadius: 4,
      marginBottom: 15,
    },
    infoTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 5,
      color: primaryColor,
    },
    infoText: {
      fontSize: 10,
      color: '#333333',
      marginBottom: 3,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 30,
      right: 30,
      textAlign: 'center',
      fontSize: 8,
      color: '#999999',
    },
  });

  return (
    <div className="w-full h-[480px] border rounded overflow-hidden shadow-sm">
      <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Encabezado de la organización */}
            {pdfConfig.logoPosition === 'center' ? (
              <View style={styles.headerCenter}>
                {organization.logoUrl && (
                  <Image src={organization.logoUrl} style={styles.logoCenter} />
                )}
                <Text style={styles.orgName}>{organization.name}</Text>
                {organization.description && (
                  <Text style={styles.orgDetails}>{organization.description}</Text>
                )}
                {pdfConfig.showAddress && organization.address && (
                  <Text style={styles.orgDetails}>{organization.address}</Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {pdfConfig.showPhone && organization.phone && (
                    <Text style={[styles.orgDetails, { marginRight: 10 }]}>
                      Tel: {organization.phone}
                    </Text>
                  )}
                  {pdfConfig.showEmail && organization.email && (
                    <Text style={[styles.orgDetails, { marginRight: 10 }]}>
                      Email: {organization.email}
                    </Text>
                  )}
                  {pdfConfig.showWebsite && organization.website && (
                    <Text style={styles.orgDetails}>Web: {organization.website}</Text>
                  )}
                </View>
                {pdfConfig.showTaxId && organization.taxId && (
                  <Text style={styles.orgDetails}>RIF/NIT: {organization.taxId}</Text>
                )}
              </View>
            ) : (
              <View style={pdfConfig.logoPosition === 'left' ? styles.headerLeft : styles.headerRight}>
                {organization.logoUrl && (
                  <Image src={organization.logoUrl} style={styles.logo} />
                )}
                <View style={styles.orgInfo}>
                  <Text style={styles.orgName}>{organization.name}</Text>
                  {organization.description && (
                    <Text style={styles.orgDetails}>{organization.description}</Text>
                  )}
                  {pdfConfig.showAddress && organization.address && (
                    <Text style={styles.orgDetails}>{organization.address}</Text>
                  )}
                  {pdfConfig.showPhone && organization.phone && (
                    <Text style={styles.orgDetails}>Tel: {organization.phone}</Text>
                  )}
                  {pdfConfig.showEmail && organization.email && (
                    <Text style={styles.orgDetails}>Email: {organization.email}</Text>
                  )}
                  {pdfConfig.showWebsite && organization.website && (
                    <Text style={styles.orgDetails}>Web: {organization.website}</Text>
                  )}
                  {pdfConfig.showTaxId && organization.taxId && (
                    <Text style={styles.orgDetails}>RIF/NIT: {organization.taxId}</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* Fecha */}
            <View>
              <Text style={styles.dateText}>
                Fecha: {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </Text>
            </View>
            
            {/* Título del documento */}
            <View>
              <Text style={styles.title}>PRESUPUESTO</Text>
            </View>
            
            {/* Información adicional (sólo para muestra) */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Vista Previa</Text>
              <Text style={styles.infoText}>Este es un ejemplo de cómo se verán los encabezados de tus documentos PDF con la configuración actual.</Text>
            </View>
            
            {/* Pie de página */}
            <Text style={styles.footer}>
              Este documento es una vista previa de configuración - {organization.name}
            </Text>
          </Page>
        </Document>
      </PDFViewer>
    </div>
  );
}