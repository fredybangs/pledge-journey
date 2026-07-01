import { AppShell } from './components/AppShell'
import { useCampaignState } from './hooks/useCampaignState'
import { useRoute } from './hooks/useRoute'
import { AdminView } from './views/AdminView'
import { DisplayView } from './views/DisplayView'
import { SettingsView } from './views/SettingsView'
import { SummaryView } from './views/SummaryView'
import './App.css'

function App() {
  const route = useRoute()
  const campaign = useCampaignState()
  const { state, stats } = campaign

  return (
    <AppShell route={route} settings={state.settings} stats={stats}>
      {route === 'admin' && (
        <AdminView
          state={state}
          stats={stats}
          upsertDonation={campaign.upsertDonation}
          deleteDonation={campaign.deleteDonation}
          clearDonations={campaign.clearDonations}
          addDonations={campaign.addDonations}
          importBackup={campaign.importBackup}
          markBackupExported={campaign.markBackupExported}
          undoLastAction={campaign.undoLastAction}
          canUndo={campaign.canUndo}
        />
      )}
      {route === 'display' && (
        <DisplayView
          donations={state.donations}
          settings={state.settings}
          stats={stats}
        />
      )}
      {route === 'summary' && (
        <SummaryView
          state={state}
          stats={stats}
          markBackupExported={campaign.markBackupExported}
        />
      )}
      {route === 'settings' && (
        <SettingsView settings={state.settings} onSave={campaign.updateSettings} />
      )}
    </AppShell>
  )
}

export default App
