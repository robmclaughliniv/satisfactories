import { Header } from './components/Header';
import { NavRail } from './components/NavRail';
import { FactoryModal } from './components/modals/FactoryModal';
import { RouteModal } from './components/modals/RouteModal';
import { FactoryScreen } from './components/screens/FactoryScreen';
import { MapScreen } from './components/screens/MapScreen';
import { ReferenceScreen } from './components/screens/ReferenceScreen';
import { DrillDrawer, RollupScreen } from './components/screens/RollupScreen';
import { WorldsScreen } from './components/screens/WorldsScreen';
import { StoreProvider, useStore } from './state/store';

function Shell() {
  const { st } = useStore();
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
          {st.screen === 'map' && <MapScreen />}
          {st.screen === 'factory' && <FactoryScreen />}
          {st.screen === 'rollup' && <RollupScreen />}
          {st.screen === 'reference' && <ReferenceScreen />}
          {st.screen === 'worlds' && <WorldsScreen />}
        </main>
      </div>
      <FactoryModal />
      <RouteModal />
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
