'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { NavSection } from './navTypes';
import { bestMatchHref } from './navTypes';

interface SidebarProps {
  sections: NavSection[];
  isOpen: boolean;
  onClose: () => void;
  /** Desktop-only icon rail mode. The mobile drawer always shows labels. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ sections, isOpen, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const activeHref = bestMatchHref(sections, pathname);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar — mobile slide-in drawer; on desktop, a collapsible rail with
          an animated width (labels fade + shrink instead of wrapping). */}
      <aside
        className={`fixed lg:static top-16 left-0 h-[calc(100vh-64px)] lg:h-full w-64 shrink-0 bg-card border-r border-line z-[70] lg:z-auto transition-all duration-300 ease-in-out lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav aria-label="Primary" className="p-4 flex flex-col gap-7 h-full overflow-y-auto overflow-x-hidden">
          {sections.map((section) => (
            <div key={section.title}>
              <h2
                className={`text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-2 px-3 whitespace-nowrap transition-all duration-200 ${
                  collapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:overflow-hidden' : 'opacity-100'
                }`}
              >
                {section.title}
              </h2>
              {/* Divider stands in for the section title when collapsed */}
              <div className={`hidden h-px bg-line mb-2 mx-2 ${collapsed ? 'lg:block' : ''}`} aria-hidden="true" />
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === activeHref;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                          collapsed ? 'px-3 lg:justify-center lg:px-0' : 'px-3'
                        } ${active
                            ? 'bg-brand-soft text-brand'
                            : 'text-ink-2 hover:bg-surface hover:text-ink'
                          }`}
                      >
                        <span aria-hidden="true" className="flex items-center justify-center w-5 shrink-0">
                          <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                        </span>
                        <span
                          className={`flex-1 whitespace-nowrap transition-all duration-200 ${
                            collapsed ? 'lg:opacity-0 lg:w-0 lg:flex-none lg:overflow-hidden' : 'opacity-100'
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span
                            className={`min-w-[20px] text-center text-[11px] px-1.5 py-0.5 rounded-full font-semibold transition-all duration-200 ${
                              collapsed ? 'lg:hidden' : ''
                            } ${active ? 'bg-brand text-white' : 'bg-surface text-ink-3 border border-line'}`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Desktop collapse toggle, pinned to the bottom of the rail */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden lg:flex items-center gap-3 mt-auto py-2.5 rounded-lg text-sm font-medium text-ink-3 hover:bg-surface hover:text-ink transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-3'
              }`}
            >
              <span aria-hidden="true" className="flex items-center justify-center w-5 shrink-0">
                {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
              </span>
              <span
                className={`whitespace-nowrap transition-all duration-200 ${
                  collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}
              >
                Collapse
              </span>
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
