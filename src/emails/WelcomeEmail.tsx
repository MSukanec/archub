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
interface WelcomeEmailProps {
  userName?: string;
  userEmail?: string;
  adminName?: string;
}
export const WelcomeEmail = ({
  userName = 'Arquitecto',
  userEmail = 'user@example.com',
  adminName = 'El Equipo de Seencel',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Seencel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hola {userName},</Heading>
          
          <Text style={text}>
            Gracias por unirte a Seencel. Estamos muy contentos de tenerte a bordo.
          </Text>
          
          <Text style={text}>
            Accede a tu cuenta y comienza a gestionar tus proyectos de construcción con todo lo que necesitas.
          </Text>
          <Text style={text}>
            Si tienes preguntas, responde este email. Leo y respondo cada mensaje.
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
export default WelcomeEmail;
