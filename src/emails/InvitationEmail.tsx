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

interface InvitationEmailProps {
  inviteeEmail?: string;
  organizationName?: string;
  inviterName?: string;
  roleName?: string;
  invitationLink?: string;
  adminName?: string;
}

export const InvitationEmail = ({
  inviteeEmail = 'invitado@example.com',
  organizationName = 'Mi Organización',
  inviterName = 'Un administrador',
  roleName = 'Miembro',
  invitationLink = 'https://seencel.com/register',
  adminName = 'El Equipo de Seencel',
}: InvitationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Te invitaron a unirte a {organizationName} en Seencel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Hola!</Heading>
          
          <Text style={text}>
            <strong>{inviterName}</strong> te ha invitado a unirte a la organización{' '}
            <strong>{organizationName}</strong> en Seencel.
          </Text>
          
          <Text style={text}>
            Tu rol será: <strong>{roleName}</strong>
          </Text>

          <Text style={text}>
            Seencel es una plataforma de gestión de proyectos de construcción que te permitirá 
            colaborar con tu equipo, hacer seguimiento de proyectos y mucho más.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={invitationLink}>
              Aceptar Invitación y Registrarme
            </Button>
          </Section>

          <Text style={textSmall}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </Text>
          <Text style={linkText}>
            <Link href={invitationLink} style={link}>
              {invitationLink}
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Saludos,<br />
            <strong>{adminName}</strong>
          </Text>
          
          <Text style={footerSmall}>
            <Link href="https://seencel.com" style={link}>seencel.com</Link>
          </Text>

          <Text style={footerDisclaimer}>
            Si no esperabas esta invitación, puedes ignorar este correo.
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
  margin: '0 0 15px 0',
};

const footerDisclaimer = {
  color: '#aaa',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};

export default InvitationEmail;
