import { useEffect, ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useTenant } from '@/contexts/TenantContext';

interface WhitelabelThemeProviderProps {
  children: ReactNode;
}

export function WhitelabelThemeProvider({ children }: WhitelabelThemeProviderProps) {
  const { tenantConfig, loading } = useTenant();

  useEffect(() => {
    if (loading || !tenantConfig?.brand_config) return;

    const { brand_colors, fonts } = tenantConfig.brand_config;
    const root = document.documentElement;

    // Apply custom brand colors
    if (brand_colors) {
      root.style.setProperty('--primary', brand_colors.primary);
      root.style.setProperty('--secondary', brand_colors.secondary);
      root.style.setProperty('--accent', brand_colors.accent);
      root.style.setProperty('--background', brand_colors.background);
      root.style.setProperty('--foreground', brand_colors.foreground);
      
      // Update music theme colors to match brand
      root.style.setProperty('--music-purple', brand_colors.primary);
      root.style.setProperty('--music-gold', brand_colors.accent);
      root.style.setProperty('--electric-lavender', brand_colors.primary);
      root.style.setProperty('--dusty-gold', brand_colors.accent);
      
      // Update gradients with new brand colors
      root.style.setProperty('--gradient-primary', 
        `linear-gradient(135deg, hsl(${brand_colors.primary}), hsl(${brand_colors.accent}))`);
      root.style.setProperty('--gradient-accent', 
        `linear-gradient(135deg, hsl(${brand_colors.accent}), hsl(${brand_colors.primary}))`);
    }

    // Apply custom fonts
    if (fonts) {
      root.style.setProperty('--font-heading', `'${fonts.heading}', 'Space Grotesk', 'Helvetica Neue', sans-serif`);
      root.style.setProperty('--font-body', `'${fonts.body}', 'Inter', 'Helvetica Neue', sans-serif`);
    }

    // Apply custom favicon if provided
    if (tenantConfig.brand_config.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = tenantConfig.brand_config.favicon_url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = tenantConfig.brand_config.favicon_url;
        document.head.appendChild(newFavicon);
      }
    }

    // Update document title with tenant name
    if (tenantConfig.company_info.company_name) {
      document.title = `${tenantConfig.company_info.company_name} - Music Rights Management`;
    }

  }, [tenantConfig, loading]);

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}