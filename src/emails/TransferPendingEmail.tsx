import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Link,
} from '@react-email/components';

interface TransferPendingEmailProps {
  userName?: string;
  courseName?: string;
  amount?: string;
  transferId?: string;
}

export const TransferPendingEmail = ({
  userName = 'Cliente',
  courseName = 'Curso',
  amount = '$0',
  transferId = 'TRF-000000',
}: TransferPendingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Tu comprobante de transferencia está siendo revisado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>Seencel</Text>
          </Section>
          
          <Heading style={h1}>📋 Comprobante Recibido</Heading>
          
          <Text style={text}>
            Hola <strong>{userName}</strong>,
          </Text>
          
          <Text style={text}>
            Hemos recibido tu comprobante de transferencia bancaria. Nuestro equipo lo está revisando y te notificaremos cuando tu pago sea confirmado.
          </Text>

          <Section style={orderSection}>
            <Text style={sectionTitle}>🔍 Estado de tu Pago</Text>
            <Text style={statusBadge}>⏳ PENDIENTE DE REVISIÓN</Text>
            <Text style={orderItem}>
              <strong>Curso:</strong> {courseName}
            </Text>
            <Text style={orderItem}>
              <strong>Monto:</strong> {amount}
            </Text>
            <Text style={orderItem}>
              <strong>ID de Transferencia:</strong> {transferId}
            </Text>
            <Text style={orderItem}>
              <strong>Fecha de envío:</strong> {new Date().toLocaleDateString('es-ES')}
            </Text>
          </Section>

          <Section style={infoSection}>
            <Text style={infoTitle}>⏱️ ¿Cuánto tarda?</Text>
            <Text style={infoText}>
              Normalmente revisamos los comprobantes en un plazo de <strong>24 a 48 horas hábiles</strong>. Te enviaremos un email de confirmación una vez que tu pago sea aprobado.
            </Text>
          </Section>

          <Text style={text}>
            Si tienes alguna pregunta sobre tu pago, no dudes en contactarnos respondiendo a este email o a través del chat de soporte.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            <strong>Seencel Inc.</strong> - Educación en Construcción
            <br />
            <Link href="https://seencel.com" style={link}>www.seencel.com</Link>
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

const h1 = {
  color: '#f59e0b',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0 20px',
  padding: '0 48px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 48px',
  margin: '15px 0',
};

const sectionTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px',
};

const orderSection = {
  backgroundColor: '#fffbeb',
  margin: '20px 48px',
  padding: '20px',
  borderRadius: '5px',
  border: '1px solid #fde68a',
};

const statusBadge = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '20px',
  display: 'inline-block',
  margin: '0 0 15px',
};

const orderItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const infoSection = {
  backgroundColor: '#f0f9ff',
  margin: '20px 48px',
  padding: '20px',
  borderRadius: '5px',
  border: '1px solid #bae6fd',
};

const infoTitle = {
  color: '#0369a1',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 10px',
};

const infoText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 48px',
  margin: '10px 0',
};

const link = {
  color: '#555',
  textDecoration: 'underline',
};

export default TransferPendingEmail;
