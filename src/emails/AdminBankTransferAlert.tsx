import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
  Button,
  Section,
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
      <Preview>Nueva transferencia pendiente de {userName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nueva Transferencia Pendiente</Heading>
          
          <Text style={text}>
            Se registró un pago por transferencia bancaria que requiere tu aprobación.
          </Text>
          
          <Text style={textDetails}>
            <strong>Cliente:</strong> {userName}<br />
            <strong>Email:</strong> {userEmail}<br />
            <strong>Curso:</strong> {courseName}<br />
            <strong>Monto:</strong> {formattedAmount}<br />
            <strong>ID Transferencia:</strong> {transferId}<br />
            <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://seencel.com/admin/payments">
              Revisar Transferencia
            </Button>
          </Section>

          <Text style={textSmall}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </Text>
          <Text style={linkText}>
            <Link href="https://seencel.com/admin/payments" style={link}>
              https://seencel.com/admin/payments
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footerSmall}>
            Email automático de notificación para administradores.<br />
            <Link href="https://seencel.com" style={link}>seencel.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '40px 0',
};

const container = {
  maxWidth: '465px',
  margin: '0 auto',
  padding: '20px',
};

const h1 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 15px 0',
};

const text = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 15px 0',
};

const textDetails = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 15px 0',
  backgroundColor: '#fffbeb',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #fde68a',
};

const textSmall = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '20px 0 5px 0',
};

const linkText = {
  color: '#0066cc',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 15px 0',
  wordBreak: 'break-all' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '25px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '30px 0',
};

const footerSmall = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};

export default AdminBankTransferAlert;
