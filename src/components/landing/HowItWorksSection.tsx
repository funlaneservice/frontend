import { Reveal } from "@/containers/landing/Reveal"
import { STEPS } from "@/lib/constants"

export function HowItWorksSection() {
    return (
        <section id="how" className="relative py-16 sm:py-24 border-y border-line dark:border-white/10 bg-surface dark:bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <Reveal className="text-center max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#a07d35] dark:text-[#E5C185]">How it works</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white">Four steps from request to runway.</h2>
                </Reveal>

                <div className="mt-14 grid md:grid-cols-4 gap-6 relative">
                    {/* connecting line */}
                    <div aria-hidden="true" className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-brand/0 via-brand/40 to-[#C5A059]/0" />
                    {STEPS.map((s, i) => (
                        <Reveal key={s.title} delay={i * 120} className="relative text-center">
                            <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-[#0A1222] border border-line dark:border-white/10 flex items-center justify-center shadow-sm">
                                <s.icon className="w-6 h-6 text-brand" />
                                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                            </div>
                            <h3 className="mt-5 font-semibold text-ink dark:text-white">{s.title}</h3>
                            <p className="mt-2 text-sm text-ink-2 dark:text-white/70 leading-relaxed">{s.desc}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}