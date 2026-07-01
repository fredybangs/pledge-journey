import { CheckCircle2, Edit3, Trash2 } from 'lucide-react'
import {
  donationReceivedAmount,
  donationToDistance,
  donorDisplayName,
  formatDistance,
  formatMoney,
} from '../lib/campaign'
import type { CampaignSettings, Donation, DonationStatus } from '../lib/types'

const statusLabels: Record<DonationStatus, string> = {
  received: 'Received',
  pledged: 'Pledged',
  partially_received: 'Partial',
  cancelled: 'Cancelled',
}

type DonationRowProps = {
  donation: Donation
  settings: CampaignSettings
  onEdit: (donation: Donation) => void
  onDelete: (donation: Donation) => void
  onMarkReceived: (donation: Donation) => void
}

export function DonationRow({
  donation,
  settings,
  onEdit,
  onDelete,
  onMarkReceived,
}: DonationRowProps) {
  const received = donationReceivedAmount(donation)
  const outstanding = Math.max(donation.amount - received, 0)

  return (
    <article className="donation-row">
      <div>
        <strong>
          {donorDisplayName(donation)}
          <small>{donation.reference}</small>
        </strong>
        <span>
          {formatMoney(donation.amount, settings.currency)} -{' '}
          {formatDistance(donationToDistance(donation.amount, settings), settings)}
        </span>
        <em>
          {donation.category}
          {donation.donorContact ? ` - ${donation.donorContact}` : ''}
          {outstanding > 0
            ? ` - ${formatMoney(outstanding, settings.currency)} outstanding`
            : ''}
        </em>
      </div>
      <span className={`status-pill ${donation.status}`}>
        {statusLabels[donation.status]}
      </span>
      <div className="row-actions">
        {(donation.status === 'pledged' ||
          donation.status === 'partially_received') && (
          <button
            type="button"
            title="Mark received"
            onClick={() => onMarkReceived(donation)}
          >
            <CheckCircle2 size={16} />
          </button>
        )}
        <button type="button" title="Edit" onClick={() => onEdit(donation)}>
          <Edit3 size={16} />
        </button>
        <button type="button" title="Delete" onClick={() => onDelete(donation)}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  )
}
