import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Section,
  Link,
} from '@react-email/components';

interface AdminBankTransferAlertProps {
  userName?: string;
  userEmail?: string;
  courseName?: string;
  amount?: string;
  currency?: string;
  transferId?: string;
}

export const AdminBankTransferAlert = ({
  userName = 'Cliente',
  userEmail = 'cliente@example.com',
  courseName = 'Curso de Construcción',
  amount = '50000',
  currency = 'ARS',
  transferId = 'btp-000000',
}: AdminBankTransferAlertProps) => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));

  return (
    <Html>
      <Head />
      <Preview>Nueva transferencia bancaria pendiente de aprobación</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>Seencel</Text>
          </Section>
          
          <Section style={alertBanner}>
            <Text style={alertEmoji}>🏦</Text>
            <Heading style={h1}>Nueva Transferencia Pendiente</Heading>
          </Section>
          
          <Text style={text}>
            Se ha registrado un nuevo pago por transferencia bancaria que requiere tu aprobación.
          </Text>

          <Section style={detailsSection}>
            <Text style={sectionTitle}>📋 Detalles del Pago</Text>
            <Text style={detailItem}>
              <strong>Cliente:</strong> {userName}
            </Text>
            <Text style={detailItem}>
              <strong>Email:</strong> {userEmail}
            </Text>
            <Text style={detailItem}>
              <strong>Curso:</strong> {courseName}
            </Text>
            <Text style={detailItem}>
              <strong>Monto:</strong> {formattedAmount}
            </Text>
            <Text style={detailItem}>
              <strong>ID Transferencia:</strong> {transferId}
            </Text>
            <Text style={detailItem}>
              <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Section>

          <Text style={text}>
            Haz clic en el botón para revisar el comprobante y aprobar o rechazar el pago.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href="https://seencel.com/admin/payments/transfers">
              Revisar Transferencia
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Este es un email automático de notificación para administradores.
            <br />
            <Link href="https://seencel.com" style={link}>Seencel</Link> - Sistema de Gestión
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const logoSection = {
  textAlign: 'center' as const,
  padding: '20px',
};

const logo = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#000',
  margin: '0',
};

const alertBanner = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 20px',
  borderRadius: '8px',
  border: '1px solid #f59e0b',
};

const alertEmoji = {
  fontSize: '40px',
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#92400e',
  fontSize: '22px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 48px',
  margin: '20px 0',
};

const sectionTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  margin: '20px 48px',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const detailItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '20px',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  padding: '0 48px',
  margin: '10px 0',
};

const link = {
  color: '#555',
  textDecoration: 'underline',
};

export default AdminBankTransferAlert;
