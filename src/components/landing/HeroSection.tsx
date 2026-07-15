import { Reveal } from "@/containers/landing/Reveal"
import { ArrowRight, CheckCircle2, Clock, PlaneTakeoff, ShieldCheck, Sparkles, Ticket, Wallet } from "lucide-react"
import Link from "next/link"
import { FunlaneMark } from "../ui";

function GlassCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 px-3.5 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
            {children}
        </div>
    );
}


function HeroScene() {
    return (
        <div className="relative mx-auto w-full max-w-[520px] aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-[#0E1E3D] via-[#0B1A33] to-[#070D1A] shadow-2xl">
            {/* Glow */}
            <div aria-hidden="true" className="absolute inset-10 rounded-full bg-brand/20 blur-3xl" />

            {/* Orbit rings with traveling planes */}
            <div className="absolute inset-8 rounded-full border border-white/10 animate-spin-slow">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#0A1222] border border-white/15 flex items-center justify-center shadow-lg">
                    {/* Fixed light blue: this scene is always dark, and the themed
                        `brand-soft` token flips to a dark navy in dark mode. */}
                    <PlaneTakeoff className="w-4 h-4 text-[#8AC4EC]" />
                </span>
            </div>
            <div className="absolute inset-[4.5rem] rounded-full border border-dashed border-white/10 animate-spin-slower" style={{ animationDirection: 'reverse' }}>
                <span className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0A1222] border border-white/15 flex items-center justify-center">
                    <Ticket className="w-3.5 h-3.5 text-[#E5C185]" />
                </span>
            </div>

            {/* Center globe */}
            <div className="absolute inset-0 flex items-center justify-center">
                <FunlaneMark className="w-24 h-24 animate-float-slow drop-shadow-[0_20px_40px_rgba(22,112,181,0.6)]" />
            </div>

            {/* Floating UI cards */}
            <div className="absolute left-4 top-10 animate-float">
                <GlassCard>
                    <span className="w-9 h-9 rounded-lg bg-[#1670B5]/25 text-[#8AC4EC] flex items-center justify-center"><Wallet className="w-4 h-4" /></span>
                    <div>
                        <div className="text-[11px] text-white/60">Available balance</div>
                        <div className="font-bold text-sm text-white">₦2,400,000</div>
                    </div>
                </GlassCard>
            </div>

            <div className="absolute right-4 top-1/3 animate-float" style={{ animationDelay: '1.2s' }}>
                <GlassCard>
                    <span className="w-9 h-9 rounded-lg bg-green/20 text-green flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></span>
                    <div>
                        <div className="text-[11px] text-white/60">Quote</div>
                        <div className="font-bold text-sm text-white">Approved · locked</div>
                    </div>
                </GlassCard>
            </div>

            <div className="absolute left-6 bottom-8 animate-float" style={{ animationDelay: '2.1s' }}>
                <GlassCard>
                    <span className="w-9 h-9 rounded-lg bg-[#C5A059]/20 text-[#E5C185] flex items-center justify-center"><PlaneTakeoff className="w-4 h-4" /></span>
                    <div>
                        <div className="text-[11px] text-white/60">Lagos → London</div>
                        <div className="font-bold text-sm text-white">Ticket issued</div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

export const HeroSection = ({ isDark }: { isDark: boolean }) => {
    return (
        <div>
            <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-5 sm:px-8">
                {/* Aurora background */}
                <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-brand/20 dark:bg-brand/30 blur-[120px] animate-aurora" />
                    <div className="absolute top-10 right-0 w-[30rem] h-[30rem] rounded-full bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 blur-[120px] animate-aurora" style={{ animationDelay: '4s' }} />
                    <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full bg-[#C5A059]/10 dark:bg-[#C5A059]/15 blur-[120px] animate-aurora" style={{ animationDelay: '8s' }} />
                    {/* Grid overlay — dark mode only */}
                    <div
                        className="absolute inset-0 opacity-[0.18] hidden dark:block"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px)',
                            backgroundSize: '52px 52px',
                            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 75%)',
                        }}
                    />
                </div>

                <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Copy */}
                    <div>
                        <Reveal from="up">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-2 dark:text-white/80 bg-ink/5 dark:bg-white/5 border border-line dark:border-white/10 rounded-full pl-2 pr-3.5 py-1.5">
                                <span className="inline-flex items-center gap-1 bg-brand/15 dark:bg-brand/20 text-brand rounded-full px-2 py-0.5">
                                    <Sparkles className="w-3 h-3" /> New
                                </span>
                                Corporate travel, reimagined
                            </span>
                        </Reveal>

                        <Reveal from="up" delay={80}>
                            <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight text-ink dark:text-white">
                                Business travel
                                <br />
                                without the{' '}
                                <span className="relative whitespace-nowrap">
                                    <span className="bg-gradient-to-r from-brand via-[#3AA0DC] to-[#C5A059] bg-clip-text text-transparent">turbulence.</span>
                                    <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                                        <path d="M2 7 Q 50 1 100 5 T 198 4" stroke="url(#ul)" strokeWidth="3" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="ul" x1="0" x2="1">
                                                <stop stopColor="#1670B5" />
                                                <stop offset="1" stopColor="#C5A059" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </span>
                            </h1>
                        </Reveal>

                        <Reveal from="up" delay={160}>
                            <p className="mt-6 text-base sm:text-lg text-ink-2 dark:text-white/75 leading-relaxed max-w-xl">
                                Funlane is the corporate travel desk for modern teams. Request flights, lock funds
                                <span className="text-ink dark:text-white font-medium"> only when you approve</span>, and track every booking in real time —
                                fully NDPA-compliant and built for Nigeria.
                            </p>
                        </Reveal>

                        <Reveal from="up" delay={240}>
                            <div className="mt-9 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/signup"
                                    className="group inline-flex items-center justify-center gap-2 h-[3.25rem] px-7 py-3.5 rounded-xl bg-brand text-white hover:bg-brand-dark font-semibold transition-all shadow-[0_12px_40px_-10px_rgba(22,112,181,0.9)] hover:shadow-[0_18px_50px_-10px_rgba(22,112,181,1)]"
                                >
                                    Create a free account
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 h-[3.25rem] px-7 py-3.5 rounded-xl border border-line dark:border-white/15 text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 font-semibold transition-colors"
                                >
                                    Client sign in
                                </Link>
                            </div>
                        </Reveal>

                        <Reveal from="up" delay={320}>
                            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-3 dark:text-white/65">
                                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green" /> NDPA compliant</span>
                                <span className="inline-flex items-center gap-1.5"><Wallet className="w-4 h-4 text-brand" /> Pre-funded wallet</span>
                                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#C5A059] dark:text-[#E5C185]" /> Real-time tracking</span>
                            </div>
                        </Reveal>
                    </div>

                    {/* Animated visual */}
                    <Reveal from="scale" delay={200} className="relative">
                        <HeroScene />
                    </Reveal>
                </div>
            </section>
        </div>
    )
}
