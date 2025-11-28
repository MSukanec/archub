import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Section,
  Link,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  userEmail?: string;
}

export const WelcomeEmail = ({
  userName = 'Arquitecto',
  userEmail = 'user@example.com',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Seencel - Gestión de Proyectos de Construcción</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>🏗️ Seencel</Text>
          </Section>
          
          <Heading style={h1}>¡Hola, {userName}!</Heading>
          
          <Text style={text}>
            Gracias por unirte a <strong>Seencel</strong>. Estamos muy felices de tenerte en nuestra plataforma de gestión de proyectos de construcción.
          </Text>
          
          <Text style={text}>
            Tu cuenta ya está completamente lista y configurada. Ahora puedes:
          </Text>

          <ul style={listStyle}>
            <li style={listItem}>📊 Crear y gestionar tus proyectos de construcción</li>
            <li style={listItem}>👥 Invitar a miembros del equipo</li>
            <li style={listItem}>💰 Monitorear presupuestos y costos</li>
            <li style={listItem}>📁 Centralizar tus documentos y archivos</li>
          </ul>

          <Section style={btnContainer}>
            <Button style={button} href="https://seencel.com/organization/dashboard">
              Ir a mi Dashboard
            </Button>
          </Section>
          
          <Hr style={hr} />

          <Text style={footer}>
            Si tienes cualquier pregunta, no dudes en contactarnos a través del chat de soporte en la plataforma.
          </Text>

          <Text style={footer}>
            <strong>Seencel Inc.</strong> - Gestión Inteligente de Construcción
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
  color: '#333',
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

const listStyle = {
  padding: '0 48px',
  margin: '20px 0',
};

const listItem = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '10px',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '30px 20px',
};

const button = {
  backgroundColor: '#000000',
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

export default WelcomeEmail;
