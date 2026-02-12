import { useEffect, ReactNode } from 'react';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';

// Store original CSS variable values so we can restore them
const ORIGINAL_VALUES: Record<string, string> = {};
const BRANDING_VARS = ['--primary', '--accent', '--ring', '--electric-lavender', '--music-purple'];

function captureOriginals() {
  if (Object.keys(ORIGINAL_VALUES).length > 0) return;
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  for (const v of BRANDING_VARS) {
    ORIGINAL_VALUES[v] = computed.getPropertyValue(v).trim();
  }
}

function applyBranding(colors: { primary: string; accent: string; headerBg: string }) {
  captureOriginals();
  const root = document.documentElement;
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--electric-lavender', colors.primary);
  root.style.setProperty('--music-purple', colors.primary);
}

function restoreBranding() {
  const root = document.documentElement;
  for (const v of BRANDING_VARS) {
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
