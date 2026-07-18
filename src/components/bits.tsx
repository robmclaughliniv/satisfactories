import type { CSSProperties, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { fmt, initials, itemColor, transportColor } from '../data/gameData';
import type { Flow, FlowLeg } from '../state/flows';

export const SG = "'Space Grotesk'";
export const MONO = "'IBM Plex Mono'";

const TRASH_ICON =
  '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>';

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

function FlowLegRow({
  leg,
  onLegClick,
  onLegDelete,
  canDeleteLeg,
  actionLabel = 'Edit',
}: {
  leg: FlowLeg;
  onLegClick?: (leg: FlowLeg) => void;
  onLegDelete?: (leg: FlowLeg) => void;
  canDeleteLeg?: (leg: FlowLeg) => boolean;
  actionLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const clickable = !!(leg.routeId || leg.localInputId || leg.stationId) && !!onLegClick;
  const deletable = clickable && !!onLegDelete && (canDeleteLeg ? canDeleteLeg(leg) : true);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={clickable ? () => onLegClick!(leg) : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: clickable ? 'pointer' : undefined,
        borderRadius: 5,
        padding: '2px 4px',
        margin: '-2px -4px',
        background: hovered && clickable ? '#12151B' : undefined,
      }}
    >
      {onLegDelete ? (
        deletable ? (
          <button
            type="button"
            title="Delete source"
            aria-label="Delete source"
            onClick={(e) => {
              e.stopPropagation();
              onLegDelete(leg);
            }}
            style={{
              width: 16,
              height: 16,
              flex: '0 0 auto',
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: '#E5604D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? 'auto' : 'none',
            }}
            dangerouslySetInnerHTML={svgIcon(TRASH_ICON, 13)}
          />
        ) : (
          <span style={{ width: 16, flex: '0 0 auto' }} />
        )
      ) : null}
      <TransportBadge t={leg.transport} />
      <span style={{ width: 7, height: 7, borderRadius: 2, background: leg.color, flex: '0 0 auto' }}></span>
      <span style={{ flex: 1, fontSize: 11, color: '#AEB4BE', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {leg.partner}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#9097A1' }}>{fmt(leg.rate) + '/m'}</span>
      {clickable && <span style={{ fontSize: 9.5, color: '#5E646E' }}>{actionLabel}</span>}
    </div>
  );
}

/** Collapsible section header with chevron toggle. */
export function AccordionSection({
  title,
  count,
  hint,
  icon,
  expanded,
  onToggle,
  children,
  mb = 20,
}: {
  title: string;
  count?: ReactNode;
  hint?: string;
  icon?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  mb?: number;
}) {
  return (
    <div style={{ marginBottom: mb }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: expanded ? 10 : 0,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ width: 11, textAlign: 'center', color: '#5E646E', fontSize: 10, flex: '0 0 auto' }}>{expanded ? '▾' : '▸'}</span>
        {icon}
        <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13, color: '#C2C8D2' }}>{title}</span>
        {count !== undefined && <span style={{ fontSize: 11, color: '#5E646E' }}>{count}</span>}
        {hint && <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#6B7280' }}>{hint}</span>}
      </div>
      {expanded && children}
    </div>
  );
}

export function FavStar({ favorited, onToggle }: { favorited: boolean; onToggle: () => void }) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      style={{ color: favorited ? '#F5A95B' : '#5E646E', fontSize: 14, cursor: 'pointer', flex: '0 0 auto', lineHeight: 1 }}
    >
      {favorited ? '★' : '☆'}
    </span>
  );
}
export function FlowList({
  flows,
  expandedFlow,
  keyPrefix = '',
  onToggle,
  emptyText,
  addLeg,
  onLegClick,
  onLegDelete,
  canDeleteLeg,
  legActionLabel,
  flowHint,
  onReorder,
  favoritedItems,
  onToggleFav,
  onFlowDelete,
  canDeleteFlow,
}: {
  flows: Flow[];
  expandedFlow: Record<string, boolean>;
  keyPrefix?: string;
  onToggle: (key: string) => void;
  emptyText: string;
  addLeg?: (flow: Flow) => ReactNode;
  onLegClick?: (leg: FlowLeg) => void;
  onLegDelete?: (leg: FlowLeg) => void;
  canDeleteLeg?: (leg: FlowLeg) => boolean;
  legActionLabel?: (leg: FlowLeg) => string;
  flowHint?: (flow: Flow) => ReactNode;
  onReorder?: (orderedItems: string[]) => void;
  favoritedItems?: string[];
  onToggleFav?: (item: string) => void;
  onFlowDelete?: (flow: Flow) => void;
  canDeleteFlow?: (flow: Flow) => boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const reorderable = !!onReorder;

  const finishReorder = (from: number, to: number) => {
    if (!onReorder || from === to || from < 0 || to < 0 || from >= flows.length || to >= flows.length) return;
    const next = flows.map((fl) => fl.item);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const clearDrag = () => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {flows.map((fl, index) => {
        const exp = !!expandedFlow[keyPrefix + fl.key];
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
        const deletableFlow = !!onFlowDelete && (canDeleteFlow ? canDeleteFlow(fl) : true);
        const flowHovered = hoveredFlow === fl.key;
        return (
          <div
            key={fl.key}
            onMouseEnter={() => setHoveredFlow(fl.key)}
            onMouseLeave={() => setHoveredFlow(null)}
            onDragOver={(e) => {
              if (!reorderable) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragIndexRef.current !== null && overIndex !== index) setOverIndex(index);
            }}
            onDrop={(e) => {
              if (!reorderable) return;
              e.preventDefault();
              e.stopPropagation();
              const from = dragIndexRef.current ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
              finishReorder(from, index);
              clearDrag();
            }}
            style={{
              border: `1px solid ${isOver ? '#F5882E66' : '#20242D'}`,
              borderRadius: 8,
              overflow: 'visible',
              opacity: isDragging ? 0.55 : 1,
              boxShadow: isOver ? 'inset 0 2px 0 #F5882E' : undefined,
            }}
          >
            <div
              draggable={reorderable}
              onDragStart={(e) => {
                if (!reorderable) return;
                didDragRef.current = true;
                dragIndexRef.current = index;
                setDragIndex(index);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
                // Transparent drag image can fail in some browsers; keep default ghost.
              }}
              onDragEnd={() => {
                // Click fires after dragend — swallow the expand toggle.
                requestAnimationFrame(() => {
                  didDragRef.current = false;
                });
                clearDrag();
              }}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                onToggle(keyPrefix + fl.key);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 9px',
                cursor: reorderable ? 'grab' : 'pointer',
                background: '#0F1116',
                userSelect: 'none',
              }}
            >
              {reorderable && (
                <span
                  title="Drag to reorder"
                  style={{
                    width: 10,
                    color: '#5E646E',
                    fontSize: 11,
                    letterSpacing: -1,
                    flex: '0 0 auto',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                  aria-hidden
                >
                  ⠿
                </span>
              )}
              <span style={{ width: 11, textAlign: 'center', color: '#5E646E', fontSize: 9, pointerEvents: 'none' }}>{exp ? '▾' : '▸'}</span>
              <ItemSquare item={fl.item} />
              <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fl.item}</div>
                <div style={{ fontSize: 9.5, color: '#6B7280' }}>
                  {flowHint ? (
                    flowHint(fl)
                  ) : (
                    <>
                      {fl.legs.length}
                      {fl.legs.length === 1 ? ' source' : ' sources'}
                    </>
                  )}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: fl.dir === 'export' ? '#5BCB86' : '#F5A95B', pointerEvents: 'none' }}>
                {(fl.dir === 'export' ? '↑ ' : '↓ ') + fmt(fl.total) + '/m'}
              </span>
              {onToggleFav && (
                <FavStar favorited={!!favoritedItems?.includes(fl.item)} onToggle={() => onToggleFav(fl.item)} />
              )}
              {onFlowDelete &&
                (deletableFlow ? (
                  <span
                    role="button"
                    tabIndex={0}
                    title="Remove from export list"
                    aria-label="Remove from export list"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlowDelete(fl);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onFlowDelete(fl);
                      }
                    }}
                    style={{
                      width: 20,
                      flex: '0 0 auto',
                      textAlign: 'center',
                      color: flowHovered ? '#E5604D' : '#5E646E',
                      cursor: 'pointer',
                      fontSize: 15,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </span>
                ) : (
                  <span style={{ width: 20, flex: '0 0 auto' }} />
                ))}
            </div>
            {exp && (
              <div
                style={{
                  borderTop: '1px solid #1A1E25',
                  background: '#0B0C0F',
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {fl.legs.map((leg, i) => (
                  <FlowLegRow
                    key={i}
                    leg={leg}
                    onLegClick={onLegClick}
                    onLegDelete={onLegDelete}
                    canDeleteLeg={canDeleteLeg}
                    actionLabel={legActionLabel?.(leg) ?? 'Edit'}
                  />
                ))}
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
export function ProducedRow({
  name,
  rate,
  tone = 'green',
  favorited,
  onToggleFav,
}: {
  name: string;
  rate: string;
  tone?: 'green' | 'red';
  favorited?: boolean;
  onToggleFav?: () => void;
}) {
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
      {onToggleFav && <FavStar favorited={!!favorited} onToggle={onToggleFav} />}
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
