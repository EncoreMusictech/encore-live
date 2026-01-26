import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Music, Play, Calendar, Loader2, Users, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { AnimatedMusicBackground } from './AnimatedMusicBackground';

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
    navigate(`/catalog-audit?artist=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSearch = (searchId: string) => {
    navigate(`/catalog-audit?searchId=${searchId}`);
  };

  const handleMultiCatalogMode = () => {
    navigate('/catalog-audit?mode=multi');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 overflow-hidden">
      {/* Animated background */}
      <AnimatedMusicBackground />
      
      <motion.div 
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with animated elements */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative inline-block"
          >
            {/* Floating music notes around title */}
            <motion.div
              className="absolute -left-12 -top-4"
              animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Music className="w-8 h-8 text-primary/40" />
            </motion.div>
            <motion.div
              className="absolute -right-14 top-0"
              animate={{ y: [0, -10, 0], rotate: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <DollarSign className="w-7 h-7 text-primary/40" />
            </motion.div>
            <motion.div
              className="absolute -right-8 -bottom-6"
              animate={{ y: [0, -6, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Sparkles className="w-5 h-5 text-primary/50" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-3">
              <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">ENCORE</span> Catalog Audit
            </h1>
            <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ♪
              </motion.span>
              Discover Uncollected Royalties
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                ♪
              </motion.span>
            </p>
          </motion.div>
        </div>

        {/* Search Section with glowing card effect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative"
        >
          {/* Glowing background effect */}
          <motion.div 
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl opacity-50"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <Card className="relative bg-card/60 backdrop-blur-xl border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                <div className="relative flex-1 group">
                  <motion.div
                    className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/50 to-primary/30 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300"
                  />
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter artist or songwriter name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-lg bg-background/80 border-border/50 focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search
                    </>
                  )}
                </Button>
              </form>

              {/* Multi-Catalog Button */}
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
                onClick={handleMultiCatalogMode}
              >
                <Users className="w-5 h-5" />
                Audit Multiple Catalogs
                <motion.span
                  className="ml-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Divider with music notes */}
        <motion.div 
          className="flex items-center gap-4 my-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-border/50" />
          <span className="text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4" />
            Recent Searches
            <Music className="w-4 h-4" />
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/50 to-border/50" />
        </motion.div>

        {/* Recent Searches List */}
        <motion.div 
          className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {isLoadingRecent ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-muted-foreground text-sm">Loading your catalogs...</p>
            </div>
          ) : recentSearches.length === 0 ? (
            <Card className="bg-card/30 backdrop-blur border-border/30 border-dashed">
              <CardContent className="py-12 text-center">
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Music className="w-16 h-16 mx-auto mb-4 text-primary/30" />
                </motion.div>
                <p className="text-muted-foreground font-medium">
                  No catalog searches yet
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Search for an artist above to discover uncollected royalties
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
                whileHover={{ scale: 1.01, x: 4 }}
              >
                <Card 
                  className="bg-card/50 backdrop-blur border-border/30 hover:border-primary/50 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => handleSelectSearch(search.id)}
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardContent className="py-4 px-5 flex items-center gap-4 relative">
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      <Music className="w-6 h-6 text-primary" />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-lg group-hover:text-primary transition-colors">
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
                      <motion.span 
                        className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center gap-1.5"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Music className="w-3.5 h-3.5" />
                        {search.total_songs_found ?? 0} songs
                      </motion.span>
                      <Button 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1.5 shadow-lg shadow-primary/20"
                      >
                        <Play className="w-4 h-4" />
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
