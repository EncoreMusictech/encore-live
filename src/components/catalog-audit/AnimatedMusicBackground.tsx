import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music, Music2, Music3, Music4, DollarSign, Disc, Headphones, Mic2, Radio } from 'lucide-react';

interface FloatingIconProps {
  icon: React.ElementType;
  delay: number;
  duration: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

function FloatingIcon({ icon: Icon, delay, duration, x, y, size, opacity }: FloatingIconProps) {
  return (
    <motion.div
      className="absolute text-primary/20 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ 
        opacity: [0, opacity, opacity, 0],
        scale: [0.5, 1, 1, 0.8],
        rotate: [-10, 5, -5, 10],
        y: [0, -30, -60, -100],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Icon size={size} />
    </motion.div>
  );
}

function PulsingNote({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary/30 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.5, 0],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function WaveformBar({ index, height }: { index: number; height: number }) {
  return (
    <motion.div
      className="w-1 bg-primary/20 rounded-full"
      initial={{ height: 10 }}
      animate={{ height: [10, height, 10] }}
      transition={{
        duration: 1.2,
        delay: index * 0.1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function AnimatedMusicBackground() {
  const icons = useMemo(() => [
    { icon: Music, x: 5, y: 15, delay: 0, duration: 8, size: 24, opacity: 0.15 },
    { icon: Music2, x: 15, y: 70, delay: 1.5, duration: 10, size: 32, opacity: 0.1 },
    { icon: DollarSign, x: 85, y: 20, delay: 0.5, duration: 9, size: 28, opacity: 0.12 },
    { icon: Music3, x: 75, y: 75, delay: 2, duration: 11, size: 20, opacity: 0.15 },
    { icon: DollarSign, x: 10, y: 45, delay: 3, duration: 8, size: 24, opacity: 0.1 },
    { icon: Music4, x: 90, y: 50, delay: 1, duration: 10, size: 30, opacity: 0.12 },
    { icon: Disc, x: 25, y: 85, delay: 2.5, duration: 9, size: 26, opacity: 0.1 },
    { icon: Headphones, x: 70, y: 10, delay: 0.8, duration: 11, size: 22, opacity: 0.15 },
    { icon: Mic2, x: 50, y: 90, delay: 4, duration: 10, size: 24, opacity: 0.1 },
    { icon: Radio, x: 35, y: 5, delay: 1.2, duration: 9, size: 20, opacity: 0.12 },
    { icon: DollarSign, x: 60, y: 80, delay: 3.5, duration: 8, size: 26, opacity: 0.15 },
    { icon: Music, x: 95, y: 35, delay: 2.2, duration: 10, size: 22, opacity: 0.1 },
  ], []);

  const pulsingNotes = useMemo(() => [
    { x: 20, y: 30, delay: 0 },
    { x: 80, y: 40, delay: 1 },
    { x: 40, y: 70, delay: 2 },
    { x: 60, y: 20, delay: 1.5 },
    { x: 15, y: 60, delay: 2.5 },
    { x: 85, y: 70, delay: 0.5 },
    { x: 30, y: 15, delay: 3 },
    { x: 70, y: 55, delay: 1.8 },
  ], []);

  const waveformHeights = useMemo(() => 
    Array.from({ length: 40 }, () => Math.random() * 40 + 15), 
  []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Floating music icons */}
      {icons.map((props, index) => (
        <FloatingIcon key={index} {...props} />
      ))}

      {/* Pulsing dots */}
      {pulsingNotes.map((props, index) => (
        <PulsingNote key={`pulse-${index}`} {...props} />
      ))}

      {/* Bottom waveform visualization */}
      <div className="absolute bottom-0 left-0 right-0 h-20 flex items-end justify-center gap-1 px-4 opacity-50">
        {waveformHeights.map((height, index) => (
          <WaveformBar key={index} index={index} height={height} />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        initial={{ x: '-50%', y: '-50%' }}
        animate={{ 
          x: ['-50%', '-30%', '-50%'],
          y: ['-50%', '-30%', '-50%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ left: '20%', top: '20%' }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-accent/5 blur-3xl"
        initial={{ x: '50%', y: '50%' }}
        animate={{ 
          x: ['50%', '30%', '50%'],
          y: ['50%', '70%', '50%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ right: '10%', bottom: '10%' }}
      />

      {/* Vinyl record animation */}
      <motion.div
        className="absolute -right-20 -bottom-20 w-64 h-64 opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full border-8 border-primary/30 relative">
          <div className="absolute inset-8 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-16 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-[45%] rounded-full bg-primary/30" />
        </div>
      </motion.div>

      {/* Second vinyl (top left) */}
      <motion.div
        className="absolute -left-16 -top-16 w-48 h-48 opacity-5"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full border-8 border-primary/30 relative">
          <div className="absolute inset-6 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-12 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-[45%] rounded-full bg-primary/30" />
        </div>
      </motion.div>

      {/* Flowing dollar signs for royalties theme */}
      <motion.div
        className="absolute left-1/4 top-1/3"
        animate={{ 
          y: [0, -200],
          opacity: [0, 0.15, 0.15, 0],
          scale: [0.8, 1, 1.1, 0.9],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <DollarSign className="w-16 h-16 text-primary/20" />
      </motion.div>
      <motion.div
        className="absolute right-1/3 top-1/2"
        animate={{ 
          y: [0, -180],
          opacity: [0, 0.12, 0.12, 0],
          scale: [0.8, 1, 1.1, 0.9],
        }}
        transition={{ duration: 15, delay: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <DollarSign className="w-12 h-12 text-primary/20" />
      </motion.div>
    </div>
  );
}
