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
} from '@react-email/components';
interface ContactEmailProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  country?: string;
  message?: string;
}
export const ContactEmail = ({
  firstName = 'Usuario',
  lastName = 'Test',
  email = 'usuario@example.com',
  company = '',
  phone = '+54 11 1234-5678',
  country = 'AR',
  message = 'Este es un mensaje de prueba.',
}: ContactEmailProps) => {
  const countryNames: Record<string, string> = {
    AR: 'Argentina',
    MX: 'México',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Perú',
    EC: 'Ecuador',
    UY: 'Uruguay',
    PY: 'Paraguay',
    BO: 'Bolivia',
    VE: 'Venezuela',
    BR: 'Brasil',
    ES: 'España',
    US: 'Estados Unidos',
    OTHER: 'Otro país',
  };
  return (
    <Html>
      <Head />
      <Preview>Nuevo mensaje de contacto de {firstName} {lastName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nuevo Mensaje de Contacto</Heading>
          
          <Section style={infoSection}>
            <Text style={label}>Nombre completo:</Text>
            <Text style={value}>{firstName} {lastName}</Text>
            
            <Text style={label}>Email:</Text>
            <Text style={value}>{email}</Text>
            
            {company && (
              <>
                <Text style={label}>Empresa:</Text>
                <Text style={value}>{company}</Text>
              </>
            )}
            
            <Text style={label}>Teléfono:</Text>
            <Text style={value}>{phone}</Text>
            
            <Text style={label}>País:</Text>
            <Text style={value}>{countryNames[country] || country}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={label}>Mensaje:</Text>
          <Section style={messageSection}>
            <Text style={messageText}>{message}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Este mensaje fue enviado desde el formulario de contacto de Seencel.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '40px 0',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px',
  maxWidth: '580px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};
const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center'as const,
  margin: '0 0 24px 0',
};
const infoSection = {
  marginBottom: '16px',
};
const label = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase'as const,
  letterSpacing: '0.5px',
  margin: '12px 0 4px 0',
};
const value = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 8px 0',
};
const hr = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
};
const messageSection = {
  backgroundColor: '#f9f9f9',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e5e5e5',
};
const messageText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap'as const,
};
const footer = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center'as const,
  margin: '0',
};
export default ContactEmail;
