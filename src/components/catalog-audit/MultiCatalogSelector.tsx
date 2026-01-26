import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Plus, X, Loader2, BarChart3, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMultiCatalogAudit } from '@/hooks/useMultiCatalogAudit';
import { format } from 'date-fns';

interface AvailableCatalog {
  id: string;
  songwriter_name: string;
  total_songs_found: number | null;
  created_at: string;
}

export function MultiCatalogSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableCatalogs, setAvailableCatalogs] = useState<AvailableCatalog[]>([]);
  const [filteredCatalogs, setFilteredCatalogs] = useState<AvailableCatalog[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  const {
    selectedCatalogs,
    addCatalog,
    removeCatalog,
    clearCatalogs,
    loading: isGenerating,
    fetchAggregatedData,
  } = useMultiCatalogAudit();

  useEffect(() => {
    const fetchCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        // Fetch catalogs - for authenticated users, show their own; otherwise show recent anonymous ones
        let query = supabase
          .from('song_catalog_searches')
          .select('id, songwriter_name, total_songs_found, created_at')
          .eq('search_status', 'completed')
          .gt('total_songs_found', 0)
          .order('created_at', { ascending: false })
          .limit(50);

        if (user) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.is('user_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        setAvailableCatalogs(data || []);
        setFilteredCatalogs(data || []);
      } catch (err) {
        console.error('Error fetching catalogs:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCatalogs(availableCatalogs);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCatalogs(
        availableCatalogs.filter(c => 
          c.songwriter_name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, availableCatalogs]);

  const handleAddCatalog = (catalog: AvailableCatalog) => {
    addCatalog({
      searchId: catalog.id,
      artistName: catalog.songwriter_name,
      songCount: catalog.total_songs_found || 0,
    });
  };

  const handleGenerateReport = async () => {
    const data = await fetchAggregatedData();
    if (data) {
      // Navigate to multi-catalog presentation with the search IDs
      const searchIds = selectedCatalogs.map(c => c.searchId).join(',');
      navigate(`/catalog-audit-presentation?multi=true&searchIds=${searchIds}`);
    }
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    navigate(`/catalog-audit-presentation?artist=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isSelected = (catalogId: string) => selectedCatalogs.some(c => c.searchId === catalogId);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        className="w-full max-w-5xl h-[90vh] flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-2">
              <span className="text-primary">ENCORE</span> Multi-Catalog Audit
            </h1>
            <p className="text-muted-foreground">
              Select multiple catalogs to generate an aggregated report
            </p>
          </motion.div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Available Catalogs */}
          <Card className="flex flex-col min-h-0">
            <CardContent className="flex flex-col p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Available Catalogs</h2>
              </div>

              {/* Search */}
              <form onSubmit={handleNewSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search or add new artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" disabled={!searchQuery.trim() || isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </form>

              {/* Catalog List */}
              <ScrollArea className="flex-1">
                {isLoadingCatalogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredCatalogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No catalogs found.</p>
                    <p className="text-sm">Search for an artist above to discover their catalog.</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {filteredCatalogs.map((catalog) => {
                      const selected = isSelected(catalog.id);
                      return (
                        <motion.div
                          key={catalog.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            p-3 rounded-lg border transition-all cursor-pointer
                            ${selected 
                              ? 'bg-primary/10 border-primary/50' 
                              : 'bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card'
                            }
                          `}
                          onClick={() => !selected && handleAddCatalog(catalog)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{catalog.songwriter_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {catalog.total_songs_found} songs • {format(new Date(catalog.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            {selected ? (
                              <Badge variant="secondary" className="ml-2">Added</Badge>
                            ) : (
                              <Button size="sm" variant="ghost" className="ml-2">
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Selected Catalogs */}
          <Card className="flex flex-col min-h-0">
            <CardContent className="flex flex-col p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Selected Catalogs</h2>
                  {selectedCatalogs.length > 0 && (
                    <Badge variant="outline">{selectedCatalogs.length}</Badge>
                  )}
                </div>
                {selectedCatalogs.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearCatalogs}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 mb-4">
                <AnimatePresence mode="popLayout">
                  {selectedCatalogs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No catalogs selected yet.</p>
                      <p className="text-sm">Click catalogs on the left to add them.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2 pr-2">
                      {selectedCatalogs.map((catalog) => (
                        <motion.div
                          key={catalog.searchId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, x: 20 }}
                          layout
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{catalog.artistName}</p>
                              <p className="text-xs text-muted-foreground">
                                {catalog.songCount} songs
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="ml-2 text-destructive hover:text-destructive"
                              onClick={() => removeCatalog(catalog.searchId)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>

              {/* Summary & Generate Button */}
              {selectedCatalogs.length > 0 && (
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total catalogs:</span>
                    <span className="font-medium">{selectedCatalogs.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total songs:</span>
                    <span className="font-medium">
                      {selectedCatalogs.reduce((sum, c) => sum + c.songCount, 0)}
                    </span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Aggregated Report
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back to single mode */}
        <div className="text-center mt-4">
          <Button 
            variant="link" 
            onClick={() => navigate('/catalog-audit-presentation')}
          >
            Or search for a single artist instead
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
