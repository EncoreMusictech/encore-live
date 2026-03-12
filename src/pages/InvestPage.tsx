import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/catalog-audit/AnimatedCounter';
import {
  Shuffle, FileSpreadsheet, Users, Ban, Cpu,
  Shield, Zap, Layers, CheckCircle2, XCircle,
  TrendingUp, DollarSign, Target, Building2, Handshake,
  ArrowRight, Phone, Mail, Calendar, Globe,
  Music, FileText, BarChart3, UserCheck, Minus,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, Play, X,
} from 'lucide-react';

/* ════════ DATA ════════ */

const painPoints = [
  { icon: Shuffle, title: 'Rights Scattered', desc: 'No single source of truth across platforms.' },
  { icon: FileSpreadsheet, title: 'Manual Tracking', desc: 'Royalties managed in spreadsheets.' },
  { icon: Users, title: 'Creators Left Behind', desc: "Don't know what they're owed." },
  { icon: Ban, title: 'Middlemen Take 10–20%', desc: 'Commissions drain creator revenue.' },
  { icon: Cpu, title: 'Legacy Systems', desc: "Can't scale for today's industry." },
];

const modules = [
  { icon: BarChart3, name: 'Catalog Valuation', desc: 'AI-powered IP valuation.' },
  { icon: FileText, name: 'Contract & Copyright', desc: 'Automated agreement workflows.' },
  { icon: Music, name: 'Sync Licensing', desc: 'One-click licensing deals.' },
  { icon: DollarSign, name: 'Royalties', desc: 'Commission-free processing.' },
  { icon: UserCheck, name: 'Client Portals', desc: 'White-label dashboards.' },
];

const differentiators = [
  { icon: Ban, label: 'No Commissions' },
  { icon: Zap, label: 'AI-Powered' },
  { icon: Layers, label: 'Unlimited Scale' },
  { icon: Shield, label: 'Modular' },
];

const compMatrix: { feature: string; encore: boolean | string; curve: boolean | string; songtrust: boolean | string; mogul: boolean | string }[] = [
  { feature: 'Commission-Free', encore: true, curve: false, songtrust: false, mogul: false },
  { feature: 'Modular Pricing', encore: true, curve: false, songtrust: false, mogul: false },
  { feature: 'Catalog Valuation', encore: true, curve: false, songtrust: false, mogul: false },
  { feature: 'Contract Mgmt', encore: true, curve: 'Partial', songtrust: false, mogul: 'Partial' },
  { feature: 'Royalty Processing', encore: true, curve: true, songtrust: true, mogul: true },
  { feature: 'Client Portals', encore: true, curve: false, songtrust: false, mogul: false },
  { feature: 'White-Label', encore: true, curve: false, songtrust: false, mogul: false },
  { feature: 'AI Features', encore: true, curve: false, songtrust: false, mogul: false },
];

const funds = [
  { label: 'Consultants', pct: 46.2, color: 'bg-primary' },
  { label: 'IT / Development', pct: 26.2, color: 'bg-dusty-gold' },
  { label: 'Tradeshows', pct: 8.7, color: 'bg-electric-lavender/70' },
  { label: 'Community', pct: 7.7, color: 'bg-primary/60' },
  { label: 'Content', pct: 5.2, color: 'bg-dusty-gold/70' },
  { label: 'GTM', pct: 4.4, color: 'bg-electric-lavender/50' },
  { label: 'Contingencies', pct: 0.8, color: 'bg-muted-foreground/60' },
];

const exits = [
  { icon: Building2, title: 'Publishing Admin', desc: 'Kobalt, Songtrust, CD Baby Pro.' },
  { icon: Cpu, title: 'Rights-Tech', desc: 'Utopia Music, JKBX, anotherblock.' },
  { icon: Globe, title: 'Distributors', desc: 'DistroKid, TuneCore, Stem.' },
  { icon: Handshake, title: 'Strategic', desc: 'Labels & PE funds.' },
];

const team = [
  { name: 'Janishia Jones', role: 'CEO', bio: 'Vision & strategy.' },
  { name: 'Lawrence Berment', role: 'CTO', bio: 'Platform architect.' },
  { name: 'Monet Little', role: 'Head of CS', bio: 'Client success.' },
  { name: 'Kebu Commissiong', role: 'VP Sales', bio: 'Partnerships & revenue.' },
];

const advisors = [
  { name: 'Hazel Savage', note: 'Music-AI, ex-Spotify.' },
  { name: 'Chris McMurtry', note: 'Music tech advisor.' },
];

/* ════════ HELPERS ════════ */

function CellIcon({ val }: { val: boolean | string }) {
  if (val === true) return <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success mx-auto" />;
  if (val === false) return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/40 mx-auto" />;
  return <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-dusty-gold mx-auto" />;
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-accent uppercase tracking-widest text-dusty-gold text-[10px] sm:text-xs">{children}</span>;
}

/** Wrapper ensuring each slide fills the viewport with centered content + scroll safety */
function Slide({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 py-8 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

/* ════════ SLIDES ════════ */

function SlideHero({ onPlayDemo }: { onPlayDemo: () => void }) {
  return (
    <Slide>
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 max-w-3xl">
        <Badge variant="outline" className="border-dusty-gold/40 text-dusty-gold font-accent text-[10px] sm:text-xs px-3 py-1">
          Pre-Seed Opportunity
        </Badge>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
          <span className="bg-gradient-primary bg-clip-text text-transparent">ENCORE</span>
          <br />
          <span className="text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Rights Management</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-xl leading-relaxed">
          Track your rights like you track your hits.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button variant="fader" size="lg" asChild>
            <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" /> Schedule a Call
            </a>
          </Button>
          <Button variant="vinyl" size="lg" onClick={onPlayDemo}>
            <Play className="mr-2 h-4 w-4" /> View Demo
          </Button>
          <Button variant="studio" size="lg" asChild>
            <Link to="/features">
              View Product <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Slide>
  );
}

function SlideProblem() {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl">
        <div className="text-center space-y-2">
          <SlideLabel>The Problem</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">The Music Industry Has a Rights Problem</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
          {painPoints.map((p) => (
            <div key={p.title} className="bg-card border border-border/50 rounded-lg p-3 sm:p-5 space-y-2">
              <p.icon className="text-primary h-5 w-5 sm:h-7 sm:w-7" />
              <h3 className="font-headline text-sm sm:text-base">{p.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <blockquote className="text-center border-l-4 border-dusty-gold pl-4 py-2 italic text-muted-foreground text-sm sm:text-base max-w-2xl">
          "Every day, someone, somewhere is getting screwed in the music industry."
        </blockquote>
      </div>
    </Slide>
  );
}

function SlideSolution() {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl">
        <div className="text-center space-y-2">
          <SlideLabel>Our Solution</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">One Platform. Every Right. Zero Commission.</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {modules.map((m) => (
            <div key={m.name} className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 space-y-2 text-center">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <m.icon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="font-headline text-xs sm:text-sm">{m.name}</h3>
              <p className="text-muted-foreground text-[10px] sm:text-xs">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {differentiators.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
              <d.icon className="text-dusty-gold h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-headline text-xs sm:text-sm">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

function SlideMarket({ active }: { active: boolean }) {
  const stats = [
    { value: 7.8, suffix: 'B', label: 'Global Music Rights', year: '2033' },
    { value: 45, suffix: 'B', label: 'Royalty & Rights Mgmt', year: '2033' },
    { value: 9.73, suffix: 'B', label: 'Publishing Admin', year: '2030' },
  ];
  return (
    <Slide>
      <div className="flex flex-col items-center gap-6 sm:gap-10 max-w-4xl">
        <div className="text-center space-y-2">
          <SlideLabel>Market Opportunity</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">A Massive & Growing TAM</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1 sm:space-y-2">
              <div className="font-headline text-primary text-2xl sm:text-4xl md:text-5xl">
                $<AnimatedCounter value={s.value} format="number" duration={2200} startAnimation={active} />
                <span className="text-dusty-gold">{s.suffix}</span>
              </div>
              <p className="text-muted-foreground text-[10px] sm:text-sm">{s.label}</p>
              <Badge variant="outline" className="text-[9px] sm:text-xs border-border text-muted-foreground">By {s.year}</Badge>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground/50 text-[9px] sm:text-xs">
          Sources: Grand View Research, Fortune Business Insights, Straits Research
        </p>
      </div>
    </Slide>
  );
}

function SlideCompetitive() {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-3xl">
        <div className="text-center space-y-2">
          <SlideLabel>Competitive Landscape</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">Why ENCORE Wins</h2>
        </div>
        <div className="w-full overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-card">
                <th className="text-left p-2 sm:p-3 font-headline text-foreground">Feature</th>
                <th className="p-2 sm:p-3 font-headline text-primary">ENCORE</th>
                <th className="p-2 sm:p-3 font-headline text-muted-foreground">Curve</th>
                <th className="p-2 sm:p-3 font-headline text-muted-foreground">Songtrust</th>
                <th className="p-2 sm:p-3 font-headline text-muted-foreground">Mogul</th>
              </tr>
            </thead>
            <tbody>
              {compMatrix.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-card/50'}>
                  <td className="p-2 sm:p-3 text-foreground font-medium">{row.feature}</td>
                  <td className="p-2 sm:p-3 text-center"><CellIcon val={row.encore} /></td>
                  <td className="p-2 sm:p-3 text-center"><CellIcon val={row.curve} /></td>
                  <td className="p-2 sm:p-3 text-center"><CellIcon val={row.songtrust} /></td>
                  <td className="p-2 sm:p-3 text-center"><CellIcon val={row.mogul} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Slide>
  );
}

function SlideFinancials() {
  const stats = [
    { icon: Target, label: 'Year 1 Net Sales', value: '$480K' },
    { icon: TrendingUp, label: 'Annual Growth', value: '150%+' },
    { icon: DollarSign, label: 'Gross Margin', value: '80%+' },
  ];
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-3xl">
        <div className="text-center space-y-2">
          <SlideLabel>Financial Projections</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">Built for Profitable Growth</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 text-center space-y-2">
              <s.icon className="text-dusty-gold mx-auto h-6 w-6 sm:h-8 sm:w-8" />
              <div className="font-headline text-primary text-xl sm:text-3xl">{s.value}</div>
              <p className="text-muted-foreground text-[10px] sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md space-y-2">
          <p className="text-muted-foreground text-center text-xs sm:text-sm">Revenue Trajectory</p>
          {['Year 1', 'Year 2', 'Year 3'].map((yr, i) => {
            const widths = ['20%', '55%', '100%'];
            return (
              <div key={yr} className="flex items-center gap-3">
                <span className="w-12 text-[10px] sm:text-xs text-muted-foreground text-right">{yr}</span>
                <div className="flex-1 h-2 sm:h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: widths[i] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Slide>
  );
}

function SlideAsk({ active }: { active: boolean }) {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-2xl">
        <div className="text-center space-y-2">
          <SlideLabel>The Ask</SlideLabel>
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl">
            <span className="bg-gradient-primary bg-clip-text text-transparent">$350K</span>{' '}
            Pre-Seed SAFE
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Fueling product, partnerships, and market entry.
          </p>
        </div>
        <div className="w-full space-y-2 sm:space-y-3">
          {funds.map((f) => (
            <div key={f.label} className="space-y-0.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-foreground">{f.label}</span>
                <span className="text-muted-foreground font-headline">{f.pct}%</span>
              </div>
              <div className="h-2 sm:h-2.5 rounded-full bg-secondary overflow-hidden">
                {active && (
                  <motion.div
                    className={`h-full rounded-full ${f.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

function SlideExits() {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-3xl">
        <div className="text-center space-y-2">
          <SlideLabel>Exit Opportunities</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">Multiple Paths to Liquidity</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 w-full">
          {exits.map((e) => (
            <div key={e.title} className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 space-y-2 text-center">
              <e.icon className="text-dusty-gold mx-auto h-6 w-6 sm:h-8 sm:w-8" />
              <h3 className="font-headline text-sm sm:text-base">{e.title}</h3>
              <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

function SlideTeam() {
  return (
    <Slide>
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-3xl">
        <div className="text-center space-y-2">
          <SlideLabel>Leadership</SlideLabel>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl">The Team Behind ENCORE</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 w-full">
          {team.map((t) => (
            <div key={t.name} className="bg-card border border-border/50 rounded-xl p-3 sm:p-5 text-center space-y-2">
              <div className="mx-auto rounded-full bg-primary/10 flex items-center justify-center font-headline text-primary h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl">
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="font-headline text-xs sm:text-sm">{t.name}</h3>
              <Badge variant="outline" className="text-[9px] sm:text-xs border-dusty-gold/30 text-dusty-gold">{t.role}</Badge>
              <p className="text-muted-foreground text-[10px] sm:text-xs">{t.bio}</p>
            </div>
          ))}
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-headline text-muted-foreground text-sm sm:text-base">Advisory Board</h3>
          <div className="flex gap-6 justify-center">
            {advisors.map((a) => (
              <div key={a.name}>
                <p className="font-headline text-foreground text-xs sm:text-sm">{a.name}</p>
                <p className="text-muted-foreground text-[10px] sm:text-xs">{a.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  );
}

function SlideCTA() {
  return (
    <Slide>
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 max-w-2xl">
        <SlideLabel>Let's Talk</SlideLabel>
        <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl bg-gradient-primary bg-clip-text text-transparent">
          Innovation Starts Here
        </h2>
        <p className="text-muted-foreground text-sm sm:text-lg max-w-xl">
          Join us in building the future of music rights management.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Button variant="fader" size="lg" asChild>
            <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" /> Schedule a Demo
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="mailto:info@encoremusic.tech">
              <Mail className="mr-2 h-4 w-4" /> info@encoremusic.tech
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2">
          <a href="tel:+1234567890" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Phone className="h-3.5 w-3.5" /> Contact Us
          </a>
          <span className="text-border">|</span>
          <a href="https://encorights.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Globe className="h-3.5 w-3.5" /> encorights.com
          </a>
        </div>
      </div>
    </Slide>
  );
}

/* ════════ DECK ENGINE ════════ */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

export default function InvestPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 10;

  const go = useCallback((idx: number) => {
    if (idx < 0 || idx >= totalSlides || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, totalSlides]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showVideo) { if (e.key === 'Escape') setShowVideo(false); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen?.();
      if (e.key === 'f' || e.key === 'F5') { e.preventDefault(); containerRef.current?.requestFullscreen?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen, showVideo]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) document.exitFullscreen?.();
    else containerRef.current?.requestFullscreen?.();
  };

  const renderSlide = (idx: number) => {
    switch (idx) {
      case 0: return <SlideHero onPlayDemo={() => setShowVideo(true)} />;
      case 1: return <SlideProblem />;
      case 2: return <SlideSolution />;
      case 3: return <SlideMarket active={current === 3} />;
      case 4: return <SlideCompetitive />;
      case 5: return <SlideFinancials />;
      case 6: return <SlideAsk active={current === 6} />;
      case 7: return <SlideExits />;
      case 8: return <SlideTeam />;
      case 9: return <SlideCTA />;
      default: return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-background overflow-hidden relative select-none"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      {/* Slide content */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {renderSlide(current)}
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prev} disabled={current === 0}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={next} disabled={current === totalSlides - 1}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-headline">
            {current + 1}/{totalSlides}
          </span>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}
            className="h-8 w-8 text-muted-foreground hover:text-foreground">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary z-50">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((current + 1) / totalSlides) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideo(false)}
                className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
              <video
                src="/videos/ENCORE_Demo_Video.mp4"
                controls
                autoPlay
                className="w-full h-full rounded-xl border border-border shadow-elegant"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
