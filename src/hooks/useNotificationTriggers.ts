import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

export const useNotificationTriggers = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  // Contract notification triggers
  const triggerContractNotification = async (
    userId: string,
    contractId: string,
    type: 'signed' | 'expiring' | 'pending',
    contractTitle: string
  ) => {
    if (!user) return;

    const notifications = {
      signed: {
        title: 'Contract Signed',
        message: `"${contractTitle}" has been successfully signed and executed.`,
        priority: 'high' as const
      },
      expiring: {
        title: 'Contract Expiring Soon',
        message: `"${contractTitle}" will expire in 30 days. Consider renewal.`,
        priority: 'medium' as const
      },
      pending: {
        title: 'Contract Approval Required',
        message: `"${contractTitle}" is pending your review and approval.`,
        priority: 'high' as const
      }
    };

    const notification = notifications[type];
    
    await createNotification(
      userId,
      `contract_${type}`,
      notification.title,
      notification.message,
      { contractId, contractTitle },
      notification.priority
    );
  };

  // Royalty notification triggers
  const triggerRoyaltyNotification = async (
    userId: string,
    type: 'statement_ready' | 'payment_processed' | 'discrepancy',
    amount?: number,
    period?: string
  ) => {
    if (!user) return;

    const notifications = {
      statement_ready: {
        title: 'New Royalty Statement Available',
        message: `Your royalty statement for ${period || 'this period'} is ready for download.`,
        priority: 'medium' as const
      },
      payment_processed: {
        title: 'Payment Processed',
        message: `Royalty payment of ${amount ? `$${amount.toLocaleString()}` : 'your earnings'} has been processed.`,
        priority: 'high' as const
      },
      discrepancy: {
        title: 'Royalty Discrepancy Found',
        message: 'We found discrepancies in your royalty data that require review.',
        priority: 'high' as const
      }
    };

    const notification = notifications[type];
    
    await createNotification(
      userId,
      type === 'statement_ready' ? 'royalty_statement' : 'payment_processed',
      notification.title,
      notification.message,
      { amount, period },
      notification.priority
    );
  };

  // Copyright notification triggers
  const triggerCopyrightNotification = async (
    userId: string,
    workTitle: string,
    type: 'registered' | 'validation_error' | 'cwr_completed'
  ) => {
    if (!user) return;

    const notifications = {
      registered: {
        title: 'Copyright Registered',
        message: `"${workTitle}" has been successfully registered with the PRO.`,
        priority: 'medium' as const
      },
      validation_error: {
        title: 'Copyright Validation Error',
        message: `"${workTitle}" has validation errors that need attention.`,
        priority: 'high' as const
      },
      cwr_completed: {
        title: 'CWR Transmission Complete',
        message: `CWR file including "${workTitle}" has been transmitted successfully.`,
        priority: 'medium' as const
      }
    };

    const notification = notifications[type];
    
    await createNotification(
      userId,
      'copyright_registered',
      notification.title,
      notification.message,
      { workTitle },
      notification.priority
    );
  };

  // Sync licensing notification triggers
  const triggerSyncNotification = async (
    userId: string,
    type: 'opportunity' | 'license_signed' | 'payment_received',
    projectTitle?: string,
    amount?: number
  ) => {
    if (!user) return;

    const notifications = {
      opportunity: {
        title: 'New Sync Opportunity',
        message: `New sync licensing opportunity for "${projectTitle}" is available.`,
        priority: 'medium' as const
      },
      license_signed: {
        title: 'Sync License Signed',
        message: `Sync license for "${projectTitle}" has been executed.`,
        priority: 'high' as const
      },
      payment_received: {
        title: 'Sync Payment Received',
        message: `Payment of $${amount?.toLocaleString()} received for "${projectTitle}".`,
        priority: 'high' as const
      }
    };

    const notification = notifications[type];
    
    await createNotification(
      userId,
      'sync_opportunity',
      notification.title,
      notification.message,
      { projectTitle, amount },
      notification.priority
    );
  };

  // System notification triggers
  const triggerSystemNotification = async (
    userId: string,
    type: 'maintenance' | 'feature_release' | 'security_alert',
    message: string
  ) => {
    if (!user) return;

    const priorities = {
      maintenance: 'medium' as const,
      feature_release: 'low' as const,
      security_alert: 'critical' as const
    };

    const titles = {
      maintenance: 'System Maintenance Scheduled',
      feature_release: 'New Features Available',
      security_alert: 'Security Alert'
    };

    await createNotification(
      userId,
      'system_alert',
      titles[type],
      message,
      { type },
      priorities[type]
    );
  };

  return {
    triggerContractNotification,
    triggerRoyaltyNotification,
    triggerCopyrightNotification,
    triggerSyncNotification,
    triggerSystemNotification
  };
};