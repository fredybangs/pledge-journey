import { Bus, LayoutDashboard, MonitorUp, Plus, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDistance, formatMoney } from '../lib/campaign'
import type { CampaignSettings, CampaignStats } from '../lib/types'
import type { AppRoute } from '../hooks/useRoute'
import { routeHref } from '../hooks/useRoute'

type AppShellProps = {
  route: AppRoute
  settings: CampaignSettings
  stats: CampaignStats
  children: ReactNode
}

export function AppShell({ route, settings, stats, children }: AppShellProps) {
  if (route === 'display') return <>{children}</>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Bus size={24} />
          </span>
          <div>
            <strong>{settings.title}</strong>
            <span>{settings.organizer}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <a className={route === 'admin' ? 'active' : ''} href={routeHref('admin')}>
            <Plus size={18} />
            Admin
          </a>
          <a
            className=""
            href={routeHref('display')}
            target="_blank"
            rel="noreferrer"
          >
            <MonitorUp size={18} />
            Display
          </a>
          <a
            className={route === 'summary' ? 'active' : ''}
            href={routeHref('summary')}
          >
            <LayoutDashboard size={18} />
            Summary
          </a>
          <a
            className={route === 'settings' ? 'active' : ''}
            href={routeHref('settings')}
          >
            <Settings size={18} />
            Settings
          </a>
        </nav>

        <div className="sidebar-stats">
          <span>Committed</span>
          <strong>{formatMoney(stats.committed, settings.currency)}</strong>
          <small>{formatDistance(stats.distance, settings)} sponsored</small>
        </div>

        <div className="sidebar-actions">
          <a href={routeHref('display')} target="_blank" rel="noreferrer">
            <MonitorUp size={16} />
            Open Display
          </a>
          <a href={routeHref('summary')}>
            <LayoutDashboard size={16} />
            Event Report
          </a>
          <a href={routeHref('settings')}>
            <Settings size={16} />
            Configure
          </a>
        </div>
      </aside>

      <section className="main-stage">{children}</section>
    </div>
  )
}
