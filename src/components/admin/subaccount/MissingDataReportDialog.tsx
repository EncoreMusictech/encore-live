import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import Papa from 'papaparse';

const CHECKPOINTS = [
  { key: 'contract_entered', label: 'Contract' },
  { key: 'copyrights_entered', label: 'Copyrights' },
  { key: 'schedules_attached', label: 'Schedules' },
  { key: 'payees_created', label: 'Payees' },
  { key: 'contract_terms_confirmed', label: 'Terms' },
  { key: 'payee_splits_confirmed', label: 'Splits' },
  { key: 'beginning_balance_entered', label: 'Balance' },
  { key: 'client_portal_created', label: 'Portal' },
  { key: 'client_assets_granted', label: 'Assets' },
] as const;

interface TrackingItem {
  id: string;
  entity_name: string | null;
  administrator?: string | null;
  writer_name: string;
  [key: string]: any;
}

interface MissingDataReportDialogProps {
  items: TrackingItem[];
  companyName?: string;
}

interface MissingRow {
  writer_name: string;
  entity_name: string;
  administrator: string;
  missing: string[];
}

export function MissingDataReportDialog({ items, companyName }: MissingDataReportDialogProps) {
  const [filterCheckpoint, setFilterCheckpoint] = useState<string>('all');

  const missingRows: MissingRow[] = items
    .map(item => {
      const missing = CHECKPOINTS.filter(cp => !item[cp.key]).map(cp => cp.label);
      if (missing.length === 0) return null;
      return {
        writer_name: item.writer_name,
        entity_name: item.entity_name || 'Unassigned',
        administrator: item.administrator || '—',
        missing,
      };
    })
    .filter(Boolean) as MissingRow[];

  const filtered = filterCheckpoint === 'all'
    ? missingRows
    : missingRows.filter(r => r.missing.includes(filterCheckpoint));

  // Group by checkpoint for summary
  const checkpointGroups = CHECKPOINTS.map(cp => ({
    label: cp.label,
    count: items.filter(i => !i[cp.key]).length,
  })).filter(g => g.count > 0);

  const exportCsv = () => {
    const rows = filtered.map(r => ({
      Writer: r.writer_name,
      Entity: r.entity_name,
      Administrator: r.administrator,
      'Missing Checkpoints': r.missing.join(', '),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-data-report${companyName ? `-${companyName}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Run Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Missing Data Report{companyName ? ` — ${companyName}` : ''}</DialogTitle>
        </DialogHeader>

        {missingRows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">All checkpoints are complete! 🎉</p>
        ) : (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {checkpointGroups.map(g => (
                <Badge
                  key={g.label}
                  variant={filterCheckpoint === g.label ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setFilterCheckpoint(filterCheckpoint === g.label ? 'all' : g.label)}
                >
                  {g.label}: {g.count} missing
                </Badge>
              ))}
            </div>

            {/* Filter + Export */}
            <div className="flex items-center justify-between">
              <Select value={filterCheckpoint} onValueChange={setFilterCheckpoint}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by checkpoint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Checkpoints</SelectItem>
                  {CHECKPOINTS.map(cp => (
                    <SelectItem key={cp.key} value={cp.label}>{cp.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Writer</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Missing Checkpoints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{row.writer_name}</TableCell>
                    <TableCell className="text-sm">{row.entity_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.administrator}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.missing.map(m => (
                          <Badge key={m} variant="destructive" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">
              {filtered.length} writer(s) with incomplete data
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
