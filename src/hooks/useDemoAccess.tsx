import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DemoLimits {
  catalogValuation: {
    searches: number;
    maxSearches: number;
  };
  contractManagement: {
    contracts: number;
    maxContracts: number;
  };
  copyrightManagement: {
    registrations: number;
    maxRegistrations: number;
  };
  royaltiesProcessing: {
    imports: number;
    maxImports: number;
  };
  syncLicensing: {
    licenses: number;
    maxLicenses: number;
  };
}

interface DemoAccessContextType {
  isDemo: boolean;
  isAdmin: boolean;
  demoLimits: DemoLimits;
  canAccess: (module: string) => boolean;
  incrementUsage: (module: string) => void;
  getRemainingUsage: (module: string) => number;
  resetDemoData: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  upgradeMessage: string;
  showUpgradeModalForModule: (module: string) => void;
}

const DemoAccessContext = createContext<DemoAccessContextType | undefined>(undefined);

const ADMIN_EMAIL = 'info@encoremusic.tech';

const INITIAL_DEMO_LIMITS: DemoLimits = {
  catalogValuation: {
    searches: 0,
    maxSearches: 1,
  },
  contractManagement: {
    contracts: 0,
    maxContracts: 1,
  },
  copyrightManagement: {
    registrations: 0,
    maxRegistrations: 1,
  },
  royaltiesProcessing: {
    imports: 0,
    maxImports: 1,
  },
  syncLicensing: {
    licenses: 0,
    maxLicenses: 1,
  },
};

export const DemoAccessProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [demoLimits, setDemoLimits] = useState<DemoLimits>(INITIAL_DEMO_LIMITS);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // Determine if user is demo or admin
  const isDemo = !user || user?.user_metadata?.role === 'demo'; // Unauthenticated users or users with demo role are demo users
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Load demo limits from localStorage on mount
  useEffect(() => {
    if (isDemo) {
      const storedLimits = localStorage.getItem('encore_demo_limits');
      if (storedLimits) {
        try {
          const parsed = JSON.parse(storedLimits);
          setDemoLimits(parsed);
        } catch (error) {
          console.error('Error parsing stored demo limits:', error);
          setDemoLimits(INITIAL_DEMO_LIMITS);
        }
      }
    }
  }, [isDemo]);

  // Save demo limits to localStorage whenever they change
  useEffect(() => {
    if (isDemo) {
      localStorage.setItem('encore_demo_limits', JSON.stringify(demoLimits));
    }
  }, [demoLimits, isDemo]);

  // Reset demo data when user signs in
  useEffect(() => {
    if (user && !isAdmin) {
      resetDemoData();
    }
  }, [user, isAdmin]);

  const canAccess = (module: string): boolean => {
    // Admin users have full access
    if (isAdmin) return true;
    
    // Authenticated non-admin users have full access
    if (user && !isAdmin) return true;
    
    // Demo users have limited access
    if (isDemo) {
      switch (module) {
        case 'catalogValuation':
          return demoLimits.catalogValuation.searches < demoLimits.catalogValuation.maxSearches;
        case 'contractManagement':
          return demoLimits.contractManagement.contracts < demoLimits.contractManagement.maxContracts;
        case 'copyrightManagement':
          return demoLimits.copyrightManagement.registrations < demoLimits.copyrightManagement.maxRegistrations;
        case 'royaltiesProcessing':
          return demoLimits.royaltiesProcessing.imports < demoLimits.royaltiesProcessing.maxImports;
        case 'syncLicensing':
          return demoLimits.syncLicensing.licenses < demoLimits.syncLicensing.maxLicenses;
        default:
          return false;
      }
    }
    
    return false;
  };

  const incrementUsage = (module: string): void => {
    if (isAdmin || !isDemo) return; // Only track for demo users
    
    setDemoLimits(prev => {
      const newLimits = { ...prev };
      
      switch (module) {
        case 'catalogValuation':
          newLimits.catalogValuation.searches += 1;
          break;
        case 'contractManagement':
          newLimits.contractManagement.contracts += 1;
          break;
        case 'copyrightManagement':
          newLimits.copyrightManagement.registrations += 1;
          break;
        case 'royaltiesProcessing':
          newLimits.royaltiesProcessing.imports += 1;
          break;
        case 'syncLicensing':
          newLimits.syncLicensing.licenses += 1;
          break;
      }
      
      return newLimits;
    });
  };

  const showUpgradeModalForModule = (module: string): void => {
    if (isAdmin || !isDemo) return;
    
    switch (module) {
      case 'catalogValuation':
        setUpgradeMessage('Demo complete! You\'ve used your free catalog valuation. Sign up to unlock unlimited valuations and deal simulations.');
        break;
      case 'contractManagement':
        setUpgradeMessage('Demo complete. Sign up to manage more contracts and unlock advanced features.');
        break;
      case 'copyrightManagement':
        setUpgradeMessage('Demo complete! You\'ve registered your first copyright. Sign up to manage unlimited copyrights and access bulk registration.');
        break;
      case 'royaltiesProcessing':
        setUpgradeMessage('You\'ve completed the royalties demo. Sign up to unlock full reconciliation tools and unlimited statement processing.');
        break;
      case 'syncLicensing':
        setUpgradeMessage('Demo complete! You\'ve explored sync licensing. Sign up to manage unlimited sync deals and access advanced tracking features.');
        break;
    }
    setShowUpgradeModal(true);
  };

  const getRemainingUsage = (module: string): number => {
    if (isAdmin || !isDemo) return Infinity;
    
    switch (module) {
      case 'catalogValuation':
        return demoLimits.catalogValuation.maxSearches - demoLimits.catalogValuation.searches;
      case 'contractManagement':
        return demoLimits.contractManagement.maxContracts - demoLimits.contractManagement.contracts;
      case 'copyrightManagement':
        return demoLimits.copyrightManagement.maxRegistrations - demoLimits.copyrightManagement.registrations;
      case 'royaltiesProcessing':
        return demoLimits.royaltiesProcessing.maxImports - demoLimits.royaltiesProcessing.imports;
      case 'syncLicensing':
        return demoLimits.syncLicensing.maxLicenses - demoLimits.syncLicensing.licenses;
      default:
        return 0;
    }
  };

  const resetDemoData = (): void => {
    setDemoLimits(INITIAL_DEMO_LIMITS);
    localStorage.removeItem('encore_demo_limits');
    setShowUpgradeModal(false);
    setUpgradeMessage('');
  };

  return (
    <DemoAccessContext.Provider value={{
      isDemo,
      isAdmin,
      demoLimits,
      canAccess,
      incrementUsage,
      getRemainingUsage,
      resetDemoData,
      showUpgradeModal,
      setShowUpgradeModal,
      upgradeMessage,
      showUpgradeModalForModule,
    }}>
      {children}
    </DemoAccessContext.Provider>
  );
};

export const useDemoAccess = () => {
  const context = useContext(DemoAccessContext);
  if (context === undefined) {
    throw new Error('useDemoAccess must be used within a DemoAccessProvider');
  }
  return context;
};