import type { BeyondUnlock, CampaignSettings, RouteMilestone } from './types'

export type ValidationIssue = {
  field: string
  message: string
}

function trimmed(value: string) {
  return value.trim()
}

function findDuplicateDistances(items: Array<RouteMilestone | BeyondUnlock>) {
  const seen = new Map<number, string>()
  const duplicates = new Set<number>()

  items.forEach((item) => {
    if (seen.has(item.distance)) duplicates.add(item.distance)
    seen.set(item.distance, item.label)
  })

  return [...duplicates].sort((a, b) => a - b)
}

function findDuplicateNumbers(values: number[]) {
  const seen = new Set<number>()
  const duplicates = new Set<number>()

  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  })

  return [...duplicates].sort((a, b) => a - b)
}

export function validateCampaignSettings(settings: CampaignSettings) {
  const issues: ValidationIssue[] = []

  if (!trimmed(settings.title)) {
    issues.push({ field: 'title', message: 'Campaign name is required.' })
  }

  if (!trimmed(settings.organizer)) {
    issues.push({ field: 'organizer', message: 'Organization name is required.' })
  }

  if (!trimmed(settings.startPoint)) {
    issues.push({ field: 'startPoint', message: 'Start point is required.' })
  }

  if (!trimmed(settings.destination)) {
    issues.push({ field: 'destination', message: 'Destination is required.' })
  }

  if (!trimmed(settings.currency)) {
    issues.push({ field: 'currency', message: 'Currency label is required.' })
  }

  if (!trimmed(settings.pledgeName)) {
    issues.push({ field: 'pledgeName', message: 'Pledge unit name is required.' })
  }

  if (!Number.isFinite(settings.costPerUnit) || settings.costPerUnit <= 0) {
    issues.push({ field: 'costPerUnit', message: 'Cost per unit must be above 0.' })
  }

  if (!Number.isFinite(settings.targetDistance) || settings.targetDistance <= 0) {
    issues.push({ field: 'targetDistance', message: 'Target distance must be above 0.' })
  }

  if (settings.quickAmounts.length === 0) {
    issues.push({
      field: 'quickAmounts',
      message: 'Add at least one quick amount.',
    })
  }

  settings.quickAmounts.forEach((amount, index) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      issues.push({
        field: `quickAmounts.${index}`,
        message: `Quick amount ${index + 1} must be above 0.`,
      })
    }
  })

  const quickAmountDuplicates = findDuplicateNumbers(settings.quickAmounts)
  if (quickAmountDuplicates.length > 0) {
    issues.push({
      field: 'quickAmounts',
      message: `Quick amounts must be unique. Duplicate: ${quickAmountDuplicates.join(', ')}.`,
    })
  }

  if (settings.routeMilestones.length < 2) {
    issues.push({
      field: 'routeMilestones',
      message: 'Add at least a start and destination checkpoint.',
    })
  }

  settings.routeMilestones.forEach((item, index) => {
    if (!trimmed(item.label)) {
      issues.push({
        field: `routeMilestones.${item.id}.label`,
        message: `Checkpoint ${index + 1} needs a name.`,
      })
    }

    if (!Number.isFinite(item.distance) || item.distance < 0) {
      issues.push({
        field: `routeMilestones.${item.id}.distance`,
        message: `${item.label || `Checkpoint ${index + 1}`} needs a valid distance.`,
      })
    }

    if (item.distance > settings.targetDistance) {
      issues.push({
        field: `routeMilestones.${item.id}.distance`,
        message: `${item.label || `Checkpoint ${index + 1}`} cannot be beyond the target distance.`,
      })
    }
  })

  const routeDuplicates = findDuplicateDistances(settings.routeMilestones)
  if (routeDuplicates.length > 0) {
    issues.push({
      field: 'routeMilestones',
      message: `Checkpoint distances must be unique. Duplicate: ${routeDuplicates.join(', ')}.`,
    })
  }

  const hasStart = settings.routeMilestones.some((item) => item.distance === 0)
  if (!hasStart) {
    issues.push({
      field: 'routeMilestones',
      message: 'Route checkpoints must include a start point at distance 0.',
    })
  }

  const hasTarget = settings.routeMilestones.some(
    (item) => item.distance === settings.targetDistance,
  )
  if (!hasTarget) {
    issues.push({
      field: 'routeMilestones',
      message: 'Route checkpoints must include the destination at the target distance.',
    })
  }

  settings.beyondUnlocks.forEach((item, index) => {
    if (!trimmed(item.label)) {
      issues.push({
        field: `beyondUnlocks.${item.id}.label`,
        message: `Unlock ${index + 1} needs a name.`,
      })
    }

    if (!Number.isFinite(item.distance)) {
      issues.push({
        field: `beyondUnlocks.${item.id}.distance`,
        message: `${item.label || `Unlock ${index + 1}`} needs a valid distance.`,
      })
    }

    if (item.distance <= settings.targetDistance) {
      issues.push({
        field: `beyondUnlocks.${item.id}.distance`,
        message: `${item.label || `Unlock ${index + 1}`} must be beyond the target distance.`,
      })
    }
  })

  const unlockDuplicates = findDuplicateDistances(settings.beyondUnlocks)
  if (unlockDuplicates.length > 0) {
    issues.push({
      field: 'beyondUnlocks',
      message: `Beyond-target unlock distances must be unique. Duplicate: ${unlockDuplicates.join(', ')}.`,
    })
  }

  return issues
}

export function settingsAreValid(settings: CampaignSettings) {
  return validateCampaignSettings(settings).length === 0
}

export function normalizeCampaignSettings(settings: CampaignSettings): CampaignSettings {
  return {
    ...settings,
    title: settings.title.trim(),
    organizer: settings.organizer.trim(),
    startPoint: settings.startPoint.trim(),
    destination: settings.destination.trim(),
    currency: settings.currency.trim(),
    pledgeName: settings.pledgeName.trim(),
    milestoneText: settings.milestoneText.trim(),
    quickAmounts: [...settings.quickAmounts].sort((a, b) => a - b),
    routeMilestones: settings.routeMilestones.map((item) => ({
      ...item,
      label: item.label.trim(),
    })),
    beyondUnlocks: settings.beyondUnlocks.map((item) => ({
      ...item,
      label: item.label.trim(),
    })),
  }
}
