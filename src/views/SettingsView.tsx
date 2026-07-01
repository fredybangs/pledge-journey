import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CirclePlus,
  GripVertical,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import {
  CAMPAIGN_TEMPLATES,
  DEFAULT_BEYOND_UNLOCKS,
  DEFAULT_ROUTE_MILESTONES,
  DEFAULT_SETTINGS,
  formatDistance,
  formatMoney,
} from '../lib/campaign'
import {
  normalizeCampaignSettings,
  validateCampaignSettings,
} from '../lib/settingsValidation'
import type {
  BeyondUnlock,
  CampaignSettings,
  DistanceUnit,
  RouteMilestone,
} from '../lib/types'

type SettingsViewProps = {
  settings: CampaignSettings
  onSave: (settings: Partial<CampaignSettings>) => void
}

type RowType = 'routeMilestones' | 'beyondUnlocks'
type DisplayTheme = CampaignSettings['displayTheme']

function createRouteRow(distance = 0): RouteMilestone {
  return {
    id: crypto.randomUUID(),
    label: '',
    distance,
  }
}

function createUnlockRow(distance: number): BeyondUnlock {
  return {
    id: crypto.randomUUID(),
    label: '',
    distance,
  }
}

function nextAvailableDistance(usedDistances: number[], start: number, max?: number) {
  const used = new Set(usedDistances)
  let candidate = start

  while (used.has(candidate) && (max === undefined || candidate <= max)) {
    candidate += 1
  }

  if (max !== undefined && candidate > max) return max
  return candidate
}

function fieldIssue(issues: ReturnType<typeof validateCampaignSettings>, field: string) {
  return issues.find((issue) => issue.field === field)
}

export function SettingsView({ settings, onSave }: SettingsViewProps) {
  const [draft, setDraft] = useState<CampaignSettings>(() => structuredClone(settings))
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    CAMPAIGN_TEMPLATES[0].id,
  )
  const [saved, setSaved] = useState(false)

  const issues = useMemo(() => validateCampaignSettings(draft), [draft])
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  )
  const canSave = issues.length === 0 && isDirty

  function updateField<TField extends keyof CampaignSettings>(
    field: TField,
    value: CampaignSettings[TField],
  ) {
    setSaved(false)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function updateRow(type: RowType, id: string, patch: Partial<RouteMilestone>) {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      [type]: current[type].map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }))
  }

  function addRow(type: RowType) {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      [type]:
        type === 'routeMilestones'
          ? [
              ...current.routeMilestones,
              createRouteRow(
                nextAvailableDistance(
                  current.routeMilestones.map((item) => item.distance),
                  0,
                  current.targetDistance,
                ),
              ),
            ]
          : [
              ...current.beyondUnlocks,
              createUnlockRow(
                nextAvailableDistance(
                  current.beyondUnlocks.map((item) => item.distance),
                  current.targetDistance + 1,
                ),
              ),
            ],
    }))
  }

  function removeRow(type: RowType, id: string) {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      [type]: current[type].filter((item) => item.id !== id),
    }))
  }

  function updateQuickAmount(index: number, value: number) {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      quickAmounts: current.quickAmounts.map((amount, itemIndex) =>
        itemIndex === index ? value : amount,
      ),
    }))
  }

  function addQuickAmount() {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      quickAmounts: [
        ...current.quickAmounts,
        nextAvailableDistance(current.quickAmounts, current.costPerUnit || 1),
      ],
    }))
  }

  function removeQuickAmount(index: number) {
    setSaved(false)
    setDraft((current) => ({
      ...current,
      quickAmounts: current.quickAmounts.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function reorderRows(type: RowType, sourceId: string, targetId: string) {
    if (sourceId === targetId) return

    setSaved(false)
    setDraft((current) => {
      const rows = [...current[type]]
      const sourceIndex = rows.findIndex((item) => item.id === sourceId)
      const targetIndex = rows.findIndex((item) => item.id === targetId)

      if (sourceIndex < 0 || targetIndex < 0) return current

      const [moved] = rows.splice(sourceIndex, 1)
      rows.splice(targetIndex, 0, moved)

      return {
        ...current,
        [type]: rows,
      }
    })
  }

  function resetToPreset() {
    const confirmed = window.confirm(
      'Reset campaign settings to the Road to Mile 91 preset?',
    )
    if (!confirmed) return

    setSaved(false)
    setDraft({
      ...DEFAULT_SETTINGS,
      routeMilestones: [...DEFAULT_ROUTE_MILESTONES],
      beyondUnlocks: [...DEFAULT_BEYOND_UNLOCKS],
    })
  }

  function applyTemplate() {
    const template = CAMPAIGN_TEMPLATES.find((item) => item.id === selectedTemplate)
    if (!template) return

    const confirmed = window.confirm(
      `Apply the "${template.label}" template? This replaces the current draft settings.`,
    )
    if (!confirmed) return

    setSaved(false)
    setDraft(structuredClone(template.settings))
  }

  function discardChanges() {
    setSaved(false)
    setDraft(structuredClone(settings))
  }

  function saveSettings() {
    const normalized = normalizeCampaignSettings(draft)
    onSave(normalized)
    setDraft(normalized)
    setSaved(true)
  }

  return (
    <main className="work-view settings-view">
      <header className="view-header settings-header">
        <div>
          <p className="eyebrow">Campaign setup</p>
          <h1>Settings</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-button" type="button" onClick={discardChanges} disabled={!isDirty}>
            <RotateCcw size={17} />
            Discard
          </button>
          <button className="ghost-button" type="button" onClick={resetToPreset}>
            <RotateCcw size={17} />
            Mile 91 Preset
          </button>
          <button className="primary-button" type="button" onClick={saveSettings} disabled={!canSave}>
            <Save size={17} />
            Save Settings
          </button>
        </div>
      </header>

      {saved && (
        <section className="settings-status success">
          <CheckCircle2 size={18} />
          Settings saved. Open the display tab to see the updated route.
        </section>
      )}

      {issues.length > 0 && (
        <section className="settings-status error">
          <AlertCircle size={18} />
          Fix {issues.length} setting issue{issues.length === 1 ? '' : 's'} before saving.
        </section>
      )}

      <section className="settings-card template-card">
        <div className="settings-card-header">
          <div>
            <h2>Campaign Template</h2>
            <p>Start from a complete setup, then adjust the values below.</p>
          </div>
          <button className="ghost-button" type="button" onClick={applyTemplate}>
            Apply Template
          </button>
        </div>
        <label>
          Template
          <select
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
          >
            {CAMPAIGN_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-layout">
        <article className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Campaign Identity</h2>
              <p>Public text shown on the display and reports.</p>
            </div>
          </div>
          <div className="settings-form-grid">
            <TextField
              label="Campaign name"
              value={draft.title}
              error={fieldIssue(issues, 'title')?.message}
              onChange={(value) => updateField('title', value)}
            />
            <TextField
              label="Organization"
              value={draft.organizer}
              error={fieldIssue(issues, 'organizer')?.message}
              onChange={(value) => updateField('organizer', value)}
            />
            <TextField
              label="Start point"
              value={draft.startPoint}
              error={fieldIssue(issues, 'startPoint')?.message}
              onChange={(value) => updateField('startPoint', value)}
            />
            <TextField
              label="Destination"
              value={draft.destination}
              error={fieldIssue(issues, 'destination')?.message}
              onChange={(value) => updateField('destination', value)}
            />
            <TextField
              label="Currency"
              value={draft.currency}
              error={fieldIssue(issues, 'currency')?.message}
              onChange={(value) => updateField('currency', value)}
            />
            <TextField
              label="Pledge unit name"
              value={draft.pledgeName}
              error={fieldIssue(issues, 'pledgeName')?.message}
              onChange={(value) => updateField('pledgeName', value)}
              placeholder="mile, kilometer, lap, step"
            />
            <label>
              Distance unit
              <select
                value={draft.distanceUnit}
                onChange={(event) =>
                  updateField('distanceUnit', event.target.value as DistanceUnit)
                }
              >
                <option value="mi">Miles</option>
                <option value="km">Kilometers</option>
              </select>
            </label>
            <label>
              Display theme
              <select
                value={draft.displayTheme}
                onChange={(event) =>
                  updateField('displayTheme', event.target.value as DisplayTheme)
                }
              >
                <option value="sierra-leone">Sierra Leone</option>
                <option value="bright">Bright Rally</option>
                <option value="night">Night Stage</option>
                <option value="simple">Simple Board</option>
              </select>
            </label>
            <NumberField
              label="Cost per unit"
              value={draft.costPerUnit}
              error={fieldIssue(issues, 'costPerUnit')?.message}
              onChange={(value) => updateField('costPerUnit', value)}
            />
            <NumberField
              label="Target distance"
              value={draft.targetDistance}
              error={fieldIssue(issues, 'targetDistance')?.message}
              onChange={(value) => updateField('targetDistance', value)}
            />
            <label className="settings-wide-field">
              Pledge message
              <input
                value={draft.milestoneText}
                onChange={(event) => updateField('milestoneText', event.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="settings-card settings-preview">
          <div className="settings-card-header">
            <div>
              <h2>Campaign Math</h2>
              <p>How the app converts money into progress.</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>One unit costs</dt>
              <dd>{formatMoney(draft.costPerUnit || 0, draft.currency || 'Le')}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{formatDistance(draft.targetDistance || 0, draft)}</dd>
            </div>
            <div>
              <dt>Target amount</dt>
              <dd>
                {formatMoney(
                  (draft.costPerUnit || 0) * (draft.targetDistance || 0),
                  draft.currency || 'Le',
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <article className="settings-card quick-amount-card">
        <div className="settings-card-header">
          <div>
            <h2>Quick Amounts</h2>
            <p>Buttons shown on the donation entry screen.</p>
          </div>
          <button className="ghost-button" type="button" onClick={addQuickAmount}>
            <CirclePlus size={17} />
            Add Amount
          </button>
        </div>
        {fieldIssue(issues, 'quickAmounts') && (
          <p className="settings-row-error">
            {fieldIssue(issues, 'quickAmounts')?.message}
          </p>
        )}
        <div className="quick-amount-list">
          {draft.quickAmounts.map((amount, index) => {
            const amountIssue = fieldIssue(issues, `quickAmounts.${index}`)

            return (
              <label key={`${amount}-${index}`} className={amountIssue ? 'field-invalid' : ''}>
                Amount {index + 1}
                <span className="key-pair-row">
                  <input
                    min={1}
                    type="number"
                    value={Number.isFinite(amount) ? amount : 0}
                    onChange={(event) =>
                      updateQuickAmount(index, Number(event.target.value))
                    }
                  />
                  <button
                    className="row-danger-button"
                    type="button"
                    title="Remove amount"
                    onClick={() => removeQuickAmount(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
                {amountIssue && <small>{amountIssue.message}</small>}
              </label>
            )
          })}
        </div>
      </article>

      <SettingsRows
        title="Route checkpoints"
        description="Each location must have a unique distance from the start. Include distance 0 and the destination distance."
        items={draft.routeMilestones}
        issues={issues}
        type="routeMilestones"
        targetDistance={draft.targetDistance}
        distanceUnit={draft.distanceUnit}
        onAdd={() => addRow('routeMilestones')}
        onRemove={(id) => removeRow('routeMilestones', id)}
        onChange={(id, patch) => updateRow('routeMilestones', id, patch)}
        onReorder={(sourceId, targetId) =>
          reorderRows('routeMilestones', sourceId, targetId)
        }
      />

      <SettingsRows
        title="Beyond-target unlocks"
        description="Unlock distances must be greater than the target distance and should each be unique."
        items={draft.beyondUnlocks}
        issues={issues}
        type="beyondUnlocks"
        targetDistance={draft.targetDistance}
        distanceUnit={draft.distanceUnit}
        onAdd={() => addRow('beyondUnlocks')}
        onRemove={(id) => removeRow('beyondUnlocks', id)}
        onChange={(id, patch) => updateRow('beyondUnlocks', id, patch)}
        onReorder={(sourceId, targetId) =>
          reorderRows('beyondUnlocks', sourceId, targetId)
        }
      />
    </main>
  )
}

type TextFieldProps = {
  label: string
  value: string
  error?: string
  placeholder?: string
  onChange: (value: string) => void
}

function TextField({ label, value, error, placeholder, onChange }: TextFieldProps) {
  return (
    <label className={error ? 'field-invalid' : ''}>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <small>{error}</small>}
    </label>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  error?: string
  onChange: (value: number) => void
}

function NumberField({ label, value, error, onChange }: NumberFieldProps) {
  return (
    <label className={error ? 'field-invalid' : ''}>
      {label}
      <input
        min={0}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {error && <small>{error}</small>}
    </label>
  )
}

type SettingsRowsProps<TItem extends RouteMilestone | BeyondUnlock> = {
  title: string
  description: string
  items: TItem[]
  issues: ReturnType<typeof validateCampaignSettings>
  type: RowType
  targetDistance: number
  distanceUnit: DistanceUnit
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, patch: Partial<TItem>) => void
  onReorder: (sourceId: string, targetId: string) => void
}

function SettingsRows<TItem extends RouteMilestone | BeyondUnlock>({
  title,
  description,
  items,
  issues,
  type,
  targetDistance,
  distanceUnit,
  onAdd,
  onRemove,
  onChange,
  onReorder,
}: SettingsRowsProps<TItem>) {
  const groupIssue = fieldIssue(issues, type)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function startDrag(event: DragEvent<HTMLButtonElement>, id: string) {
    setDraggedId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }

  function allowDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function dropRow(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault()
    const sourceId = draggedId || event.dataTransfer.getData('text/plain')

    if (sourceId) onReorder(sourceId, targetId)
    setDraggedId(null)
  }

  return (
    <article className="settings-card settings-rows-card">
      <div className="settings-card-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="ghost-button" type="button" onClick={onAdd}>
          <CirclePlus size={17} />
          Add Row
        </button>
      </div>

      {groupIssue && <p className="settings-row-error">{groupIssue.message}</p>}

      <div className="settings-row-table">
        <div className="settings-row-head">
          <span>Order</span>
          <span>Name</span>
          <span>Distance from start</span>
          <span>Rule</span>
          <span>Action</span>
        </div>
        {items.map((item) => {
          const labelError = fieldIssue(issues, `${type}.${item.id}.label`)
          const distanceError = fieldIssue(issues, `${type}.${item.id}.distance`)

          return (
            <div
              className={`settings-row ${draggedId === item.id ? 'dragging' : ''}`}
              key={item.id}
              onDragOver={allowDrop}
              onDrop={(event) => dropRow(event, item.id)}
            >
              <button
                className="drag-handle"
                draggable
                type="button"
                title="Drag to arrange"
                onDragStart={(event) => startDrag(event, item.id)}
                onDragEnd={() => setDraggedId(null)}
              >
                <GripVertical size={18} />
              </button>
              <label className={labelError ? 'field-invalid' : ''}>
                <span className="sr-only">Name</span>
                <input
                  value={item.label}
                  onChange={(event) =>
                    onChange(item.id, { label: event.target.value } as Partial<TItem>)
                  }
                  placeholder={type === 'routeMilestones' ? 'Town or checkpoint' : 'Unlock name'}
                />
                {labelError && <small>{labelError.message}</small>}
              </label>
              <label className={distanceError ? 'field-invalid' : ''}>
                <span className="sr-only">Distance</span>
                <input
                  min={0}
                  type="number"
                  value={Number.isFinite(item.distance) ? item.distance : 0}
                  onChange={(event) =>
                    onChange(item.id, {
                      distance: Number(event.target.value),
                    } as Partial<TItem>)
                  }
                />
                {distanceError && <small>{distanceError.message}</small>}
              </label>
              <span className="settings-row-rule">
                {type === 'routeMilestones'
                  ? `0-${targetDistance} ${distanceUnit}`
                  : `>${targetDistance} ${distanceUnit}`}
              </span>
              <button
                className="row-danger-button"
                type="button"
                title="Remove row"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </article>
  )
}
