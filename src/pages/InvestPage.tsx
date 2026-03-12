import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/catalog-audit/AnimatedCounter';
import { Progress } from '@/components/ui/progress';
import {
  Shuffle, FileSpreadsheet, Users, Ban, Cpu,
  Shield, Zap, Layers, Globe, CheckCircle2, XCircle,
  TrendingUp, DollarSign, Target, Building2, Handshake,
  ArrowRight, Phone, Mail, Calendar, ChevronDown,
  Music, Scale, FileText, BarChart3, UserCheck,
  Minus
} from 'lucide-react';

/* ─── helpers ─── */
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-accent text-xs tracking-widest text-dusty-gold uppercase mb-2 block">
      {children}
    </span>
  );
}

/* ─── data ─── */
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
  { label: 'Tradeshows & Events', pct: 8.7, color: 'bg-electric-lavender/70' },
  { label: 'Community Building', pct: 7.7, color: 'bg-primary/60' },
  { label: 'Content Creation', pct: 5.2, color: 'bg-dusty-gold/70' },
  { label: 'Go-to-Market', pct: 4.4, color: 'bg-electric-lavender/50' },
  { label: 'Contingencies', pct: 0.8, color: 'bg-muted-foreground' },
];

const exits = [
  { icon: Building2, title: 'Publishing Admin Co\'s', desc: 'Kobalt, Songtrust, CD Baby Pro — seeking tech bolt-ons.' },
  { icon: Cpu, title: 'Rights-Tech Platforms', desc: 'Utopia Music, JKBX, anotherblock — consolidating the stack.' },
  { icon: Globe, title: 'Distributors / SaaS', desc: 'DistroKid, TuneCore, Stem — expanding into admin tools.' },
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

/* ─── check / x renderer ─── */
function CellIcon({ val }: { val: boolean | string }) {
  if (val === true) return <CheckCircle2 className="h-5 w-5 text-success mx-auto" />;
  if (val === false) return <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <Minus className="h-5 w-5 text-dusty-gold mx-auto" />;
}

/* ═══════════════════════════════════════════ PAGE ═══════════════════════════════════════════ */

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body overflow-x-hidden">

      {/* ── 1. HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        {/* glow bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[160px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-dusty-gold/8 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-4xl text-center space-y-8"
        >
          <Badge variant="outline" className="border-dusty-gold/40 text-dusty-gold font-accent text-xs px-4 py-1">
            Pre-Seed Opportunity
          </Badge>

          <h1 className="font-headline text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">ENCORE</span>
            <br />
            <span className="text-foreground">Rights Management</span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your rights like you track your hits.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" variant="fader" className="text-base px-8" asChild>
              <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-5 w-5" /> Schedule a Call
              </a>
            </Button>
            <Button size="lg" variant="studio" className="text-base px-8" asChild>
              <Link to="/features">
                View Product <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* ── 2. THE PROBLEM ── */}
      <Section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">The Music Industry Has a Rights Problem</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <Card key={p.title} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <p.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-headline text-lg">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <blockquote className="max-w-3xl mx-auto text-center border-l-4 border-dusty-gold pl-6 py-4 italic text-lg text-muted-foreground">
            "Every day, someone, somewhere is getting screwed in the music industry."
          </blockquote>
        </div>
      </Section>

      {/* ── 3. OUR SOLUTION ── */}
      <Section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <SectionLabel>Our Solution</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">One Platform. Every Right. Zero Commission.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <Card key={m.name} className="bg-card border-border/50 group hover:shadow-elegant transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-headline text-lg">{m.name}</h3>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {differentiators.map((d) => (
              <Badge key={d.label} variant="secondary" className="text-sm py-2 px-4 gap-2 bg-card border border-border">
                <d.icon className="h-4 w-4 text-dusty-gold" />
                {d.label}
              </Badge>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 4. MARKET OPPORTUNITY ── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <SectionLabel>Market Opportunity</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">A Massive & Growing TAM</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { value: 7.8, suffix: 'B', label: 'Global Music Rights Market', year: '2033' },
              { value: 45, suffix: 'B', label: 'Royalty & Rights Mgmt Software', year: '2033' },
              { value: 9.73, suffix: 'B', label: 'Publishing Admin Software', year: '2030' },
            ].map((s) => {
              const ref = useRef<HTMLDivElement>(null);
              const inView = useInView(ref, { once: true });
              return (
                <div key={s.label} ref={ref} className="text-center space-y-2">
                  <div className="font-headline text-4xl sm:text-5xl text-primary">
                    $<AnimatedCounter value={s.value} format="number" duration={2200} startAnimation={inView} />
                    <span className="text-dusty-gold">{s.suffix}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">By {s.year}</Badge>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-center text-muted-foreground/60">
            Sources: Grand View Research, Fortune Business Insights, Straits Research
          </p>
        </div>
      </Section>

      {/* ── 5. COMPETITIVE LANDSCAPE ── */}
      <Section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionLabel>Competitive Landscape</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">Why ENCORE Wins</h2>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-4 font-headline text-foreground">Feature</th>
                  <th className="p-4 font-headline text-primary">ENCORE</th>
                  <th className="p-4 font-headline text-muted-foreground">Curve</th>
                  <th className="p-4 font-headline text-muted-foreground">Songtrust</th>
                  <th className="p-4 font-headline text-muted-foreground">Mogul</th>
                </tr>
              </thead>
              <tbody>
                {compMatrix.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-card/50'}>
                    <td className="p-4 text-foreground font-medium">{row.feature}</td>
                    <td className="p-4 text-center"><CellIcon val={row.encore} /></td>
                    <td className="p-4 text-center"><CellIcon val={row.curve} /></td>
                    <td className="p-4 text-center"><CellIcon val={row.songtrust} /></td>
                    <td className="p-4 text-center"><CellIcon val={row.mogul} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── 6. FINANCIAL PROJECTIONS ── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionLabel>Financial Projections</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">Built for Profitable Growth</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Target, label: 'Year 1 Net Sales Target', value: '$480K' },
              { icon: TrendingUp, label: 'Annual Growth Rate', value: '150%+' },
              { icon: DollarSign, label: 'Gross Margin', value: '80%+' },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border/50 text-center">
                <CardContent className="p-8 space-y-3">
                  <s.icon className="h-8 w-8 text-dusty-gold mx-auto" />
                  <div className="font-headline text-3xl text-primary">{s.value}</div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* simple revenue trajectory */}
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">Revenue Trajectory (Indexed)</p>
            {['Year 1', 'Year 2', 'Year 3'].map((yr, i) => {
              const pcts = [20, 55, 100];
              return (
                <div key={yr} className="flex items-center gap-4">
                  <span className="w-16 text-xs text-muted-foreground text-right">{yr}</span>
                  <div className="flex-1">
                    <Progress value={pcts[i]} className="h-3 bg-secondary" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 7. THE ASK ── */}
      <Section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-4">
            <SectionLabel>The Ask</SectionLabel>
            <h2 className="font-headline text-4xl sm:text-5xl">
              <span className="bg-gradient-primary bg-clip-text text-transparent">$350K</span>{' '}
              Pre-Seed SAFE
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Fueling product, partnerships, and market entry to capture the rights-tech opportunity.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {funds.map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{f.label}</span>
                  <span className="text-muted-foreground font-headline">{f.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${f.color}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${f.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 8. EXIT OPPORTUNITIES ── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionLabel>Exit Opportunities</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">Multiple Paths to Liquidity</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {exits.map((e) => (
              <Card key={e.title} className="bg-card border-border/50 hover:border-dusty-gold/40 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <e.icon className="h-7 w-7 text-dusty-gold" />
                  <h3 className="font-headline text-base">{e.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 9. TEAM ── */}
      <Section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionLabel>Leadership</SectionLabel>
            <h2 className="font-headline text-3xl sm:text-4xl">The Team Behind ENCORE</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t) => (
              <Card key={t.name} className="bg-card border-border/50 text-center">
                <CardContent className="p-6 space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center font-headline text-xl text-primary">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-headline text-base">{t.name}</h3>
                  <Badge variant="outline" className="text-xs border-dusty-gold/30 text-dusty-gold">{t.role}</Badge>
                  <p className="text-xs text-muted-foreground">{t.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* advisors */}
          <div className="text-center space-y-4">
            <h3 className="font-headline text-lg text-muted-foreground">Advisory Board</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {advisors.map((a) => (
                <div key={a.name} className="text-center">
                  <p className="font-headline text-sm text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 10. CONTACT CTA ── */}
      <Section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <SectionLabel>Let's Talk</SectionLabel>
          <h2 className="font-headline text-4xl sm:text-5xl bg-gradient-primary bg-clip-text text-transparent">
            Innovation Starts Here
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join us in building the future of music rights management — where every creator gets what they're owed.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" variant="fader" className="text-base px-8" asChild>
              <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-5 w-5" /> Schedule a Demo
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="mailto:invest@encorights.com">
                <Mail className="mr-2 h-5 w-5" /> invest@encorights.com
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" /> Contact Us
            </a>
            <span className="text-border">|</span>
            <a href="https://encorights.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Globe className="h-4 w-4" /> encorights.com
            </a>
          </div>
        </div>
      </Section>

      {/* footer spacer */}
      <div className="h-8" />
    </div>
  );
}
