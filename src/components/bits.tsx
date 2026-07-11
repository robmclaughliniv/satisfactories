import type { CSSProperties, ReactNode } from 'react';
import { fmt, initials, itemColor, transportColor } from '../data/gameData';
import type { Flow, FlowLeg } from '../state/flows';

export const SG = "'Space Grotesk'";
export const MONO = "'IBM Plex Mono'";

/** Colored square tile with item initials. */
export function ItemSquare({
  item,
  size = 20,
  radius = 5,
  fontSize = 8,
  color,
  text,
  textColor = '#0C0D11',
  style,
}: {
  item?: string;
  size?: number;
  radius?: number;
  fontSize?: number;
  color?: string;
  text?: string;
  textColor?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color ?? itemColor(item || ''),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        color: textColor,
        flex: '0 0 auto',
        ...style,
      }}
    >
      {text ?? initials(item || '')}
    </span>
  );
}

export function TransportBadge({ t, pad = '1px 5px' }: { t: string; pad?: string }) {
  const c = transportColor(t);
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        color: c,
        border: `1px solid ${c}`,
        borderRadius: 4,
        padding: pad,
        flex: '0 0 auto',
      }}
    >
      {t}
    </span>
  );
}

/**
 * Expandable exports & imports list (used in the map sidebar and factory
 * detail balance panel).
 */
export function FlowList({
  flows,
  expandedFlow,
  keyPrefix = '',
  onToggle,
  emptyText,
  addLeg,
  onLegClick,
}: {
  flows: Flow[];
  expandedFlow: Record<string, boolean>;
  keyPrefix?: string;
  onToggle: (key: string) => void;
  emptyText: string;
  addLeg?: (flow: Flow) => ReactNode;
  onLegClick?: (leg: FlowLeg) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {flows.map((fl) => {
        const exp = !!expandedFlow[keyPrefix + fl.key];
        return (
          <div key={fl.key} style={{ border: '1px solid #20242D', borderRadius: 8, overflow: 'hidden' }}>
            <div
              onClick={() => onToggle(keyPrefix + fl.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', cursor: 'pointer', background: '#0F1116' }}
            >
              <span style={{ width: 11, textAlign: 'center', color: '#5E646E', fontSize: 9 }}>{exp ? '▾' : '▸'}</span>
              <ItemSquare item={fl.item} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fl.item}</div>
                <div style={{ fontSize: 9.5, color: '#6B7280' }}>
                  {fl.legs.length}
                  {fl.legs.length === 1 ? ' source' : ' sources'}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: fl.dir === 'export' ? '#5BCB86' : '#F5A95B' }}>
                {(fl.dir === 'export' ? '↑ ' : '↓ ') + fmt(fl.total) + '/m'}
              </span>
            </div>
            {exp && (
              <div
                style={{
                  borderTop: '1px solid #1A1E25',
                  background: '#0B0C0F',
                  padding: '7px 9px 7px 31px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {fl.legs.map((leg, i) => {
                  const editable = !!(leg.routeId || leg.localInputId);
                  return (
                    <div
                      key={i}
                      onClick={editable && onLegClick ? () => onLegClick(leg) : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: editable && onLegClick ? 'pointer' : undefined,
                        borderRadius: 5,
                        padding: editable && onLegClick ? '2px 4px' : undefined,
                        margin: editable && onLegClick ? '-2px -4px' : undefined,
                      }}
                    >
                      <TransportBadge t={leg.transport} />
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: leg.color, flex: '0 0 auto' }}></span>
                      <span style={{ flex: 1, fontSize: 11, color: '#AEB4BE', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leg.partner}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#9097A1' }}>{fmt(leg.rate) + '/m'}</span>
                    </div>
                  );
                })}
                {addLeg?.(fl)}
              </div>
            )}
          </div>
        );
      })}
      {flows.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>{emptyText}</div>}
    </div>
  );
}

/** Small "Produced here" style row: tile, name, +rate. */
export function ProducedRow({ name, rate, tone = 'green' }: { name: string; rate: string; tone?: 'green' | 'red' }) {
  const green = tone === 'green';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: green ? '#101510' : '#150F0F',
        border: `1px solid ${green ? '#1B2A1E' : '#2A1B1B'}`,
        borderRadius: 7,
        padding: '6px 8px',
      }}
    >
      <ItemSquare item={name} />
      <span style={{ flex: 1, fontSize: 12, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: green ? '#5BCB86' : '#E5604D' }}>{rate}</span>
    </div>
  );
}

export function SectionLabel({ color = '#8A909A', children, mb = 9 }: { color?: string; children: ReactNode; mb?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 10,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color,
        marginBottom: mb,
      }}
    >
      {children}
    </div>
  );
}

export function svgIcon(paths: string, size = 19) {
  return {
    __html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
  };
}
