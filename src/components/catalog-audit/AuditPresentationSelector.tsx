import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Music, Play, Calendar, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface RecentSearch {
  id: string;
  songwriter_name: string;
  total_songs_found: number | null;
  created_at: string;
}

export function AuditPresentationSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentSearches = async () => {
      if (!user) {
        setIsLoadingRecent(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('song_catalog_searches')
          .select('id, songwriter_name, total_songs_found, created_at')
          .eq('user_id', user.id)
          .eq('search_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentSearches(data || []);
      } catch (err) {
        console.error('Error fetching recent searches:', err);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchRecentSearches();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    navigate(`/catalog-audit-presentation?artist=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSearch = (searchId: string) => {
    navigate(`/catalog-audit-presentation?searchId=${searchId}`);
  };

  const handleMultiCatalogMode = () => {
    navigate('/catalog-audit-presentation?mode=multi');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
      <motion.div 
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-headline font-bold text-foreground mb-2">
              <span className="text-primary">ENCORE</span> Catalog Audit
            </h1>
            <p className="text-muted-foreground text-lg">
              Presentation Mode
            </p>
          </motion.div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter artist or songwriter name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-card/50 backdrop-blur border-border/50 focus:border-primary"
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="h-14 px-8"
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>

          {/* Multi-Catalog Button */}
          <Button 
            variant="outline" 
            className="w-full h-12 mb-8"
            onClick={handleMultiCatalogMode}
          >
            <Users className="w-5 h-5 mr-2" />
            Audit Multiple Catalogs
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-sm text-muted-foreground uppercase tracking-wider">
            Or select from recent searches
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </motion.div>

        {/* Recent Searches List */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {isLoadingRecent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentSearches.length === 0 ? (
            <Card className="bg-card/30 backdrop-blur border-border/30">
              <CardContent className="py-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No recent catalog searches found.
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Search for an artist above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            recentSearches.map((search, index) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
              >
                <Card 
                  className="bg-card/50 backdrop-blur border-border/30 hover:border-primary/50 hover:bg-card/70 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleSelectSearch(search.id)}
                >
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {search.songwriter_name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(search.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {search.total_songs_found ?? 0} songs
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Present
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
