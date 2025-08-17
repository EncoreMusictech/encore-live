import React from 'npm:react@18.3.1';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';

interface UserInvitationEmailProps {
  invitee_name?: string;
  subscriber_name?: string; // e.g., ENCORE
  site_url: string;
  accept_url: string;
  support_email?: string;
  permissions?: Record<string, any>;
}

const palette = {
  bg: '#0b0b0f',
  card: '#111217',
  text: '#EAEAF2',
  subtext: '#B9B8C4',
  accent: '#8B7CFF', // ENCORE-like lavender
  accent2: '#5E4CF0',
  ring: '#2A2B36'
};

const containerStyle: React.CSSProperties = {
  background: palette.bg,
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  background: `linear-gradient(180deg, ${palette.card}, #0E1016)`,
  border: `1px solid ${palette.ring}`,
  borderRadius: 12,
  padding: 24,
};

const buttonStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent2})`,
  color: '#fff',
  borderRadius: 10,
  padding: '14px 18px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block'
};

const smallLink: React.CSSProperties = {
  color: palette.accent,
  textDecoration: 'underline'
};

export const UserInvitationEmail = ({
  invitee_name,
  subscriber_name = 'ENCORE',
  site_url,
  accept_url,
  support_email = 'support@encoremusic.tech',
  permissions = {},
}: UserInvitationEmailProps) => {
  const getGrantedModules = () => {
    const moduleNames = {
      contracts: 'Contract Management',
      copyright: 'Copyright Management', 
      royalties: 'Royalties Processing',
      sync_licenses: 'Sync Licensing'
    };
    
    return Object.entries(permissions)
      .filter(([key, value]) => value?.enabled)
      .map(([key]) => moduleNames[key as keyof typeof moduleNames])
      .filter(Boolean);
  };

  const grantedModules = getGrantedModules();

  return (
    <Html>
      <Head />
      <Preview>{subscriber_name} CRM Team Access Invitation</Preview>
      <Body style={containerStyle}>
        <Container style={cardStyle}>
          <Heading style={{ color: palette.text, margin: 0, fontSize: 28 }}>
            Welcome to the {subscriber_name} CRM Team
          </Heading>
          <Text style={{ color: palette.subtext, marginTop: 8, marginBottom: 20 }}>
            {invitee_name ? `Hi ${invitee_name},` : 'Hello,'} you've been granted User access to our CRM system with specific module permissions.
          </Text>

          <Section style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            <Button style={buttonStyle} href={accept_url}>Accept Invitation & Access CRM</Button>
          </Section>

          <Text style={{ color: palette.text, fontWeight: 700, marginTop: 8 }}>Your Access Level: User</Text>
          <Text style={{ color: palette.subtext, marginBottom: 16 }}>
            As a User, you have access to specific CRM modules based on your role and responsibilities.
          </Text>

          {grantedModules.length > 0 && (
            <>
              <Text style={{ color: palette.text, fontWeight: 700, marginTop: 8 }}>Granted Module Access</Text>
              <ul style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
                {grantedModules.map((module, index) => (
                  <li key={index}>{module}</li>
                ))}
              </ul>
            </>
          )}

          <Text style={{ color: palette.text, fontWeight: 700, marginTop: 16 }}>Getting Started</Text>
          <ol style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
            <li>Click "Accept Invitation & Access CRM" above</li>
            <li>Sign in with the email address that received this invitation</li>
            <li>You'll be directed to the CRM dashboard with your permitted modules</li>
            <li>Explore your assigned modules and familiarize yourself with the interface</li>
          </ol>

          <Hr style={{ borderColor: palette.ring, margin: '20px 0' }} />

          <Text style={{ color: palette.subtext }}>
            If the button doesn't work, copy and paste this link into your browser:{' '}
            <a style={smallLink} href={accept_url}>{accept_url}</a>
          </Text>
          <Text style={{ color: palette.subtext }}>
            Need help? Contact us at <a style={smallLink} href={`mailto:${support_email}`}>{support_email}</a>.
          </Text>
          <Text style={{ color: palette.subtext, fontSize: 12, marginTop: 8 }}>
            You received this email because you were granted User access to the {subscriber_name} CRM system.
          </Text>
        </Container>
        <Section style={{ textAlign: 'center', marginTop: 16 }}>
          <Text style={{ color: palette.subtext, fontSize: 12 }}>© {new Date().getFullYear()} {subscriber_name}. All rights reserved.</Text>
        </Section>
      </Body>
    </Html>
  );
};

export default UserInvitationEmail;