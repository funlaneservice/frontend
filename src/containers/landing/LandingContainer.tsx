'use client';

import { useEffect, useState } from 'react';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { CTASection } from '@/components/landing/CTASection';
import { NavBar } from '@/components/landing/NavBar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { Footer } from '@/components/landing/Footer';
import { StatsSection } from '@/components/landing/StatsSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { PortalSection } from '@/components/landing/PortalSection';
import { TrustMarque } from '@/components/landing/TrustMarque';

type Theme = 'dark' | 'light';

export function LandingContainer() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('funlane-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('funlane-theme', next);
      return next;
    });
  }

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white text-ink dark:bg-[#070D1A] dark:text-white overflow-x-hidden antialiased transition-colors duration-300">
        <NavBar isDark={isDark} menuOpen={menuOpen} scrolled={scrolled} setMenuOpen={setMenuOpen} toggleTheme={toggleTheme} />

        <HeroSection isDark={isDark} />

        <TrustMarque />

        <StatsSection />

        <FeaturesSection />

        <HowItWorksSection />

        <SecuritySection />

        <PortalSection />

        <TestimonialSection />

        <CTASection />

        <Footer isDark={isDark} />
      </div>
    </div>
  );
}
