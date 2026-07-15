import Link from 'next/link';
import { FunlaneLogo } from '@/components/ui/Logo';
import { Shield, MapPin } from 'lucide-react';

const DEFAULT_FEATURES = [
    {
        icon: Shield,
        title: 'NDPA Compliant',
        desc: 'Encrypted, enterprise-grade security.',
    },
    {
        icon: MapPin,
        title: 'Real-time Tracking',
        desc: 'Follow every request end to end.',
    },
];

interface AuthHeroProps {
    title: string;
    description: string;
    features?: typeof DEFAULT_FEATURES;
}

export function AuthHero({
    title,
    description,
    features = DEFAULT_FEATURES,
}: AuthHeroProps) {
    return (
        <div className="auth-hero">
            <Link href="/" aria-label="Funlane home" className="self-start">
                <FunlaneLogo tone="light" markClassName="w-10 h-10" />
            </Link>

            <div className="flex-1 flex flex-col justify-end">
                <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white mb-4 max-w-md mt-auto">
                    {title}
                </h2>

                <p className="text-white/60 text-sm leading-relaxed max-w-md mb-8">
                    {description}
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-md">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-xl bg-white/5 border border-white/10 p-4"
                        >
                            <feature.icon
                                aria-hidden="true"
                                className="w-5 h-5 text-white"
                            />

                            <div className="font-semibold text-sm text-white mt-2">
                                {feature.title}
                            </div>

                            <div className="text-[11px] text-white/50 mt-0.5 leading-snug">
                                {feature.desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}