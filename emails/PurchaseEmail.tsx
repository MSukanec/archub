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

interface PurchaseEmailProps {
  userName?: string;
  courseName?: string;
  amount?: string;
  transactionId?: string;
}

export const PurchaseEmail = ({
  userName = 'Estudiante',
  courseName = 'Curso de Construcción Avanzada',
  amount = '$99.99',
  transactionId = 'TXN-000000',
}: PurchaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmación de tu compra en Seencel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>🏗️ Seencel</Text>
          </Section>
          
          <Heading style={h1}>¡Compra Confirmada!</Heading>
          
          <Text style={text}>
            Hola <strong>{userName}</strong>,
          </Text>
          
          <Text style={text}>
            Gracias por tu compra. Hemos procesado exitosamente tu acceso al curso.
          </Text>

          <Section style={orderSection}>
            <Text style={sectionTitle}>📋 Detalles de tu Compra</Text>
            <Text style={orderItem}>
              <strong>Curso:</strong> {courseName}
            </Text>
            <Text style={orderItem}>
              <strong>Monto:</strong> {amount}
            </Text>
            <Text style={orderItem}>
              <strong>ID de Transacción:</strong> {transactionId}
            </Text>
            <Text style={orderItem}>
              <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}
            </Text>
          </Section>

          <Text style={text}>
            Ya puedes acceder al contenido completo del curso desde tu dashboard. Los materiales, videos y recursos están disponibles de inmediato.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href="https://seencel.com/learning/courses">
              Ver mi Curso
            </Button>
          </Section>

          <Text style={text}>
            Si tienes problemas al acceder o necesitas ayuda, contáctanos a través del chat de soporte.
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
  color: '#28a745',
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
  padding: '0 48px',
  margin: '20px 0 15px',
};

const orderSection = {
  backgroundColor: '#f9f9f9',
  margin: '20px 48px',
  padding: '20px',
  borderRadius: '5px',
  border: '1px solid #e6ebf1',
};

const orderItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '30px 20px',
};

const button = {
  backgroundColor: '#28a745',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
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

export default PurchaseEmail;
