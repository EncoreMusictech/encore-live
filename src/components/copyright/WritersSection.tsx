import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User, Search, Database, Calendar } from 'lucide-react';
import { CopyrightWriter } from '@/hooks/useCopyright';
import { MLCLookupModal } from './MLCLookupModal';
import { MLCResultsDrawer } from './MLCResultsDrawer';
import { useMLCCache } from '@/hooks/useMLCCache';
import { mergeWritersWithExisting } from '@/lib/mlc-utils';
import { useToast } from '@/hooks/use-toast';

interface WritersSectionProps {
  copyrightId?: string;
  writers: CopyrightWriter[];
  onWritersChange: (writers: CopyrightWriter[]) => void;
}

interface WriterFormData {
  writer_name: string;
  ipi_number: string;
  writer_role: string;
  pro_affiliation: string;
  ownership_percentage: number;
}

export const WritersSection: React.FC<WritersSectionProps> = ({
  copyrightId,
  writers,
  onWritersChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showISWCModal, setShowISWCModal] = useState(false);
  const [showISRCModal, setShowISRCModal] = useState(false);
  const [showResultsDrawer, setShowResultsDrawer] = useState(false);
  const [mlcResults, setMLCResults] = useState<any>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ date: string; type: string; value: string } | null>(null);
  
  const { getCachedResult, setCachedResult } = useMLCCache();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<WriterFormData>({
    writer_name: '',
    ipi_number: '',
    writer_role: 'composer',
    pro_affiliation: '',
    ownership_percentage: 0
  });

  const writerRoles = [
    { value: 'composer', label: 'Composer' },
    { value: 'author', label: 'Author/Lyricist' },
    { value: 'arranger', label: 'Arranger' },
    { value: 'adapter', label: 'Adapter' },
    { value: 'translator', label: 'Translator' }
  ];

  const commonPROs = [
    'ASCAP', 'BMI', 'SESAC', 'PRS', 'GEMA', 'SACEM', 'SOCAN', 'APRA'
  ];

  const addWriter = () => {
    if (!formData.writer_name) return;
    
    const newWriter: CopyrightWriter = {
      id: `temp-${Date.now()}`,
      copyright_id: copyrightId || '',
      writer_name: formData.writer_name,
      ipi_number: formData.ipi_number || null,
      cae_number: null,
      isni: null,
      writer_role: formData.writer_role,
      pro_affiliation: formData.pro_affiliation || null,
      nationality: null,
      ownership_percentage: formData.ownership_percentage,
      mechanical_share: 0,
      performance_share: 0,
      synchronization_share: 0,
      controlled_status: 'NC',
      created_at: new Date().toISOString()
    };

    onWritersChange([...writers, newWriter]);
    setFormData({
      writer_name: '',
      ipi_number: '',
      writer_role: 'composer',
      pro_affiliation: '',
      ownership_percentage: 0
    });
    setShowForm(false);
  };

  const removeWriter = (writerId: string) => {
    onWritersChange(writers.filter(w => w.id !== writerId));
  };

  const handleMLCResults = (results: any) => {
    // Check cache first
    const cached = getCachedResult(results.searchType, results.searchValue);
    if (cached) {
      setMLCResults(cached);
      setShowResultsDrawer(true);
      return;
    }

    // Cache the new results
    setCachedResult(results.searchType, results.searchValue, results);
    setMLCResults(results);
    setShowResultsDrawer(true);
  };

  const handleAddMLCWriters = (mlcWriters: CopyrightWriter[]) => {
    const { merged, conflicts } = mergeWritersWithExisting(mlcWriters, writers);
    
    if (conflicts.length > 0) {
      toast({
        title: "Writer Conflicts Detected",
        description: `${conflicts.length} writer(s) already exist. Duplicates were skipped.`,
        variant: "destructive"
      });
    }

    // Update writers with new ones (existing ones are preserved)
    const newWriters = mlcWriters.filter(mlcWriter => 
      !writers.some(existing => 
        (existing.ipi_number && mlcWriter.ipi_number && existing.ipi_number === mlcWriter.ipi_number) ||
        existing.writer_name.toLowerCase() === mlcWriter.writer_name.toLowerCase()
      )
    );

    if (newWriters.length > 0) {
      onWritersChange([...writers, ...newWriters]);
      setLastSyncInfo({
        date: new Date().toLocaleString(),
        type: mlcResults?.searchType || 'MLC',
        value: mlcResults?.searchValue || 'Unknown'
      });
      
      toast({
        title: "Writers Added Successfully",
        description: `Added ${newWriters.length} writer(s) from MLC data.`,
      });
    }
  };

  const totalOwnership = writers.reduce((sum, writer) => sum + writer.ownership_percentage, 0);
  const isOwnershipValid = totalOwnership <= 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Writers & Composers
              <Badge variant={writers.length > 0 ? "default" : "secondary"}>
                {writers.length} writer{writers.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            {lastSyncInfo && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Last synced from MLC {lastSyncInfo.date}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setShowISWCModal(true)}
            >
              <Database className="h-4 w-4 mr-1" />
              Lookup by ISWC
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setShowISRCModal(true)}
            >
              <Search className="h-4 w-4 mr-1" />
              Lookup by ISRC
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Writer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="writer_name">Writer Name *</Label>
                <Input
                  id="writer_name"
                  value={formData.writer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, writer_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipi">IPI Number</Label>
                <Input
                  id="ipi"
                  value={formData.ipi_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipi_number: e.target.value }))}
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Writer Role</Label>
                <Select
                  value={formData.writer_role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, writer_role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {writerRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>PRO Affiliation</Label>
                <Select
                  value={formData.pro_affiliation}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pro_affiliation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PRO" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonPROs.map(pro => (
                      <SelectItem key={pro} value={pro}>
                        {pro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership %</Label>
                <Input
                  id="ownership"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.ownership_percentage}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    ownership_percentage: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={addWriter} disabled={!formData.writer_name}>
                Add Writer
              </Button>
            </div>
          </div>
        )}

        {writers.length > 0 && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>PRO</TableHead>
                  <TableHead>IPI</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {writers.map((writer) => (
                  <TableRow key={writer.id}>
                    <TableCell className="font-medium">{writer.writer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {writerRoles.find(r => r.value === writer.writer_role)?.label || writer.writer_role}
                      </Badge>
                    </TableCell>
                    <TableCell>{writer.pro_affiliation || '-'}</TableCell>
                    <TableCell>{writer.ipi_number || '-'}</TableCell>
                    <TableCell>{writer.ownership_percentage}%</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWriter(writer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Writer Ownership:</span>
              <div className="flex items-center gap-2">
                <Badge variant={isOwnershipValid ? "default" : "destructive"}>
                  {totalOwnership.toFixed(2)}%
                </Badge>
                {!isOwnershipValid && (
                  <span className="text-sm text-destructive">
                    Ownership cannot exceed 100%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {writers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No writers added yet</p>
            <p className="text-sm">Add at least one writer to continue</p>
          </div>
        )}

        {/* MLC Lookup Modals */}
        <MLCLookupModal
          open={showISWCModal}
          onOpenChange={setShowISWCModal}
          type="ISWC"
          onResults={handleMLCResults}
        />
        
        <MLCLookupModal
          open={showISRCModal}
          onOpenChange={setShowISRCModal}
          type="ISRC"
          onResults={handleMLCResults}
        />

        {/* MLC Results Drawer */}
        <MLCResultsDrawer
          open={showResultsDrawer}
          onOpenChange={setShowResultsDrawer}
          results={mlcResults}
          onAddSelected={handleAddMLCWriters}
          existingWriters={writers}
        />
      </CardContent>
    </Card>
  );
};