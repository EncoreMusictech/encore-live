import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SyncLicense {
  id: string;
  synch_id: string;
  user_id: string;
  project_title: string;
  synch_agent?: string;
  media_type?: string;
  platforms?: string;
  territory?: string;
  term_duration?: string;
  episode_season?: string;
  request_received?: string;
  request_attachment_url?: string;
  source?: string;
  territory_of_licensee?: string;
  term_start?: string;
  term_end?: string;
  territories?: string[];
  music_type?: string;
  music_use?: string;
  smpte?: string;
  linked_copyright_ids?: string[];
  publisher_splits?: any;
  master_splits?: any;
  pub_share_percentage?: number;
  master_share_percentage?: number;
  pub_fee_all_in?: number;
  pub_fee?: number;
  master_fee?: number;
  invoiced_amount?: number;
  currency: string;
  royalties?: string;
  synch_status: string;
  approval_issued?: string;
  approval_documentation_url?: string;
  first_confirmation_of_use?: string;
  license_status: string;
  license_issued?: string;
  pe_license_received?: string;
  fe_license_returned: boolean;
  fe_license_url?: string;
  invoice_status: string;
  invoice_issued?: string;
  payment_status: string;
  payment_received?: string;
  check_copy_remittance_url?: string;
  notes?: string;
  mfn: boolean;
  created_at: string;
  updated_at: string;
  
  // Existing enhanced fields
  exclusive_license?: boolean;
  promotional_usage?: boolean;
  festival_usage?: boolean;
  trailer_usage?: boolean;
  advertising_usage?: boolean;
  usage_duration_seconds?: number;
  usage_description?: string;
  context_description?: string;
  production_company?: string;
  production_budget?: number;
  distribution_channels?: string[];
  expected_audience_size?: number;
  master_owner?: string;
  master_owner_contact?: string;
  publishing_administrator?: string;
  publishing_admin_contact?: string;
  backend_royalty_rate?: number;
  performance_bonus?: number;
  sales_threshold_bonus?: number;
  sales_threshold_amount?: number;
  union_restrictions?: string;
  content_rating?: string;
  territory_restrictions?: string[];
  embargo_territories?: string[];
  delivery_format?: string;
  technical_specs?: any;
  delivery_deadline?: string;
  internal_project_code?: string;
  priority_level?: string;
  client_contact_info?: any;
  legal_review_status?: string;
  legal_reviewer?: string;
  legal_review_date?: string;
  approval_expiry_date?: string;

  // Phase 1: New contact information fields
  licensor_name?: string;
  licensor_email?: string;
  licensor_phone?: string;
  licensor_address?: string;
  licensor_company?: string;
  licensee_name?: string;
  licensee_email?: string;
  licensee_phone?: string;
  licensee_address?: string;
  licensee_company?: string;

  // Phase 1: Payment terms fields
  payment_due_date?: string;
  payment_method?: string;
  banking_instructions?: any;
  payment_reference?: string;
  advance_amount?: number;
  backend_percentage?: number;

  // Phase 1: Scene context and usage tracking
  scene_description?: string;
  scene_duration_seconds?: number;
  scene_timestamp?: string;
  music_timing_notes?: string;
  instrumental_vocal?: 'instrumental' | 'vocal' | 'both';
  music_prominence?: 'background' | 'featured' | 'theme';
  audio_mix_level?: number;
  audio_file_url?: string;

  // Phase 1: Contract execution tracking
  contract_execution_status?: 'draft' | 'sent' | 'signed' | 'executed' | 'expired';
  contract_sent_date?: string;
  contract_signed_date?: string;
  contract_executed_date?: string;
  contract_expiry_date?: string;
  signatory_name?: string;
  signatory_title?: string;
  witness_name?: string;
  notarization_required?: boolean;
  notarization_date?: string;

  // Phase 1: Credit language and rights clearance
  credit_language?: string;
  credit_placement?: 'end_credits' | 'opening_credits' | 'none' | 'on_screen' | 'package_only';
  credit_size?: 'standard' | 'large' | 'small' | 'equal';
  credit_requirements?: any;
  rights_cleared?: boolean;
  rights_clearance_type?: 'one-stop' | 'pre-cleared' | 'full-clearance' | 'all-in-deal';
  clearance_notes?: string;
  master_rights_cleared?: boolean;
  publishing_rights_cleared?: boolean;
  synchronization_rights_cleared?: boolean;
  performance_rights_cleared?: boolean;
  mechanical_rights_cleared?: boolean;

  // Phase 1: Document management
  signed_agreement_url?: string;
  executed_agreement_url?: string;
  amendment_urls?: string[];
  supporting_documents?: any[];
}

export interface CreateSyncLicenseData {
  project_title: string;
  synch_agent?: string;
  media_type?: string;
  request_received?: string;
  source?: string;
  territory_of_licensee?: string;
  term_start?: string;
  term_end?: string;
  territories?: string[];
  music_type?: string;
  music_use?: string;
  smpte?: string;
  linked_copyright_ids?: string[];
  pub_fee?: number;
  master_fee?: number;
  currency?: string;
  synch_status?: string;
  payment_status?: string;
  invoice_status?: string;
  notes?: string;
  
  // New fields
  exclusive_license?: boolean;
  promotional_usage?: boolean;
  festival_usage?: boolean;
  trailer_usage?: boolean;
  advertising_usage?: boolean;
  usage_duration_seconds?: number;
  usage_description?: string;
  context_description?: string;
  production_company?: string;
  production_budget?: number;
  distribution_channels?: string[];
  expected_audience_size?: number;
  master_owner?: string;
  master_owner_contact?: string;
  publishing_administrator?: string;
  publishing_admin_contact?: string;
  backend_royalty_rate?: number;
  performance_bonus?: number;
  sales_threshold_bonus?: number;
  sales_threshold_amount?: number;
  union_restrictions?: string;
  content_rating?: string;
  territory_restrictions?: string[];
  embargo_territories?: string[];
  delivery_format?: string;
  technical_specs?: any;
  delivery_deadline?: string;
  internal_project_code?: string;
  priority_level?: string;
  client_contact_info?: any;
  legal_review_status?: string;
  legal_reviewer?: string;
  legal_review_date?: string;
  approval_expiry_date?: string;
}

export const useSyncLicenses = () => {
  return useQuery({
    queryKey: ["sync-licenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_licenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as SyncLicense[];
    },
  });
};

export const useCreateSyncLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSyncLicenseData) => {
      const { data: result, error } = await supabase
        .from("sync_licenses")
        .insert([data as any])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-licenses"] });
      toast({
        title: "Success",
        description: "Sync license created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sync license",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSyncLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SyncLicense> }) => {
      const { data: result, error } = await supabase
        .from("sync_licenses")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-licenses"] });
      toast({
        title: "Success",
        description: "Sync license updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sync license",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSyncLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sync_licenses")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-licenses"] });
      toast({
        title: "Success",
        description: "Sync license deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sync license",
        variant: "destructive",
      });
    },
  });
};

export const useGenerateSyncLicensePDF = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      console.log('Generating sync license PDF for ID:', licenseId);
      
      const { data, error } = await supabase.functions.invoke('generate-sync-license-pdf', {
        body: { licenseId }
      });

      if (error) {
        console.error('PDF generation error:', error);
        throw error;
      }

      console.log('PDF generation response:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data?.htmlContent && data?.filename) {
        // Convert HTML to PDF using jsPDF and html2canvas
        import('jspdf').then(({ jsPDF }) => {
          import('html2canvas').then((html2canvas) => {
            // Create a temporary iframe for rendering
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '794px';
            iframe.style.height = '1123px';
            document.body.appendChild(iframe);
            
            const doc = iframe.contentDocument!;
            doc.open();
            doc.write(data.htmlContent);
            doc.close();
            
            // Wait for content to render
            setTimeout(() => {
              const target = doc.body;
              if (target) {
                html2canvas.default(target, { 
                  scale: 2, 
                  useCORS: true, 
                  logging: false, 
                  backgroundColor: '#ffffff' 
                }).then((canvas) => {
                  const pdf = new jsPDF('p', 'pt', 'a4');
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const margin = 48;
                  const imgWidth = pageWidth - margin * 2;
                  const scale = imgWidth / canvas.width;
                  const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);
                  
                  let y = 0;
                  let pageIndex = 0;
                  
                  while (y < canvas.height) {
                    const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sliceHeight;
                    const ctx = pageCanvas.getContext('2d')!;
                    ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
                    const imgData = pageCanvas.toDataURL('image/png');
                    
                    if (pageIndex > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sliceHeight * scale);
                    
                    y += sliceHeight;
                    pageIndex++;
                  }
                  
                  pdf.save(data.filename.replace('.html', '.pdf'));
                  document.body.removeChild(iframe);
                  
                  toast({
                    title: "Success",
                    description: "Sync license PDF generated and downloaded successfully",
                  });
                }).catch((error) => {
                  console.error('Canvas rendering error:', error);
                  document.body.removeChild(iframe);
                  toast({
                    title: "Error", 
                    description: "Failed to render PDF",
                    variant: "destructive",
                  });
                });
              }
            }, 500);
          });
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid response from PDF generation service",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Sync license PDF generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate sync license PDF",
        variant: "destructive",
      });
    },
  });
};

// Note: Template functionality will be added once Supabase types are regenerated