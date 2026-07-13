import type { CSSProperties } from 'react';
import { SG, svgIcon } from './bits';
import { useStore } from '../state/store';
import type { Screen } from '../types';

const icons: Record<string, string> = {
  map: '<polygon points="9 3 9 18 3 21 3 6 9 3"/><polygon points="15 6 15 21 21 18 21 3 15 6"/><line x1="9" y1="3" x2="15" y2="6"/><line x1="9" y1="18" x2="15" y2="21"/>',
  factories: '<rect x="3" y="10" width="7" height="11"/><rect x="14" y="3" width="7" height="18"/><line x1="6.5" y1="14" x2="6.5" y2="14.01"/><line x1="17.5" y1="7" x2="17.5" y2="7.01"/><line x1="17.5" y1="11" x2="17.5" y2="11.01"/>',
  rollup: '<line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="18" y1="20" x2="18" y2="14"/>',
  reference: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  worlds: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
};

function navStyle(active: boolean, disabled = false): CSSProperties {
  return {
    width: 52,
    padding: '7px 0 5px',
    borderRadius: 10,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: active ? 'rgba(245,136,46,.14)' : 'transparent',
    color: active ? '#F5A95B' : disabled ? '#3D434C' : '#727A85',
    transition: 'all .12s',
  };
}

const NAV_ITEMS: { key: Screen; label: string; needsWorld: boolean }[] = [
  { key: 'map', label: 'Map', needsWorld: true },
  { key: 'factories', label: 'Factories', needsWorld: true },
  { key: 'rollup', label: 'Resources', needsWorld: true },
  { key: 'reference', label: 'Reference', needsWorld: false },
];

export function NavRail() {
  const { world, screen, go } = useStore();
  return (
    <nav
      data-m-nav=""
      style={{
        width: 66,
        flex: '0 0 66px',
        background: '#0E0F13',
        borderRight: '1px solid #1E222B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 3,
        zIndex: 30,
      }}
    >
      <div
        data-m-logo=""
        onClick={() => go(world ? 'map' : 'worlds')}
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: 'linear-gradient(150deg,#F5882E,#E5651F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SG,
          fontWeight: 700,
          fontSize: 17,
          color: '#120A03',
          marginBottom: 10,
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(245,136,46,.35)',
        }}
      >
        S
      </div>
      {NAV_ITEMS.map((item) => {
        const disabled = item.needsWorld && !world;
        return (
          <button
            key={item.key}
            onClick={() => !disabled && go(item.key)}
            disabled={disabled}
            title={disabled ? `${item.label} — select a world first` : item.label}
            style={navStyle(screen === item.key, disabled)}
          >
            <span style={{ display: 'flex' }} dangerouslySetInnerHTML={svgIcon(icons[item.key])} />
            <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '.01em' }}>{item.label}</span>
          </button>
        );
      })}
      <div data-m-navspacer="" style={{ flex: 1 }}></div>
      <div data-m-navspacer="" style={{ width: 28, height: 1, background: '#20242D', margin: '2px 0 4px' }}></div>
      <button onClick={() => go('worlds')} title="Worlds" style={navStyle(screen === 'worlds')}>
        <span style={{ display: 'flex' }} dangerouslySetInnerHTML={svgIcon(icons.worlds)} />
        <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '.01em' }}>Worlds</span>
      </button>
    </nav>
  );
}
