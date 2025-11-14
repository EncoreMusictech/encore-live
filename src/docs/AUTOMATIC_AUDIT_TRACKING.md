# Automatic Admin Action Tracking

## Overview

The automatic action tracking system ensures that all data operations (create, read, update, delete) performed by system administrators while in view mode are automatically logged to the audit trail for compliance and security monitoring.

## Architecture

### Core Components

1. **`autoLogAdminAction`** (`src/lib/auditLogger.ts`)
   - Standalone utility function that can be called from anywhere
   - Automatically detects if user is in admin view mode
   - Logs actions to the `admin_view_mode_audit` table
   - Silently fails to avoid disrupting main operations

2. **`withAuditLog`** HOF (`src/lib/auditLogger.ts`)
   - Higher-order function to wrap async operations
   - Automatically logs both successful and failed operations
   - Preserves original function behavior

3. **`useAdminActionLogger`** Hook (`src/hooks/useAdminActionLogger.ts`)
   - React hook for component-level action logging
   - Provides `logAction` and `wrapAction` utilities
   - Integrates with ViewMode context

## How It Works

### Detection of View Mode

The system automatically detects when an admin is in view mode by checking:
1. `sessionStorage.getItem('viewContext')` for view mode status
2. Session ID from the view context
3. Company ID being viewed

If any of these are missing, logging is silently skipped.

### Automatic Integration

The tracking has been integrated into:

1. **Copyright Activity Logging** (`useActivityLog.ts`)
   - All copyright operations are automatically tracked
   - Create, update, delete, and bulk upload actions

2. **Security Event Logging** (`securityMonitor.ts`)
   - Security events are tracked when in view mode
   - Helps monitor security-related admin actions

## Usage Patterns

### Pattern 1: Direct Function Call

```typescript
import { autoLogAdminAction } from '@/lib/auditLogger';

const handleDelete = async (id: string) => {
  await supabase.from('contracts').delete().eq('id', id);
  
  // Log the action
  await autoLogAdminAction({
    actionType: 'delete',
    resourceType: 'contract',
    resourceId: id,
    actionDetails: { contractId: id }
  });
};
```

### Pattern 2: Using the HOF Wrapper

```typescript
import { withAuditLog } from '@/lib/auditLogger';

const deleteContract = async (id: string) => {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Wrap the function with automatic logging
const deleteContractWithLogging = withAuditLog(
  deleteContract,
  (id) => ({
    actionType: 'delete',
    resourceType: 'contract',
    resourceId: id,
    actionDetails: { contractId: id }
  })
);

// Use it
await deleteContractWithLogging(contractId);
```

### Pattern 3: Using the React Hook

```typescript
import { useAdminActionLogger } from '@/hooks/useAdminActionLogger';

const MyComponent = () => {
  const { logAction, wrapAction, isViewMode } = useAdminActionLogger();

  const handleUpdate = async (data: any) => {
    await wrapAction(
      async () => {
        const { error } = await supabase
          .from('contracts')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      },
      {
        actionType: 'update_contract',
        resourceType: 'contract',
        resourceId: data.id,
        actionDetails: { updates: data }
      }
    );
  };

  return (
    <div>
      {isViewMode && <Badge>View Mode - Actions Logged</Badge>}
      <Button onClick={handleUpdate}>Update</Button>
    </div>
  );
};
```

## Action Types

Standard action types tracked:

- `create` - Resource creation
- `read` - Resource access/viewing
- `update` - Resource modification
- `delete` - Resource deletion
- `export` - Data export operations
- `import` - Data import/bulk upload operations

Action types are automatically prefixed with the resource type:
- `create_contract`
- `update_copyright`
- `delete_payout`
- etc.

## Risk Levels

Risk levels are automatically assigned based on action type:

| Action Type | Risk Level | Description |
|-------------|-----------|-------------|
| delete | high | Deletion operations are high risk |
| update, create | medium | Modification operations are medium risk |
| export | medium | Data export is medium risk |
| read | low | Read operations are low risk |

Custom risk levels can be specified when calling `autoLogAdminAction`.

## Performance Considerations

1. **Non-Blocking**: All logging operations are async and don't block the main operation
2. **Silent Failures**: Logging errors don't affect the main operation
3. **IP Caching**: IP addresses are cached in sessionStorage to reduce API calls
4. **Conditional Execution**: Logging only runs when in view mode

## Data Captured

For each action, the following data is captured:

- Admin user ID and email
- Session ID (links to view mode session)
- Action type (e.g., `create_contract`)
- Company ID and name being viewed
- Resource type (e.g., `contract`)
- Resource ID (if applicable)
- Action details (custom JSON data)
- Old values (for updates)
- New values (for creates/updates)
- IP address (cached)
- User agent
- Request path
- Risk level
- Timestamp
- Success/failure status

## Integration Checklist

To add automatic tracking to a new module:

1. **Import the utility**:
   ```typescript
   import { autoLogAdminAction } from '@/lib/auditLogger';
   ```

2. **Call after successful operations**:
   ```typescript
   await autoLogAdminAction({
     actionType: 'create',
     resourceType: 'your_resource',
     resourceId: newResource.id,
     actionDetails: { ... }
   });
   ```

3. **Optional: Add old/new values for updates**:
   ```typescript
   await autoLogAdminAction({
     actionType: 'update',
     resourceType: 'your_resource',
     resourceId: resource.id,
     oldValues: { field: 'old value' },
     newValues: { field: 'new value' }
   });
   ```

## Security Features

1. **Tamper-Proof**: Logs are inserted via RPC, preventing client-side manipulation
2. **RLS Protected**: Only system admins can view logs
3. **No Deletes**: Audit logs cannot be deleted, only archived
4. **Session Tracking**: All actions linked to a session for complete audit trail
5. **IP Tracking**: Client IP addresses logged for forensics
6. **User Agent Tracking**: Browser information captured
7. **Automatic Risk Assessment**: Risk levels assigned automatically

## Compliance

This system helps meet compliance requirements for:

- **SOC 2**: Audit logging of privileged access
- **GDPR**: Tracking of data access and modifications
- **HIPAA**: Audit trails for data access (if handling health data)
- **ISO 27001**: Security event logging
- **PCI DSS**: Tracking of access to cardholder data

## Monitoring & Alerts

The audit logs can be monitored for:

1. **High-risk actions**: Automatic flagging of delete operations
2. **Unusual patterns**: Multiple actions in short time periods
3. **Access patterns**: Companies frequently accessed
4. **Failed operations**: Tracking of errors during admin actions

## Best Practices

1. ✅ **Always log after successful operations**: Don't log before the operation completes
2. ✅ **Include meaningful action details**: Help future auditors understand what happened
3. ✅ **Use standard action types**: Stick to create/read/update/delete/export/import
4. ✅ **Include resource IDs when available**: Link logs to specific records
5. ✅ **Don't log sensitive data**: Avoid logging passwords, tokens, or PII in action details
6. ❌ **Don't block on logging failures**: Let operations complete even if logging fails
7. ❌ **Don't log every read operation**: Focus on writes and exports
8. ❌ **Don't duplicate logs**: The system auto-logs, so avoid manual logging in the same flow

## Example: Full Integration

```typescript
// In a custom hook like useContracts.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { autoLogAdminAction } from '@/lib/auditLogger';

export const useContracts = () => {
  const [loading, setLoading] = useState(false);

  const createContract = async (contractData: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;

      // Auto-log the action
      await autoLogAdminAction({
        actionType: 'create',
        resourceType: 'contract',
        resourceId: data.id,
        actionDetails: {
          contractType: contractData.contract_type,
          counterparty: contractData.counterparty_name
        },
        newValues: contractData
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (id: string, updates: any) => {
    setLoading(true);
    try {
      // Get old values first
      const { data: oldData } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Auto-log with old and new values
      await autoLogAdminAction({
        actionType: 'update',
        resourceType: 'contract',
        resourceId: id,
        actionDetails: {
          fieldsUpdated: Object.keys(updates)
        },
        oldValues: oldData,
        newValues: updates
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Auto-log deletion (high risk)
      await autoLogAdminAction({
        actionType: 'delete',
        resourceType: 'contract',
        resourceId: id,
        actionDetails: {
          permanent: true
        }
      });

      return true;
    } finally {
      setLoading(false);
    }
  };

  return {
    createContract,
    updateContract,
    deleteContract,
    loading
  };
};
```

## Viewing Audit Logs

Audit logs can be viewed through:

1. **Admin UI**: `/dashboard/admin/audit-logs`
2. **Database Query**: Direct query to `admin_view_mode_audit` table
3. **RPC Function**: `get_admin_audit_summary` for aggregated data

## Future Enhancements

Planned improvements:

1. Real-time alerts for high-risk actions
2. Automated compliance reports
3. Machine learning for anomaly detection
4. Integration with external SIEM systems
5. Webhook notifications for critical actions
