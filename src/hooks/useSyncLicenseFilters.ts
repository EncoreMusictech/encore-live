import { useState, useMemo } from "react";
import { SyncLicenseFilters } from "@/components/sync-licensing/SyncLicenseFilters";
import { SyncLicense } from "@/hooks/useSyncLicenses";

export const useSyncLicenseFilters = (licenses: SyncLicense[]) => {
  const [filters, setFilters] = useState<SyncLicenseFilters>({});

  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          license.project_title?.toLowerCase().includes(searchLower) ||
          license.synch_id?.toLowerCase().includes(searchLower) ||
          license.synch_agent?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && license.synch_status !== filters.status) {
        return false;
      }

      // Media type filter
      if (filters.mediaType && license.media_type !== filters.mediaType) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus && license.payment_status !== filters.paymentStatus) {
        return false;
      }

      // Agent filter
      if (filters.agent) {
        const agentLower = filters.agent.toLowerCase();
        if (!license.synch_agent?.toLowerCase().includes(agentLower)) {
          return false;
        }
      }

      return true;
    });
  }, [licenses, filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value.trim() !== "").length;
  }, [filters]);

  return {
    filters,
    setFilters,
    filteredLicenses,
    activeFiltersCount,
  };
};