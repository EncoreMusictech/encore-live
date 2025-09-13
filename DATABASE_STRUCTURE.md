# Database Structure Documentation
*Music Intellectual Property Management Platform*

## Overview
The platform uses PostgreSQL via Supabase with comprehensive Row-Level Security (RLS), supporting a multi-tenant architecture with module-based access control. The database contains **80+ tables** organized across **9 core functional modules**.

---

## 🏗️ Architecture Summary

### Core Design Principles
- **Row-Level Security (RLS)** on all user data tables
- **Multi-tenant isolation** via `user_id` foreign keys
- **Module-based access control** with subscription management
- **Audit trails** for sensitive operations
- **Automatic ID generation** with custom prefixes
- **Flexible JSON storage** for dynamic configurations

### Database Statistics
- **Total Tables**: 80+
- **Custom Functions**: 50+
- **RLS Policies**: 150+
- **Custom Types/Enums**: 15+
- **Triggers**: 25+

---

## 📊 Module-Based Table Organization

### 1. **Authentication & User Management**
Core user infrastructure and access control.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `subscribers` | Main user subscriptions | Stripe integration, tier management |
| `user_module_access` | Module permissions | Time-based access, source tracking |
| `user_subscriptions` | Detailed subscription data | Billing cycles, Stripe sync |
| `user_free_trials` | Trial period management | 14-day trials, module-specific |
| `notification_preferences` | User notification settings | Channel preferences, frequency |
| `security_events` | Security audit log | Login attempts, suspicious activity |

#### Key Features:
- **Email-based authentication** via Supabase Auth
- **Module-based subscriptions** (individual or bundles)
- **Free trial system** with automatic expiration
- **Security event logging** for compliance

---

### 2. **Catalog Valuation Module**
AI-powered music catalog valuation system.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `catalog_valuations` | Main valuation records | DCF, multiples, risk-adjusted values |
| `catalog_revenue_sources` | Additional revenue data | 9 revenue types, confidence scoring |
| `saved_valuation_scenarios` | Scenario modeling | What-if analysis, parameter variations |
| `industry_benchmarks` | Market data | Genre-specific multiples, growth rates |
| `artist_discography` | Spotify catalog data | Albums, singles, metadata |
| `song_catalog_searches` | Artist search results | Metadata completeness tracking |
| `songwriter_profiles` | Writer profile data | PRO affiliations, career periods |

#### Advanced Features:
- **Enhanced valuation methodology** with additional revenue integration
- **Revenue diversification scoring** (up to 20% valuation bonus)
- **AI-powered confidence scoring** based on data completeness
- **Real-time Spotify integration** for catalog discovery
- **Scenario modeling** for deal negotiations

---

### 3. **Contract Management Module**
Comprehensive agreement lifecycle management.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `contracts` | Master agreement records | 5 contract types, workflow stages |
| `contract_interested_parties` | Rights holders & splits | Performance, mechanical, sync splits |
| `contract_schedule_works` | Works covered by contracts | Copyright linking, inheritance |
| `contract_templates` | Reusable contract frameworks | Public/private sharing |
| `contract_royalty_connections` | Royalty flow mapping | Split percentages, priorities |

#### Contract Types Supported:
1. **Publishing Agreements** (Administration, Co-Publishing, Full)
2. **Artist Agreements** (Independent, Label, 360 deals)
3. **Producer Agreements** (Flat fee, Points, Hybrid)
4. **Sync Licensing** (TV, Film, Web, Advertising)
5. **Distribution Agreements** (Distribution-only, Full services)

#### Key Features:
- **7-step creation workflow** with validation
- **AI-powered contract parsing** from PDFs
- **DocuSign integration** for e-signatures
- **Rights percentage validation** (must total 100%)
- **Automatic controlled percentage calculation**

---

### 4. **Copyright Management Module**
Comprehensive copyright registration and tracking.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `copyrights` | Master copyright records | ISRC/ISWC tracking, validation status |
| `copyright_writers` | Writer ownership data | Split percentages, controlled status |
| `copyright_publishers` | Publisher ownership data | Original/sub-publisher tracking |
| `copyright_recordings` | Recording versions | ISRC codes, label information |
| `copyright_activity_logs` | Change audit trail | Field-level change tracking |

#### Key Features:
- **Ownership validation system** (writers + publishers ≤ 100%)
- **Automatic ID generation** (CR2025-XXXXXX format)
- **Real-time change logging** for audit trails
- **Recording version tracking** with ISRC management

---

### 5. **Royalty Processing Module**
Advanced royalty allocation and payment processing.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `royalty_allocations` | Individual royalty records | Work-level allocation, controlled status |
| `royalties_import_staging` | Import processing area | CSV parsing, validation, mapping |
| `reconciliation_batches` | Statement batching | Status tracking, period management |
| `payouts` | Payment processing | Multi-stage workflow, expense tracking |
| `payout_royalties` | Royalty-to-payout mapping | Allocation tracking |
| `payout_expenses` | Expense management | Recoupable/non-recoupable tracking |
| `payout_workflow_history` | Payment audit trail | Stage transitions, approvals |

#### Advanced Features:
- **Multi-source royalty import** with intelligent mapping
- **Automated batch reconciliation** with validation
- **Advanced expense management** with recoupment tracking
- **Multi-stage payout workflow** (Draft → Review → Approved → Paid)
- **Real-time balance calculations** for clients

---

### 6. **Payee Hierarchy System**
Structured payment recipient management.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `payees` | Payment recipients | Auto-generated IDs (PAY-YYYY-XXXX) |
| `writers` | Writer entities | Auto-generated IDs (WR-YYYY-XXXX) |
| `original_publishers` | Publisher entities | Auto-generated IDs (OP-YYYY-XXXX) |
| `quarterly_balance_reports` | Financial statements | Opening/closing balances, calculations |
| `contacts` | Contact information | Payment details, tax information |

#### Hierarchy Structure:
```
Agreement → Original Publisher → Writer → Payee
                                      ↓
                           Quarterly Balance Reports
```

---

### 7. **Sync Licensing Module**
Music synchronization and licensing management.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `sync_licenses` | License agreements | Usage rights, territory management |
| `sync_invoices` | Billing management | PDF generation, payment tracking |
| `invoice_templates` | Customizable templates | Branding, terms configuration |

#### Key Features:
- **Auto-generated sync IDs** (SYNC-YYYY-XXXX)
- **Territory-based licensing** with usage restrictions
- **Automated invoice generation** with PDF export
- **Custom template system** for branding

---

### 8. **Client Portal System**
Secure client access and data sharing.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `client_portal_access` | Access permissions | Module-specific permissions, expiration |
| `client_invitations` | Invitation management | Token-based security, auto-expiration |
| `client_data_associations` | Data visibility mapping | Granular data access control |
| `client_account_balances` | Financial summaries | Real-time balance calculations |

#### Security Features:
- **Token-based invitations** with automatic expiration
- **Granular data access control** (royalty-by-royalty)
- **Module-specific permissions** (view-only access)
- **Automatic cleanup** of expired invitations

---

### 9. **CWR/PRO Integration Module**
Professional society integration and export.

#### Tables:
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `cwr_sender_codes` | PRO registration codes | Encrypted storage, status tracking |
| `cwr_acknowledgments` | PRO response tracking | Registration status, linked records |
| `pro_ftp_credentials` | PRO FTP configurations | Encrypted credentials, connection testing |
| `export_delivery_jobs` | Automated delivery | Retry logic, status tracking |
| `ack_processing_logs` | Response processing | Error tracking, retry mechanisms |

#### Key Features:
- **Multi-PRO support** (ASCAP, BMI, SESAC, International)
- **Encrypted credential storage** for security
- **Automated CWR export** with validation
- **Acknowledgment processing** with error handling
- **FTP delivery automation** with retry logic

---

## 🔐 Security Architecture

### Row-Level Security (RLS) Implementation

#### User Data Isolation
```sql
-- Standard pattern for user data
CREATE POLICY "Users can manage their own data" ON table_name
FOR ALL USING (auth.uid() = user_id);
```

#### Client Portal Security
```sql
-- Granular data access for client portal
CREATE POLICY "Clients can view assigned data" ON royalty_allocations
FOR SELECT USING (
  has_client_portal_access(auth.uid(), 'royalties') AND
  EXISTS (SELECT 1 FROM client_data_associations WHERE ...)
);
```

#### Operations Team Access
```sql
-- Administrative access with function-based checks
CREATE POLICY "Operations team access" ON performance_metrics
FOR ALL USING (is_operations_team_member(auth.uid()));
```

### Security Functions
- **`has_client_portal_access()`** - Client permission validation
- **`is_operations_team_member()`** - Admin access control
- **`log_security_event()`** - Audit trail creation
- **`check_rate_limit()`** - DDoS protection

---

## 🔄 Key Database Functions

### Automatic ID Generation
| Function | Pattern | Usage |
|----------|---------|-------|
| `generate_payee_id()` | PAY-YYYY-XXXX | Payee identification |
| `generate_writer_id()` | WR-YYYY-XXXX | Writer identification |
| `generate_op_id()` | OP-YYYY-XXXX | Publisher identification |
| `generate_royalty_id()` | ROY-YYYY-XXXXXX | Royalty tracking |
| `generate_sync_id()` | SYNC-YYYY-XXXX | Sync license tracking |

### Validation Functions
- **`validate_royalty_splits()`** - Ensures 100% allocation
- **`validate_copyright_ownership()`** - Ownership percentage checks
- **`calculate_contract_controlled_percentage()`** - Rights calculations

### Workflow Functions
- **`update_payout_workflow_stage()`** - Payment stage management
- **`link_expenses_to_payout()`** - Expense association
- **`update_client_balance()`** - Real-time balance updates

---

## 📈 Analytics & Reporting Tables

### Operations Analytics
| Table | Purpose | Metrics Tracked |
|-------|---------|-----------------|
| `performance_metrics` | System performance | Response times, throughput |
| `support_ticket_analytics` | Customer support | Resolution times, satisfaction |
| `rate_limits` | API protection | Request limits, blocking |

### Financial Analytics
| Table | Purpose | Data Tracked |
|-------|---------|--------------|
| `quarterly_balance_reports` | Client financials | Royalties, expenses, payments |
| `client_account_balances` | Real-time balances | Current outstanding amounts |

---

## 🔧 System Configuration

### Integration Management
| Table | Purpose | Integrations |
|-------|---------|---------------|
| `integration_management` | Third-party APIs | Sync status, error tracking |
| `payment_integration_settings` | Payment processors | Stripe, fees, limits |
| `tenant_configurations` | Multi-tenant settings | Branding, modules, domains |

### Notification System
| Table | Purpose | Features |
|-------|---------|-----------|
| `notifications` | User notifications | Priority levels, expiration |
| `onboarding_emails` | Automated workflows | Module-specific sequences |

---

## 🚀 Performance Optimizations

### Indexing Strategy
- **User ID indexes** on all user data tables
- **Composite indexes** for common query patterns
- **GIN indexes** for JSON and array columns
- **Partial indexes** for filtered queries

### Query Optimization
- **Materialized views** for complex aggregations
- **Function-based indexes** for computed columns
- **Connection pooling** via Supabase
- **Read replicas** for analytics queries

---

## 📋 Maintenance & Monitoring

### Automated Cleanup
| Function | Schedule | Purpose |
|----------|----------|---------|
| `expire_old_invitations()` | Daily | Clean expired invitations |
| `expire_client_access()` | Daily | Revoke expired access |
| `cleanup_old_logs()` | Weekly | Archive old audit logs |
| `expire_trials()` | Daily | Expire trial periods |

### Health Monitoring
- **RLS policy validation** - Ensures security compliance
- **Foreign key integrity** - Maintains referential integrity
- **Performance monitoring** - Tracks query performance
- **Error rate tracking** - Monitors system health

---

*Last Updated: January 2025*  
*Database Version: Production v2.1*  
*Total Tables: 80+ | Total Functions: 50+ | RLS Policies: 150+*