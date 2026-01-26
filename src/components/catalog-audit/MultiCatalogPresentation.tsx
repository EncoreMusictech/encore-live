import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, ChevronLeft, ChevronRight, 
  BarChart3, AlertTriangle, Music, DollarSign,
  FileQuestion, Building2, FileWarning, Users, Headphones, Tv, Radio, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedCounter } from './AnimatedCounter';
import { type AggregatedAuditData, type CatalogSummary, type SongWithIssues } from '@/hooks/useMultiCatalogAudit';
import { supabase } from '@/integrations/supabase/client';

interface ArtistEnrichmentData {
  artistName: string;
  imageUrl: string | null;
  biography: string | null;
  topTracks: Array<{ name: string; popularity: number; spotifyUrl?: string }>;
  recentSyncs: Array<{ title: string; placement: string; year?: number }>;
  recentPerformances: Array<{ event: string; date?: string; location?: string }>;
  spotifyFollowers?: number;
  monthlyListeners?: number;
  genres: string[];
}

interface MultiCatalogPresentationProps {
  data: AggregatedAuditData;
  onClose: () => void;
  onDownloadReport: () => void;
  isGeneratingPDF?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function MultiCatalogPresentation({ 
  data, 
  onClose, 
  onDownloadReport,
  isGeneratingPDF 
}: MultiCatalogPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Slides: Overview, Gaps, Financial, Per-Catalog (one per catalog), Missing Songs
  const totalSlides = 4 + data.catalogs.length;

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const renderSlide = () => {
    if (currentSlide === 0) return <OverviewSlide data={data} />;
    if (currentSlide === 1) return <GapsSlide data={data} />;
    if (currentSlide === 2) return <FinancialSlide data={data} />;
    if (currentSlide === 3) return <MissingSongsSlide data={data} />;
    
    const catalogIndex = currentSlide - 4;
    if (catalogIndex >= 0 && catalogIndex < data.catalogs.length) {
      return <CatalogDetailSlide catalog={data.catalogs[catalogIndex]} />;
    }
    
    return null;
  };

  const getSlideTitle = () => {
    if (currentSlide === 0) return 'Portfolio Overview';
    if (currentSlide === 1) return 'Registration Gaps';
    if (currentSlide === 2) return 'Financial Impact';
    if (currentSlide === 3) return 'Priority Actions';
    
    const catalogIndex = currentSlide - 4;
    if (catalogIndex >= 0 && catalogIndex < data.catalogs.length) {
      return data.catalogs[catalogIndex].artistName;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-background/80 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-headline font-bold">
              <span className="text-primary">ENCORE</span> Multi-Catalog Audit
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.catalogs.length} Catalogs • {data.totals.totalWorks} Total Works
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-4">
            {currentSlide + 1} / {totalSlides}
          </span>
          <Button variant="outline" onClick={onDownloadReport} disabled={isGeneratingPDF}>
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Generating...' : 'Download Report'}
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="pt-20 pb-20 px-8 h-full overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-2">{getSlideTitle()}</Badge>
            </div>
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-4 bg-background/80 backdrop-blur border-t border-border/50">
        <Button 
          variant="outline" 
          onClick={prevSlide} 
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
        
        <Button 
          variant="outline" 
          onClick={nextSlide} 
          disabled={currentSlide === totalSlides - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Overview Slide
function OverviewSlide({ data }: { data: AggregatedAuditData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<BarChart3 className="w-6 h-6" />}
          label="Catalogs"
          value={data.totals.catalogCount}
        />
        <StatCard 
          icon={<Music className="w-6 h-6" />}
          label="Total Works"
          value={data.totals.totalWorks}
        />
        <StatCard 
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Total Gaps"
          value={data.totals.totalGaps}
          variant="warning"
        />
        <StatCard 
          icon={<DollarSign className="w-6 h-6" />}
          label="Pipeline Value"
          value={formatCurrency(data.totals.pipelineTotal)}
          variant="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Included Catalogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.catalogs.map((catalog) => (
              <div 
                key={catalog.searchId}
                className="p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <p className="font-medium">{catalog.artistName}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{catalog.catalogSize} songs</span>
                  <span>•</span>
                  <span className="text-destructive">{catalog.totalGaps} gaps</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Gaps Slide
function GapsSlide({ data }: { data: AggregatedAuditData }) {
  const gapTypes = [
    { 
      label: 'Missing ISWC', 
      value: data.totals.missingISWC,
      icon: FileQuestion,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    { 
      label: 'Missing PRO Registration', 
      value: data.totals.missingPRO,
      icon: Building2,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    { 
      label: 'Incomplete Metadata', 
      value: data.totals.incompleteMetadata,
      icon: FileWarning,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-6xl font-headline font-bold text-destructive mb-2">
          <AnimatedCounter value={data.totals.totalGaps} duration={1500} />
        </p>
        <p className="text-xl text-muted-foreground">Total Registration Gaps Identified</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gapTypes.map((gap) => (
          <Card key={gap.label} className={`${gap.bgColor} border-0`}>
            <CardContent className="pt-6">
              <gap.icon className={`w-10 h-10 ${gap.color} mb-4`} />
              <p className={`text-4xl font-bold ${gap.color}`}>{gap.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{gap.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gaps by Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.catalogs.map((catalog) => (
              <div key={catalog.searchId} className="flex items-center gap-4">
                <span className="flex-1 font-medium truncate">{catalog.artistName}</span>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-amber-600">
                    {catalog.missingISWC} ISWC
                  </Badge>
                  <Badge variant="outline" className="text-red-600">
                    {catalog.missingPRO} PRO
                  </Badge>
                  <Badge variant="outline" className="text-orange-600">
                    {catalog.incompleteMetadata} Meta
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Financial Slide
function FinancialSlide({ data }: { data: AggregatedAuditData }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Combined Pipeline Estimate
        </p>
        <p className="text-7xl font-headline font-bold text-primary">
          <AnimatedCounter value={data.totals.pipelineTotal} format="currency" duration={2000} />
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(data.totals.performance)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Performance Royalties</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(data.totals.mechanical)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Mechanical Royalties</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(data.totals.sync)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Sync Licensing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline by Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.catalogs.sort((a, b) => b.pipelineTotal - a.pipelineTotal).map((catalog) => (
              <div key={catalog.searchId} className="flex items-center gap-4">
                <span className="flex-1 font-medium truncate">{catalog.artistName}</span>
                <span className="font-bold text-primary">{formatCurrency(catalog.pipelineTotal)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Missing Songs Slide
function MissingSongsSlide({ data }: { data: AggregatedAuditData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-headline font-bold mb-2">Priority Actions</h2>
        <p className="text-muted-foreground">Top songs with missing registrations or incomplete metadata</p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-4">
          {data.catalogs.map((catalog) => (
            <Card key={catalog.searchId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  {catalog.artistName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {catalog.topMissingSongs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No critical issues found</p>
                ) : (
                  <div className="space-y-2">
                    {catalog.topMissingSongs.map((song) => (
                      <div 
                        key={song.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="font-medium truncate flex-1">{song.song_title}</span>
                        <div className="flex gap-1 ml-2">
                          {song.issues.map((issue) => (
                            <Badge 
                              key={issue} 
                              variant="outline" 
                              className={
                                issue.includes('ISWC') ? 'text-amber-600 border-amber-600/30' :
                                issue.includes('PRO') ? 'text-red-600 border-red-600/30' :
                                'text-orange-600 border-orange-600/30'
                              }
                            >
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Catalog Detail Slide with Artist Enrichment
function CatalogDetailSlide({ catalog }: { catalog: CatalogSummary }) {
  const [enrichment, setEnrichment] = useState<ArtistEnrichmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrichment = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('artist-enrichment', {
          body: { artistName: catalog.artistName },
        });
        if (!error && data?.success) {
          setEnrichment(data.data);
        }
      } catch (err) {
        console.error('Enrichment fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrichment();
  }, [catalog.artistName]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Artist Header with Image */}
      <div className="flex items-start gap-6">
        {/* Artist Image */}
        <div className="flex-shrink-0">
          {enrichment?.imageUrl ? (
            <img
              src={enrichment.imageUrl}
              alt={catalog.artistName}
              className="w-24 h-24 rounded-xl object-cover shadow-lg border border-primary/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Music className="w-10 h-10 text-primary/40" />
              )}
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="flex-1">
          <h2 className="text-3xl font-headline font-bold text-primary mb-1">{catalog.artistName}</h2>
          {enrichment?.genres && enrichment.genres.length > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              {enrichment.genres.slice(0, 3).join(' • ')}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{catalog.catalogSize} Works in Catalog</span>
            {enrichment?.spotifyFollowers && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                {formatNumber(enrichment.spotifyFollowers)}
              </span>
            )}
            {enrichment?.monthlyListeners && (
              <span className="flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-primary" />
                {formatNumber(enrichment.monthlyListeners)}/mo
              </span>
            )}
          </div>
          {enrichment?.biography && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {enrichment.biography}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Missing ISWC" value={catalog.missingISWC} variant="warning" />
        <StatCard label="Missing PRO" value={catalog.missingPRO} variant="destructive" />
        <StatCard label="Incomplete" value={catalog.incompleteMetadata} />
        <StatCard label="Pipeline" value={formatCurrency(catalog.pipelineTotal)} variant="success" />
      </div>

      {/* Two Column Layout: Top Tracks/Syncs + Songs Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Tracks and Syncs */}
        <div className="space-y-4">
          {enrichment?.topTracks && enrichment.topTracks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  Top Tracks
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {enrichment.topTracks.slice(0, 3).map((track, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm py-1">
                      <span className="text-foreground truncate flex-1 mr-2">
                        <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                        {track.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${track.popularity}%` }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {enrichment?.recentSyncs && enrichment.recentSyncs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tv className="w-4 h-4 text-primary" />
                  Notable Syncs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {enrichment.recentSyncs.slice(0, 2).map((sync, idx) => (
                    <li key={idx} className="text-sm">
                      <p className="text-foreground font-medium truncate">{sync.title}</p>
                      <p className="text-muted-foreground text-xs truncate">{sync.placement}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {enrichment?.recentPerformances && enrichment.recentPerformances.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Recent Performances
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {enrichment.recentPerformances.slice(0, 2).map((perf, idx) => (
                    <li key={idx} className="text-sm">
                      <p className="text-foreground font-medium truncate">{perf.event}</p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        {perf.date}
                        {perf.location && (
                          <>
                            <span>•</span>
                            <MapPin className="w-2.5 h-2.5" />
                            {perf.location}
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Songs Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 5 Songs Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {catalog.topMissingSongs.length === 0 ? (
              <p className="text-muted-foreground text-sm">All songs have complete registrations!</p>
            ) : (
              <div className="space-y-2">
                {catalog.topMissingSongs.map((song, idx) => (
                  <div 
                    key={song.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate">{song.song_title}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {song.issues.map((issue) => (
                        <Badge 
                          key={issue} 
                          variant="outline"
                          className={`text-xs ${
                            issue.includes('ISWC') ? 'text-amber-600' :
                            issue.includes('PRO') ? 'text-destructive' :
                            'text-orange-500'
                          }`}
                        >
                          {issue.replace('Missing ', '').replace('Incomplete ', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{formatCurrency(catalog.performance)}</p>
            <p className="text-xs text-muted-foreground">Performance</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{formatCurrency(catalog.mechanical)}</p>
            <p className="text-xs text-muted-foreground">Mechanical</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{formatCurrency(catalog.sync)}</p>
            <p className="text-xs text-muted-foreground">Sync</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  variant = 'default' 
}: { 
  icon?: React.ReactNode; 
  label: string; 
  value: number | string;
  variant?: 'default' | 'warning' | 'destructive' | 'success';
}) {
  const colorClass = {
    default: 'text-foreground',
    warning: 'text-amber-500',
    destructive: 'text-destructive',
    success: 'text-primary',
  }[variant];

  return (
    <Card>
      <CardContent className="pt-6 text-center">
        {icon && <div className={`mb-2 ${colorClass}`}>{icon}</div>}
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
