# Admin Audit Logging System

## Overview

The Admin Audit Logging System provides comprehensive tracking and monitoring of system administrator actions when they switch to sub-account view mode. This system is essential for compliance, security monitoring, and maintaining accountability.

## Key Features

### 1. **Session Tracking**
- Automatically logs when admins enter sub-account view mode
- Tracks session duration and exit events
- Unique session IDs for correlation of all actions within a session

### 2. **Action Monitoring**
Tracks the following action types:
- `view_mode_entered` - Admin switches to sub-account view
- `view_mode_exited` - Admin returns to system view
- `data_viewed` - Admin views data while in sub-account mode
- `data_created` - Admin creates data on behalf of sub-account
- `data_updated` - Admin modifies existing data
- `data_deleted` - Admin deletes data
- `export_performed` - Admin exports data
- `settings_changed` - Admin modifies settings

### 3. **Risk Assessment**
Each action is assigned a risk level:
- **Low**: Normal viewing and routine operations
- **Medium**: Data modifications, exports (sessions over 1 hour)
- **High**: Deletions, bulk operations (sessions over 2 hours)
- **Critical**: Sensitive data access, security changes

### 4. **Compliance Features**
- **Immutable Logs**: Audit logs cannot be modified or deleted
- **3-Year Retention**: Logs retained for compliance (configurable)
- **IP Address Tracking**: Records IP address of admin actions
- **User Agent Logging**: Captures browser/device information
- **Session Duration**: Tracks how long admins remain in view mode

## Database Schema

### `admin_view_mode_audit` Table

```sql
CREATE TABLE public.admin_view_mode_audit (
  id uuid PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  admin_email text NOT NULL,
  session_id text NOT NULL,
  action_type text NOT NULL,
  company_id uuid,
  company_name text,
  resource_type text,
  resource_id uuid,
  action_details jsonb,
  ip_address inet,
  user_agent text,
  request_path text,
  created_at timestamp with time zone NOT NULL,
  session_duration_seconds integer,
  risk_level text DEFAULT 'low'
);
```

## API Functions

### `log_admin_view_mode_action()`
Logs a single admin action with full context.

**Parameters:**
- `p_admin_user_id` (uuid): Admin's user ID
- `p_session_id` (text): Unique session identifier
- `p_action_type` (text): Type of action performed
- `p_company_id` (uuid, optional): Company being viewed
- `p_company_name` (text, optional): Company name
- `p_resource_type` (text, optional): Type of resource (e.g., 'copyright', 'contract')
- `p_resource_id` (uuid, optional): Specific resource ID
- `p_action_details` (jsonb, optional): Additional action context
- `p_ip_address` (text, optional): Admin's IP address
- `p_user_agent` (text, optional): Browser user agent
- `p_request_path` (text, optional): URL path
- `p_risk_level` (text, optional): Risk assessment

### `close_admin_view_mode_session()`
Closes a view mode session and calculates total duration.

**Parameters:**
- `p_session_id` (text): Session to close
- `p_ip_address` (text, optional): IP address
- `p_user_agent` (text, optional): User agent

### `get_admin_audit_summary()`
Returns summary statistics for a time period.

**Parameters:**
- `p_start_date` (timestamp): Period start
- `p_end_date` (timestamp): Period end
- `p_admin_user_id` (uuid, optional): Filter by specific admin

**Returns:**
- `admin_user_id`: Admin's ID
- `admin_email`: Admin's email
- `total_sessions`: Number of view mode sessions
- `total_actions`: Total actions performed
- `companies_accessed`: Unique companies viewed
- `high_risk_actions`: Count of high/critical risk actions
- `avg_session_duration_minutes`: Average session length
- `last_access`: Most recent activity timestamp

## Security

### Row-Level Security (RLS)
- **SELECT**: Only system admins can view audit logs
- **INSERT**: System can create logs (authenticated users)
- **UPDATE/DELETE**: Disabled (logs are immutable)

### Access Control
Only users with the `admin` role in the `user_roles` table can access audit logs through the UI and API.

## Usage Examples

### Viewing Audit Logs
```typescript
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';

function MyComponent() {
  const { logs, summary, loading } = useAdminAuditLogs();
  
  // logs: Array of all audit log entries
  // summary: Statistical summary
  // loading: Loading state
}
```

### Filtering by Date Range
```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');
const { logs } = useAdminAuditLogs(startDate, endDate);
```

### Getting High-Risk Actions
```typescript
const { getHighRiskLogs } = useAdminAuditLogs();
const highRiskActions = getHighRiskLogs();
```

## UI Components

### `AdminAuditLogsTable`
Comprehensive table view of all audit logs with:
- Sortable columns
- Risk level badges
- Action type indicators
- Session duration display
- Details modal for each log entry

### Location
Access audit logs at `/dashboard/admin/audit-logs` (system admins only)

## Compliance & Retention

### Retention Policy
- **Low Risk**: 3 years
- **Medium/High Risk**: 3 years
- **Critical**: Indefinite (manual archive required)

### Archival
Run the cleanup function periodically (recommended: monthly):
```sql
SELECT public.archive_old_admin_audit_logs();
```

## Best Practices

1. **Regular Monitoring**: Review audit logs weekly for unusual patterns
2. **High-Risk Review**: Immediately investigate all high/critical risk actions
3. **Long Sessions**: Alert on sessions exceeding 2 hours
4. **Multiple Companies**: Flag admins accessing many companies in short periods
5. **Suspicious Patterns**: Monitor for bulk deletions or unusual export activity

## Alerting Recommendations

Set up alerts for:
- Sessions exceeding 2 hours (potential security issue)
- More than 50 actions in a single session (bulk operations)
- Data deletions while in view mode
- Access to more than 5 companies in 24 hours
- Any critical risk level actions

## Integration with View Mode

The audit logging system is automatically integrated with the view mode functionality:

1. When admin enters view mode via `ViewSwitcher` → `view_mode_entered` logged
2. All navigation and actions tracked automatically
3. When admin exits view mode → `view_mode_exited` logged with duration

No manual logging required - the system handles it transparently.

## Troubleshooting

### Logs Not Appearing
1. Verify user has `admin` role in `user_roles` table
2. Check RLS policies are active
3. Ensure `log_admin_view_mode_action` function exists

### Session Duration Not Calculated
1. Verify `view_mode_entered` event was logged
2. Check `close_admin_view_mode_session` was called on exit
3. Ensure session IDs match between entry and exit

### Performance Issues
1. Audit table has proper indexes (created automatically)
2. Consider archiving old logs more frequently
3. Limit query date ranges in high-volume environments

## Future Enhancements

Potential improvements for future versions:
- Real-time alerting via webhooks
- Export audit logs to SIEM systems
- Anomaly detection using ML
- Automatic risk scoring based on behavior patterns
- Integration with compliance reporting tools
