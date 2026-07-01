import { useMemo, useRef } from 'react'
import { Download, FileJson } from 'lucide-react'
import { MetricStrip } from '../components/MetricStrip'
import {
  donationReceivedAmount,
  donorDisplayName,
  formatDistance,
  formatMoney,
  sortDonations,
} from '../lib/campaign'
import {
  campaignBackup,
  donationsToCsv,
  outstandingPledgesToCsv,
} from '../lib/exporters'
import { downloadText } from '../lib/storage'
import type { AppState, CampaignStats, Donation } from '../lib/types'

type SummaryViewProps = {
  state: AppState
  stats: CampaignStats
  markBackupExported: () => void
}

function groupAmount(
  donations: Donation[],
  getKey: (donation: Donation) => string,
  getAmount: (donation: Donation) => number,
) {
  return donations.reduce<Record<string, number>>((map, item) => {
    const key = getKey(item)
    map[key] = (map[key] || 0) + getAmount(item)
    return map
  }, {})
}

function outstandingAmount(donation: Donation) {
  return Math.max(donation.amount - donationReceivedAmount(donation), 0)
}

export function SummaryView({ state, stats, markBackupExported }: SummaryViewProps) {
  const { donations, settings, auditLog } = state
  const sessionStartedAt = useRef(new Date().toISOString())

  const activeDonations = useMemo(
    () => donations.filter((item) => item.status !== 'cancelled'),
    [donations],
  )
  const paymentBreakdown = useMemo(
    () =>
      groupAmount(activeDonations, (item) => item.paymentType, donationReceivedAmount),
    [activeDonations],
  )
  const categoryBreakdown = useMemo(
    () =>
      groupAmount(activeDonations, (item) => item.category, (item) => item.amount),
    [activeDonations],
  )
  const dailyTotals = useMemo(
    () =>
      groupAmount(
        activeDonations,
        (item) => new Date(item.createdAt).toLocaleDateString(),
        (item) => item.amount,
      ),
    [activeDonations],
  )
  const sessionDonations = useMemo(
    () =>
      activeDonations.filter(
        (item) =>
          new Date(item.createdAt).getTime() >=
          new Date(sessionStartedAt.current).getTime(),
      ),
    [activeDonations],
  )
  const sessionTotal = sessionDonations.reduce((sum, item) => sum + item.amount, 0)
  const outstandingPledges = useMemo(
    () =>
      sortDonations(activeDonations).filter((item) => outstandingAmount(item) > 0),
    [activeDonations],
  )
  const biggestDonation = useMemo(
    () => [...activeDonations].sort((a, b) => b.amount - a.amount)[0],
    [activeDonations],
  )

  function exportCsv() {
    downloadText(
      'pledge-journey-donations.csv',
      donationsToCsv(donations, settings),
      'text/csv',
    )
  }

  function exportOutstandingCsv() {
    downloadText(
      'pledge-journey-outstanding-pledges.csv',
      outstandingPledgesToCsv(donations, settings),
      'text/csv',
    )
  }

  function exportJson() {
    downloadText(
      'pledge-journey-backup.json',
      campaignBackup(state),
      'application/json',
    )
    markBackupExported()
  }

  return (
    <main className="work-view summary-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">Event report</p>
          <h1>Campaign Summary</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-button" type="button" onClick={exportCsv}>
            <Download size={17} />
            CSV
          </button>
          <button className="ghost-button" type="button" onClick={exportOutstandingCsv}>
            <Download size={17} />
            Pledges
          </button>
          <button className="primary-button" type="button" onClick={exportJson}>
            <FileJson size={17} />
            Backup
          </button>
        </div>
      </header>

      <MetricStrip
        metrics={[
          {
            label: 'Total committed',
            value: formatMoney(stats.committed, settings.currency),
          },
          {
            label: 'Total received',
            value: formatMoney(stats.received, settings.currency),
          },
          {
            label: 'Outstanding pledges',
            value: formatMoney(stats.pledged, settings.currency),
          },
          { label: 'Donors', value: stats.donorCount },
        ]}
      />

      <section className="summary-grid">
        <article className="report-panel">
          <h2>Journey</h2>
          <dl>
            <div>
              <dt>Distance sponsored</dt>
              <dd>{formatDistance(stats.distance, settings)}</dd>
            </div>
            <div>
              <dt>Target distance</dt>
              <dd>{formatDistance(settings.targetDistance, settings)}</dd>
            </div>
            <div>
              <dt>Beyond target</dt>
              <dd>{formatDistance(stats.beyondDistance, settings)}</dd>
            </div>
            <div>
              <dt>Largest entry</dt>
              <dd>
                {biggestDonation
                  ? `${donorDisplayName(biggestDonation)} - ${formatMoney(
                      biggestDonation.amount,
                      settings.currency,
                    )}`
                  : 'None'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="report-panel">
          <h2>Session</h2>
          <dl>
            <div>
              <dt>This screen session</dt>
              <dd>{formatMoney(sessionTotal, settings.currency)}</dd>
            </div>
            <div>
              <dt>Session entries</dt>
              <dd>{sessionDonations.length}</dd>
            </div>
            <div>
              <dt>Cancelled value</dt>
              <dd>{formatMoney(stats.cancelled, settings.currency)}</dd>
            </div>
            <div>
              <dt>Outstanding pledge count</dt>
              <dd>{stats.outstandingPledgeCount}</dd>
            </div>
          </dl>
        </article>

        <ReportBreakdown
          title="Payment Types"
          values={paymentBreakdown}
          currency={settings.currency}
        />
        <ReportBreakdown
          title="Categories"
          values={categoryBreakdown}
          currency={settings.currency}
        />
        <ReportBreakdown title="Daily Totals" values={dailyTotals} currency={settings.currency} />

        <article className="report-panel">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {auditLog.slice(0, 8).map((entry) => (
              <div key={entry.id}>
                <strong>{entry.message}</strong>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {auditLog.length === 0 && <p className="empty-state">No activity yet.</p>}
          </div>
        </article>
      </section>

      <section className="table-section">
        <div className="panel-title-row">
          <h2>Outstanding Pledges</h2>
          <span>{outstandingPledges.length} records</span>
        </div>
        <div className="pledge-list">
          {outstandingPledges.map((donation) => (
            <article key={donation.id}>
              <strong>
                {donation.reference} - {donorDisplayName(donation)}
              </strong>
              <span>{donation.donorContact || 'No contact saved'}</span>
              <em>
                {formatMoney(outstandingAmount(donation), settings.currency)} outstanding
              </em>
            </article>
          ))}
          {outstandingPledges.length === 0 && (
            <p className="empty-state">No outstanding pledges.</p>
          )}
        </div>
      </section>

      <section className="table-section">
        <div className="panel-title-row">
          <h2>Donation Ledger</h2>
          <span>{donations.length} records</span>
        </div>
        <div className="ledger-table">
          <div className="ledger-head">
            <span>Reference</span>
            <span>Donor</span>
            <span>Amount</span>
            <span>Received</span>
            <span>Status</span>
            <span>Category</span>
            <span>Date</span>
          </div>
          {sortDonations(donations).map((donation) => (
            <div className="ledger-row" key={donation.id}>
              <span>{donation.reference}</span>
              <span>{donorDisplayName(donation)}</span>
              <span>{formatMoney(donation.amount, settings.currency)}</span>
              <span>{formatMoney(donationReceivedAmount(donation), settings.currency)}</span>
              <span>
                <i className={`status-pill ${donation.status}`}>{donation.status}</i>
              </span>
              <span>{donation.category}</span>
              <span>{new Date(donation.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

type ReportBreakdownProps = {
  title: string
  values: Record<string, number>
  currency: string
}

function ReportBreakdown({ title, values, currency }: ReportBreakdownProps) {
  return (
    <article className="report-panel">
      <h2>{title}</h2>
      <dl>
        {Object.entries(values).map(([label, amount]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatMoney(amount, currency)}</dd>
          </div>
        ))}
        {Object.keys(values).length === 0 && (
          <div>
            <dt>No entries</dt>
            <dd>{formatMoney(0, currency)}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}
