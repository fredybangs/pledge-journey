import { DEFAULT_SETTINGS } from './campaign'
import type {
  AppState,
  AuditEntry,
  BackupMeta,
  CampaignSettings,
  Donation,
} from './types'

const STORAGE_KEY = 'road-to-camp-state'
const CHANGE_KEY = 'road-to-camp-last-change'
const CHANNEL_NAME = 'road-to-camp-updates'

const channel =
  'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : undefined

export function createEmptyState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    donations: [],
    auditLog: [],
    backupMeta: {
      donationCountAtLastExport: 0,
    },
  }
}

type LegacySettings = Partial<CampaignSettings> & {
  costPerMile?: number
  targetMiles?: number
}

function normalizeSettings(settings?: LegacySettings): CampaignSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    costPerUnit:
      settings?.costPerUnit || settings?.costPerMile || DEFAULT_SETTINGS.costPerUnit,
    targetDistance:
      settings?.targetDistance ||
      settings?.targetMiles ||
      DEFAULT_SETTINGS.targetDistance,
    routeMilestones: Array.isArray(settings?.routeMilestones)
      ? settings.routeMilestones
      : DEFAULT_SETTINGS.routeMilestones,
    beyondUnlocks: Array.isArray(settings?.beyondUnlocks)
      ? settings.beyondUnlocks
      : DEFAULT_SETTINGS.beyondUnlocks,
    quickAmounts: Array.isArray(settings?.quickAmounts)
      ? settings.quickAmounts
      : DEFAULT_SETTINGS.quickAmounts,
    displayTheme: settings?.displayTheme || DEFAULT_SETTINGS.displayTheme,
  }
}

function fallbackReference(index: number) {
  return `PJ-${String(index + 1).padStart(4, '0')}`
}

function normalizeDonation(donation: Partial<Donation>, index: number): Donation {
  const amount = Number(donation.amount || 0)
  const status = donation.status || 'received'
  const receivedAmount =
    status === 'received'
      ? amount
      : status === 'partially_received'
        ? Number(donation.receivedAmount || 0)
        : 0

  return {
    id: donation.id || crypto.randomUUID(),
    reference: donation.reference || fallbackReference(index),
    donorName: donation.donorName || '',
    donorContact: donation.donorContact || '',
    amount,
    receivedAmount,
    status,
    paymentType: donation.paymentType || 'Cash',
    paymentReference: donation.paymentReference || '',
    category: donation.category || 'General',
    anonymous: Boolean(donation.anonymous),
    note: donation.note || '',
    createdAt: donation.createdAt || new Date().toISOString(),
    updatedAt: donation.updatedAt || donation.createdAt || new Date().toISOString(),
  }
}

function normalizeAuditLog(auditLog?: AuditEntry[]) {
  return Array.isArray(auditLog) ? auditLog : []
}

function normalizeBackupMeta(backupMeta?: Partial<BackupMeta>): BackupMeta {
  return {
    lastExportedAt: backupMeta?.lastExportedAt,
    donationCountAtLastExport: backupMeta?.donationCountAtLastExport || 0,
  }
}

export function loadState(): AppState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as
      | Partial<AppState>
      | undefined

    return {
      settings: normalizeSettings(saved?.settings as LegacySettings | undefined),
      donations: Array.isArray(saved?.donations)
        ? saved.donations.map((donation, index) => normalizeDonation(donation, index))
        : [],
      auditLog: normalizeAuditLog(saved?.auditLog),
      backupMeta: normalizeBackupMeta(saved?.backupMeta),
    }
  } catch {
    return createEmptyState()
  }
}

export function saveState(nextState: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  localStorage.setItem(CHANGE_KEY, String(Date.now()))
  channel?.postMessage({ type: 'changed' })
}

export function subscribeToStateChanges(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === CHANGE_KEY) callback()
  }
  const onMessage = () => callback()

  window.addEventListener('storage', onStorage)
  channel?.addEventListener('message', onMessage)

  return () => {
    window.removeEventListener('storage', onStorage)
    channel?.removeEventListener('message', onMessage)
  }
}

export function saveDonation(state: AppState, donation: Donation): AppState {
  const exists = state.donations.some((item) => item.id === donation.id)
  return {
    ...state,
    donations: exists
      ? state.donations.map((item) => (item.id === donation.id ? donation : item))
      : [...state.donations, donation],
  }
}

export function deleteDonation(state: AppState, id: string): AppState {
  return {
    ...state,
    donations: state.donations.filter((item) => item.id !== id),
  }
}

export function replaceSettings(
  state: AppState,
  settings: Partial<CampaignSettings>,
): AppState {
  return {
    ...state,
    settings: { ...state.settings, ...settings },
  }
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function backupToJson(state: AppState) {
  return JSON.stringify(state, null, 2)
}

export function stateFromBackup(text: string): AppState {
  const imported = JSON.parse(text) as Partial<AppState>
  return {
    settings: normalizeSettings(imported.settings as LegacySettings | undefined),
    donations: Array.isArray(imported.donations)
      ? imported.donations.map((donation, index) => normalizeDonation(donation, index))
      : [],
    auditLog: normalizeAuditLog(imported.auditLog),
    backupMeta: normalizeBackupMeta(imported.backupMeta),
  }
}
