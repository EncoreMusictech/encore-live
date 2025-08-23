import { supabase } from '@/integrations/supabase/client';

export const createTestNotifications = async (userId: string) => {
  const testNotifications: Array<{
    user_id: string;
    type: 'contract_signed' | 'contract_expiring' | 'contract_pending' | 'royalty_statement' | 'payment_processed' | 'copyright_registered' | 'sync_opportunity' | 'system_alert';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    data: any;
  }> = [
    {
      user_id: userId,
      type: 'contract_signed' as const,
      priority: 'high' as const,
      title: 'Contract Signed Successfully',
      message: 'Your publishing agreement with "Midnight Dreams Records" has been signed and executed.',
      data: { contractId: 'contract-123', contractTitle: 'Publishing Agreement - Midnight Dreams' }
    },
    {
      user_id: userId,
      type: 'royalty_statement' as const,
      priority: 'medium' as const,
      title: 'Q4 Royalty Statement Available',
      message: 'Your quarterly royalty statement for Q4 2024 is ready for download. Total earnings: $2,847.50',
      data: { amount: 2847.50, period: 'Q4 2024' }
    },
    {
      user_id: userId,
      type: 'contract_expiring' as const,
      priority: 'medium' as const,
      title: 'Contract Expiring Soon',
      message: 'Your sync license agreement with "Blue Moon Productions" expires in 28 days.',
      data: { contractId: 'sync-456', daysRemaining: 28 }
    },
    {
      user_id: userId,
      type: 'payment_processed' as const,
      priority: 'high' as const,
      title: 'Payment Processed',
      message: 'Royalty payment of $1,234.56 has been successfully processed to your account.',
      data: { amount: 1234.56, paymentMethod: 'Direct Deposit' }
    },
    {
      user_id: userId,
      type: 'copyright_registered' as const,
      priority: 'medium' as const,
      title: 'Copyright Registration Complete',
      message: '"Summer Breeze (Acoustic Version)" has been successfully registered with ASCAP.',
      data: { workTitle: 'Summer Breeze (Acoustic Version)', pro: 'ASCAP' }
    },
    {
      user_id: userId,
      type: 'sync_opportunity' as const,
      priority: 'medium' as const,
      title: 'New Sync Opportunity',
      message: 'Netflix is looking for indie folk tracks for their upcoming series. Your catalog matches their criteria.',
      data: { platform: 'Netflix', genre: 'indie folk', deadline: '2024-02-15' }
    },
    {
      user_id: userId,
      type: 'system_alert' as const,
      priority: 'low' as const,
      title: 'New Features Available',
      message: 'Check out our new AI-powered catalog analysis tools in the valuation module.',
      data: { feature: 'AI Catalog Analysis', module: 'catalog-valuation' }
    },
    {
      user_id: userId,
      type: 'contract_pending' as const,
      priority: 'high' as const,
      title: 'Contract Approval Required',
      message: 'Distribution agreement with "Global Music Network" requires your review and signature.',
      data: { contractId: 'dist-789', urgency: 'high' }
    }
  ];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotifications);

    if (error) {
      console.error('Error creating test notifications:', error);
      throw error;
    }

    console.log('Test notifications created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test notifications:', error);
    throw error;
  }
};