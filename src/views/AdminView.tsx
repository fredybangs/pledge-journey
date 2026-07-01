import { useMemo, useRef, useState } from 'react'
import {
  Download,
  FileJson,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { DonationRow } from '../components/DonationRow'
import { MetricStrip } from '../components/MetricStrip'
import {
  calculateStats,
  donationToDistance,
  donorDisplayName,
  formatDistance,
  formatMoney,
  sortDonations,
  unitLabel,
} from '../lib/campaign'
import { createDemoDonations } from '../lib/demoData'
import { campaignBackup, donationsToCsv } from '../lib/exporters'
import { downloadText, stateFromBackup } from '../lib/storage'
import type {
  AppState,
  CampaignStats,
  Donation,
  DonationCategory,
  DonationStatus,
  PaymentType,
} from '../lib/types'

type DonationForm = {
  donorName: string
  donorContact: string
  amount: string
  receivedAmount: string
  status: DonationStatus
  paymentType: PaymentType
  paymentReference: string
  category: DonationCategory
  anonymous: boolean
  note: string
}

type AdminViewProps = {
  state: AppState
  stats: CampaignStats
  upsertDonation: (donation: Donation) => void
  deleteDonation: (id: string) => void
  clearDonations: () => void
  addDonations: (donations: Donation[]) => void
  importBackup: (backupText: string) => void
  markBackupExported: () => void
  undoLastAction: () => void
  canUndo: boolean
}

const emptyForm: DonationForm = {
  donorName: '',
  donorContact: '',
  amount: '',
  receivedAmount: '',
  status: 'received',
  paymentType: 'Cash',
  paymentReference: '',
  category: 'General',
  anonymous: false,
  note: '',
}

const paymentTypes: PaymentType[] = [
  'Cash',
  'Orange Money',
  'Afrimoney',
  'Bank',
  'Pledge',
  'Other',
]

const donationCategories: DonationCategory[] = [
  'General',
  'Transport',
  'Meals',
  'Materials',
  'Camp Support',
  'Other',
]

export function AdminView({
  state,
  stats,
  upsertDonation,
  deleteDonation,
  clearDonations,
  addDonations,
  importBackup,
  markBackupExported,
  undoLastAction,
  canUndo,
}: AdminViewProps) {
  const { settings, donations, backupMeta } = state
  const [form, setForm] = useState<DonationForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const fileInput = useRef<HTMLInputElement | null>(null)

  const recentDonations = useMemo(
    () => sortDonations(donations).slice(0, 12),
    [donations],
  )
  const editingDonation = useMemo(
    () => donations.find((item) => item.id === editingId),
    [donations, editingId],
  )
  const backupDue =
    donations.length > 0 &&
    donations.length !== backupMeta.donationCountAtLastExport
  const backupLabel = backupMeta.lastExportedAt
    ? `Last backup: ${new Date(backupMeta.lastExportedAt).toLocaleString()}`
    : 'No backup exported yet'

  function updateForm<TField extends keyof DonationForm>(
    field: TField,
    value: DonationForm[TField],
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'status') {
        if (value === 'received') next.receivedAmount = next.amount
        if (value === 'pledged' || value === 'cancelled') next.receivedAmount = ''
      }

      if (field === 'amount' && next.status === 'received') {
        next.receivedAmount = String(value)
      }

      return next
    })
  }

  function formReceivedAmount(amount: number) {
    if (form.status === 'received') return amount
    if (form.status === 'partially_received') {
      return Math.min(Math.max(Number(form.receivedAmount || 0), 0), amount)
    }
    return 0
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(form.amount)

    if (!amount || amount <= 0) {
      setToast('Enter a valid amount.')
      return
    }

    if (
      form.status === 'partially_received' &&
      formReceivedAmount(amount) >= amount
    ) {
      setToast('Use Received when the full amount has been collected.')
      return
    }

    const existing = donations.find((item) => item.id === editingId)
    const now = new Date().toISOString()
    const donation: Donation = {
      id: editingId || crypto.randomUUID(),
      reference: existing?.reference || '',
      donorName: form.donorName.trim(),
      donorContact: form.donorContact.trim(),
      amount,
      receivedAmount: formReceivedAmount(amount),
      status: form.status,
      paymentType: form.paymentType,
      paymentReference: form.paymentReference.trim(),
      category: form.category,
      anonymous: form.anonymous,
      note: form.note.trim(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    upsertDonation(donation)
    setForm(emptyForm)
    setEditingId(null)
    setToast(
      `${donorDisplayName(donation)} sponsored ${formatDistance(
        donationToDistance(donation.amount, settings),
        settings,
      )}.`,
    )
  }

  function editDonation(donation: Donation) {
    setEditingId(donation.id)
    setForm({
      donorName: donation.donorName,
      donorContact: donation.donorContact,
      amount: String(donation.amount),
      receivedAmount:
        donation.status === 'partially_received'
          ? String(donation.receivedAmount)
          : '',
      status: donation.status,
      paymentType: donation.paymentType,
      paymentReference: donation.paymentReference,
      category: donation.category,
      anonymous: donation.anonymous,
      note: donation.note,
    })
  }

  function removeDonation(donation: Donation) {
    const confirmed = window.confirm(
      `Delete ${donation.reference} from ${donorDisplayName(donation)}?`,
    )
    if (!confirmed) return
    deleteDonation(donation.id)
    setToast('Donation removed.')
  }

  function markReceived(donation: Donation) {
    upsertDonation({
      ...donation,
      status: 'received',
      receivedAmount: donation.amount,
      paymentType: donation.paymentType === 'Pledge' ? 'Cash' : donation.paymentType,
      updatedAt: new Date().toISOString(),
    })
    setToast(`${donation.reference} marked as received.`)
  }

  function exportCsv() {
    downloadText(
      'pledge-journey-donations.csv',
      donationsToCsv(donations, settings),
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
    setToast('Backup exported.')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const previewState = stateFromBackup(text)
      const previewStats = calculateStats(
        previewState.donations,
        previewState.settings,
      )
      const confirmed = window.confirm(
        `Import "${previewState.settings.title}" with ${
          previewState.donations.length
        } records and ${formatMoney(
          previewStats.committed,
          previewState.settings.currency,
        )} committed? This replaces the current data on this laptop.`,
      )

      if (confirmed) {
        importBackup(text)
        setToast('Backup imported.')
      }
    } catch {
      setToast('That backup file could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  function handleClear() {
    if (!window.confirm('Clear every donation record on this laptop?')) return
    clearDonations()
    setToast('All donations cleared.')
  }

  function handleUndo() {
    undoLastAction()
    setToast('Last change undone.')
  }

  return (
    <main className="work-view admin-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">Fundraising desk</p>
          <h1>Enter Donations</h1>
        </div>
        <div className="header-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <RotateCcw size={17} />
            Undo
          </button>
          <a className="ghost-button" href="#settings">
            Configure Campaign
          </a>
          <a className="primary-button" href="#display" target="_blank" rel="noreferrer">
            Open Display
          </a>
        </div>
      </header>

      <MetricStrip
        metrics={[
          { label: 'Committed', value: formatMoney(stats.committed, settings.currency) },
          { label: 'Received', value: formatMoney(stats.received, settings.currency) },
          { label: 'Pledged', value: formatMoney(stats.pledged, settings.currency) },
          {
            label: unitLabel(settings),
            value: `${formatDistance(stats.distance, settings)} / ${formatDistance(
              settings.targetDistance,
              settings,
            )}`,
          },
        ]}
      />

      {backupDue && (
        <section className="backup-reminder">
          <strong>Backup recommended</strong>
          <span>{backupLabel}</span>
          <button type="button" onClick={exportJson}>
            <FileJson size={16} />
            Export Backup
          </button>
        </section>
      )}

      <section className="admin-grid">
        <form className="entry-panel" onSubmit={handleSubmit}>
          {editingDonation && (
            <div className="receipt-banner">
              Editing receipt <strong>{editingDonation.reference}</strong>
            </div>
          )}

          <div className="form-row two">
            <label>
              Donor name
              <input
                value={form.donorName}
                onChange={(event) => updateForm('donorName', event.target.value)}
                placeholder="Name or group"
              />
            </label>
            <label>
              Donor contact
              <input
                value={form.donorContact}
                onChange={(event) => updateForm('donorContact', event.target.value)}
                placeholder="Phone, WhatsApp, or email"
              />
            </label>
          </div>

          <div className="form-row two">
            <label>
              Amount pledged
              <input
                type="number"
                min={1}
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              Received now
              <input
                type="number"
                min={0}
                max={Number(form.amount) || undefined}
                disabled={form.status !== 'partially_received'}
                value={
                  form.status === 'received'
                    ? form.amount
                    : form.status === 'partially_received'
                      ? form.receivedAmount
                      : ''
                }
                onChange={(event) =>
                  updateForm('receivedAmount', event.target.value)
                }
                placeholder="0"
              />
            </label>
          </div>

          <div className="quick-grid" aria-label="Quick amounts">
            {settings.quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => updateForm('amount', String(amount))}
              >
                {formatMoney(amount, settings.currency)}
              </button>
            ))}
          </div>

          <div className="form-row two">
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value as DonationStatus)
                }
              >
                <option value="received">Received</option>
                <option value="pledged">Pledged</option>
                <option value="partially_received">Partially Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  updateForm('category', event.target.value as DonationCategory)
                }
              >
                {donationCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row two">
            <label>
              Payment type
              <select
                value={form.paymentType}
                onChange={(event) =>
                  updateForm('paymentType', event.target.value as PaymentType)
                }
              >
                {paymentTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Payment reference
              <input
                value={form.paymentReference}
                onChange={(event) =>
                  updateForm('paymentReference', event.target.value)
                }
                placeholder="Transaction ID or receipt"
              />
            </label>
          </div>

          <label>
            Note
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
            />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(event) => updateForm('anonymous', event.target.checked)}
            />
            Display as anonymous
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <Save size={17} />
              {editingId ? 'Update Entry' : 'Save Donation'}
            </button>
            {editingId && (
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {toast && <p className="toast">{toast}</p>}
        </form>

        <section className="recent-panel">
          <div className="panel-title-row">
            <h2>Recent Entries</h2>
            <span>{donations.length} total</span>
          </div>
          <div className="entry-list">
            {recentDonations.map((donation) => (
              <DonationRow
                key={donation.id}
                donation={donation}
                settings={settings}
                onEdit={editDonation}
                onDelete={removeDonation}
                onMarkReceived={markReceived}
              />
            ))}
            {recentDonations.length === 0 && (
              <p className="empty-state">No donations entered yet.</p>
            )}
          </div>

          <div className="backup-actions">
            <button type="button" onClick={exportCsv}>
              <Download size={16} />
              CSV
            </button>
            <button type="button" onClick={exportJson}>
              <FileJson size={16} />
              Backup
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}>
              <Upload size={16} />
              Import
            </button>
            <button type="button" onClick={() => addDonations(createDemoDonations())}>
              <RefreshCcw size={16} />
              Demo
            </button>
            <button className="danger-button" type="button" onClick={handleClear}>
              <Trash2 size={16} />
              Clear
            </button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="application/json"
              onChange={handleImport}
            />
          </div>
        </section>
      </section>
    </main>
  )
}
