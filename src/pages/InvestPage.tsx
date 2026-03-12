import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/catalog-audit/AnimatedCounter';
import {
  Shuffle, FileSpreadsheet, Users, Ban, Cpu,
  Shield, Zap, Layers, CheckCircle2, XCircle,
  TrendingUp, DollarSign, Target, Building2, Handshake,
  ArrowRight, ArrowLeft, Phone, Mail, Calendar, Globe,
  Music, FileText, BarChart3, UserCheck, Minus,
  Maximize2, Minimize2, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ════════════════════════ SLIDE DATA ════════════════════════ */

const painPoints = [
  { icon: Shuffle, title: 'Rights Scattered', desc: 'Across platforms, drives, and inboxes — no single source of truth.' },
  { icon: FileSpreadsheet, title: 'Manual Tracking', desc: 'Royalties still managed in spreadsheets and guesswork.' },
  { icon: Users, title: 'Creators Left Behind', desc: "Most don't know what they're owed or who owes it." },
  { icon: Ban, title: 'Middlemen Take 10–20%', desc: 'Commissions drain revenue before it reaches creators.' },
  { icon: Cpu, title: 'Legacy Systems', desc: "Built for yesterday's industry — can't scale for today's." },
];

const modules = [
  { icon: BarChart3, name: 'Catalog Valuation', desc: 'AI-powered IP valuation using DCF, multiples & market data.' },
  { icon: FileText, name: 'Contract & Copyright', desc: 'Parse, create and manage agreements with automated workflows.' },
  { icon: Music, name: 'Sync Licensing', desc: 'Searchable catalog with one-click licensing deal management.' },
  { icon: DollarSign, name: 'Royalties Processing', desc: 'Ingest statements, reconcile, and pay — commission-free.' },
  { icon: UserCheck, name: 'Client Portals', desc: 'White-label dashboards for your artists and writers.' },
];

const differentiators = [
  { icon: Ban, label: 'No Commissions EVER' },
  { icon: Zap, label: 'AI-Powered' },
  { icon: Layers, label: 'Unlimited Scale' },
  { icon: Shield, label: 'Modular & Customizable' },
];

const compMatrix = [
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
  { label: 'Tradeshows & Events', pct: 8.7, color: 'bg-electric-lavender/70' },
  { label: 'Community Building', pct: 7.7, color: 'bg-primary/60' },
  { label: 'Content Creation', pct: 5.2, color: 'bg-dusty-gold/70' },
  { label: 'Go-to-Market', pct: 4.4, color: 'bg-electric-lavender/50' },
  { label: 'Contingencies', pct: 0.8, color: 'bg-muted-foreground/60' },
];

const exits = [
  { icon: Building2, title: 'Publishing Admin', desc: 'Kobalt, Songtrust, CD Baby Pro — seeking tech bolt-ons.' },
  { icon: Cpu, title: 'Rights-Tech', desc: 'Utopia Music, JKBX, anotherblock — consolidating the stack.' },
  { icon: Globe, title: 'Distributors / SaaS', desc: 'DistroKid, TuneCore, Stem — expanding into admin.' },
  { icon: Handshake, title: 'Strategic Acquirers', desc: 'Major labels & PE funds chasing rights infrastructure.' },
];

const team = [
  { name: 'Janishia Jones', role: 'CEO', bio: 'Music industry veteran leading vision & strategy.' },
  { name: 'Lawrence Berment', role: 'CTO', bio: 'Full-stack architect powering the ENCORE platform.' },
  { name: 'Monet Little', role: 'Head of Client Success', bio: 'Ensuring every client thrives from onboarding to growth.' },
  { name: 'Kebu Commissiong', role: 'VP Sales', bio: 'Driving revenue through strategic partnerships.' },
];

const advisors = [
  { name: 'Hazel Savage', note: 'Music-AI pioneer, former Spotify.' },
  { name: 'Chris McMurtry', note: 'Music tech investor & advisor.' },
];

/* ════════════════════════ HELPERS ════════════════════════ */

function CellIcon({ val }: { val: boolean | string }) {
  if (val === true) return <CheckCircle2 className="h-[28px] w-[28px] text-success mx-auto" />;
  if (val === false) return <XCircle className="h-[28px] w-[28px] text-muted-foreground/40 mx-auto" />;
  return <Minus className="h-[28px] w-[28px] text-dusty-gold mx-auto" />;
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-accent uppercase tracking-[0.2em] text-dusty-gold" style={{ fontSize: 18 }}>
      {children}
    </span>
  );
}

/* ════════════════════════ INDIVIDUAL SLIDES ════════════════════════ */

function SlideHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-[120px] gap-[40px]">
      <Badge variant="outline" className="border-dusty-gold/40 text-dusty-gold font-accent px-[24px] py-[8px]" style={{ fontSize: 16 }}>
        Pre-Seed Opportunity
      </Badge>
      <h1 className="font-headline leading-[1.05] tracking-tight" style={{ fontSize: 96 }}>
        <span className="bg-gradient-primary bg-clip-text text-transparent">ENCORE</span>
        <br />
        <span className="text-foreground" style={{ fontSize: 72 }}>Rights Management</span>
      </h1>
      <p className="text-muted-foreground max-w-[900px] leading-relaxed" style={{ fontSize: 32 }}>
        Track your rights like you track your hits.
      </p>
      <div className="flex gap-[24px] pt-[16px]">
        <Button variant="fader" className="px-[40px] py-[16px] h-auto" style={{ fontSize: 22 }} asChild>
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-[12px]" style={{ width: 24, height: 24 }} /> Schedule a Call
          </a>
        </Button>
        <Button variant="studio" className="px-[40px] py-[16px] h-auto" style={{ fontSize: 22 }} asChild>
          <Link to="/features">
            View Product <ArrowRight className="ml-[12px]" style={{ width: 24, height: 24 }} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SlideProblem() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[48px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>The Problem</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>The Music Industry Has a Rights Problem</h2>
      </div>
      <div className="grid grid-cols-3 gap-[24px] w-full max-w-[1600px]">
        {painPoints.map((p) => (
          <div key={p.title} className="bg-card border border-border/50 rounded-lg p-[32px] space-y-[12px]">
            <p.icon className="text-primary" style={{ width: 40, height: 40 }} />
            <h3 className="font-headline" style={{ fontSize: 24 }}>{p.title}</h3>
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: 18 }}>{p.desc}</p>
          </div>
        ))}
      </div>
      <blockquote className="max-w-[1100px] text-center border-l-4 border-dusty-gold pl-[32px] py-[12px] italic text-muted-foreground" style={{ fontSize: 24 }}>
        "Every day, someone, somewhere is getting screwed in the music industry."
      </blockquote>
    </div>
  );
}

function SlideSolution() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[48px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Our Solution</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>One Platform. Every Right. Zero Commission.</h2>
      </div>
      <div className="grid grid-cols-5 gap-[20px] w-full max-w-[1700px]">
        {modules.map((m) => (
          <div key={m.name} className="bg-card border border-border/50 rounded-lg p-[28px] space-y-[12px] text-center">
            <div className="h-[56px] w-[56px] rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <m.icon className="text-primary" style={{ width: 28, height: 28 }} />
            </div>
            <h3 className="font-headline" style={{ fontSize: 22 }}>{m.name}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 16 }}>{m.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-[20px]">
        {differentiators.map((d) => (
          <div key={d.label} className="flex items-center gap-[10px] bg-card border border-border rounded-full px-[24px] py-[12px]">
            <d.icon className="text-dusty-gold" style={{ width: 22, height: 22 }} />
            <span className="font-headline" style={{ fontSize: 18 }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideMarket({ active }: { active: boolean }) {
  const stats = [
    { value: 7.8, suffix: 'B', label: 'Global Music Rights Market', year: '2033' },
    { value: 45, suffix: 'B', label: 'Royalty & Rights Mgmt Software', year: '2033' },
    { value: 9.73, suffix: 'B', label: 'Publishing Admin Software', year: '2030' },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[60px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Market Opportunity</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>A Massive & Growing TAM</h2>
      </div>
      <div className="grid grid-cols-3 gap-[60px]">
        {stats.map((s) => (
          <div key={s.label} className="text-center space-y-[16px]">
            <div className="font-headline text-primary" style={{ fontSize: 80 }}>
              $<AnimatedCounter value={s.value} format="number" duration={2200} startAnimation={active} />
              <span className="text-dusty-gold">{s.suffix}</span>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 22 }}>{s.label}</p>
            <Badge variant="outline" className="border-border text-muted-foreground" style={{ fontSize: 14 }}>By {s.year}</Badge>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground/50" style={{ fontSize: 14 }}>
        Sources: Grand View Research, Fortune Business Insights, Straits Research
      </p>
    </div>
  );
}

function SlideCompetitive() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[48px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Competitive Landscape</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>Why ENCORE Wins</h2>
      </div>
      <div className="w-full max-w-[1400px] overflow-hidden rounded-xl border border-border">
        <table className="w-full" style={{ fontSize: 20 }}>
          <thead>
            <tr className="bg-card">
              <th className="text-left p-[20px] font-headline text-foreground" style={{ fontSize: 22 }}>Feature</th>
              <th className="p-[20px] font-headline text-primary" style={{ fontSize: 22 }}>ENCORE</th>
              <th className="p-[20px] font-headline text-muted-foreground" style={{ fontSize: 22 }}>Curve</th>
              <th className="p-[20px] font-headline text-muted-foreground" style={{ fontSize: 22 }}>Songtrust</th>
              <th className="p-[20px] font-headline text-muted-foreground" style={{ fontSize: 22 }}>Mogul</th>
            </tr>
          </thead>
          <tbody>
            {compMatrix.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-card/50'}>
                <td className="p-[16px] text-foreground font-medium">{row.feature}</td>
                <td className="p-[16px] text-center"><CellIcon val={row.encore} /></td>
                <td className="p-[16px] text-center"><CellIcon val={row.curve} /></td>
                <td className="p-[16px] text-center"><CellIcon val={row.songtrust} /></td>
                <td className="p-[16px] text-center"><CellIcon val={row.mogul} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SlideFinancials() {
  const stats = [
    { icon: Target, label: 'Year 1 Net Sales', value: '$480K' },
    { icon: TrendingUp, label: 'Annual Growth', value: '150%+' },
    { icon: DollarSign, label: 'Gross Margin', value: '80%+' },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[60px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Financial Projections</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>Built for Profitable Growth</h2>
      </div>
      <div className="grid grid-cols-3 gap-[40px] w-full max-w-[1400px]">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-[48px] text-center space-y-[16px]">
            <s.icon className="text-dusty-gold mx-auto" style={{ width: 48, height: 48 }} />
            <div className="font-headline text-primary" style={{ fontSize: 52 }}>{s.value}</div>
            <p className="text-muted-foreground" style={{ fontSize: 22 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="w-full max-w-[900px] space-y-[16px]">
        <p className="text-muted-foreground text-center" style={{ fontSize: 18 }}>Revenue Trajectory</p>
        {['Year 1', 'Year 2', 'Year 3'].map((yr, i) => {
          const widths = ['20%', '55%', '100%'];
          return (
            <div key={yr} className="flex items-center gap-[20px]">
              <span className="w-[80px] text-muted-foreground text-right" style={{ fontSize: 18 }}>{yr}</span>
              <div className="flex-1 h-[20px] rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: widths[i] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideAsk({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[48px]">
      <div className="text-center space-y-[16px]">
        <SlideLabel>The Ask</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 72 }}>
          <span className="bg-gradient-primary bg-clip-text text-transparent">$350K</span>{' '}
          Pre-Seed SAFE
        </h2>
        <p className="text-muted-foreground max-w-[700px] mx-auto" style={{ fontSize: 24 }}>
          Fueling product, partnerships, and market entry.
        </p>
      </div>
      <div className="w-full max-w-[1000px] space-y-[16px]">
        {funds.map((f) => (
          <div key={f.label} className="space-y-[4px]">
            <div className="flex justify-between" style={{ fontSize: 18 }}>
              <span className="text-foreground">{f.label}</span>
              <span className="text-muted-foreground font-headline">{f.pct}%</span>
            </div>
            <div className="h-[14px] rounded-full bg-secondary overflow-hidden">
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
  );
}

function SlideExits() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[60px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Exit Opportunities</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>Multiple Paths to Liquidity</h2>
      </div>
      <div className="grid grid-cols-4 gap-[32px] w-full max-w-[1600px]">
        {exits.map((e) => (
          <div key={e.title} className="bg-card border border-border/50 rounded-xl p-[40px] space-y-[16px] text-center">
            <e.icon className="text-dusty-gold mx-auto" style={{ width: 48, height: 48 }} />
            <h3 className="font-headline" style={{ fontSize: 26 }}>{e.title}</h3>
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: 18 }}>{e.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideTeam() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-[100px] gap-[48px]">
      <div className="text-center space-y-[12px]">
        <SlideLabel>Leadership</SlideLabel>
        <h2 className="font-headline" style={{ fontSize: 56 }}>The Team Behind ENCORE</h2>
      </div>
      <div className="grid grid-cols-4 gap-[32px] w-full max-w-[1500px]">
        {team.map((t) => (
          <div key={t.name} className="bg-card border border-border/50 rounded-xl p-[36px] text-center space-y-[16px]">
            <div className="mx-auto rounded-full bg-primary/10 flex items-center justify-center font-headline text-primary"
              style={{ width: 80, height: 80, fontSize: 32 }}>
              {t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="font-headline" style={{ fontSize: 24 }}>{t.name}</h3>
            <Badge variant="outline" className="border-dusty-gold/30 text-dusty-gold" style={{ fontSize: 14 }}>{t.role}</Badge>
            <p className="text-muted-foreground" style={{ fontSize: 17 }}>{t.bio}</p>
          </div>
        ))}
      </div>
      <div className="space-y-[12px] text-center">
        <h3 className="font-headline text-muted-foreground" style={{ fontSize: 22 }}>Advisory Board</h3>
        <div className="flex gap-[48px] justify-center">
          {advisors.map((a) => (
            <div key={a.name}>
              <p className="font-headline text-foreground" style={{ fontSize: 20 }}>{a.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: 16 }}>{a.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideCTA() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-[120px] gap-[40px]">
      <SlideLabel>Let's Talk</SlideLabel>
      <h2 className="font-headline bg-gradient-primary bg-clip-text text-transparent" style={{ fontSize: 80 }}>
        Innovation Starts Here
      </h2>
      <p className="text-muted-foreground max-w-[800px]" style={{ fontSize: 28 }}>
        Join us in building the future of music rights management — where every creator gets what they're owed.
      </p>
      <div className="flex gap-[24px] pt-[8px]">
        <Button variant="fader" className="px-[40px] py-[16px] h-auto" style={{ fontSize: 22 }} asChild>
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-[12px]" style={{ width: 24, height: 24 }} /> Schedule a Demo
          </a>
        </Button>
        <Button variant="outline" className="px-[40px] py-[16px] h-auto" style={{ fontSize: 22 }} asChild>
          <a href="mailto:invest@encorights.com">
            <Mail className="mr-[12px]" style={{ width: 24, height: 24 }} /> invest@encorights.com
          </a>
        </Button>
      </div>
      <div className="flex items-center gap-[32px] text-muted-foreground pt-[16px]" style={{ fontSize: 20 }}>
        <a href="tel:+1234567890" className="flex items-center gap-[10px] hover:text-foreground transition-colors">
          <Phone style={{ width: 20, height: 20 }} /> Contact Us
        </a>
        <span className="text-border">|</span>
        <a href="https://encorights.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[10px] hover:text-foreground transition-colors">
          <Globe style={{ width: 20, height: 20 }} /> encorights.com
        </a>
      </div>
    </div>
  );
}

/* ════════════════════════ SLIDE DECK ENGINE ════════════════════════ */

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function InvestPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 10;

  // Compute scale
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    setScale(Math.min(w / SLIDE_W, h / SLIDE_H));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  useEffect(() => {
    // re-calc when fullscreen changes
    setTimeout(updateScale, 100);
  }, [isFullscreen, updateScale]);

  const go = useCallback((idx: number) => {
    if (idx < 0 || idx >= totalSlides || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, totalSlides]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen?.();
      if (e.key === 'f' || e.key === 'F5') {
        e.preventDefault();
        containerRef.current?.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen]);

  // Fullscreen change
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
      case 0: return <SlideHero />;
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
      style={{ cursor: isFullscreen ? 'none' : 'default' }}
    >
      {/* Scaled slide area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {/* ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 rounded-full bg-primary/8 blur-[200px]" style={{ width: 800, height: 800 }} />
          </div>

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {renderSlide(current)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        {/* Nav arrows */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prev} disabled={current === 0}
            className="h-10 w-10 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={next} disabled={current === totalSlides - 1}
            className="h-10 w-10 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-headline">
            {current + 1} / {totalSlides}
          </span>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}
            className="h-10 w-10 text-muted-foreground hover:text-foreground">
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-secondary z-50">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((current + 1) / totalSlides) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
