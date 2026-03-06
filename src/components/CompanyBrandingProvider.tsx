import { useEffect, ReactNode } from 'react';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';

// Store original CSS variable values so we can restore them
const ORIGINAL_VALUES: Record<string, string> = {};

// Simple CSS variables that get directly replaced
const SIMPLE_BRANDING_VARS = [
  '--primary', '--accent', '--ring', '--electric-lavender', '--music-purple',
  '--sidebar-primary', '--sidebar-accent-foreground', '--sidebar-ring',
  '--dusty-gold', '--music-gold',
];

// Computed CSS variables (gradients, shadows) that are rebuilt from colors
const COMPUTED_VARS = [
  '--gradient-primary', '--gradient-accent',
  '--shadow-elegant', '--shadow-glow', '--shadow-fader',
];

const ALL_VARS = [...SIMPLE_BRANDING_VARS, ...COMPUTED_VARS];

function captureOriginals() {
  if (Object.keys(ORIGINAL_VALUES).length > 0) return;
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  for (const v of ALL_VARS) {
    ORIGINAL_VALUES[v] = computed.getPropertyValue(v).trim();
  }
}

function applyBranding(colors: { primary: string; accent: string; headerBg: string }) {
  captureOriginals();
  const root = document.documentElement;

  // Simple variable mappings
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--electric-lavender', colors.primary);
  root.style.setProperty('--music-purple', colors.primary);
  root.style.setProperty('--sidebar-primary', colors.primary);
  root.style.setProperty('--sidebar-accent-foreground', colors.accent);
  root.style.setProperty('--sidebar-ring', colors.primary);
  root.style.setProperty('--dusty-gold', colors.accent);
  root.style.setProperty('--music-gold', colors.accent);

  // Rebuild computed variables using the brand colors
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.accent}))`
  );
  root.style.setProperty(
    '--gradient-accent',
    `linear-gradient(135deg, hsl(${colors.accent}), hsl(${colors.primary}))`
  );
  root.style.setProperty(
    '--shadow-elegant',
    `0 10px 30px -10px hsl(${colors.primary} / 0.3)`
  );
  root.style.setProperty(
    '--shadow-glow',
    `0 0 40px hsl(${colors.primary} / 0.2)`
  );
  root.style.setProperty(
    '--shadow-fader',
    `0 4px 12px hsl(${colors.accent} / 0.3)`
  );
}

function restoreBranding() {
  const root = document.documentElement;
  for (const v of ALL_VARS) {
    if (ORIGINAL_VALUES[v]) {
      root.style.setProperty(v, ORIGINAL_VALUES[v]);
    } else {
      root.style.removeProperty(v);
    }
  }
}

interface Props {
  children: ReactNode;
}

export function CompanyBrandingProvider({ children }: Props) {
  const { branding, loading } = useCompanyBranding();

  useEffect(() => {
    if (loading) return;

    if (branding?.enabled && branding.colors) {
      applyBranding(branding.colors);
    } else {
      restoreBranding();
    }

    return () => {
      restoreBranding();
    };
  }, [branding, loading]);

  return <>{children}</>;
}
