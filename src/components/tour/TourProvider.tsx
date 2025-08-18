import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemoAccess } from '@/hooks/useDemoAccess';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  navigateTo?: string;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const DEMO_TOURS = {
  dashboard: {
    id: 'dashboard',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Your Music Rights Dashboard',
        content: 'This dashboard gives you an overview of all your music rights, revenue, and activities. Let\'s take a quick tour to show you how to use each module.',
        position: 'bottom' as const
      },
      {
        id: 'modules',
        title: 'Your Module Overview',
        content: 'These cards show your key metrics: catalog value, active contracts, registered copyrights, sync deals, and royalty revenue. Click any card to dive deeper into that module.',
        target: '.grid.grid-cols-1.md\\:grid-cols-2',
        position: 'bottom' as const
      },
      {
        id: 'catalog-valuation',
        title: 'Catalog Valuation',
        content: 'Start here! Search for any artist to see AI-powered catalog valuations, streaming analytics, and deal projections. This gives you market insights for investment decisions. Click Next to visit this module.',
        target: '[href="/crm/catalog-valuation"]',
        position: 'bottom' as const,
        navigateTo: '/crm/catalog-valuation'
      },
      {
        id: 'contracts',
        title: 'Contract Management',
        content: 'Create and manage publishing agreements, artist contracts, sync licenses, and more. Upload existing contracts or use our guided forms. Click Next to visit this module.',
        target: '[href="/crm/contracts"]',
        position: 'bottom' as const,
        navigateTo: '/crm/contracts'
      },
      {
        id: 'copyright',
        title: 'Copyright Registration',
        content: 'Register your musical works, manage writer splits, and prepare CWR files for PRO submissions. Essential for royalty collection. Click Next to visit this module.',
        target: '[href="/crm/copyright"]',
        position: 'bottom' as const,
        navigateTo: '/crm/copyright'
      },
      {
        id: 'sync',
        title: 'Sync Licensing',
        content: 'Track sync opportunities, manage licensing deals, and generate invoices for TV, film, and advertising placements. Click Next to visit this module.',
        target: '[href="/crm/sync"]',
        position: 'bottom' as const,
        navigateTo: '/crm/sync'
      },
      {
        id: 'royalties',
        title: 'Royalty Processing',
        content: 'Import statements, reconcile earnings, allocate payments to writers and publishers, and generate detailed reports. Click Next to visit this module.',
        target: '[href="/crm/royalties"]',
        position: 'bottom' as const,
        navigateTo: '/crm/royalties'
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        content: 'Use these shortcuts for common tasks. As a demo user, you can try each module once to see how it works.',
        target: '.space-y-3',
        position: 'left' as const
      }
    ]
  },
  'catalog-valuation': {
    id: 'catalog-valuation',
    steps: [
      {
        id: 'search',
        title: 'Step 1: Search for an Artist',
        content: 'Enter any artist name (try "Taylor Swift" or "The Weeknd") to pull their Spotify data and see catalog analytics.',
        target: 'input[placeholder*="artist"]',
        position: 'bottom' as const
      },
      {
        id: 'analyze',
        title: 'Step 2: Review the Analysis',
        content: 'Once you search, you\'ll see streaming data, popularity metrics, genre analysis, and estimated catalog value using DCF models.',
        position: 'bottom' as const
      },
      {
        id: 'valuation-methods',
        title: 'Step 3: Understand Valuation Methods',
        content: 'We use multiple approaches: Discounted Cash Flow (DCF), industry multiples, and risk-adjusted valuations based on genre and popularity.',
        position: 'bottom' as const
      },
      {
        id: 'deal-scenarios',
        title: 'Step 4: Explore Deal Scenarios',
        content: 'Use the Deal Simulator to model different acquisition structures: full purchase, licensing deals, or co-publishing agreements.',
        position: 'bottom' as const
      }
    ]
  },
  contracts: {
    id: 'contracts',
    steps: [
      {
        id: 'contract-types',
        title: 'Step 1: Choose Contract Type',
        content: 'Select from Publishing Agreements, Artist Contracts, Producer Deals, Sync Licenses, or Distribution Agreements.',
        target: 'button:contains("Create")',
        position: 'bottom' as const
      },
      {
        id: 'guided-form',
        title: 'Step 2: Complete the Guided Form',
        content: 'Our 7-step process guides you through: Agreement Type → Basic Info → Terms → Parties → Works → Interested Parties → Review',
        position: 'bottom' as const
      },
      {
        id: 'auto-populate',
        title: 'Step 3: Use Auto-Population',
        content: 'Upload existing contracts to auto-extract terms, or link to copyright registrations to inherit writer and publisher information.',
        position: 'bottom' as const
      },
      {
        id: 'templates',
        title: 'Step 4: Save as Templates',
        content: 'Create reusable templates for standard deals to speed up future contract creation.',
        position: 'bottom' as const
      }
    ]
  },
  copyright: {
    id: 'copyright',
    steps: [
      {
        id: 'register-work',
        title: 'Step 1: Register a Musical Work',
        content: 'Enter song details: title, writers, publishers, and ownership percentages. This creates the foundation for royalty collection.',
        target: 'button:contains("Register")',
        position: 'bottom' as const
      },
      {
        id: 'writer-splits',
        title: 'Step 2: Define Writer Splits',
        content: 'Set writer and publisher shares (must total 100%). These splits determine how royalties are distributed.',
        position: 'bottom' as const
      },
      {
        id: 'pro-data',
        title: 'Step 3: Add PRO Information',
        content: 'Include IPI/CAE numbers and PRO affiliations (ASCAP, BMI, SESAC) for proper royalty collection.',
        position: 'bottom' as const
      },
      {
        id: 'bulk-tools',
        title: 'Step 4: Use Bulk Tools',
        content: 'For large catalogs, use bulk upload features and MLC data enrichment to speed up registration.',
        position: 'bottom' as const
      }
    ]
  },
  sync: {
    id: 'sync',
    steps: [
      {
        id: 'create-opportunity',
        title: 'Step 1: Log Sync Opportunity',
        content: 'Create a new sync request with project details: TV show, film, commercial, or other media placement.',
        target: 'button:contains("New")',
        position: 'bottom' as const
      },
      {
        id: 'track-progress',
        title: 'Step 2: Track Deal Progress',
        content: 'Move deals through stages: Pitched → Quoted → Approved → Licensed → Paid. Use the kanban board or calendar view.',
        position: 'bottom' as const
      },
      {
        id: 'rights-clearance',
        title: 'Step 3: Handle Rights Clearance',
        content: 'Specify what rights you control (master, sync, territory) and coordinate with other rights holders if needed.',
        position: 'bottom' as const
      },
      {
        id: 'generate-invoice',
        title: 'Step 4: Generate Invoices',
        content: 'Once approved, create professional invoices with custom terms, payment schedules, and usage restrictions.',
        position: 'bottom' as const
      }
    ]
  },
  royalties: {
    id: 'royalties',
    steps: [
      {
        id: 'import-statements',
        title: 'Step 1: Import Royalty Statements',
        content: 'Upload CSV or Excel files from PROs, distributors, or streaming platforms. Our parser handles multiple formats.',
        target: 'button:contains("Import")',
        position: 'bottom' as const
      },
      {
        id: 'reconcile-data',
        title: 'Step 2: Reconcile and Match',
        content: 'Review imported data, match songs to your catalog, and resolve any discrepancies or unmatched items.',
        position: 'bottom' as const
      },
      {
        id: 'allocate-royalties',
        title: 'Step 3: Allocate to Payees',
        content: 'Distribute earnings to writers and publishers based on their contractual shares and recoupment status.',
        position: 'bottom' as const
      },
      {
        id: 'generate-statements',
        title: 'Step 4: Generate Statements',
        content: 'Create detailed royalty statements for each payee showing earnings, deductions, and running balances.',
        position: 'bottom' as const
      }
    ]
  }
};

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isDemo } = useDemoAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [hasSeenDashboardTour, setHasSeenDashboardTour] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  // Restore tour state from sessionStorage when component mounts or location changes
  useEffect(() => {
    const restoreTourState = () => {
      const tourState = sessionStorage.getItem('activeTour');
      if (tourState && isDemo) {
        try {
          const { tourId, currentStep: savedStep, isActive: savedIsActive } = JSON.parse(tourState);
          if (savedIsActive) {
            const tour = DEMO_TOURS[tourId as keyof typeof DEMO_TOURS];
            if (tour) {
              setSteps(tour.steps);
              setCurrentStep(savedStep);
              setIsActive(true);
              setActiveTourId(tourId);
            }
          }
        } catch (error) {
          console.error('Error restoring tour state:', error);
          sessionStorage.removeItem('activeTour');
        }
      }
    };

    // Small delay to allow page to render
    const timeoutId = setTimeout(restoreTourState, 500);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, isDemo]);

  // Check if we should show the dashboard tour for demo users
  useEffect(() => {
    if (isDemo && !hasSeenDashboardTour && !sessionStorage.getItem('activeTour')) {
      const hasSeenTour = localStorage.getItem('encore_dashboard_tour_seen');
      if (!hasSeenTour) {
        // Start dashboard tour automatically for new demo users
        setTimeout(() => {
          startTour('dashboard');
        }, 1000);
      } else {
        setHasSeenDashboardTour(true);
      }
    }
  }, [isDemo, hasSeenDashboardTour]);

  const startTour = (tourId: string) => {
    if (!isDemo) return; // Only show tours for demo users
    
    const tour = DEMO_TOURS[tourId as keyof typeof DEMO_TOURS];
    if (tour) {
      setSteps(tour.steps);
      setCurrentStep(0);
      setIsActive(true);
      setActiveTourId(tourId);
      
      // Store tour state in sessionStorage to persist across navigation
      sessionStorage.setItem('activeTour', JSON.stringify({
        tourId,
        currentStep: 0,
        isActive: true
      }));
    }
  };

  const nextStep = () => {
    const currentTourStep = steps[currentStep];
    
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextTourStep = steps[nextStepIndex];
      
      // Update tour state
      setCurrentStep(nextStepIndex);
      
      // Update sessionStorage
      sessionStorage.setItem('activeTour', JSON.stringify({
        tourId: activeTourId,
        currentStep: nextStepIndex,
        isActive: true
      }));
      
      // Navigate if the current step has a navigateTo property
      if (currentTourStep?.navigateTo && location.pathname !== currentTourStep.navigateTo) {
        navigate(currentTourStep.navigateTo);
      }
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setActiveTourId(null);
    
    // Clean up session storage
    sessionStorage.removeItem('activeTour');
    
    // Mark dashboard tour as seen
    if (steps.length > 0 && steps[0].id === 'welcome') {
      localStorage.setItem('encore_dashboard_tour_seen', 'true');
      setHasSeenDashboardTour(true);
    }
  };

  const skipTour = () => {
    endTour();
  };

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      steps,
      startTour,
      nextStep,
      prevStep,
      endTour,
      skipTour
    }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};