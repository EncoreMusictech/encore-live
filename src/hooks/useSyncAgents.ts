import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSyncAgents = () => {
  return useQuery({
    queryKey: ["sync-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_licenses")
        .select("synch_agent")
        .not("synch_agent", "is", null)
        .not("synch_agent", "eq", "");

      if (error) {
        throw error;
      }

      // Get unique agent names
      const uniqueAgents = [...new Set(data.map(item => item.synch_agent))];
      return uniqueAgents.filter(Boolean) as string[];
    },
  });
};

export const useSyncSources = () => {
  return useQuery({
    queryKey: ["sync-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_licenses")
        .select("source")
        .not("source", "is", null)
        .not("source", "eq", "");

      if (error) {
        throw error;
      }

      // Get unique source names
      const uniqueSources = [...new Set(data.map(item => item.source))];
      return uniqueSources.filter(Boolean) as string[];
    },
  });
};