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
  pub_fee?: number;
  master_fee?: number;
  currency?: string;
  synch_status?: string;
  payment_status?: string;
  invoice_status?: string;
  notes?: string;
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