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
interface PurchaseEmailProps {
  userName?: string;
  courseName?: string;
  courseSlug?: string;
  amount?: string;
  transactionId?: string;
  adminName?: string;
}
export const PurchaseEmail = ({
  userName = 'Estudiante',
  courseName = 'Curso de Construcción Avanzada',
  courseSlug = '',
  amount = '$99.99',
  transactionId = 'TXN-000000',
  adminName = 'El Equipo de Seencel',
}: PurchaseEmailProps) => {
  const courseUrl = courseSlug 
    ? `https://seencel.com/learning/courses/${courseSlug}`
    : 'https://seencel.com/learning/courses';
  return (
    <Html>
      <Head />
      <Preview>Confirmación de tu compra: {courseName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hola {userName},</Heading>
          
          <Text style={text}>
            Gracias por tu compra. Tu acceso al curso <strong>{courseName}</strong> ya está activo.
          </Text>
          
          <Text style={textDetails}>
            <strong>Monto:</strong> {amount}<br />
            <strong>ID de Transacción:</strong> {transactionId}<br />
            <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={courseUrl}>
              Ir a mi Curso
            </Button>
          </Section>
          <Text style={textSmall}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </Text>
          <Text style={linkText}>
            <Link href={courseUrl} style={link}>
              {courseUrl}
            </Link>
          </Text>
          <Text style={text}>
            Si tienes alguna pregunta, responde este email. Leo y respondo cada mensaje.
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
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #eee',
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
  wordBreak: 'break-all'as const,
};
const buttonContainer = {
  textAlign: 'center'as const,
  margin: '25px 0',
};
const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center'as const,
  display: 'inline-block',
  padding: '12px 24px',
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
export default PurchaseEmail;
