export type DonationStatus = 'received' | 'pledged' | 'partially_received' | 'cancelled'

export type PaymentType =
  | 'Cash'
  | 'Orange Money'
  | 'Afrimoney'
  | 'Bank'
  | 'Pledge'
  | 'Other'

export type DonationCategory =
  | 'General'
  | 'Transport'
  | 'Meals'
  | 'Materials'
  | 'Camp Support'
  | 'Other'

export type DistanceUnit = 'mi' | 'km'

export type RouteMilestone = {
  id: string
  label: string
  distance: number
}

export type BeyondUnlock = {
  id: string
  label: string
  distance: number
}

export type CampaignSettings = {
  title: string
  organizer: string
  startPoint: string
  destination: string
  currency: string
  pledgeName: string
  costPerUnit: number
  targetDistance: number
  distanceUnit: DistanceUnit
  milestoneText: string
  routeMilestones: RouteMilestone[]
  beyondUnlocks: BeyondUnlock[]
  quickAmounts: number[]
  displayTheme: 'sierra-leone' | 'bright' | 'night' | 'simple'
}

export type Donation = {
  id: string
  reference: string
  donorName: string
  donorContact: string
  amount: number
  receivedAmount: number
  status: DonationStatus
  paymentType: PaymentType
  paymentReference: string
  category: DonationCategory
  anonymous: boolean
  note: string
  createdAt: string
  updatedAt: string
}

export type AuditAction =
  | 'donation_created'
  | 'donation_updated'
  | 'donation_deleted'
  | 'donation_marked_received'
  | 'donations_cleared'
  | 'settings_updated'
  | 'backup_imported'
  | 'backup_exported'

export type AuditEntry = {
  id: string
  action: AuditAction
  message: string
  donationReference?: string
  createdAt: string
}

export type BackupMeta = {
  lastExportedAt?: string
  donationCountAtLastExport: number
}

export type AppState = {
  settings: CampaignSettings
  donations: Donation[]
  auditLog: AuditEntry[]
  backupMeta: BackupMeta
}

export type CampaignStats = {
  committed: number
  received: number
  pledged: number
  cancelled: number
  distance: number
  targetDistance: number
  percent: number
  beyondDistance: number
  remainingDistance: number
  donorCount: number
  latest?: Donation
  outstandingPledgeCount: number
}
