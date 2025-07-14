import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  confirmationUrl: string;
  userEmail: string;
}

export const WelcomeEmail = ({
  confirmationUrl,
  userEmail,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to ENCORE Music Tech Solutions - Please verify your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logo}>
            <Text style={logoText}>ENCORE</Text>
            <Text style={logoSubtext}>Music Tech Solutions</Text>
          </div>
        </Section>
        
        <Heading style={h1}>Welcome to ENCORE!</Heading>
        
        <Text style={text}>
          Thank you for signing up for ENCORE Music Tech Solutions' Rights Management Systems. 
          We're excited to have you on board!
        </Text>
        
        <Text style={text}>
          To get started with our comprehensive suite of music industry tools, please verify your email address by clicking the button below:
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href={confirmationUrl}
            target="_blank"
            style={button}
          >
            Verify Your Account
          </Link>
        </Section>
        
        <Text style={text}>
          Or copy and paste this link in your browser:
        </Text>
        <Text style={linkText}>{confirmationUrl}</Text>
        
        <Hr style={hr} />
        
        <Text style={text}>
          Once verified, you'll have access to our powerful platform featuring:
        </Text>
        
        <Text style={featureList}>
          • <strong>Catalog Valuation</strong> - Advanced music catalog valuation tools<br />
          • <strong>Deal Simulator</strong> - Model and analyze music deals<br />
          • <strong>Contract Management</strong> - Streamline your legal workflows<br />
          • <strong>Copyright Management</strong> - Manage your intellectual property rights
        </Text>
        
        <Text style={text}>
          If you have any questions or need assistance, our support team is here to help.
        </Text>
        
        <Text style={footer}>
          Best regards,<br />
          The ENCORE Team<br />
          <Link
            href="https://encoremusic.tech"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            ENCORE Music Tech Solutions
          </Link>
        </Text>
        
        <Hr style={hr} />
        
        <Text style={disclaimer}>
          If you didn't create an account with ENCORE, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
}

const header = {
  backgroundColor: '#1a1a1a',
  padding: '20px',
  borderRadius: '8px 8px 0 0',
  marginBottom: '32px',
}

const logo = {
  textAlign: 'center' as const,
}

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

const logoSubtext = {
  color: '#cccccc',
  fontSize: '12px',
  margin: '4px 0 0 0',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const featureList = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '16px 0',
  paddingLeft: '20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}

const linkText = {
  color: '#667eea',
  fontSize: '14px',
  margin: '8px 0 16px 0',
  wordBreak: 'break-all' as const,
}

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
}

const disclaimer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
}