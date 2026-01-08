# Pricing Model Reference

> **Internal Reference Document** - Use this to ensure module access is granted correctly based on subscription tier.

---

## Individual Module Pricing

| Module ID | Module Name | Monthly Price | Description |
|-----------|-------------|---------------|-------------|
| `royalties` | Royalties Module | $199 | Royalty splits, recoupment, statements, payouts |
| `copyright` | Copyright Module | $99 | Metadata registration, DDEX/CWR export, PRO status |
| `contracts` | Contract Manager | $59 | Templates, deal tracking, rights ownership logic |
| `sync` | Sync Licensing Tracker | $149 | Sync requests, license terms, deal approvals |
| `valuation` | Catalog Valuation Tool | $99 | Forecast revenue, growth, terminal value |
| `dashboard` | Client Dashboard | $149 | Artist/manager portal for statements and deal visibility |

**Notes:**
- All modules include unlimited assets and users
- Save 25% when bundling 3 or more modules

---

## Bundled Plans

| Plan Name | Monthly Price | Best For | Included Modules |
|-----------|---------------|----------|------------------|
| Starter Creator | $79 | Indie songwriters | `copyright` + `contracts` (lite) |
| Essentials | $149 | Small rights owners | `copyright` + `contracts` + `valuation` |
| Publishing Pro | $299 | Indie publishers | `royalties` + `copyright` + `contracts` |
| Licensing Pro | $349 | Sync teams, labels | `sync` + `royalties` + `dashboard` |
| Growth Bundle | $449 | Scaling publishers | `royalties` + `copyright` + `contracts` + `valuation` |
| Enterprise Suite | $849 | Large catalogs/admins | All 6 modules + API access + Priority Support |

---

## Module ID Mapping

For code reference, these are the canonical module IDs and their aliases:

```javascript
const MODULE_ID_ALIASES = {
  'royalties': ['royalties-processing', 'royalties_processing', 'royalties'],
  'copyright': ['copyright-management', 'copyright_management', 'copyright'],
  'contracts': ['contract-management', 'contract_management', 'contracts'],
  'sync': ['sync-licensing', 'sync_licensing', 'sync'],
  'valuation': ['catalog-valuation', 'catalog_valuation', 'valuation'],
  'dashboard': ['client-portal', 'client_portal', 'dashboard', 'client-dashboard'],
  'catalog': ['catalog-management', 'catalog_management', 'catalog'],
};
```

---

## Access Logic

1. **Individual Module Subscribers**: Grant access only to the specific module(s) purchased
2. **Bundle Subscribers**: Grant access to all modules included in the bundle
3. **Enterprise/Agency Tiers**: Grant access to ALL modules
4. **Free Trial**: Grant access to trial_modules array from user's trial record

---

## Database Tables

- `subscribers` - Stripe subscription info, `subscription_tier` field
- `company_module_access` - Per-company module access (module_id, enabled)
- `module_products` - Individual module product definitions
- `bundle_products` - Bundle product definitions with `included_modules` array

---

*Last Updated: January 2026*
