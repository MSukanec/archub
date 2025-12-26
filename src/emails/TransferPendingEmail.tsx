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
} from '@react-email/components';

interface TransferPendingEmailProps {
  userName?: string;
  courseName?: string;
  amount?: string;
  transferId?: string;
  adminName?: string;
}

export const TransferPendingEmail = ({
  userName = 'Cliente',
  courseName = 'Curso',
  amount = '$0',
  transferId = 'TRF-000000',
  adminName = 'El Equipo de Seencel',
}: TransferPendingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Recibimos tu comprobante de transferencia</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hola {userName},</Heading>
          
          <Text style={text}>
            Recibimos tu comprobante de transferencia bancaria. Nuestro equipo lo está revisando.
          </Text>
          
          <Text style={textDetails}>
            <strong>Curso:</strong> {courseName}<br />
            <strong>Monto:</strong> {amount}<br />
            <strong>ID de Transferencia:</strong> {transferId}<br />
            <strong>Fecha de envío:</strong> {new Date().toLocaleDateString('es-ES')}
          </Text>

          <Text style={textHighlight}>
            Normalmente revisamos los comprobantes en <strong>24 a 48 horas hábiles</strong>. 
            Te enviaremos un email de confirmación cuando tu pago sea aprobado.
          </Text>

          <Text style={text}>
            Si tienes alguna pregunta sobre tu pago, responde este email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Saludos,<br />
            <strong>{adminName}</strong>
          </Text>
          
          <Text style={footerSmall}>
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

const textHighlight = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 15px 0',
  backgroundColor: '#f0f9ff',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #bae6fd',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '30px 0',
};

const footer = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 10px 0',
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

export default TransferPendingEmail;
