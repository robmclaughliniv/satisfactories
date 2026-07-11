import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { readPersistedLayout, writePersistedLayout } from './usePersistedLayout';

export type SideConfig = {
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  collapsible?: boolean;
};

type SplitLayoutProps = {
  id: string;
  left?: SideConfig;
  right?: SideConfig;
  panes: { left?: ReactNode; main: ReactNode; right?: ReactNode };
  /** Adds data-m-screen + absolute fill positioning */
  screen?: boolean;
  /** Adds data-m-stack for mobile vertical stacking */
  stackOnMobile?: boolean;
  style?: CSSProperties;
};

const MAIN_MIN = 240;
const MOBILE_BP = 760;
const HANDLE_W = 5;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function sideMin(cfg: SideConfig) {
  return cfg.minWidth ?? 160;
}

function sideMax(cfg: SideConfig) {
  return cfg.maxWidth ?? 520;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const fn = () => setMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return mobile;
}

function ResizeHandle({
  side,
  onDragStart,
  onCollapse,
  collapsible,
}: {
  side: 'left' | 'right';
  onDragStart: (e: ReactMouseEvent) => void;
  onCollapse?: () => void;
  collapsible?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      data-m-split-handle=""
      role="separator"
      aria-orientation="vertical"
      aria-label={side === 'left' ? 'Resize left panel' : 'Resize right panel'}
      onMouseDown={onDragStart}
      onDoubleClick={collapsible ? onCollapse : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: HANDLE_W,
        flex: `0 0 ${HANDLE_W}px`,
        cursor: 'col-resize',
        background: hover ? '#2A3140' : '#1A1E25',
        position: 'relative',
        zIndex: 4,
        transition: 'background .12s ease',
      }}
    >
      {collapsible && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={side === 'left' ? 'Collapse left panel' : 'Collapse right panel'}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onCollapse?.();
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 22,
            border: '1px solid #2E343F',
            borderRadius: 4,
            background: '#15171D',
            color: '#727A85',
            fontSize: 8,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {side === 'left' ? '‹' : '›'}
        </button>
      )}
    </div>
  );
}

function CollapseTab({ side, onExpand }: { side: 'left' | 'right'; onExpand: () => void }) {
  return (
    <button
      type="button"
      data-m-split-tab=""
      aria-label={side === 'left' ? 'Show left panel' : 'Show right panel'}
      onClick={onExpand}
      style={{
        position: 'absolute',
        top: '50%',
        left: side === 'left' ? 0 : undefined,
        right: side === 'right' ? 0 : undefined,
        transform: 'translateY(-50%)',
        width: 16,
        height: 36,
        border: '1px solid #2E343F',
        borderRadius: side === 'left' ? '0 6px 6px 0' : '6px 0 0 6px',
        borderLeft: side === 'right' ? '1px solid #2E343F' : undefined,
        borderRight: side === 'left' ? '1px solid #2E343F' : undefined,
        background: '#15171D',
        color: '#9097A1',
        fontSize: 10,
        cursor: 'pointer',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {side === 'left' ? '›' : '‹'}
    </button>
  );
}

export function SplitLayout({ id, left, right, panes, screen, stackOnMobile, style }: SplitLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const persisted = useRef(readPersistedLayout(id));

  const [leftWidth, setLeftWidth] = useState(() => {
    const p = persisted.current?.leftWidth;
    if (p != null && left) return clamp(p, sideMin(left), sideMax(left));
    return left?.defaultWidth ?? 0;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const p = persisted.current?.rightWidth;
    if (p != null && right) return clamp(p, sideMin(right), sideMax(right));
    return right?.defaultWidth ?? 0;
  });
  const [leftOpen, setLeftOpen] = useState(() => persisted.current?.leftOpen ?? true);
  const [rightOpen, setRightOpen] = useState(() => persisted.current?.rightOpen ?? true);

  const persist = useCallback(
    (patch: Partial<{ leftWidth: number; rightWidth: number; leftOpen: boolean; rightOpen: boolean }>) => {
      const next = {
        leftWidth: patch.leftWidth ?? leftWidth,
        rightWidth: patch.rightWidth ?? rightWidth,
        leftOpen: patch.leftOpen ?? leftOpen,
        rightOpen: patch.rightOpen ?? rightOpen,
      };
      writePersistedLayout(id, next);
    },
    [id, leftWidth, rightWidth, leftOpen, rightOpen],
  );

  const clampLeft = useCallback(
    (w: number, containerW: number) => {
      if (!left) return w;
      const rightSpace = right && (mobile || rightOpen) ? rightWidth + HANDLE_W : 0;
      const handleSpace = HANDLE_W;
      const max = Math.min(sideMax(left), containerW - MAIN_MIN - rightSpace - handleSpace - (right && (mobile || rightOpen) ? HANDLE_W : 0));
      return clamp(w, sideMin(left), max);
    },
    [left, right, rightWidth, rightOpen, mobile],
  );

  const clampRight = useCallback(
    (w: number, containerW: number) => {
      if (!right) return w;
      const leftSpace = left && (mobile || leftOpen) ? leftWidth + HANDLE_W : 0;
      const handleSpace = HANDLE_W;
      const max = Math.min(sideMax(right), containerW - MAIN_MIN - leftSpace - handleSpace - (left && (mobile || leftOpen) ? HANDLE_W : 0));
      return clamp(w, sideMin(right), max);
    },
    [left, right, leftWidth, leftOpen, mobile],
  );

  useEffect(() => {
    if (mobile) return;
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      setLeftWidth((w) => clampLeft(w, cw));
      setRightWidth((w) => clampRight(w, cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile, clampLeft, clampRight]);

  const startLeftDrag = useCallback(
    (e: ReactMouseEvent) => {
      if (mobile || !left) return;
      e.preventDefault();
      const startX = e.clientX;
      const startW = leftWidth;
      const containerW = rootRef.current?.clientWidth ?? window.innerWidth;

      const move = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const next = clampLeft(startW + delta, containerW);
        setLeftWidth(next);
      };
      const finish = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', finish);
        setLeftWidth((w) => {
          const cw = rootRef.current?.clientWidth ?? window.innerWidth;
          const clamped = clampLeft(w, cw);
          persist({ leftWidth: clamped });
          return clamped;
        });
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', finish);
    },
    [mobile, left, leftWidth, clampLeft, persist],
  );

  const startRightDrag = useCallback(
    (e: ReactMouseEvent) => {
      if (mobile || !right) return;
      e.preventDefault();
      const startX = e.clientX;
      const startW = rightWidth;
      const containerW = rootRef.current?.clientWidth ?? window.innerWidth;

      const move = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const next = clampRight(startW + delta, containerW);
        setRightWidth(next);
      };
      const finish = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', finish);
        setRightWidth((w) => {
          const cw = rootRef.current?.clientWidth ?? window.innerWidth;
          const clamped = clampRight(w, cw);
          persist({ rightWidth: clamped });
          return clamped;
        });
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', finish);
    },
    [mobile, right, rightWidth, clampRight, persist],
  );

  const collapseLeft = useCallback(() => {
    setLeftOpen(false);
    persist({ leftOpen: false });
  }, [persist]);

  const collapseRight = useCallback(() => {
    setRightOpen(false);
    persist({ rightOpen: false });
  }, [persist]);

  const expandLeft = useCallback(() => {
    setLeftOpen(true);
    persist({ leftOpen: true });
  }, [persist]);

  const expandRight = useCallback(() => {
    setRightOpen(true);
    persist({ rightOpen: true });
  }, [persist]);

  const showLeft = mobile || leftOpen;
  const showRight = mobile || rightOpen;
  const leftCollapsible = !mobile && (left?.collapsible ?? true);
  const rightCollapsible = !mobile && (right?.collapsible ?? true);

  const rootStyle: CSSProperties = {
    display: 'flex',
    overflow: 'hidden',
    ...(screen ? { position: 'absolute', inset: 0 } : {}),
    ...style,
  };

  return (
    <div
      ref={rootRef}
      data-m-screen={screen ? '' : undefined}
      data-m-stack={stackOnMobile ? '' : undefined}
      style={rootStyle}
    >
      {left && panes.left && showLeft && (
        <div
          data-m-split-pane=""
          style={{
            width: mobile ? undefined : leftWidth,
            flex: mobile ? undefined : `0 0 ${leftWidth}px`,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {panes.left}
        </div>
      )}

      {left && panes.left && showLeft && !mobile && (
        <ResizeHandle
          side="left"
          onDragStart={startLeftDrag}
          onCollapse={leftCollapsible ? collapseLeft : undefined}
          collapsible={leftCollapsible}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!mobile && left && !leftOpen && leftCollapsible && <CollapseTab side="left" onExpand={expandLeft} />}
        {panes.main}
        {!mobile && right && !rightOpen && rightCollapsible && <CollapseTab side="right" onExpand={expandRight} />}
      </div>

      {right && panes.right && showRight && !mobile && (
        <ResizeHandle
          side="right"
          onDragStart={startRightDrag}
          onCollapse={rightCollapsible ? collapseRight : undefined}
          collapsible={rightCollapsible}
        />
      )}

      {right && panes.right && showRight && (
        <div
          data-m-split-pane=""
          style={{
            width: mobile ? undefined : rightWidth,
            flex: mobile ? undefined : `0 0 ${rightWidth}px`,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {panes.right}
        </div>
      )}
    </div>
  );
}
