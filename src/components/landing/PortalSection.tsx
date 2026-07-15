import { Reveal } from "@/containers/landing/Reveal"
import { CLIENT_PERKS, AGENT_PERKS } from "@/lib/constants"
import { ArrowRight, CheckCircle2, Users, Headphones } from "lucide-react"
import Link from "next/link"

export function PortalSection() {
    return (
        < section id="portals" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24" >
            <Reveal className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">Choose your access</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white">Two doors, one platform.</h2>
                <p className="mt-4 text-ink-2 dark:text-white/75">Book and manage trips as a client, or process the queue as an agency agent.</p>
            </Reveal>

            <div className="mt-12 grid lg:grid-cols-2 gap-6">
                {/* Client */}
                <Reveal from="up">
                    <div className="group relative h-full rounded-3xl border border-brand/20 dark:border-white/10 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-8 sm:p-10 overflow-hidden">
                        <div aria-hidden="true" className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand/20 blur-3xl group-hover:scale-125 transition-transform duration-500" />
                        <div className="relative">
                            <span className="inline-flex w-12 h-12 rounded-xl bg-brand/15 dark:bg-brand/20 text-brand items-center justify-center"><Users className="w-6 h-6" /></span>
                            <h3 className="mt-5 text-2xl font-bold text-ink dark:text-white">For clients</h3>
                            <p className="mt-2 text-ink-2 dark:text-white/70 leading-relaxed">
                                Submit travel requests, review curated quotes, approve with one tap and track everything from a single dashboard.
                            </p>
                            <ul className="mt-6 space-y-2.5">
                                {CLIENT_PERKS.map((p) => (
                                    <li key={p} className="flex items-center gap-2.5 text-sm text-ink-2 dark:text-white/80"><CheckCircle2 className="w-4 h-4 text-brand" /> {p}</li>
                                ))}
                            </ul>
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <Link href="/signup" className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-brand text-white hover:bg-brand-dark font-semibold transition-colors">
                                    Sign up <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="/login" className="flex-1 inline-flex items-center justify-center h-12 rounded-xl border border-line dark:border-white/20 text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 font-semibold transition-colors">
                                    Log in
                                </Link>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Agent */}
                <Reveal from="up" delay={120}>
                    <div className="group relative h-full rounded-3xl border border-[#C5A059]/30 dark:border-[#C5A059]/25 bg-gradient-to-br from-[#C5A059]/15 via-[#C5A059]/5 to-transparent p-8 sm:p-10 overflow-hidden">
                        <div aria-hidden="true" className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#C5A059]/20 blur-3xl group-hover:scale-125 transition-transform duration-500" />
                        <div className="relative">
                            <span className="inline-flex w-12 h-12 rounded-xl bg-[#C5A059]/20 text-[#a07d35] dark:text-[#E5C185] items-center justify-center"><Headphones className="w-6 h-6" /></span>
                            <h3 className="mt-5 text-2xl font-bold text-ink dark:text-white">For agents</h3>
                            <p className="mt-2 text-ink-2 dark:text-white/70 leading-relaxed">
                                Work the shared request queue, build quote options, issue tickets and manage client wallets from the agency dashboard.
                            </p>
                            <ul className="mt-6 space-y-2.5">
                                {AGENT_PERKS.map((p) => (
                                    <li key={p} className="flex items-center gap-2.5 text-sm text-ink-2 dark:text-white/80"><CheckCircle2 className="w-4 h-4 text-[#a07d35] dark:text-[#E5C185]" /> {p}</li>
                                ))}
                            </ul>
                            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
                                <Link href="/agent/login" className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#C5A059] hover:bg-[#b08f4c] text-[#241a06] font-semibold transition-colors">
                                    Agent sign in <ArrowRight className="w-4 h-4" />
                                </Link>
                                <span className="text-xs text-ink-3 dark:text-white/60 sm:max-w-[40%] text-center sm:text-left">Agents are onboarded by your administrator.</span>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section >
    )
}