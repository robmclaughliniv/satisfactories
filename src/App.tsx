import { Header } from './components/Header';
import { NavRail } from './components/NavRail';
import { AddExportResourceModal } from './components/modals/AddExportResourceModal';
import { FactoryModal } from './components/modals/FactoryModal';
import { LocalInputModal } from './components/modals/LocalInputModal';
import { RouteModal } from './components/modals/RouteModal';
import { StationEditModal } from './components/modals/StationEditModal';
import { FactoriesScreen } from './components/screens/FactoriesScreen';
import { FactoryScreen } from './components/screens/FactoryScreen';
import { MapScreen } from './components/screens/MapScreen';
import { ReferenceScreen } from './components/screens/ReferenceScreen';
import { DrillDrawer, RollupScreen } from './components/screens/RollupScreen';
import { WorldsScreen } from './components/screens/WorldsScreen';
import { StoreProvider, useStore } from './state/store';

function Shell() {
  // Effective screen from the store: world-bound screens (map, factory,
  // factories, rollup) fall back to 'worlds' when no world is active.
  const { screen } = useStore();
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        background: '#0B0C0F',
        color: '#E7E9ED',
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      <NavRail />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {screen === 'map' && <MapScreen />}
          {screen === 'factory' && <FactoryScreen />}
          {screen === 'factories' && <FactoriesScreen />}
          {screen === 'rollup' && <RollupScreen />}
          {screen === 'reference' && <ReferenceScreen />}
          {screen === 'worlds' && <WorldsScreen />}
        </main>
      </div>
      <FactoryModal />
      <RouteModal />
      <LocalInputModal />
      <AddExportResourceModal />
      <StationEditModal />
      <DrillDrawer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
