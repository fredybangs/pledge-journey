import {
  donationReceivedAmount,
  donationToDistance,
  donorDisplayName,
  sortDonations,
} from './campaign'
import type { AppState, CampaignSettings, Donation } from './types'

function csvCell(value: string | number | boolean) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function outstandingAmount(donation: Donation) {
  return Math.max(donation.amount - donationReceivedAmount(donation), 0)
}

export function donationsToCsv(
  donations: Donation[],
  settings: CampaignSettings,
) {
  const headers = [
    'Reference',
    'Donor',
    'Contact',
    'Display Name',
    'Amount',
    'Received Amount',
    'Outstanding Amount',
    `Distance (${settings.distanceUnit})`,
    'Status',
    'Category',
    'Payment Type',
    'Payment Reference',
    'Anonymous',
    'Note',
    'Created At',
    'Updated At',
  ]

  const rows = sortDonations(donations).map((item) =>
    [
      item.reference,
      item.donorName,
      item.donorContact,
      donorDisplayName(item),
      item.amount,
      donationReceivedAmount(item),
      outstandingAmount(item),
      donationToDistance(item.amount, settings).toFixed(2),
      item.status,
      item.category,
      item.paymentType,
      item.paymentReference,
      item.anonymous ? 'yes' : 'no',
      item.note,
      item.createdAt,
      item.updatedAt,
    ]
      .map(csvCell)
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

export function outstandingPledgesToCsv(
  donations: Donation[],
  _settings: CampaignSettings,
) {
  const outstanding = donations.filter((item) => outstandingAmount(item) > 0)
  const headers = [
    'Reference',
    'Donor',
    'Contact',
    'Outstanding Amount',
    'Status',
    'Category',
    'Created At',
  ]
  const rows = sortDonations(outstanding).map((item) =>
    [
      item.reference,
      donorDisplayName(item),
      item.donorContact,
      outstandingAmount(item),
      item.status,
      item.category,
      item.createdAt,
    ]
      .map(csvCell)
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

export function campaignBackup(state: AppState) {
  return JSON.stringify(state, null, 2)
}
