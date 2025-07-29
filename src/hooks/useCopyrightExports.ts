import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExportOptions {
  format: 'cwr' | 'ddex' | 'csv';
  copyrightIds: string[];
  includeRecordings?: boolean;
  includePublishers?: boolean;
  includeWriters?: boolean;
}

export const useCopyrightExports = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportCopyrights = async (options: ExportOptions) => {
    setExporting(true);
    
    try {
      if (options.format === 'cwr') {
        await exportCWR(options.copyrightIds);
      } else if (options.format === 'ddex') {
        await exportDDEX(options.copyrightIds);
      } else if (options.format === 'csv') {
        await exportCSV(options);
      }
      
      toast({
        title: "Export Successful",
        description: `${options.format.toUpperCase()} export completed successfully.`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || 'Failed to export copyrights',
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportCWR = async (copyrightIds: string[]) => {
    const { data, error } = await supabase.functions.invoke('export-cwr', {
      body: { copyrightIds }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate CWR export');
    }

    // The function returns the file content directly
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cwr_export_${new Date().toISOString().split('T')[0]}.cwr`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportDDEX = async (copyrightIds: string[]) => {
    const { data, error } = await supabase.functions.invoke('export-ddex', {
      body: { copyrightIds }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate DDEX export');
    }

    // The function returns the XML content directly
    const blob = new Blob([data], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ddex_export_${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportCSV = async (options: ExportOptions) => {
    // Fetch copyright data with related tables
    const { data: copyrights, error } = await supabase
      .from('copyrights')
      .select(`
        *,
        ${options.includeWriters ? 'copyright_writers(*),' : ''}
        ${options.includePublishers ? 'copyright_publishers(*),' : ''}
        ${options.includeRecordings ? 'copyright_recordings(*)' : ''}
      `)
      .in('id', options.copyrightIds);

    if (error) {
      throw new Error(`Failed to fetch copyright data: ${error.message}`);
    }

    // Convert to CSV
    const csvContent = generateCSV(copyrights, options);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copyright_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const generateCSV = (copyrights: any[], options: ExportOptions): string => {
    const headers = [
      'Work Title',
      'Work ID',
      'ISWC',
      'Registration Status',
      'Creation Date',
      'Language Code',
      'Work Type'
    ];

    if (options.includeWriters) {
      headers.push('Writers', 'Writer IPIs', 'Writer Shares');
    }

    if (options.includePublishers) {
      headers.push('Publishers', 'Publisher IPIs', 'Publisher Shares');
    }

    if (options.includeRecordings) {
      headers.push('Recordings', 'ISRCs', 'Artists');
    }

    const rows = copyrights.map(copyright => {
      const row = [
        copyright.work_title,
        copyright.work_id,
        copyright.iswc || '',
        copyright.registration_status,
        copyright.creation_date || '',
        copyright.language_code || '',
        copyright.work_type || ''
      ];

      if (options.includeWriters && copyright.copyright_writers) {
        row.push(
          copyright.copyright_writers.map((w: any) => w.writer_name).join('; '),
          copyright.copyright_writers.map((w: any) => w.ipi_number || '').join('; '),
          copyright.copyright_writers.map((w: any) => `${w.ownership_percentage}%`).join('; ')
        );
      }

      if (options.includePublishers && copyright.copyright_publishers) {
        row.push(
          copyright.copyright_publishers.map((p: any) => p.publisher_name).join('; '),
          copyright.copyright_publishers.map((p: any) => p.ipi_number || '').join('; '),
          copyright.copyright_publishers.map((p: any) => `${p.ownership_percentage}%`).join('; ')
        );
      }

      if (options.includeRecordings && copyright.copyright_recordings) {
        row.push(
          copyright.copyright_recordings.map((r: any) => r.recording_title || '').join('; '),
          copyright.copyright_recordings.map((r: any) => r.isrc || '').join('; '),
          copyright.copyright_recordings.map((r: any) => r.artist_name || '').join('; ')
        );
      }

      return row;
    });

    // Convert to CSV format
    const csvRows = [headers, ...rows];
    return csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const validateExport = async (copyrightIds: string[]): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // Fetch copyrights to validate
    const { data: copyrights, error } = await supabase
      .from('copyrights')
      .select(`
        *,
        copyright_writers(*),
        copyright_publishers(*)
      `)
      .in('id', copyrightIds);

    if (error) {
      errors.push(`Failed to validate copyrights: ${error.message}`);
      return { isValid: false, errors };
    }

    // Validate each copyright
    copyrights.forEach(copyright => {
      if (!copyright.work_title || copyright.work_title.trim() === '') {
        errors.push(`Copyright "${copyright.work_id}" is missing a work title`);
      }

      // Check for writer ownership validation
      const totalWriterShare = copyright.copyright_writers.reduce(
        (sum: number, writer: any) => sum + writer.ownership_percentage, 0
      );
      
      if (totalWriterShare > 100) {
        errors.push(`Copyright "${copyright.work_title}" has writer shares exceeding 100%`);
      }

      // Check for publisher ownership validation
      const totalPublisherShare = copyright.copyright_publishers.reduce(
        (sum: number, publisher: any) => sum + publisher.ownership_percentage, 0
      );
      
      if (totalPublisherShare > 100) {
        errors.push(`Copyright "${copyright.work_title}" has publisher shares exceeding 100%`);
      }

      // Check for required fields for CWR/DDEX compliance
      if (!copyright.language_code) {
        errors.push(`Copyright "${copyright.work_title}" is missing language code`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  return {
    exporting,
    exportCopyrights,
    validateExport,
  };
};