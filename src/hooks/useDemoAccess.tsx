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
  dealSimulator: {
    scenarios: number;
    maxScenarios: number;
  };
}

interface DemoAccessContextType {
  isDemo: boolean;
  isDemoAccount: boolean;
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
const DEMO_EMAIL = 'demo@encoremusic.tech';

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
  dealSimulator: {
    scenarios: 0,
    maxScenarios: 1,
  },
};

export const DemoAccessProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [demoLimits, setDemoLimits] = useState<DemoLimits>(INITIAL_DEMO_LIMITS);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // Determine if user is demo or admin
  const isDemo = !user || user?.email === DEMO_EMAIL || user?.user_metadata?.role === 'demo'; // Unauthenticated users, demo account, or users with demo role are demo users
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isDemoAccount = !!user && (user?.email === DEMO_EMAIL || user?.user_metadata?.role === 'demo');

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
    
    // Demo account users have limited access (same as unauthenticated demo users)
    if (user?.email === DEMO_EMAIL) {
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
        case 'dealSimulator':
          return demoLimits.dealSimulator.scenarios < demoLimits.dealSimulator.maxScenarios;
        default:
          return false;
      }
    }
    
    // Authenticated non-admin, non-demo users have full access
    if (user && !isDemo) return true;
    
    // Unauthenticated demo users have limited access
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
        case 'dealSimulator':
          return demoLimits.dealSimulator.scenarios < demoLimits.dealSimulator.maxScenarios;
        default:
          return false;
      }
    }
    
    return false;
  };

  const incrementUsage = (module: string): void => {
    if (isAdmin) return; // Admin never has limits
    
    // Track usage for demo account and unauthenticated demo users
    if (user?.email === DEMO_EMAIL || isDemo) {
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
          case 'dealSimulator':
            newLimits.dealSimulator.scenarios += 1;
            break;
        }
        
        return newLimits;
      });
    }
  };

  const showUpgradeModalForModule = (module: string): void => {
    if (isAdmin) return; // Admin never sees upgrade modals
    
    // Show upgrade modal for demo account and unauthenticated demo users
    if (user?.email === DEMO_EMAIL || isDemo) {
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
        case 'dealSimulator':
          setUpgradeMessage('Demo complete! You\'ve saved your first deal scenario. Sign up to save unlimited scenarios and access advanced deal modeling features.');
          break;
      }
      setShowUpgradeModal(true);
    }
  };

  const getRemainingUsage = (module: string): number => {
    if (isAdmin) return Infinity; // Admin has unlimited access
    
    // Demo account and unauthenticated demo users have limited access
    if (user?.email === DEMO_EMAIL || isDemo) {
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
        case 'dealSimulator':
          return demoLimits.dealSimulator.maxScenarios - demoLimits.dealSimulator.scenarios;
        default:
          return 0;
      }
    }
    
    return Infinity; // Non-demo users have unlimited access
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
      isDemoAccount,
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