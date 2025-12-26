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
interface SubscriptionExpiryEmailProps {
  userName?: string;
  organizationName?: string;
  planName?: string;
  expiresAt?: string;
  daysRemaining?: number;
  renewUrl?: string;
}
export const SubscriptionExpiryEmail = ({
  userName = 'Usuario',
  organizationName = 'Tu Organización',
  planName = 'Pro',
  expiresAt = '31 de diciembre, 2025',
  daysRemaining = 7,
  renewUrl = 'https://seencel.com/settings/pricing-plan',
}: SubscriptionExpiryEmailProps) => {
  const urgencyText = daysRemaining <= 1 
    ? '⚠️ ¡Tu suscripción vence HOY!'
    : daysRemaining <= 3 
      ? `⚠️ Tu suscripción vence en ${daysRemaining} días`
      : `Tu suscripción vence en ${daysRemaining} días`;
  const urgencyColor = daysRemaining <= 1 ? '#dc2626': daysRemaining <= 3 ? '#ea580c': '#0066cc';
  return (
    <Html>
      <Head />
      <Preview>{urgencyText} - Renueva tu plan {planName} de Seencel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hola {userName},</Heading>
          
          <Text style={{ ...text, color: urgencyColor, fontWeight: '600', fontSize: '16px'}}>
            {urgencyText}
          </Text>
          
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Organización:</strong> {organizationName}
            </Text>
            <Text style={infoText}>
              <strong>Plan actual:</strong> {planName}
            </Text>
            <Text style={infoText}>
              <strong>Fecha de vencimiento:</strong> {expiresAt}
            </Text>
          </Section>
          <Text style={text}>
            Para continuar disfrutando de todas las funciones de tu plan {planName}, 
            por favor renueva tu suscripción antes de que expire.
          </Text>
          <Text style={text}>
            Si tu suscripción expira, tu organización será cambiada automáticamente al plan 
            Free, lo cual puede limitar algunas funcionalidades.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={renewUrl}>
              Renovar Suscripción
            </Button>
          </Section>
          <Text style={textSmall}>
            Si tienes alguna pregunta o necesitas ayuda, responde a este email 
            o contáctanos en <Link href="mailto:contacto@seencel.com" style={link}>contacto@seencel.com</Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Saludos,<br />
            <strong>El Equipo de Seencel</strong>
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
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '40px 0',
};
const container = {
  backgroundColor: '#ffffff',
  maxWidth: '465px',
  margin: '0 auto',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};
const h1 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px 0',
};
const text = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};
const textSmall = {
  color: '#777',
  fontSize: '13px',
  lineHeight: '22px',
  margin: '20px 0 0 0',
};
const infoBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
  border: '1px solid #e2e8f0',
};
const infoText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
};
const buttonContainer = {
  textAlign: 'center'as const,
  margin: '28px 0',
};
const button = {
  backgroundColor: '#0047AB',
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
export default SubscriptionExpiryEmail;
