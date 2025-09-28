/**
 * Revenue calculation utilities for catalog valuation
 * Based on the Enhanced Valuation Methodology from the custom knowledge base
 */

export interface RevenueTypeMultiplier {
  type: string;
  label: string;
  multiplier: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  examples: string[];
}

export const REVENUE_TYPE_MULTIPLIERS: Record<string, RevenueTypeMultiplier> = {
  publishing: {
    type: 'publishing',
    label: 'Publishing Revenue',
    multiplier: 18,
    description: 'Highest multiplier - stable, long-term income from publishing rights',
    riskLevel: 'low',
    examples: ['BMI/ASCAP collections', 'Publisher advances', 'Songwriter royalties', 'Co-publishing deals']
  },
  mechanical: {
    type: 'mechanical',
    label: 'Mechanical Royalties',
    multiplier: 15,
    description: 'High multiplier - mechanical reproduction rights',
    riskLevel: 'low',
    examples: ['CD sales', 'Digital downloads', 'Streaming mechanicals', 'Physical sales']
  },
  streaming: {
    type: 'streaming',
    label: 'Streaming Revenue',
    multiplier: 12,
    description: 'Moderate multiplier - ongoing streaming income',
    riskLevel: 'medium',
    examples: ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music']
  },
  master_licensing: {
    type: 'master_licensing',
    label: 'Master Licensing',
    multiplier: 12,
    description: 'Moderate multiplier - master recording rights licensing',
    riskLevel: 'medium',
    examples: ['Record label deals', 'Distribution agreements', 'Master use licenses']
  },
  performance: {
    type: 'performance',
    label: 'Live Performance',
    multiplier: 10,
    description: 'Moderate multiplier - live performance income',
    riskLevel: 'medium',
    examples: ['Concert revenue', 'Festival fees', 'Live streaming', 'Venue performances']
  },
  sync: {
    type: 'sync',
    label: 'Sync/Licensing',
    multiplier: 8,
    description: 'Lower multiplier - synchronization and licensing deals',
    riskLevel: 'medium',
    examples: ['TV shows', 'Movies', 'Commercials', 'Video games', 'Netflix', 'Spotify playlists']
  },
  other: {
    type: 'other',
    label: 'Other Revenue',
    multiplier: 6,
    description: 'Lower multiplier - miscellaneous revenue sources',
    riskLevel: 'high',
    examples: ['Samples', 'Cover versions', 'Licensing fees', 'Miscellaneous royalties']
  },
  merchandise: {
    type: 'merchandise',
    label: 'Merchandise',
    multiplier: 5,
    description: 'Lower multiplier - merchandise and product sales',
    riskLevel: 'high',
    examples: ['T-shirts', 'Albums', 'Branded products', 'Fan merchandise']
  },
  touring: {
    type: 'touring',
    label: 'Touring Revenue',
    multiplier: 3,
    description: 'Lowest multiplier - most volatile income stream',
    riskLevel: 'high',
    examples: ['Tour income', 'Booking fees', 'Travel-based revenue', 'Meet & greets']
  }
};

/**
 * Calculate the valuation contribution of additional revenue sources
 * Based on the Enhanced Valuation Methodology (30% weight)
 */
export const calculateAdditionalRevenueValuation = (
  revenueSources: Array<{
    revenue_type: string;
    annual_revenue: number;
    confidence_level: 'low' | 'medium' | 'high';
    is_recurring: boolean;
  }>
) => {
  let totalValuation = 0;
  const breakdown: Record<string, number> = {};

  revenueSources.forEach(source => {
    const multiplierInfo = REVENUE_TYPE_MULTIPLIERS[source.revenue_type];
    if (!multiplierInfo) return;

    // Base valuation using multiplier
    let sourceValuation = source.annual_revenue * multiplierInfo.multiplier;

    // Apply confidence adjustments
    const confidenceMultiplier = {
      high: 1.1,    // +10% for high confidence
      medium: 1.0,  // No adjustment for medium confidence  
      low: 0.8      // -20% for low confidence
    }[source.confidence_level];

    sourceValuation *= confidenceMultiplier;

    // Apply recurring adjustment
    if (!source.is_recurring) {
      sourceValuation *= 0.6; // 40% reduction for one-time revenue
    }

    totalValuation += sourceValuation;
    breakdown[source.revenue_type] = (breakdown[source.revenue_type] || 0) + sourceValuation;
  });

  return {
    totalValuation,
    breakdown,
    averageMultiplier: revenueSources.length > 0 
      ? totalValuation / revenueSources.reduce((sum, s) => sum + s.annual_revenue, 0)
      : 0
  };
};

/**
 * Calculate revenue diversification score (0-1)
 * Based on number of different revenue types (max 9)
 */
export const calculateDiversificationScore = (revenueTypes: string[]): number => {
  const uniqueTypes = new Set(revenueTypes);
  return Math.min(uniqueTypes.size / 9, 1);
};

/**
 * Calculate diversification bonus for enhanced valuation
 * Up to 20% bonus based on diversification
 */
export const calculateDiversificationBonus = (diversificationScore: number): number => {
  return diversificationScore * 0.2; // Up to 20% bonus
};

/**
 * Get risk assessment for a portfolio of revenue sources
 */
export const assessPortfolioRisk = (
  revenueSources: Array<{
    revenue_type: string;
    annual_revenue: number;
    confidence_level: 'low' | 'medium' | 'high';
  }>
) => {
  if (revenueSources.length === 0) {
    return { riskLevel: 'high', score: 0, recommendations: [] };
  }

  let totalRevenue = 0;
  let weightedRiskScore = 0;
  const typeCounts = new Map<string, number>();

  revenueSources.forEach(source => {
    totalRevenue += source.annual_revenue;
    
    const multiplierInfo = REVENUE_TYPE_MULTIPLIERS[source.revenue_type];
    if (multiplierInfo) {
      // Risk scoring: low=1, medium=2, high=3
      const riskScore = { low: 1, medium: 2, high: 3 }[multiplierInfo.riskLevel];
      const confidenceScore = { low: 3, medium: 2, high: 1 }[source.confidence_level];
      
      weightedRiskScore += (riskScore + confidenceScore) * source.annual_revenue;
      typeCounts.set(source.revenue_type, (typeCounts.get(source.revenue_type) || 0) + 1);
    }
  });

  const avgRiskScore = weightedRiskScore / totalRevenue / 6; // Normalize to 0-1
  const diversification = typeCounts.size / 9; // 0-1 scale
  
  // Overall risk score (lower is better)
  const finalRiskScore = avgRiskScore * (1 - diversification * 0.3);
  
  let riskLevel: 'low' | 'medium' | 'high';
  let recommendations: string[] = [];

  if (finalRiskScore < 0.3) {
    riskLevel = 'low';
    recommendations.push('Excellent diversification and revenue quality');
  } else if (finalRiskScore < 0.6) {
    riskLevel = 'medium';
    recommendations.push('Consider diversifying into more stable revenue types');
    if (diversification < 0.4) {
      recommendations.push('Add more revenue source types to reduce risk');
    }
  } else {
    riskLevel = 'high';
    recommendations.push('High risk portfolio - consider adding more stable revenue sources');
    recommendations.push('Focus on publishing and mechanical revenue for stability');
    if (diversification < 0.3) {
      recommendations.push('Critically low diversification - add multiple revenue types');
    }
  }

  return {
    riskLevel,
    score: Math.round((1 - finalRiskScore) * 100), // Convert to 0-100 score
    recommendations,
    diversificationScore: diversification
  };
};

/**
 * Generate comprehensive CSV template data
 */
export const generateCsvTemplateData = () => {
  const headers = [
    'revenue_type',
    'revenue_source', 
    'annual_revenue',
    'currency',
    'growth_rate',
    'confidence_level',
    'start_date',
    'end_date',
    'is_recurring',
    'notes'
  ];

  const sampleData = [
    {
      revenue_type: 'publishing',
      revenue_source: 'BMI Performance Royalties',
      annual_revenue: '75000',
      currency: 'USD',
      growth_rate: '8',
      confidence_level: 'high',
      start_date: '2024-01-01',
      end_date: '',
      is_recurring: 'true',
      notes: 'Quarterly collections from BMI for radio/TV performances'
    },
    {
      revenue_type: 'streaming',
      revenue_source: 'Spotify Streaming Revenue',
      annual_revenue: '45000',
      currency: 'USD',
      growth_rate: '15',
      confidence_level: 'high',
      start_date: '2024-01-01',
      end_date: '',
      is_recurring: 'true',
      notes: 'Monthly streaming revenue from Spotify platform'
    },
    {
      revenue_type: 'sync',
      revenue_source: 'Netflix Original Series License',
      annual_revenue: '50000',
      currency: 'USD',
      growth_rate: '0',
      confidence_level: 'medium',
      start_date: '2024-06-01',
      end_date: '2025-06-01',
      is_recurring: 'false',
      notes: 'One-time sync license fee for Netflix original series'
    },
    {
      revenue_type: 'mechanical',
      revenue_source: 'Digital Download Mechanicals',
      annual_revenue: '25000',
      currency: 'USD',
      growth_rate: '5',
      confidence_level: 'medium',
      start_date: '2024-01-01',
      end_date: '',
      is_recurring: 'true',
      notes: 'Mechanical royalties from iTunes, Amazon, etc.'
    },
    {
      revenue_type: 'performance',
      revenue_source: 'Live Concert Revenue',
      annual_revenue: '120000',
      currency: 'USD',
      growth_rate: '20',
      confidence_level: 'medium',
      start_date: '2024-03-01',
      end_date: '2024-12-31',
      is_recurring: 'true',
      notes: 'Revenue from scheduled live performances and tours'
    }
  ];

  return {
    headers,
    sampleData,
    csvContent: [headers, ...sampleData.map(row => Object.values(row))]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  };
};

/**
 * Validate CSV row data
 */
export const validateRevenueSourceRow = (
  row: any,
  rowIndex: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!row.revenue_source?.trim()) {
    errors.push(`Row ${rowIndex}: Revenue source name is required`);
  }

  if (!row.annual_revenue || isNaN(Number(row.annual_revenue)) || Number(row.annual_revenue) <= 0) {
    errors.push(`Row ${rowIndex}: Annual revenue must be a positive number`);
  }

  // Validate revenue type
  if (!REVENUE_TYPE_MULTIPLIERS[row.revenue_type]) {
    errors.push(`Row ${rowIndex}: Invalid revenue type "${row.revenue_type}". Valid types: ${Object.keys(REVENUE_TYPE_MULTIPLIERS).join(', ')}`);
  }

  // Validate confidence level
  if (!['low', 'medium', 'high'].includes(row.confidence_level)) {
    errors.push(`Row ${rowIndex}: Invalid confidence level "${row.confidence_level}". Valid levels: low, medium, high`);
  }

  // Validate dates if provided
  if (row.start_date && isNaN(Date.parse(row.start_date))) {
    errors.push(`Row ${rowIndex}: Invalid start date format "${row.start_date}"`);
  }

  if (row.end_date && isNaN(Date.parse(row.end_date))) {
    errors.push(`Row ${rowIndex}: Invalid end date format "${row.end_date}"`);
  }

  // Validate boolean fields
  if (row.is_recurring && !['true', 'false'].includes(row.is_recurring.toLowerCase())) {
    errors.push(`Row ${rowIndex}: is_recurring must be "true" or "false"`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};