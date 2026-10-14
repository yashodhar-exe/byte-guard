import { useEffect, useState, type PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Bell, ChevronLeft, ChevronRight, ClipboardCheck, Globe2, LogOut, Moon, ScanSearch, Settings, ShieldCheck, Smartphone, Sun, Tags } from 'lucide-react'
import { cn } from '../lib/utils'
import { useWorkspace } from '../data/workspace'
import { Button, OriginBadge } from './ui'

const navigation = [
  { to: '/', label: 'Overview', icon: BarChart3, end: true },
  { to: '/brands', label: 'Brands', icon: Tags },
  { to: '/social', label: 'Social monitor', icon: ScanSearch },
  { to: '/apps', label: 'App monitor', icon: Smartphone },
  { to: '/web', label: 'Web monitor', icon: Globe2 },
  { to: '/findings', label: 'Findings', icon: ClipboardCheck },
  { to: '/settings', label: 'Settings', icon: Settings }
]

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('bytegaurd-theme') === 'dark' || (!localStorage.getItem('bytegaurd-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('bytegaurd-theme', theme)
  }, [theme])
  return { theme, setTheme }
}

export function AppShell({ children, onSignOut }: PropsWithChildren<{ onSignOut?: () => Promise<void> }>) {
  const [collapsed, setCollapsed] = useState(false)
  const { isDemo, organization } = useWorkspace()
  const { theme, setTheme } = useTheme()

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col', collapsed ? 'w-16 p-2' : 'w-64 p-3')}>
      <div className={cn('flex items-center', collapsed ? 'h-12 justify-center px-0' : 'h-12 justify-between px-2')}>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" title="Expand sidebar" className="flex items-center gap-2 overflow-hidden font-semibold tracking-tight text-slate-950 dark:text-white">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
              <ShieldCheck size={18} />
            </span>
          </button>
        ) : (
          <>
            <NavLink to="/" className="flex items-center gap-2 overflow-hidden font-semibold tracking-tight text-slate-950 dark:text-white">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                <ShieldCheck size={18} />
              </span>
              <span>Byte Guard</span>
            </NavLink>
            <button
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="grid h-7 w-7 place-items-center rounded-sm border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <ChevronLeft size={15} />
            </button>
          </>
        )}
      </div>

      <nav className={cn('grid gap-1', collapsed ? 'mt-6' : 'mt-7')}>
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center rounded-sm text-sm font-medium transition',
                collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-3 px-3 w-full',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn('mt-auto border-t border-slate-200 pt-4 dark:border-slate-800', collapsed ? 'px-0 flex flex-col items-center' : 'px-2')}>
        {!collapsed && (
          <>
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{organization?.name ?? 'Workspace'}</p>
            <p className="mt-1 text-xs text-slate-500">Digital risk protection</p>
            <div className="mt-3">
              {isDemo ? <OriginBadge origin="synthetic" /> : <OriginBadge origin="live" />}
            </div>
          </>
        )}
        {onSignOut && (
          <button
            onClick={() => void onSignOut()}
            className={cn(
              'flex h-10 items-center rounded-sm text-sm font-medium transition',
              collapsed ? 'w-10 justify-center px-0 mx-auto' : 'mt-4 w-full gap-3 px-3',
              'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        )}
      </div>
    </aside>
    <header className={cn('sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur transition-[margin] duration-200 dark:border-slate-800 dark:bg-slate-950/90', collapsed ? 'md:ml-16' : 'md:ml-64', 'md:px-8')}>
      <NavLink to="/" className="flex items-center gap-2 font-semibold md:hidden"><span className="grid h-8 w-8 place-items-center rounded-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"><ShieldCheck size={18} /></span>Byte Guard</NavLink>
      <div className="hidden flex-1 md:block" />
      <div className="flex items-center gap-1"><Button variant="ghost" className="h-9 min-h-9 w-9 px-0" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</Button><Button variant="ghost" className="h-9 min-h-9 w-9 px-0" aria-label="Notifications"><Bell size={17} /></Button>{onSignOut && <Button variant="secondary" className="ml-2 h-9 min-h-9" onClick={() => void onSignOut()}>Sign out</Button>}</div>
    </header>
    <main className={cn('mx-auto max-w-screen-2xl px-4 py-6 pb-24 transition-[margin] duration-200', collapsed ? 'md:ml-16' : 'md:ml-64', 'md:px-8 md:py-8')}>{children}</main>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-slate-200 bg-white px-1 py-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('grid justify-items-center gap-1 rounded-sm py-1 text-[10px] font-medium', isActive ? 'text-slate-950 dark:text-white' : 'text-slate-500')}><Icon size={17} /><span className="max-w-12 truncate">{label.split(' ')[0]}</span></NavLink>)}</nav>
  </div>
}
