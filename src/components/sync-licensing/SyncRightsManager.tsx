import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Music, Plus, Link2, CheckCircle } from 'lucide-react';
import { CopyrightTable } from '@/components/copyright/CopyrightTable';
import { EnhancedCopyrightForm } from '@/components/copyright/EnhancedCopyrightForm';
import { useCopyright } from '@/hooks/useCopyright';
import { Copyright } from '@/hooks/useCopyright';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SyncRightsManagerProps {
  selectedCopyrightId?: string;
  onCopyrightSelect?: (copyright: Copyright) => void;
  onCopyrightCreate?: (copyright: Copyright) => void;
}

export const SyncRightsManager: React.FC<SyncRightsManagerProps> = ({
  selectedCopyrightId,
  onCopyrightSelect,
  onCopyrightCreate
}) => {
  const { copyrights, loading, getWritersForCopyright } = useCopyright();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('existing');
  const [writers, setWriters] = useState<{ [key: string]: any[] }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCopyright, setSelectedCopyright] = useState<Copyright | null>(null);

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

  // Find selected copyright
  const selectedCopyrightData = selectedCopyrightId 
    ? copyrights.find(c => c.id === selectedCopyrightId)
    : null;

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

  const handleCopyrightSelect = (copyright: Copyright) => {
    setSelectedCopyright(copyright);
    onCopyrightSelect?.(copyright);
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

  return (
    <div className="space-y-4">
      {/* Selected Copyright Display */}
      {selectedCopyrightData && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary" />
              Selected Work
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="font-medium">{selectedCopyrightData.work_title}</div>
                <div className="text-sm text-muted-foreground">
                  Work ID: {selectedCopyrightData.work_id}
                </div>
              </div>
              <div>
                <div className="text-sm">
                  <strong>Writers:</strong>
                </div>
                <div className="text-sm text-muted-foreground">
                  {writers[selectedCopyrightData.id]?.map(w => w.writer_name).join(', ') || 'Loading...'}
                </div>
              </div>
              <div>
                <div className="text-sm">
                  <strong>Controlled Share:</strong>
                </div>
                <div className="text-sm font-medium">
                  {calculateControlledShare(writers[selectedCopyrightData.id] || [])}%
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCopyright(null)}
              className="mt-3"
            >
              Change Selection
            </Button>
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
                      const isSelected = selectedCopyright?.id === copyright.id;
                      
                      return (
                        <Card 
                          key={copyright.id} 
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                          onClick={() => handleCopyrightSelect(copyright)}
                        >
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            {isSelected && (
                              <div className="mt-2 pt-2 border-t">
                                <Badge className="bg-primary text-primary-foreground">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              </div>
                            )}
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