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
        target: '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-5',
        position: 'bottom' as const
      },
      {
        id: 'catalog-valuation',
        title: 'Catalog Valuation',
        content: 'Start here! Search for any artist to see AI-powered catalog valuations, streaming analytics, and deal projections. This gives you market insights for investment decisions. Click Next to visit this module.',
        target: '[href="/dashboard/catalog-valuation"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/catalog-valuation'
      },
      {
        id: 'contracts',
        title: 'Contract Management',
        content: 'Create and manage publishing agreements, artist contracts, sync licenses, and more. Upload existing contracts or use our guided forms. Click Next to visit this module.',
        target: '[href="/dashboard/contracts"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/contracts'
      },
      {
        id: 'copyright',
        title: 'Copyright Registration',
        content: 'Register your musical works, manage writer splits, and prepare CWR files for PRO submissions. Essential for royalty collection. Click Next to visit this module.',
        target: '[href="/dashboard/copyright"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/copyright'
      },
      {
        id: 'sync',
        title: 'Sync Licensing',
        content: 'Track sync opportunities, manage licensing deals, and generate invoices for TV, film, and advertising placements. Click Next to visit this module.',
        target: '[href="/dashboard/sync"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/sync'
      },
      {
        id: 'royalties',
        title: 'Royalty Processing',
        content: 'Import statements, reconcile earnings, allocate payments to writers and publishers, and generate detailed reports. Click Next to visit this module.',
        target: '[href="/dashboard/royalties"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/royalties'
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
      // Module Overview & Navigation
      {
        id: 'module-overview',
        title: 'Welcome to Catalog Valuation & Deal Analysis',
        content: 'This comprehensive module provides AI-powered catalog valuations, deal structuring tools, and financial projections. You\'ll learn to value music catalogs, analyze deals, and save scenarios for investment decisions.',
        target: '.space-y-6',
        position: 'bottom' as const
      },
      {
        id: 'tabs-overview',
        title: 'Three Powerful Tools',
        content: 'Notice the three tabs above: 1) Catalog Valuation - AI valuations, 2) Deal Analysis - Transaction modeling, 3) Song Estimator - Track analysis. We\'ll start with Deal Analysis for a complete workflow.',
        target: '[role="tablist"]',
        position: 'bottom' as const
      },
      {
        id: 'click-deal-analysis',
        title: 'Click Deal Analysis Tab',
        content: '👆 Click the "Deal Analysis" tab above to start the complete workflow. This will show you the 4-step process for analyzing music catalog transactions.',
        target: '[data-value="deal-analysis"]',
        position: 'top' as const
      },
      
      // Catalog Valuation Tab Deep Dive
      {
        id: 'catalog-tab-intro',
        title: 'AI-Powered Catalog Valuation Engine',
        content: 'This tab provides instant valuations using advanced algorithms that analyze Spotify data, apply industry multiples, and adjust for risk factors like genre, popularity, and catalog age.',
        target: '[value="catalog-valuation"]',
        position: 'bottom' as const
      },
      {
        id: 'catalog-search-demo',
        title: 'Try the Catalog Valuation',
        content: 'Search for a major artist like "The Weeknd" or "Taylor Swift". The AI will analyze their entire catalog, calculate multiple valuation scenarios, and show comparable artist benchmarks.',
        target: '.space-y-6',
        position: 'bottom' as const
      },
      {
        id: 'valuation-cards',
        title: 'Understanding Valuation Results',
        content: 'Results show Risk-Adjusted Value (primary), DCF Analysis (discounted cash flow), Market Multiple (industry comparables), and confidence scores. Charts display revenue projections and market positioning.',
        target: '.space-y-6',
        position: 'bottom' as const
      },
      
      // Deal Analysis Workflow
      {
        id: 'deal-analysis-intro',
        title: 'Deal Analysis Workflow',
        content: 'Now let\'s explore deal modeling. This 4-step process lets you search artists, select specific assets, configure deal terms, and run financial projections. Click the Deal Analysis tab.',
        target: '[value="deal-analysis"]',
        position: 'bottom' as const,
        navigateTo: '/dashboard/catalog-valuation'
      },
      {
        id: 'deal-tabs-overview',
        title: 'Four-Step Deal Process',
        content: 'Search Artist: Find and analyze target artists. Select Assets: Choose specific albums/singles. Deal Terms: Configure acquisition parameters. Saved Scenarios: Review and manage deal models.',
        target: '.space-x-1',
        position: 'bottom' as const
      },
      
      // Step 1: Search Artist
      {
        id: 'search-artist-tab',
        title: 'Step 1: Artist Discovery & Analysis',
        content: '👆 Click the "Search Artist" tab above. You\'ll search for artists to analyze their complete discography with real-time Spotify data.',
        target: '[data-tab="search"]',
        position: 'top' as const
      },
      {
        id: 'artist-search-input',
        title: 'Search for an Artist',
        content: '👇 Type "Billie Eilish" or "Ed Sheeran" in the search box below and press Enter. This will load their complete discography with popularity scores and streaming data.',
        target: 'input[placeholder*="artist"]',
        position: 'top' as const
      },
      {
        id: 'discography-display',
        title: 'Artist Information & Discography',
        content: 'View artist details, follower counts, and complete release history. Each album/single shows popularity scores (0-100) and estimated streaming potential for selection.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      
      // Step 2: Select Assets
      {
        id: 'select-assets-tab',
        title: 'Step 2: Asset Selection & Portfolio Building',
        content: '👆 Click the "Select Assets" tab above to choose specific albums and singles for your deal. This will show the artist\'s discography with selection checkboxes.',
        target: '[data-tab="selection"]',
        position: 'top' as const
      },
      {
        id: 'asset-selection-process',
        title: 'Choose Your Assets',
        content: '👇 Check the boxes next to albums/singles you want to acquire. Watch the estimated streams update in real-time as you select more assets.',
        target: '.space-y-4',
        position: 'top' as const
      },
      {
        id: 'estimated-streams',
        title: 'Stream Calculations & Selection Impact',
        content: 'See real-time stream estimates update as you select assets. Higher popularity scores and more tracks increase projected revenue. This forms the baseline for financial modeling.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      
      // Step 3: Deal Terms Configuration
      {
        id: 'deal-terms-tab',
        title: 'Step 3: Deal Structure Configuration',
        content: '👆 Click the "Deal Terms" tab above to configure the financial structure. These parameters directly impact ROI calculations and cash flow projections.',
        target: '[data-tab="terms"]',
        position: 'top' as const
      },
      {
        id: 'deal-type-selection',
        title: 'Choose Your Deal Type',
        content: '👇 Select a deal type from the dropdown: Acquisition (100% ownership, highest investment), Licensing (revenue share), or Co-Publishing (50/50 partnership).',
        target: 'select',
        position: 'top' as const
      },
      {
        id: 'financial-parameters',
        title: 'Set Financial Parameters',
        content: '👇 Enter your Upfront Advance amount and Recoupment Rate (50-100%). Try $500,000 advance with 75% recoupment to see how it affects cash flow timing.',
        target: '.grid',
        position: 'top' as const
      },
      {
        id: 'advanced-deal-terms',
        title: 'Configure Advanced Terms',
        content: '👇 Set Minimum Annual Guarantee, Deal Term Length (try 5 years), and Catalog Ownership %. These parameters control risk and reward structure.',
        target: '.grid',
        position: 'top' as const
      },
      {
        id: 'calculate-projections-button',
        title: 'Run Financial Projections',
        content: '👇 Click "Calculate Projections" to run the 5-year financial model. This applies decay curves, risk factors, and market assumptions to your deal.',
        target: 'button[type="submit"]',
        position: 'top' as const
      },
      
      // Step 4: Projections & Scenario Analysis
      {
        id: 'projection-calculation',
        title: 'Financial Projection Engine',
        content: 'Click "Calculate Projections" to run 5-year financial models. The system applies exponential decay curves, genre-specific risk factors, and market growth assumptions.',
        target: 'button',
        position: 'bottom' as const
      },
      {
        id: 'projection-results',
        title: 'Understanding Projection Results',
        content: 'Total Projected Revenue: 5-year earnings forecast. ROI %: Return on investment after 5 years. Payback Period: Time to recover initial investment. Year-by-year cash flows show detailed earning progression.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'roi-analysis',
        title: 'ROI & Risk Assessment',
        content: 'ROI calculations include advance recoupment, revenue sharing, and time value of money. Payback period indicates deal liquidity. Shorter payback = lower risk, higher confidence.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'scenario-saving',
        title: 'Save Your Deal Scenario',
        content: '👇 Click "Save Scenario" to preserve this deal for comparison. Name it something descriptive like "Billie Eilish - Full Catalog Acquisition".',
        target: 'button[type="button"]',
        position: 'top' as const
      },
      
      // Saved Scenarios Management
      {
        id: 'saved-scenarios-tab',
        title: 'View Saved Scenarios',
        content: '👆 Click the "Saved Scenarios" tab above to view all your saved deals. This is where you compare multiple opportunities side-by-side.',
        target: '[data-tab="scenarios"]',
        position: 'top' as const
      },
      {
        id: 'scenario-comparison',
        title: 'Deal Comparison & Portfolio Planning',
        content: 'Compare scenarios side-by-side to optimize deal selection. Consider total investment capacity, risk tolerance, and portfolio diversification when building your catalog acquisition strategy.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      
      // Territory & Market Analysis
      {
        id: 'territory-analysis',
        title: 'Territory Focus & Market Segmentation',
        content: 'Switch between Global, US-Only, and International territory focus to see how geographic markets affect valuations. Different territories have varying revenue multiples and risk profiles.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'market-conditions',
        title: 'Market Condition Impact',
        content: 'Territory selection affects: Revenue multiples (US: 12-15x, International: 8-12x), Risk factors (currency, regulation), Growth assumptions (mature vs emerging markets).',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      
      // Advanced Features
      {
        id: 'revenue-sources',
        title: 'Advanced: Revenue Source Management',
        content: 'For enhanced accuracy, add additional revenue sources beyond streaming: publishing, sync licensing, merchandise, touring. Each source uses different valuation multiples.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'comparable-analysis',
        title: 'Comparable Artist Benchmarking',
        content: 'The system automatically finds similar artists by genre, popularity, and catalog size to validate valuations. Comparable analysis provides market reality checks for projections.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'export-capabilities',
        title: 'Export & Reporting',
        content: 'Export detailed reports, financial models, and presentations for stakeholders. All data can be downloaded for further analysis in Excel or investment committee presentations.',
        target: '.space-y-4',
        position: 'bottom' as const
      },
      {
        id: 'workflow-complete',
        title: 'Workflow Complete: Next Steps',
        content: 'You\'ve learned the complete catalog valuation and deal analysis workflow. Try the Song Estimator tab for individual track analysis, or explore other modules like Contracts and Royalties for end-to-end music business management.',
        target: '.space-y-6',
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
        content: 'Select from Publishing Agreements, Artist Contracts, Producer Deals, Sync Licenses, or Distribution Agreements. Look for buttons to create new contracts.',
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
        content: 'Enter song details: title, writers, publishers, and ownership percentages. This creates the foundation for royalty collection. Look for registration buttons or forms.',
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
        content: 'Create a new sync request with project details: TV show, film, commercial, or other media placement. Look for "New" or "Create" buttons.',
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
        content: 'Upload CSV or Excel files from PROs, distributors, or streaming platforms. Our parser handles multiple formats. Look for import buttons.',
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
  
  // Safely handle navigation hooks
  let navigate: ReturnType<typeof useNavigate> | null = null;
  let location: ReturnType<typeof useLocation> | null = null;
  
  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    // Router hooks not available, navigation will be disabled
    console.warn('Router hooks not available in TourProvider');
  }
  
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [hasSeenDashboardTour, setHasSeenDashboardTour] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  // Restore tour state from sessionStorage when component mounts or location changes
  useEffect(() => {
    if (!location) return; // Skip if router not available
    
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
  }, [location?.pathname, isDemo]);

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
    
    console.log('Starting tour:', tourId);
    
    const tour = DEMO_TOURS[tourId as keyof typeof DEMO_TOURS];
    if (tour) {
      // For module-specific tours, navigate to the module first
      const moduleRoutes = {
        'catalog-valuation': '/dashboard/catalog-valuation',
        'contracts': '/dashboard/contracts',
        'copyright': '/dashboard/copyright',
        'sync': '/dashboard/sync',
        'royalties': '/dashboard/royalties'
      };
      
      const targetRoute = moduleRoutes[tourId as keyof typeof moduleRoutes];
      
      if (targetRoute && navigate && location && location.pathname !== targetRoute) {
        console.log('Navigating to module before starting tour:', targetRoute);
        // Navigate first, then start tour
        navigate(targetRoute);
        
        // Start tour after navigation with a delay
        setTimeout(() => {
          setSteps(tour.steps);
          setCurrentStep(0);
          setIsActive(true);
          setActiveTourId(tourId);
          
          // Store tour state in sessionStorage
          sessionStorage.setItem('activeTour', JSON.stringify({
            tourId,
            currentStep: 0,
            isActive: true
          }));
        }, 500);
      } else {
        // Already on correct page or dashboard tour
        setSteps(tour.steps);
        setCurrentStep(0);
        setIsActive(true);
        setActiveTourId(tourId);
        
        // Store tour state in sessionStorage
        sessionStorage.setItem('activeTour', JSON.stringify({
          tourId,
          currentStep: 0,
          isActive: true
        }));
      }
    }
  };

  const nextStep = () => {
    const currentTourStep = steps[currentStep];
    
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextTourStep = steps[nextStepIndex];
      
      console.log('nextStep called:', { 
        currentStep, 
        nextStepIndex,
        currentTourStep: currentTourStep?.title, 
        nextTourStep: nextTourStep?.title,
        nextNavigateTo: nextTourStep?.navigateTo,
        currentPath: location?.pathname 
      });
      
      // Check if NEXT step requires navigation
      if (nextTourStep?.navigateTo && navigate && location) {
        console.log('Next step needs navigation:', {
          from: location.pathname,
          to: nextTourStep.navigateTo,
          shouldNavigate: location.pathname !== nextTourStep.navigateTo
        });
        
        if (location.pathname !== nextTourStep.navigateTo) {
          // Navigate to where the next step should be
          navigate(nextTourStep.navigateTo);
          
          // Update step after navigation with a delay
          setTimeout(() => {
            setCurrentStep(nextStepIndex);
            sessionStorage.setItem('activeTour', JSON.stringify({
              tourId: activeTourId,
              currentStep: nextStepIndex,
              isActive: true
            }));
          }, 200);
          return;
        }
      }
      
      // No navigation needed or already on correct page, just update step
      setCurrentStep(nextStepIndex);
      sessionStorage.setItem('activeTour', JSON.stringify({
        tourId: activeTourId,
        currentStep: nextStepIndex,
        isActive: true
      }));
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