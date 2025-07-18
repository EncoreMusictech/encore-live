import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Music, Plus, Link2, CheckCircle, X } from 'lucide-react';
import { CopyrightTable } from '@/components/copyright/CopyrightTable';
import { EnhancedCopyrightForm } from '@/components/copyright/EnhancedCopyrightForm';
import { useCopyright } from '@/hooks/useCopyright';
import { Copyright } from '@/hooks/useCopyright';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SyncRightsManagerProps {
  selectedCopyrightIds?: string[];
  onCopyrightSelect?: (copyrights: Copyright[]) => void;
  onCopyrightCreate?: (copyright: Copyright) => void;
}

export const SyncRightsManager: React.FC<SyncRightsManagerProps> = ({
  selectedCopyrightIds = [],
  onCopyrightSelect,
  onCopyrightCreate
}) => {
  const { copyrights, loading, getWritersForCopyright } = useCopyright();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('existing');
  const [writers, setWriters] = useState<{ [key: string]: any[] }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCopyrights, setSelectedCopyrights] = useState<Copyright[]>([]);

  // Load writers for each copyright
  React.useEffect(() => {
    const loadWriters = async () => {
      const writersData: { [key: string]: any[] } = {};
      
      for (const copyright of copyrights) {
        try {
          const copyrightWriters = await getWritersForCopyright(copyright.id);
          writersData[copyright.id] = copyrightWriters;
        } catch (error) {
          console.error(`Error loading writers for copyright ${copyright.id}:`, error);
          writersData[copyright.id] = [];
        }
      }
      
      setWriters(writersData);
    };

    if (copyrights.length > 0) {
      loadWriters();
    }
  }, [copyrights, getWritersForCopyright]);

  // Find selected copyrights
  const selectedCopyrightsData = copyrights.filter(c => selectedCopyrightIds.includes(c.id));

  const filteredCopyrights = copyrights.filter(copyright =>
    copyright.work_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.work_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.album_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    writers[copyright.id]?.some(writer => 
      writer.writer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const calculateControlledShare = (copyrightWriters: any[]) => {
    return copyrightWriters
      .filter(w => w.controlled_status === 'C')
      .reduce((sum, w) => sum + w.ownership_percentage, 0);
  };

  const handleCopyrightToggle = (copyright: Copyright, checked: boolean) => {
    let newSelectedCopyrights;
    if (checked) {
      newSelectedCopyrights = [...selectedCopyrights, copyright];
    } else {
      newSelectedCopyrights = selectedCopyrights.filter(c => c.id !== copyright.id);
    }
    setSelectedCopyrights(newSelectedCopyrights);
    onCopyrightSelect?.(newSelectedCopyrights);
  };

  const handleRemoveSelected = (copyrightId: string) => {
    const newSelectedCopyrights = selectedCopyrights.filter(c => c.id !== copyrightId);
    setSelectedCopyrights(newSelectedCopyrights);
    onCopyrightSelect?.(newSelectedCopyrights);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setActiveTab('existing');
    // The copyright will be automatically available in the list after creation
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading copyrights...</p>
      </div>
    );
  }

  // Get controlled writers from selected copyrights
  const getControlledWritersSummary = () => {
    const controlledWriters = new Set<string>();
    selectedCopyrightsData.forEach(copyright => {
      const copyrightWriters = writers[copyright.id] || [];
      copyrightWriters
        .filter(writer => writer.controlled_status === 'C')
        .forEach(writer => controlledWriters.add(writer.writer_name));
    });
    return Array.from(controlledWriters);
  };

  return (
    <div className="space-y-4">
      {/* Selected Copyrights Display */}
      {selectedCopyrightsData.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary" />
              Selected Works ({selectedCopyrightsData.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Controlled Writers Summary */}
            {getControlledWritersSummary().length > 0 && (
              <div className="mb-4 p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium mb-2">Controlled Writers Summary:</div>
                <div className="flex flex-wrap gap-1">
                  {getControlledWritersSummary().map((writerName, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {writerName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {selectedCopyrightsData.map((copyright) => (
                <div key={copyright.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-medium">{copyright.work_title}</div>
                      <div className="text-sm text-muted-foreground">
                        Work ID: {copyright.work_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">
                        <strong>Writers:</strong>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {writers[copyright.id]?.map(w => w.writer_name).join(', ') || 'Loading...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">
                        <strong>Controlled Share:</strong>
                      </div>
                      <div className="text-sm font-medium">
                        {calculateControlledShare(writers[copyright.id] || [])}%
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSelected(copyright.id)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Connect Existing Song
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register New Song
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  My Copyrights
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search copyrights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredCopyrights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No copyrights match your search.' : 'No copyrights found.'}
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredCopyrights.map((copyright) => {
                      const copyrightWriters = writers[copyright.id] || [];
                      const controlledShare = calculateControlledShare(copyrightWriters);
                      const isSelected = selectedCopyrightIds.includes(copyright.id);
                      
                      return (
                        <Card 
                          key={copyright.id} 
                          className={`transition-colors hover:bg-muted/50 ${
                            isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleCopyrightToggle(copyright, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="font-medium truncate" title={copyright.work_title}>
                                    {copyright.work_title}
                                  </div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {copyright.work_id}
                                  </Badge>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Album</div>
                                  <div className="text-sm truncate" title={copyright.album_title || ''}>
                                    {copyright.album_title || '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Writers</div>
                                  <div className="text-sm">
                                    {copyrightWriters.length > 0 
                                      ? copyrightWriters.slice(0, 2).map(w => w.writer_name).join(', ')
                                      : 'Loading...'
                                    }
                                    {copyrightWriters.length > 2 && ` +${copyrightWriters.length - 2}`}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Controlled</div>
                                  <div className="text-sm font-medium">
                                    {controlledShare}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Register New Copyright Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedCopyrightForm 
                onSuccess={handleCreateSuccess}
                onCancel={() => setActiveTab('existing')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};