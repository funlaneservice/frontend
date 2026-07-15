import { FEATURES } from "@/lib/constants"
import { Reveal } from "@/containers/landing/Reveal"

export const FeaturesSection = () => {
    return (
        < section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24" >
            <Reveal className="max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">Why Funlane</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white">Everything a travel desk needs, in one place.</h2>
                <p className="mt-4 text-ink-2 dark:text-white/75 leading-relaxed">
                    From the first request to the issued ticket, every step is transparent, secure and engineered to keep your funds safe.
                </p>
            </Reveal>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map((f, i) => (
                    <Reveal key={f.title} delay={(i % 3) * 90} from="up">
                        <article className="group relative h-full rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 hover:border-brand/40 hover:shadow-card transition-all overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-brand/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <span className={`inline-flex w-12 h-12 rounded-xl items-center justify-center ${f.tint}`}>
                                    <f.icon className="w-6 h-6" />
                                </span>
                                <h3 className="mt-5 font-semibold text-lg text-ink dark:text-white">{f.title}</h3>
                                <p className="mt-2 text-sm text-ink-2 dark:text-white/70 leading-relaxed">{f.desc}</p>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>
        </section >
    )
}