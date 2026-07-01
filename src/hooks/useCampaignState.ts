import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateStats } from '../lib/campaign'
import {
  deleteDonation as removeDonationFromState,
  loadState,
  replaceSettings,
  saveDonation as saveDonationToState,
  saveState,
  stateFromBackup,
  subscribeToStateChanges,
} from '../lib/storage'
import type { AppState, AuditAction, CampaignSettings, Donation } from '../lib/types'

function createAuditEntry(
  action: AuditAction,
  message: string,
  donationReference?: string,
) {
  return {
    id: crypto.randomUUID(),
    action,
    message,
    donationReference,
    createdAt: new Date().toISOString(),
  }
}

function nextDonationReference(donations: Donation[]) {
  const highest = donations.reduce((max, donation) => {
    const match = donation.reference.match(/PJ-(\d+)/i)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  return `PJ-${String(highest + 1).padStart(4, '0')}`
}

function withAudit(
  state: AppState,
  action: AuditAction,
  message: string,
  donationReference?: string,
) {
  return {
    ...state,
    auditLog: [
      createAuditEntry(action, message, donationReference),
      ...state.auditLog,
    ].slice(0, 150),
  }
}

export function useCampaignState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [undoStack, setUndoStack] = useState<AppState[]>([])

  const commit = useCallback(
    (nextState: AppState, remember = true) => {
      if (remember) {
        setUndoStack((current) => [state, ...current].slice(0, 10))
      }
      setState(nextState)
      saveState(nextState)
    },
    [state],
  )

  useEffect(() => {
    return subscribeToStateChanges(() => setState(loadState()))
  }, [])

  const stats = useMemo(
    () => calculateStats(state.donations, state.settings),
    [state.donations, state.settings],
  )

  const upsertDonation = useCallback(
    (donation: Donation) => {
      const existing = state.donations.find((item) => item.id === donation.id)
      const reference = donation.reference || nextDonationReference(state.donations)
      const normalized: Donation = {
        ...donation,
        reference,
        receivedAmount:
          donation.status === 'received'
            ? donation.amount
            : donation.status === 'partially_received'
              ? Math.min(Math.max(donation.receivedAmount || 0, 0), donation.amount)
              : 0,
      }
      const savedState = saveDonationToState(state, normalized)
      const action =
        existing &&
        existing.status !== 'received' &&
        normalized.status === 'received'
          ? 'donation_marked_received'
          : existing
            ? 'donation_updated'
            : 'donation_created'
      const message = existing
        ? `${reference} updated`
        : `${reference} created`

      commit(withAudit(savedState, action, message, reference))
    },
    [commit, state],
  )

  const deleteDonation = useCallback(
    (id: string) => {
      const donation = state.donations.find((item) => item.id === id)
      const nextState = removeDonationFromState(state, id)
      commit(
        withAudit(
          nextState,
          'donation_deleted',
          `${donation?.reference || 'Donation'} deleted`,
          donation?.reference,
        ),
      )
    },
    [commit, state],
  )

  const clearDonations = useCallback(
    () =>
      commit(
        withAudit(
          { ...state, donations: [] },
          'donations_cleared',
          `${state.donations.length} donation records cleared`,
        ),
      ),
    [commit, state],
  )

  const addDonations = useCallback(
    (donations: Donation[]) => {
      const stamped = donations.map((donation, index) => ({
        ...donation,
        reference:
          donation.reference ||
          `PJ-${String(state.donations.length + index + 1).padStart(4, '0')}`,
      }))

      commit(
        withAudit(
          { ...state, donations: [...state.donations, ...stamped] },
          'donation_created',
          `${stamped.length} demo donation records added`,
        ),
      )
    },
    [commit, state],
  )

  const updateSettings = useCallback(
    (settings: Partial<CampaignSettings>) =>
      commit(
        withAudit(
          replaceSettings(state, settings),
          'settings_updated',
          'Campaign settings updated',
        ),
      ),
    [commit, state],
  )

  const importBackup = useCallback(
    (backupText: string) => {
      const imported = stateFromBackup(backupText)
      commit(
        withAudit(
          imported,
          'backup_imported',
          `${imported.donations.length} donation records imported`,
        ),
      )
    },
    [commit],
  )

  const markBackupExported = useCallback(
    () =>
      commit(
        withAudit(
          {
            ...state,
            backupMeta: {
              lastExportedAt: new Date().toISOString(),
              donationCountAtLastExport: state.donations.length,
            },
          },
          'backup_exported',
          'Backup exported',
        ),
        false,
      ),
    [commit, state],
  )

  const undoLastAction = useCallback(() => {
    const previous = undoStack[0]
    if (!previous) return

    setUndoStack((current) => current.slice(1))
    commit(previous, false)
  }, [commit, undoStack])

  return {
    state,
    stats,
    upsertDonation,
    deleteDonation,
    clearDonations,
    addDonations,
    updateSettings,
    importBackup,
    markBackupExported,
    undoLastAction,
    canUndo: undoStack.length > 0,
  }
}
