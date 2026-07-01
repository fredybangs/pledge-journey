import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BarChart3,
  Clock3,
  Maximize2,
  Route,
  Trophy,
  Users,
} from 'lucide-react'
import {
  donationCommittedAmount,
  donationToDistance,
  donorDisplayName,
  formatDistance,
  formatMoney,
  formatNumber,
  sortDonations,
  unitLabel,
} from '../lib/campaign'
import type { CampaignSettings, CampaignStats, Donation } from '../lib/types'

type DisplayViewProps = {
  donations: Donation[]
  settings: CampaignSettings
  stats: CampaignStats
}

type DisplayMode = 'route' | 'leaderboard' | 'recent' | 'summary'

const displayModes: Array<{
  id: DisplayMode
  label: string
  icon: typeof Route
}> = [
  { id: 'route', label: 'Route', icon: Route },
  { id: 'leaderboard', label: 'Top', icon: Trophy },
  { id: 'recent', label: 'Recent', icon: Clock3 },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
]

export function DisplayView({ donations, settings, stats }: DisplayViewProps) {
  const [celebrate, setCelebrate] = useState(false)
  const [mode, setMode] = useState<DisplayMode>('route')
  const [shoutoutIndex, setShoutoutIndex] = useState(0)
  const latestId = stats.latest?.id
  const reachedCamp = stats.distance >= stats.targetDistance
  const progressLeft = `calc(${stats.percent}% - 20px)`

  useEffect(() => {
    if (!latestId) return
    setCelebrate(true)
    const timeout = window.setTimeout(() => setCelebrate(false), 2400)
    return () => window.clearTimeout(timeout)
  }, [latestId, donations.length])

  const activeDonations = useMemo(
    () => sortDonations(donations.filter((item) => item.status !== 'cancelled')),
    [donations],
  )

  useEffect(() => {
    if (activeDonations.length <= 3) return

    const interval = window.setInterval(() => {
      setShoutoutIndex((current) => (current + 1) % activeDonations.length)
    }, 3200)

    return () => window.clearInterval(interval)
  }, [activeDonations.length])

  const unlocks = useMemo(
    () =>
      settings.beyondUnlocks.map((item) => ({
        ...item,
        unlocked: stats.distance >= item.distance,
      })),
    [settings.beyondUnlocks, stats.distance],
  )

  const reachedMilestone = useMemo(() => {
    return [...settings.routeMilestones]
      .filter((item) => item.distance <= stats.distance)
      .sort((a, b) => b.distance - a.distance)[0]
  }, [settings.routeMilestones, stats.distance])

  const topDonors = useMemo(() => {
    const donorMap = activeDonations.reduce<Record<string, number>>((map, donation) => {
      const key = donorDisplayName(donation)
      map[key] = (map[key] || 0) + donationCommittedAmount(donation)
      return map
    }, {})

    return Object.entries(donorMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [activeDonations])

  const shoutouts = Array.from({
    length: Math.min(activeDonations.length, 3),
  })
    .map((_, index) => activeDonations[(shoutoutIndex + index) % activeDonations.length])
    .filter(Boolean)
  const celebrationMessage = reachedCamp
    ? `${settings.destination} reached`
    : reachedMilestone
      ? `${reachedMilestone.label} unlocked`
      : `${settings.startPoint} is live`

  return (
    <main
      className={`display-screen theme-${settings.displayTheme} ${
        celebrate ? 'celebrate' : ''
      }`}
    >
      <header className="display-topbar">
        <div>
          <p>{settings.organizer}</p>
          <h1>{settings.title}</h1>
        </div>
        <div className="display-controls">
          {displayModes.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                className={mode === item.id ? 'active' : ''}
                onClick={() => setMode(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
          <button
            type="button"
            title="Fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Maximize2 size={22} />
          </button>
        </div>
      </header>

      <section className="journey-hero">
        <div className="journey-copy">
          <p className="eyebrow">{celebrationMessage}</p>
          <h2>
            {reachedCamp
              ? `${formatDistance(stats.beyondDistance, settings)} beyond target`
              : `${formatDistance(stats.remainingDistance, settings)} to go`}
          </h2>
          <p>{settings.milestoneText}</p>
        </div>

        <div className="main-numbers">
          <div>
            <span>Committed</span>
            <strong>{formatMoney(stats.committed, settings.currency)}</strong>
          </div>
          <div>
            <span>{unitLabel(settings)} sponsored</span>
            <strong>{formatNumber(stats.distance)}</strong>
          </div>
        </div>
      </section>

      {mode === 'route' && (
        <>
          <section className="route-stage" aria-label="Journey progress">
            <div className="route-line">
              <div className="route-fill" style={{ width: `${stats.percent}%` }} />
              <div className="bus-marker" style={{ left: progressLeft }}>
                <div className="bus-body">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              {settings.routeMilestones.map((marker, index) => (
                <div
                  className={`mile-marker ${index % 2 === 0 ? 'upper' : 'lower'} ${
                    stats.distance >= marker.distance ? 'passed' : ''
                  }`}
                  key={marker.id}
                  style={{
                    left: `${Math.min(
                      (marker.distance / settings.targetDistance) * 100,
                      100,
                    )}%`,
                  }}
                >
                  <i />
                  <span>
                    <b>{marker.label}</b>
                    <small>{formatDistance(marker.distance, settings)}</small>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="display-bottom">
            <article className="shoutout-panel">
              <div className="icon-chip">
                <Users size={24} />
              </div>
              <div>
                <span>Supporter shoutouts</span>
                <strong>
                  {shoutouts.length > 0
                    ? shoutouts
                        .map((donation) => donorDisplayName(donation))
                        .join(' - ')
                    : 'Waiting for the first supporter.'}
                </strong>
              </div>
            </article>

            <article className="split-total">
              <div>
                <span>Received</span>
                <strong>{formatMoney(stats.received, settings.currency)}</strong>
              </div>
              <div>
                <span>Pledged</span>
                <strong>{formatMoney(stats.pledged, settings.currency)}</strong>
              </div>
            </article>
          </section>
        </>
      )}

      {mode === 'leaderboard' && (
        <section className="display-mode-panel leaderboard-panel">
          <h2>Top Supporters</h2>
          <div className="leaderboard-list">
            {topDonors.map((donor, index) => (
              <div key={donor.name}>
                <span>{index + 1}</span>
                <strong>{donor.name}</strong>
                <em>{formatMoney(donor.amount, settings.currency)}</em>
              </div>
            ))}
            {topDonors.length === 0 && <p>Waiting for the first supporter.</p>}
          </div>
        </section>
      )}

      {mode === 'recent' && (
        <section className="display-mode-panel recent-display-panel">
          <h2>Latest Supporters</h2>
          <div className="recent-display-grid">
            {activeDonations.slice(0, 8).map((donation) => (
              <article key={donation.id}>
                <strong>{donorDisplayName(donation)}</strong>
                <span>{formatMoney(donation.amount, settings.currency)}</span>
                <small>
                  {formatNumber(donationToDistance(donation.amount, settings))}{' '}
                  {unitLabel(settings)}
                </small>
              </article>
            ))}
            {activeDonations.length === 0 && <p>Waiting for the first supporter.</p>}
          </div>
        </section>
      )}

      {mode === 'summary' && (
        <section className="display-mode-panel summary-display-panel">
          <div>
            <span>Progress</span>
            <strong>{formatNumber(stats.percent)}%</strong>
          </div>
          <div>
            <span>Supporters</span>
            <strong>{stats.donorCount}</strong>
          </div>
          <div>
            <span>Outstanding pledges</span>
            <strong>{formatMoney(stats.pledged, settings.currency)}</strong>
          </div>
          <div>
            <span>Beyond target</span>
            <strong>{formatDistance(stats.beyondDistance, settings)}</strong>
          </div>
        </section>
      )}

      <section className="beyond-strip">
        <div className="beyond-title">
          <Route size={21} />
          <span>Beyond target unlocks</span>
        </div>
        <div className="unlock-list">
          {unlocks.map((item) => (
            <span key={item.id} className={item.unlocked ? 'unlocked' : ''}>
              {formatDistance(item.distance, settings)}: {item.label}
            </span>
          ))}
        </div>
      </section>

      <div className="confetti-field" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, index) => (
          <i key={index} style={{ '--i': index } as CSSProperties} />
        ))}
      </div>
    </main>
  )
}
