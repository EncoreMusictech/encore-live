export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface OnboardingPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  timeline: string;
  owner: 'ENCORE' | 'Client' | 'ENCORE + Client' | 'All Teams';
  goLiveReference: string;
  checklist: ChecklistItem[];
  automatedActions: string[];
}

export const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    id: 'account_setup',
    name: 'Phase 1: Account Setup',
    description: 'Create sub-account, configure subscription tier, verify system values',
    order: 1,
    timeline: 'Week 1',
    owner: 'ENCORE',
    goLiveReference: 'Week 1 – Kickoff meeting completed',
    checklist: [
      { id: 'create_sub_account', label: 'Create Sub-Account in Dashboard → Operations → Sub-Accounts', required: true },
      { id: 'populate_company_name', label: 'Populate Company Name (legal entity)', required: true },
      { id: 'set_display_name', label: 'Set Display Name', required: true },
      { id: 'set_primary_email', label: 'Set Primary Contact Email', required: true },
      { id: 'set_subscription_tier', label: 'Set Subscription Tier (enterprise_internal)', required: true },
      { id: 'verify_tier_status', label: 'Verify subscription_tier and subscription_status = active', required: true },
    ],
    automatedActions: ['Account creation notification', 'Welcome email to primary contact']
  },
  {
    id: 'module_config',
    name: 'Phase 2: Module Configuration',
    description: 'Enable required modules per client scope and validate access',
    order: 2,
    timeline: 'Week 1',
    owner: 'ENCORE',
    goLiveReference: 'Weeks 4–5 – Configuration & Customization',
    checklist: [
      { id: 'enable_contract_mgmt', label: 'Enable Contract Management module', required: true },
      { id: 'enable_copyright_mgmt', label: 'Enable Copyright Management module', required: false },
      { id: 'enable_royalty_processing', label: 'Enable Royalty Processing module', required: false },
      { id: 'enable_client_portal', label: 'Enable Client Portal module', required: false },
      { id: 'verify_dashboard_display', label: 'Confirm enabled modules display correctly in dashboard', required: true },
      { id: 'verify_sidebar_nav', label: 'Verify sidebar navigation matches enabled modules', required: true },
      { id: 'test_view_as_mode', label: 'Test module access using "View As Sub-Account"', required: true },
    ],
    automatedActions: ['Module activation audit log', 'Configuration snapshot']
  },
  {
    id: 'user_onboarding',
    name: 'Phase 3: User Onboarding',
    description: 'Add admin and internal users with role-based permissions',
    order: 3,
    timeline: 'Week 1',
    owner: 'ENCORE + Client',
    goLiveReference: 'Week 1 – Finalize user roles and permissions matrix',
    checklist: [
      { id: 'send_admin_invites', label: 'Send signup instructions to admin users', required: true },
      { id: 'admin_signup_complete', label: 'Admins complete platform signup using company email', required: true },
      { id: 'add_admins_to_account', label: 'Add admin users to sub-account with Admin role', required: true },
      { id: 'verify_admin_bypass', label: 'Verify admins bypass payment setup automatically', required: true },
      { id: 'add_internal_users', label: 'Add internal users with appropriate roles (Manager/User/Viewer)', required: false },
      { id: 'verify_role_permissions', label: 'Verify role-based access levels are correct', required: true },
    ],
    automatedActions: ['User invitation emails', 'Role assignment notifications', 'Access verification checks']
  },
  {
    id: 'data_ingestion',
    name: 'Phase 4: Contract & Data Ingestion',
    description: 'Upload contracts via AI parsing or manual entry, import associated works',
    order: 4,
    timeline: 'Weeks 2-3',
    owner: 'ENCORE + Client',
    goLiveReference: 'Weeks 2–3 – Data delivery & migration',
    checklist: [
      { id: 'collect_contract_pdfs', label: 'Collect PDF copies of all contracts from client', required: true },
      { id: 'collect_metadata_spreadsheet', label: 'OR collect spreadsheet with contract metadata', required: false },
      { id: 'ai_parsing_upload', label: 'Upload contracts via AI-Assisted Parsing (OCR + extraction)', required: false },
      { id: 'manual_entry_complete', label: 'OR complete manual entry using contract-type forms', required: false },
      { id: 'review_parsed_data', label: 'Review parsed contract data prior to finalization', required: true },
      { id: 'bulk_works_upload', label: 'Bulk upload associated works (if applicable)', required: false },
      { id: 'link_works_to_contracts', label: 'Link works to correct contracts', required: false },
    ],
    automatedActions: ['Import progress tracking', 'Parsing completion notifications', 'Data validation alerts']
  },
  {
    id: 'data_validation',
    name: 'Phase 5: Data Validation & QA',
    description: 'Quality assurance checks, metadata enrichment, confidence scoring',
    order: 5,
    timeline: 'Weeks 2-3',
    owner: 'ENCORE',
    goLiveReference: 'Weeks 2–3 – Migration review & signoff',
    checklist: [
      { id: 'contracts_visible', label: 'All contracts visible and classified correctly', required: true },
      { id: 'financial_terms_verified', label: 'Financial terms verified', required: true },
      { id: 'works_linked_correctly', label: 'Works linked to correct contracts', required: true },
      { id: 'parties_splits_accurate', label: 'Interested parties and splits accurate', required: true },
      { id: 'iswc_lookups', label: 'ISWC lookups completed (optional)', required: false },
      { id: 'writer_publisher_verified', label: 'Writer and publisher chain verification', required: false },
      { id: 'confidence_scoring', label: 'Confidence scoring logged for audit', required: true },
    ],
    automatedActions: ['QA validation report', 'Data quality scoring', 'Enrichment notifications']
  },
  {
    id: 'portal_setup',
    name: 'Phase 6: Client Portal Setup',
    description: 'Configure external contributor access and permissions',
    order: 6,
    timeline: 'Weeks 4-5',
    owner: 'ENCORE',
    goLiveReference: 'Weeks 4–5 – Dashboard & permission configuration',
    checklist: [
      { id: 'navigate_invite_client', label: 'Navigate to Clients → Invite Client', required: false },
      { id: 'assign_view_contracts', label: 'Assign permission: View contracts', required: false },
      { id: 'assign_view_works', label: 'Assign permission: View works', required: false },
      { id: 'assign_view_statements', label: 'Assign permission: View statements (if enabled)', required: false },
      { id: 'send_branded_invitations', label: 'Send branded, tokenized invitation emails', required: false },
      { id: 'verify_external_access', label: 'Verify external user access model', required: false },
    ],
    automatedActions: ['Client portal invitation emails', 'Permission assignment audit']
  },
  {
    id: 'go_live',
    name: 'Phase 7: Go-Live Readiness',
    description: 'Pre-launch verification, production launch, post-launch monitoring',
    order: 7,
    timeline: 'Week 7',
    owner: 'All Teams',
    goLiveReference: 'Week 7 – Go-live approval & production launch',
    checklist: [
      { id: 'sub_account_active', label: 'Sub-account active and verified', required: true },
      { id: 'modules_enabled', label: 'Modules enabled per scope', required: true },
      { id: 'users_validated', label: 'Users added and validated', required: true },
      { id: 'contracts_approved', label: 'Contracts ingested and approved', required: true },
      { id: 'works_validated', label: 'Works linked and validated', required: true },
      { id: 'portal_invitations_sent', label: 'Client Portal invitations sent (if applicable)', required: false },
      { id: 'login_no_redirect', label: 'Login verification without payment redirects', required: true },
      { id: 'module_visibility_test', label: 'Module visibility validation', required: true },
      { id: 'data_isolation_test', label: 'Data isolation testing', required: true },
      { id: 'audit_log_review', label: 'Audit log review', required: true },
    ],
    automatedActions: ['Go-live approval workflow', 'Launch notification', 'Post-launch monitoring']
  }
];

export const PHASE_IDS = ONBOARDING_PHASES.map(p => p.id);

export function getPhaseByIndex(index: number): OnboardingPhase | undefined {
  return ONBOARDING_PHASES[index];
}

export function getPhaseIndex(phaseId: string): number {
  return ONBOARDING_PHASES.findIndex(p => p.id === phaseId);
}

export function getNextPhaseId(currentPhaseId: string): string | null {
  const idx = getPhaseIndex(currentPhaseId);
  if (idx < 0 || idx >= ONBOARDING_PHASES.length - 1) return null;
  return ONBOARDING_PHASES[idx + 1].id;
}
