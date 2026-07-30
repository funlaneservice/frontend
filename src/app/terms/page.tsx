import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { TermsContent } from '@/components/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Terms of Service — Funlane Travels & Logistics',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <TermsContent />
    </LegalPage>
  );
}
