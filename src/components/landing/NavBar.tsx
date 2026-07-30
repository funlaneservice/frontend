import Link from "next/link"
import { FunlaneLogo } from "../ui"
import { NAV_LINKS } from "@/lib/constants"
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

function ThemeToggle({ isDark, onClick }: { isDark: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-full border border-line dark:border-white/15 text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

type NavBarProps = {
  isDark: boolean;
  menuOpen: boolean;
  scrolled: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  toggleTheme: () => void;
};

export const NavBar = ({ isDark, menuOpen, scrolled, setMenuOpen, toggleTheme }: NavBarProps) => {
    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/85 dark:bg-[#070D1A]/80 backdrop-blur-xl border-b border-line dark:border-white/10'
                    : 'bg-transparent'
                }`}
        >
            <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                <Link href="/" aria-label="Funlane home">
                    <FunlaneLogo tone={isDark ? 'light' : 'dark'} markClassName="w-9 h-9" />
                </Link>

                <div className="hidden lg:flex items-center gap-8">
                    {NAV_LINKS.map((l) => (
                        <a key={l.href} href={l.href} className="text-sm font-medium text-ink-2 dark:text-white/70 hover:text-ink dark:hover:text-white transition-colors">
                            {l.label}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    <ThemeToggle isDark={isDark} onClick={toggleTheme} />
                    <Link href="/agent/login" className="text-[13px] font-semibold text-ink-3 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors ml-1">
                        Agent portal
                    </Link>
                    <div className="w-px h-4 bg-line dark:bg-white/15 mx-1.5 hidden sm:block"></div>
                    <Link href="/login" className="text-[13px] font-semibold px-4 h-9 inline-flex items-center rounded-full border border-line dark:border-white/15 text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 transition-colors">
                        Sign in
                    </Link>
                    <Link
                        href="/signup"
                        className="text-[13px] font-semibold px-5 h-9 inline-flex items-center gap-1.5 rounded-full bg-brand text-white hover:bg-brand-dark transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                        Get started <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="lg:hidden flex items-center gap-2">
                    <ThemeToggle isDark={isDark} onClick={toggleTheme} />
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-line dark:border-white/15 text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 transition-colors"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="lg:hidden bg-white/95 dark:bg-[#070D1A]/95 backdrop-blur-xl border-b border-line dark:border-white/10 animate-fade-in">
                    <div className="px-5 py-4 flex flex-col gap-1">
                        {NAV_LINKS.map((l) => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-medium text-ink-2 dark:text-white/80">
                                {l.label}
                            </a>
                        ))}
                        <div className="h-px bg-line dark:bg-white/10 my-2" />
                        <Link href="/login" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-semibold text-ink dark:text-white">Client sign in</Link>
                        <Link href="/agent/login" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-semibold text-ink-3 dark:text-white/70">Agent portal</Link>
                        <Link href="/signup" onClick={() => setMenuOpen(false)} className="mt-2 text-center text-sm font-semibold py-3 rounded-lg bg-brand text-white">
                            Create account
                        </Link>
                    </div>
                </div>
            )}
        </header>

    )
}