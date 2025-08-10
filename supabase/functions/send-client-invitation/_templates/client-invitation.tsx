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

interface ClientInvitationEmailProps {
  invitee_name?: string;
  subscriber_name?: string; // e.g., ENCORE
  site_url: string;
  accept_url: string;
  support_email?: string;
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

export const ClientInvitationEmail = ({
  invitee_name,
  subscriber_name = 'ENCORE',
  site_url,
  accept_url,
  support_email = 'support@encoremusic.tech',
}: ClientInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>{subscriber_name} Client Portal Invitation</Preview>
    <Body style={containerStyle}>
      <Container style={cardStyle}>
        <Heading style={{ color: palette.text, margin: 0, fontSize: 28 }}>You're invited to the {subscriber_name} Client Portal</Heading>
        <Text style={{ color: palette.subtext, marginTop: 8, marginBottom: 20 }}>
          {invitee_name ? `Hi ${invitee_name},` : 'Hello,'} you’ve been granted secure access to your personalized portal.
        </Text>

        <Section style={{ textAlign: 'center', margin: '8px 0 16px' }}>
          <Button style={buttonStyle} href={accept_url}>Accept Invitation & Sign In</Button>
        </Section>

        <Text style={{ color: palette.text, fontWeight: 700, marginTop: 8 }}>What you’ll find inside</Text>
        <ul style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
          <li>Dashboard overview with status and recent activity</li>
          <li>Contracts: review agreements and document history</li>
          <li>Works: verify your catalog metadata</li>
          <li>Royalties & Payouts: statements, balances, and payments</li>
          <li>Notifications & Downloads: invoices, PDFs, and alerts</li>
        </ul>

        <Text style={{ color: palette.text, fontWeight: 700, marginTop: 16 }}>Quick steps to get started</Text>
        <ol style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
          <li>Click “Accept Invitation & Sign In”.</li>
          <li>Log in or create your account with the same email that received this invite.</li>
          <li>Complete your profile (avatar, name, phone) for a personalized experience.</li>
          <li>Explore your dashboard tabs to review contracts, works, and royalty data.</li>
        </ol>

        <Hr style={{ borderColor: palette.ring, margin: '20px 0' }} />

        <Text style={{ color: palette.subtext }}>
          If the button doesn’t work, copy and paste this link into your browser:{' '}
          <a style={smallLink} href={accept_url}>{accept_url}</a>
        </Text>
        <Text style={{ color: palette.subtext }}>
          Need help? Contact us at <a style={smallLink} href={`mailto:${support_email}`}>{support_email}</a>.
        </Text>
        <Text style={{ color: palette.subtext, fontSize: 12, marginTop: 8 }}>
          You received this email because an invitation was created for your address to access the {subscriber_name} Client Portal.
        </Text>
      </Container>
      <Section style={{ textAlign: 'center', marginTop: 16 }}>
        <Text style={{ color: palette.subtext, fontSize: 12 }}>© {new Date().getFullYear()} {subscriber_name}. All rights reserved.</Text>
      </Section>
    </Body>
  </Html>
);

export default ClientInvitationEmail;
