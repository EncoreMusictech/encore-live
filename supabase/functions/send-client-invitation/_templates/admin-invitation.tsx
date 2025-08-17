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

interface AdminInvitationEmailProps {
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

export const AdminInvitationEmail = ({
  invitee_name,
  subscriber_name = 'ENCORE',
  site_url,
  accept_url,
  support_email = 'support@encoremusic.tech',
}: AdminInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>{subscriber_name} CRM Administrator Access</Preview>
    <Body style={containerStyle}>
      <Container style={cardStyle}>
        <Heading style={{ color: palette.text, margin: 0, fontSize: 28 }}>
          {subscriber_name} CRM Administrator Access
        </Heading>
        <Text style={{ color: palette.subtext, marginTop: 8, marginBottom: 20 }}>
          {invitee_name ? `Hi ${invitee_name},` : 'Hello,'} you've been granted Administrator access to our comprehensive CRM system.
        </Text>

        <Section style={{ textAlign: 'center', margin: '8px 0 16px' }}>
          <Button style={buttonStyle} href={accept_url}>Accept Admin Invitation & Access CRM</Button>
        </Section>

        <Text style={{ color: palette.text, fontWeight: 700, marginTop: 8 }}>Your Access Level: Administrator</Text>
        <Text style={{ color: palette.subtext, marginBottom: 16 }}>
          As an Administrator, you have full access to all CRM modules and management capabilities.
        </Text>

        <Text style={{ color: palette.text, fontWeight: 700, marginTop: 8 }}>Full CRM Access Includes</Text>
        <ul style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
          <li><strong>Contract Management:</strong> Create, edit, and manage all contracts and agreements</li>
          <li><strong>Copyright Management:</strong> Full copyright registration and management capabilities</li>
          <li><strong>Royalties Processing:</strong> Complete royalty calculation, allocation, and payout management</li>
          <li><strong>Sync Licensing:</strong> Manage sync licenses, deals, and rights clearance</li>
          <li><strong>Client Portal Management:</strong> Invite and manage client access and permissions</li>
          <li><strong>User Management:</strong> Create and manage team member access across all modules</li>
        </ul>

        <Text style={{ color: palette.text, fontWeight: 700, marginTop: 16 }}>Administrator Responsibilities</Text>
        <ol style={{ color: palette.subtext, lineHeight: 1.6, paddingLeft: 18, marginTop: 6 }}>
          <li>Click "Accept Admin Invitation & Access CRM" above</li>
          <li>Sign in with the email address that received this invitation</li>
          <li>Access the full CRM dashboard with all modules enabled</li>
          <li>Manage team permissions and client portal access as needed</li>
          <li>Oversee all business operations across the platform</li>
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
          You received this email because you were granted Administrator access to the {subscriber_name} CRM system.
        </Text>
      </Container>
      <Section style={{ textAlign: 'center', marginTop: 16 }}>
        <Text style={{ color: palette.subtext, fontSize: 12 }}>© {new Date().getFullYear()} {subscriber_name}. All rights reserved.</Text>
      </Section>
    </Body>
  </Html>
);

export default AdminInvitationEmail;