import { ReactNode } from 'react';
import Link from 'next/link';
import { AuthHero } from '../AuthHero';
import { FunlaneLogo } from '@/components/ui/Logo';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export function AuthLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="auth-wrap auth-geist">
            <div className="auth-split animate-scale-in">
                <AuthHero
                    title={title}
                    description={description}
                />

                <div className="auth-form-side">
                    <div className="w-full max-w-md mx-auto flex flex-col">
                        {/* Mobile brand hero — logo, wordmark + headline overlaid
                            on the brand illustration. Hidden at lg, where the
                            full-height AuthHero takes over. */}
                        <div className="auth-hero-mobile">
                            <div className="auth-hero-mobile__content">
                                <Link href="/" aria-label="Funlane home">
                                    <FunlaneLogo tone="light" markClassName="w-9 h-9" />
                                </Link>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight text-white">
                                        {title}
                                    </h2>
                                    <p className="mt-1.5 text-xs leading-relaxed text-white/75 line-clamp-2">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-card rounded-2xl shadow-lg border border-line p-6 lg:p-0 lg:bg-transparent lg:shadow-none lg:border-0">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}