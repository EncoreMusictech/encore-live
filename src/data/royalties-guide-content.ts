// Guide Screenshots
import reconciliationTabOverview from '@/assets/guide/Reconciliation_Tab_Overview.png';
import newBatchDialog from '@/assets/guide/New_Batch_Dialog.png';
import sourceDetectionScreen from '@/assets/guide/Source_Detection_Screen.png';
import validationResultsScreen from '@/assets/guide/Validation_Results_No_Errors.png';
import fieldMappingInterface from '@/assets/guide/Field_Mapping_Interface.png';
import songMatchingInterface from '@/assets/guide/Song_Matching_Interface.png';
import songSearchAutocomplete from '@/assets/guide/Song_SearchAutocomplete.png';
import addPayeeForm from '@/assets/guide/Add_Payee_Form.png';
import generateFromAgreement from '@/assets/guide/Generate_from_Agreement_Dialog.png';
import payeeHierarchyView from '@/assets/guide/Payee_Hierarchy_View.png';
import addExpenseDialog from '@/assets/guide/Add_Expense_Dialog.png';
import processBatchConfirmation from '@/assets/guide/Process_Batch_Confirmation.png';
import unprocessWarningDialog from '@/assets/guide/Unprocess_Warning_Dialog.png';
import payoutsTabOverview from '@/assets/guide/Payouts_Tab_Overview.png';
import clientPortalView from '@/assets/guide/Client_Portal_View.png';
import downloadOptionsDialog from '@/assets/guide/Download_Options_Dialog.png';

export interface GuideStep {
  title: string;
  description: string;
  tips?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  overview: string;
  steps: GuideStep[];
  proTips?: string[];
  relatedSections?: string[];
  screenshots?: {
    url: string;
    caption: string;
  }[];
}

export const royaltiesGuideContent: GuideSection[] = [
  {
    id: "analytics",
    title: "Analytics Tab Overview",
    icon: "BarChart3",
    overview: "The Analytics tab provides a comprehensive view of your royalty data through interactive visualizations, key metrics, and AI-powered insights. Use this dashboard to monitor revenue trends, identify top-performing works, and make data-driven decisions.",
    steps: [
      {
        title: "Understanding Key Metrics",
        description: "At the top of the Analytics dashboard, you'll find summary cards showing Total Revenue, Average per Work, Total Allocations, and Net Payable. These metrics update in real-time based on your selected filters.",
        tips: ["Click on any metric card to see a detailed breakdown", "Metrics reflect only processed batches"]
      },
      {
        title: "Using Filters",
        description: "Apply filters to narrow down your data view. Available filters include: Date Range (select specific periods), Writer (filter by specific writers), Territory (country-level filtering), Source (DSP, PRO, YouTube, etc.), Work (specific songs), and Media Type.",
        tips: ["Combine multiple filters for precise analysis", "Filters persist across tab switches"]
      },
      {
        title: "Revenue by Source Chart",
        description: "This bar chart breaks down your revenue by income source (Spotify, Apple Music, YouTube, PROs, etc.). Hover over bars to see exact amounts. Click on a bar to drill down into that source's details.",
        tips: ["Export chart data using the download icon", "Toggle between chart types using the view selector"]
      },
      {
        title: "Top Works Breakdown",
        description: "View your highest-earning songs in a ranked list. Each entry shows the song title, total earnings, and percentage of total revenue. Use this to identify your catalog's best performers.",
        tips: ["Click a song title to view its full allocation history", "Sort by different time periods to spot trends"]
      },
      {
        title: "Territory Map",
        description: "The interactive map displays revenue distribution by country. Darker shading indicates higher revenue. Click on any country to see detailed earnings from that territory.",
        tips: ["Zoom in on specific regions for detailed view", "Use the legend to understand revenue ranges"]
      },
      {
        title: "AI Insights Panel",
        description: "The AI Insights panel provides automated analysis of your royalty data, highlighting trends, anomalies, and optimization opportunities. Insights are refreshed each time you process new batches.",
        tips: ["Click 'Refresh Insights' after processing new statements", "AI insights consider historical patterns for context"]
      }
    ],
    proTips: [
      "Set up scheduled reports to receive analytics summaries via email",
      "Use the 'Compare Periods' feature to track quarter-over-quarter growth",
      "Export analytics data to Excel for custom analysis"
    ],
    screenshots: [
      {
        url: "/lovable-uploads/df93d50a-c213-4852-ba45-07700634740f.png",
        caption: "Royalties Analytics Dashboard showing revenue metrics and visualizations"
      }
    ],
    relatedSections: ["reconciliation", "payouts"]
  },
  {
    id: "reconciliation",
    title: "Creating Reconciliation Batches",
    icon: "FolderPlus",
    overview: "Reconciliation batches are containers for grouping royalty statements from a specific source and period. Creating a batch is the first step in the royalty processing workflow, allowing you to track and manage incoming revenue statements systematically.",
    steps: [
      {
        title: "Navigate to Reconciliation Tab",
        description: "From the Royalties module, click on the 'Reconciliation' tab in the main navigation. This displays your existing batches and the 'New Batch' button.",
        tips: ["Use the search bar to find existing batches quickly"]
      },
      {
        title: "Click 'New Batch' Button",
        description: "Click the 'New Batch' button located in the top-right area of the Reconciliation tab. This opens the batch creation dialog.",
        tips: ["You can also use the keyboard shortcut Ctrl+N (Cmd+N on Mac)"]
      },
      {
        title: "Select Source",
        description: "Choose the royalty source from the dropdown menu. Options include DSP (Digital Service Providers), PRO (Performance Rights Organizations), YouTube, Spotify, Apple Music, Amazon Music, BMI, ASCAP, SESAC, SOCAN, and more.",
        tips: ["Select the most specific source available for better tracking", "Custom sources can be added in Settings"]
      },
      {
        title: "Set Date Received",
        description: "Enter the date you received the royalty statement. This helps track processing timelines and reconcile with your accounts receivable.",
        tips: ["Use the calendar picker for accurate date selection", "This date is used for aging reports"]
      },
      {
        title: "Enter Statement Period",
        description: "Specify the statement period start and end dates. This represents the time period the royalties cover (e.g., Q1 2024 would be Jan 1 - Mar 31, 2024).",
        tips: ["Match the period exactly as shown on the source statement", "This affects period-over-period reporting"]
      },
      {
        title: "Enter Total Gross Amount",
        description: "Input the total gross revenue amount from the statement. This is used for reconciliation verification - the system will flag if imported line items don't match this total.",
        tips: ["Include all revenue before any deductions", "Currency is automatically set based on your account settings"]
      },
      {
        title: "Link Statement Document (Optional)",
        description: "Upload or link the original statement PDF/Excel file for reference. This creates an audit trail and allows team members to verify source data.",
        tips: ["Supported formats: PDF, XLS, XLSX, CSV", "Maximum file size: 25MB"]
      },
      {
        title: "Add Notes",
        description: "Include any relevant notes about the batch, such as special instructions, known issues, or processing notes. Notes are visible to all users with batch access.",
        tips: ["Document any discrepancies found during import", "Notes appear in batch history logs"]
      },
      {
        title: "Submit Batch",
        description: "Click 'Create Batch' to save. The batch is created in 'Pending' status, ready for statement import and processing.",
        tips: ["You can edit batch details before processing", "Batch ID is auto-generated for tracking"]
      }
    ],
    proTips: [
      "Create batches as soon as you receive statements to maintain accurate timelines",
      "Use consistent naming conventions for easy searching",
      "Set up batch notifications to alert team members when new batches are created"
    ],
    screenshots: [
      {
        url: reconciliationTabOverview,
        caption: "Reconciliation tab showing batch list with status indicators and progress tracking"
      },
      {
        url: newBatchDialog,
        caption: "New Batch creation dialog with Source, Date Received, Amount, and Statement linking options"
      }
    ],
    relatedSections: ["statements", "processing"]
  },
  {
    id: "statements",
    title: "Importing Statements",
    icon: "Upload",
    overview: "The statement import process transforms raw royalty data from various sources into structured records ready for allocation. The system guides you through parsing, mapping, validation, and song matching to ensure accurate data capture.",
    steps: [
      {
        title: "Navigate to Statements Tab",
        description: "Click on the 'Statements' tab in the Royalties module. This opens the import staging area where you can upload and process statement files.",
        tips: ["You can import statements without creating a batch first, but linking to a batch is recommended"]
      },
      {
        title: "Upload Statement File",
        description: "Drag and drop your statement file into the upload zone, or click to browse. Supported formats include CSV, XLS, XLSX, and some XML formats. The system will automatically begin parsing the file.",
        tips: ["For large files (10,000+ rows), parsing may take a few moments", "File name is preserved for reference"]
      },
      {
        title: "Source Detection",
        description: "The system automatically detects the statement source based on file structure and column headers. Review the detected source and confidence score. Override if necessary by selecting the correct source from the dropdown.",
        tips: ["Higher confidence scores indicate better auto-mapping accuracy", "Unknown sources default to 'Other' with manual mapping required"]
      },
      {
        title: "Field Mapping",
        description: "Map the columns from your statement to ENCORE's standard fields. Required mappings include: Song Title, Amount, and at least one identifier (ISRC, ISWC, or Work ID). Optional fields include Artist, Territory, Media Type, and Units.",
        tips: ["Drag columns to rearrange the mapping order", "Unmapped columns are preserved in metadata"]
      },
      {
        title: "Save Mapping for Reuse",
        description: "After mapping fields, click 'Save Mapping' to store this configuration for future imports from the same source. Give it a descriptive name like 'Spotify Monthly Format' for easy identification.",
        tips: ["Saved mappings appear in a dropdown on future imports", "You can edit or delete saved mappings in Settings"]
      },
      {
        title: "Data Validation",
        description: "The system validates all rows against business rules. Review any errors (red) or warnings (yellow) flagged. Common issues include missing required fields, invalid ISRCs, or duplicate entries. Click on any issue to see details and fix options.",
        tips: ["Fix critical errors before proceeding", "Warnings don't block import but should be reviewed"]
      },
      {
        title: "Review Duplicates",
        description: "If duplicate entries are detected (same ISRC/song/period), you'll be prompted to choose: Skip duplicates, Merge and sum amounts, or Import all (creates separate records). Choose based on your reconciliation needs.",
        tips: ["Merging is recommended for consolidated reporting", "Skipping prevents double-counting"]
      },
      {
        title: "Song Matching",
        description: "The system attempts to match imported songs to your registered copyrights using ISRC, ISWC, song title, and artist name. Review matches and their confidence scores. For unmatched songs, you can: Search and link manually, Create new copyright entry, or Mark as 'External' (not in your catalog).",
        tips: ["High confidence (>90%) matches are auto-linked", "Fuzzy matching handles slight title variations"]
      },
      {
        title: "Auto-Split Configuration",
        description: "For matched songs, royalties are automatically split based on copyright ownership percentages. Review the split preview to ensure allocations are correct. You can override splits for specific entries if needed.",
        tips: ["Splits inherit from copyright writer/publisher shares", "Override splits are flagged for audit purposes"]
      },
      {
        title: "Save to Staging",
        description: "Click 'Save to Staging' to commit the imported data. Records move to the staging area where they await batch processing. You can review and edit staged records before final processing.",
        tips: ["Staged records can be deleted or modified before processing", "Processing locks records for audit integrity"]
      }
    ],
    proTips: [
      "Always preview a sample of rows before full import to verify mapping accuracy",
      "Set up automated import rules for recurring statement formats",
      "Keep original statement files archived for audit purposes"
    ],
    screenshots: [
      {
        url: sourceDetectionScreen,
        caption: "Import wizard showing all 5 processing steps: Parse, Detect Source, Map Fields, Validate, and Save"
      },
      {
        url: fieldMappingInterface,
        caption: "Field Mapping interface with drag-and-drop from Available Fields to Mapping Targets. Note the 'Mapping Memory' feature for auto-saving mappings"
      },
      {
        url: validationResultsScreen,
        caption: "Validation results showing mapped/unmapped field status and data quality checks"
      },
      {
        url: songMatchingInterface,
        caption: "Song matching interface displaying imported songs on left panel and copyright catalog matches on right"
      }
    ],
    relatedSections: ["reconciliation", "manual-royalties", "processing"]
  },
  {
    id: "manual-royalties",
    title: "Creating Manual Royalties",
    icon: "PenLine",
    overview: "Manual royalty entries allow you to record earnings that don't come from imported statements, such as one-time sync fees, direct payments, or adjustment corrections. Each manual entry can be linked to a copyright for proper allocation tracking.",
    steps: [
      {
        title: "Navigate to Allocations Tab",
        description: "From the Royalties module, click on the 'Allocations' tab. This displays existing allocations and the 'New Allocation' button.",
        tips: ["You can also access this from the quick actions menu"]
      },
      {
        title: "Click 'New Allocation' Button",
        description: "Click the 'New Allocation' or 'Add Manual Royalty' button to open the manual entry form.",
        tips: ["Use this for one-off payments not in standard statements"]
      },
      {
        title: "Search and Select Song",
        description: "In the Song Title field, start typing to search your registered copyrights. Select the matching song from the dropdown. The system auto-fills associated metadata (ISRC, writers, etc.).",
        tips: ["If the song isn't found, you may need to register it in Copyright Management first", "You can enter a custom title for external works"]
      },
      {
        title: "Enter Artist Name",
        description: "Confirm or enter the artist name associated with this royalty. This is used for reporting and client statements.",
        tips: ["Artist name should match your copyright registration for consistency"]
      },
      {
        title: "Enter Amount",
        description: "Input the gross royalty amount. Currency is based on your account default but can be changed using the currency selector if needed.",
        tips: ["Enter the pre-tax/pre-deduction amount", "Negative amounts are allowed for adjustments/corrections"]
      },
      {
        title: "Select Source",
        description: "Choose the royalty source from the dropdown. Options include DSP, PRO, Sync, Direct, Other, and any custom sources you've configured.",
        tips: ["Accurate source selection improves analytics accuracy", "'Direct' is commonly used for one-time payments"]
      },
      {
        title: "Select Territory",
        description: "Choose the country or region where this royalty originated. Use 'Worldwide' if the source doesn't specify territory.",
        tips: ["Territory data affects geographic reporting", "Some sync deals specify multiple territories"]
      },
      {
        title: "Link to Batch (Optional)",
        description: "If this manual entry should be part of a reconciliation batch, select the batch from the dropdown. This helps with period tracking and batch-level reporting.",
        tips: ["Unlinked entries appear in 'Standalone Allocations'", "You can link to a batch later if needed"]
      },
      {
        title: "Add Notes",
        description: "Include any relevant details about this royalty entry, such as the reason for manual entry, reference numbers, or special handling instructions.",
        tips: ["Notes are visible on client statements if enabled", "Include invoice or payment reference numbers"]
      },
      {
        title: "Submit Entry",
        description: "Click 'Create Allocation' to save. The entry is created and linked to the selected copyright. Splits are automatically calculated based on copyright ownership.",
        tips: ["Review the split preview before submitting", "Manual entries can be edited until the batch is processed"]
      }
    ],
    proTips: [
      "Use manual entries for sync license fees, advances, and adjustment corrections",
      "Always include reference numbers in notes for audit trail",
      "Consider creating a dedicated 'Adjustments' batch for correction entries"
    ],
    screenshots: [
      {
        url: songSearchAutocomplete,
        caption: "Royalty creation form with copyright search dropdown showing auto-populated writer and ownership details"
      }
    ],
    relatedSections: ["statements", "payees"]
  },
  {
    id: "payees",
    title: "Creating and Managing Payees",
    icon: "Users",
    overview: "Payees are the individuals or entities who receive royalty payments. This includes writers, publishers, artists, and other rights holders. ENCORE provides both manual payee creation and automatic generation from contract agreements.",
    steps: [
      {
        title: "Navigate to Payees Tab",
        description: "From the Royalties module, go to Payouts → Payees tab. This displays all registered payees with their balances and status.",
        tips: ["Use the search bar to find specific payees", "Filter by payee type or status"]
      },
      {
        title: "Click 'Add Payee' Button",
        description: "Click the 'Add Payee' button to open the payee creation form. Choose between 'Manual Entry' or 'Generate from Agreement'.",
        tips: ["'Generate from Agreement' is faster for contract-based payees"]
      },
      {
        title: "Enter Payee Name",
        description: "For manual entry, input the payee's legal name as it should appear on payments and tax documents.",
        tips: ["Use the official legal name for tax reporting purposes", "DBA/stage names can be added as aliases"]
      },
      {
        title: "Select Payee Type",
        description: "Choose the payee type: Writer, Publisher, Artist, Producer, Label, Administrator, or Other. This affects how the payee appears in reports and statements.",
        tips: ["Payee type determines available commission structures", "One entity can have multiple payee records for different roles"]
      },
      {
        title: "Enter Contact Information",
        description: "Add email address and phone number. Email is required for sending statements and payment notifications.",
        tips: ["Multiple email addresses can be added for CC purposes", "Phone is optional but helpful for urgent matters"]
      },
      {
        title: "Configure Payment Information",
        description: "Set up payment details: Bank account information (for wire/ACH), PayPal email, check mailing address, or payment hold preferences.",
        tips: ["Payment info is encrypted and stored securely", "Payees can update their own info via Client Portal"]
      },
      {
        title: "Set Commission Rate",
        description: "If your company takes a commission on this payee's earnings, enter the percentage (e.g., 15%). Leave blank or 0 for no commission.",
        tips: ["Commission is automatically calculated during payout processing", "Different rates can apply to different income types"]
      },
      {
        title: "Using 'Generate from Agreement'",
        description: "Select a publishing or artist agreement from your contracts. The system extracts all writers and interested parties, creating payee records with pre-filled information including names, ownership percentages, and commission rates from the contract terms.",
        tips: ["Review generated payees before confirming", "Duplicate detection prevents creating redundant records"]
      },
      {
        title: "Understanding Payee Hierarchy",
        description: "The Payee Hierarchy view shows the relationship between agreements, works, and payees. This tree structure helps visualize how royalties flow from songs to rights holders.",
        tips: ["Click on nodes to expand/collapse relationships", "Use hierarchy view to troubleshoot allocation issues"]
      },
      {
        title: "Submit Payee",
        description: "Click 'Create Payee' to save. The payee is now available for royalty allocations and payout processing.",
        tips: ["New payees start with zero balance", "Payee status defaults to 'Active'"]
      }
    ],
    proTips: [
      "Use 'Generate from Agreement' whenever possible to ensure consistency with contract terms",
      "Regularly verify payee payment information is current",
      "Set up the Client Portal to allow payees self-service access to statements and balance info"
    ],
    screenshots: [
      {
        url: addPayeeForm,
        caption: "Add New Payee form showing two-tab layout: Payee Setup (hierarchy, info) and Earnings Split Setup"
      },
      {
        url: generateFromAgreement,
        caption: "Build Payees from Agreement dialog - select an agreement to auto-create writer payees with default splits"
      },
      {
        url: payeeHierarchyView,
        caption: "Payee hierarchy selection showing the Agreement → Publisher → Writer chain structure"
      }
    ],
    relatedSections: ["expenses", "payouts"]
  },
  {
    id: "expenses",
    title: "Managing Expenses",
    icon: "Receipt",
    overview: "Expenses are deductions applied to payee earnings before payout. This includes recoupable advances, commissions, finder fees, and administrative costs. Proper expense management ensures accurate net payout calculations and recoupment tracking.",
    steps: [
      {
        title: "Navigate to Expenses Tab",
        description: "From the Royalties module, go to Payouts → Expenses tab. This shows all recorded expenses with their status and linked payees.",
        tips: ["Filter by status to see active vs recouped expenses", "Sort by amount to prioritize large recoupments"]
      },
      {
        title: "Click 'Add Expense' Button",
        description: "Click 'Add Expense' to open the expense creation form.",
        tips: ["You can also add expenses from the payee detail page"]
      },
      {
        title: "Select Expense Type",
        description: "Choose from: Recoupable Advance (deducted from future earnings until recouped), Commission (percentage-based fee), Finder Fee (one-time referral payment), Administrative Fee (flat processing cost), or Other.",
        tips: ["Recoupable advances track remaining balance automatically", "Commission type uses the payee's commission rate"]
      },
      {
        title: "Enter Amount",
        description: "Input the expense amount. For advances, this is the total amount to be recouped. For fees, this is the one-time charge.",
        tips: ["Currency matches the payee's default currency", "Advances can be added in installments"]
      },
      {
        title: "Enter Description",
        description: "Provide a clear description of the expense, such as 'Q1 2024 Recording Advance' or 'Sync placement finder fee - XYZ Production'.",
        tips: ["Descriptions appear on client statements", "Include contract references when applicable"]
      },
      {
        title: "Link to Payee",
        description: "Select the payee this expense applies to. The expense will be deducted from this payee's future earnings.",
        tips: ["Required field - expenses must be tied to a specific payee", "Search by payee name or ID"]
      },
      {
        title: "Set Expense Flags",
        description: "Configure behavior flags: 'Recoupable' (deducted from earnings over time), 'Is Commission' (calculated as percentage), 'Is Finder Fee' (one-time deduction from specific income).",
        tips: ["Flags affect how the expense is processed during payouts", "Multiple flags can be combined"]
      },
      {
        title: "Set Effective Date",
        description: "Enter when this expense becomes effective. Expenses only apply to earnings from this date forward.",
        tips: ["Use contract signature date for advance recoupment", "Future dates delay expense application"]
      },
      {
        title: "Link to Contract (Optional)",
        description: "If this expense relates to a specific contract, link it for tracking and reporting purposes.",
        tips: ["Linked expenses appear on contract detail pages", "Helps with contract-level P&L reporting"]
      },
      {
        title: "Submit Expense",
        description: "Click 'Create Expense' to save. The expense is created in 'Pending' status and will be applied during the next payout processing.",
        tips: ["Expenses can be edited until applied", "Review expense list before processing payouts"]
      }
    ],
    proTips: [
      "For large advances, consider setting up a recoupment schedule to track expected payoff dates",
      "Regularly review recoupment status and communicate progress to payees",
      "Use expense notes to document any special terms or conditions"
    ],
    screenshots: [
      {
        url: addExpenseDialog,
        caption: "Add New Expense dialog showing Type, Amount, Behavior, Status, Date Range, and linking options (Agreement, Payee, Work). Note the Recoupable, Commission Fee, and Finder Fee checkboxes"
      }
    ],
    relatedSections: ["payees", "payouts"]
  },
  {
    id: "processing",
    title: "Processing & Unprocessing Batches",
    icon: "PlayCircle",
    overview: "Processing a batch converts staged royalty allocations into payout records and updates payee balances. Unprocessing reverses this action, allowing corrections before re-processing. Understanding this workflow is essential for accurate royalty management.",
    steps: [
      {
        title: "Review Batch Contents",
        description: "Before processing, navigate to the batch and review all allocations. Verify song matches, splits, and amounts are correct. Check for any warnings or errors that need resolution.",
        tips: ["Use the 'Validate' button to run pre-processing checks", "Resolve all errors before attempting to process"]
      },
      {
        title: "Navigate to Batch Actions",
        description: "From the Reconciliation tab, find the batch you want to process. Click on the batch row to open the detail view, or use the actions menu (three dots).",
        tips: ["Batches can only be processed if in 'Pending' or 'Needs Review' status"]
      },
      {
        title: "Click 'Process Batch' Button",
        description: "Click the 'Process' button to begin processing. A confirmation dialog appears showing what will happen.",
        tips: ["Processing may take a moment for large batches", "You cannot edit allocations while processing is in progress"]
      },
      {
        title: "Confirm Processing",
        description: "Review the confirmation dialog which shows: Total allocations to process, Payees affected, Total amount being allocated, and any expenses that will be applied. Click 'Confirm' to proceed.",
        tips: ["This action updates payee balances immediately", "Process during off-peak hours for large batches"]
      },
      {
        title: "What Happens During Processing",
        description: "The system: Creates payout records for each allocation, Updates payee account balances, Applies applicable expenses (recoupments, commissions), Sets batch status to 'Completed', and Generates transaction history entries.",
        tips: ["All changes are logged for audit purposes", "Email notifications are sent if configured"]
      },
      {
        title: "Unprocessing a Batch",
        description: "If you need to make corrections after processing, you can unprocess the batch. Navigate to the completed batch and click 'Unprocess' in the actions menu.",
        tips: ["Only available for batches processed within the last 30 days by default", "Requires appropriate user permissions"]
      },
      {
        title: "Confirm Unprocessing",
        description: "A warning dialog explains the reversal effects: Payout records will be deleted/reversed, Payee balances will be recalculated, Expense applications will be reversed, and Batch status returns to 'Pending'.",
        tips: ["Consider the impact on any statements already sent to clients", "Document reason for unprocessing in batch notes"]
      },
      {
        title: "Effects of Unprocessing",
        description: "After unprocessing: All payout records from this batch are marked as reversed, Payee balances reflect the reversal, Recoupable expenses return to 'Pending' status, and You can now edit allocations and reprocess.",
        tips: ["Unprocessing creates an audit trail entry", "Consider timing - avoid unprocessing during payout runs"]
      },
      {
        title: "Reprocessing After Corrections",
        description: "After making necessary corrections to allocations, splits, or amounts, process the batch again following the standard processing steps.",
        tips: ["Verify corrections before reprocessing", "Use batch notes to document what was changed and why"]
      }
    ],
    proTips: [
      "Establish a batch processing schedule (e.g., weekly or monthly) for consistent workflow",
      "Always verify totals match source statements before processing",
      "Use the 'Sandbox' mode for testing if available, before processing production data"
    ],
    screenshots: [
      {
        url: processBatchConfirmation,
        caption: "Process Batch confirmation dialog showing batch details and period selection before finalizing"
      },
      {
        url: unprocessWarningDialog,
        caption: "Unprocess success confirmation after reversing a processed batch"
      }
    ],
    relatedSections: ["reconciliation", "statements", "payouts"]
  },
  {
    id: "payouts",
    title: "Reading the Payouts Tab",
    icon: "Wallet",
    overview: "The Payouts tab is your central hub for managing what's owed to each payee. It shows pending amounts, expense deductions, net payable balances, and payment status. This tab also controls what payees see in the Client Portal.",
    steps: [
      {
        title: "Understanding the Admin View",
        description: "The Payouts tab displays a table with columns: Payee Name/Type, Gross Amount (total earnings), Expenses Deducted, Net Payable (what they'll receive), Status (Pending/Approved/Paid), and Actions.",
        tips: ["Click column headers to sort", "Use filters to find specific payees or statuses"]
      },
      {
        title: "Payee Gross Amount",
        description: "This column shows the total gross earnings allocated to each payee before any deductions. It includes all processed royalties from matched songs based on their ownership percentage.",
        tips: ["Click the amount to see a breakdown by source/period", "Gross amount updates after each batch processing"]
      },
      {
        title: "Expenses Deducted Column",
        description: "Shows total deductions including: Recoupment amounts (advances being recovered), Commission fees (your company's cut), Administrative fees, and Other applicable expenses.",
        tips: ["Hover to see expense breakdown", "Click to view detailed expense list"]
      },
      {
        title: "Net Payable Calculation",
        description: "Net Payable = Gross Amount - Expenses Deducted. This is the actual amount to be paid to the payee. The system automatically calculates this in real-time.",
        tips: ["Negative balances indicate the payee owes money (over-advanced)", "Minimum payout thresholds can be configured"]
      },
      {
        title: "Payout Status Workflow",
        description: "Statuses progress through: 'Pending' (awaiting review), 'Approved' (ready for payment), 'Processing' (payment initiated), 'Paid' (payment completed), and 'On Hold' (payment paused for review).",
        tips: ["Bulk status updates available via selection", "Status changes are logged with timestamps"]
      },
      {
        title: "Account Balances Sub-Tab",
        description: "The Account Balances view shows cumulative balances for each payee including: Beginning Balance, Current Period Earnings, Period Deductions, and Ending Balance.",
        tips: ["Beginning balance can be set for migrating from other systems", "Balance history is maintained for audit"]
      },
      {
        title: "Managing Beginning Balances",
        description: "For payees with existing balances from previous systems or periods, click 'Set Beginning Balance' to enter the starting amount. This ensures accurate balance tracking going forward.",
        tips: ["Document the source of beginning balance in notes", "Use as of date for proper period tracking"]
      },
      {
        title: "Client Portal View",
        description: "What payees see when they log into the Client Portal: Summary cards showing Total Earned, Pending Payments, Amount Paid; Statement breakdown by period; Account balance with transaction history; and Payment method status.",
        tips: ["Preview client view using 'View as Client' option", "Customize which data is visible in Portal Settings"]
      },
      {
        title: "Downloadable Statements",
        description: "Both admins and clients can download statements. Options include: Current period statement, Historical statements by period, Custom date range exports, and PDF or Excel format.",
        tips: ["Branding and format can be customized in Settings", "Statements include all allocation details and deductions"]
      }
    ],
    proTips: [
      "Review payouts weekly to catch any discrepancies early",
      "Set up minimum payout thresholds to avoid small payment processing fees",
      "Use the 'Approve All' feature carefully - review before bulk approval"
    ],
    screenshots: [
      {
        url: payoutsTabOverview,
        caption: "Payouts Management view with summary cards and detailed payout records showing all financial columns and status workflow"
      },
      {
        url: clientPortalView,
        caption: "Client Portal view showing Royalties & Payouts section with earnings summary cards, filters, and statement breakdown table"
      }
    ],
    relatedSections: ["payees", "expenses", "downloads"]
  },
  {
    id: "downloads",
    title: "Downloading Statements",
    icon: "Download",
    overview: "ENCORE provides flexible statement download options for both individual and bulk exports. Statements can be generated in PDF format for client distribution or Excel format for accounting integration and custom analysis.",
    steps: [
      {
        title: "Navigate to Statement Download",
        description: "Statements can be downloaded from multiple locations: the Payouts tab (individual payee rows), the Statements tab (batch-level exports), or Client Portal (payee self-service).",
        tips: ["Most common access is through the Payouts tab", "Bulk exports are available in the Statements tab"]
      },
      {
        title: "Individual Statement Download",
        description: "Find the payee row in the Payouts table. Click the download icon or Actions menu → 'Download Statement'. Choose your preferred format (PDF or Excel).",
        tips: ["Statement covers the current processing period by default", "Custom date ranges available in the options dialog"]
      },
      {
        title: "Select Statement Period",
        description: "In the download options, select the period for the statement: Current Period, Previous Period, Specific Quarter/Year, or Custom Date Range.",
        tips: ["Current period includes all processed but unpaid amounts", "Historical periods show what was paid during that time"]
      },
      {
        title: "Choose Format: PDF",
        description: "PDF statements include: Company letterhead/branding, Statement period and date, Payee information, Itemized earnings by song and source, Expense deductions with descriptions, Net amount summary, and Payment terms and instructions.",
        tips: ["PDF is best for client distribution", "Customize template in Settings → Statement Templates"]
      },
      {
        title: "Choose Format: Excel",
        description: "Excel exports include: Raw data in spreadsheet format, All allocation details with metadata, Separate tabs for summary and line items, Filterable and sortable columns, and Formulas for custom calculations.",
        tips: ["Excel is best for accounting integration", "Data can be imported into QuickBooks, Xero, etc."]
      },
      {
        title: "Bulk Export - Select Multiple",
        description: "To download statements for multiple payees: Use checkboxes to select payees, Click 'Export Selected' button, Choose format and period, and Download as individual files or combined ZIP.",
        tips: ["ZIP option is faster for many statements", "Individual files are named by payee for easy distribution"]
      },
      {
        title: "Bulk Export - All Payees",
        description: "For period-end processing, use 'Export All Statements' to generate statements for all active payees at once. Statements are packaged in a ZIP file organized by payee.",
        tips: ["Large exports may take a few minutes to generate", "Email notification when export is ready"]
      },
      {
        title: "Statement Delivery",
        description: "After downloading, statements can be: Emailed directly from ENCORE using 'Email Statement' action, Downloaded and attached to manual emails, or Uploaded to the Client Portal for payee access.",
        tips: ["Email delivery logs who received what and when", "Portal upload eliminates email attachment limits"]
      },
      {
        title: "Statement History",
        description: "All generated statements are logged in Statement History. Access previous statements, see who downloaded/sent them, and regenerate if needed.",
        tips: ["History includes version tracking for amended statements", "Useful for audit and compliance purposes"]
      }
    ],
    proTips: [
      "Set up automated statement generation and delivery for end-of-period processing",
      "Use branded PDF templates for professional client communication",
      "Archive statement exports for compliance and record-keeping"
    ],
    screenshots: [
      {
        url: downloadOptionsDialog,
        caption: "Payouts table with Actions dropdown showing Export PDF and Export Excel options for downloading statements"
      }
    ],
    relatedSections: ["payouts", "payees"]
  }
];

export const getGuideSectionById = (id: string): GuideSection | undefined => {
  return royaltiesGuideContent.find(section => section.id === id);
};

export const getRelatedSections = (currentId: string): GuideSection[] => {
  const current = getGuideSectionById(currentId);
  if (!current?.relatedSections) return [];
  return current.relatedSections
    .map(id => getGuideSectionById(id))
    .filter((section): section is GuideSection => section !== undefined);
};
