import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface MapCamera {
  zoom: number;
  panX: number;
  panY: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const WHEEL_FACTOR = 1.16;
const WHEEL_DEBOUNCE_MS = 150;

function touchDist(t0: { clientX: number; clientY: number }, t1: { clientX: number; clientY: number }) {
  const dx = t1.clientX - t0.clientX;
  const dy = t1.clientY - t0.clientY;
  return Math.hypot(dx, dy);
}

function pt(e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) {
  const ev = e as TouchEvent;
  if (ev.touches?.[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
  if (ev.changedTouches?.[0]) return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
  const me = e as MouseEvent;
  return { x: me.clientX, y: me.clientY };
}

function applyTransform(el: HTMLElement, cam: MapCamera, transition: string) {
  el.style.transition = transition;
  el.style.transform = `translate(calc(-50% + ${cam.panX}px), calc(-50% + ${cam.panY}px)) scale(${cam.zoom})`;
}

export function useMapCamera(
  viewEl: RefObject<HTMLDivElement | null>,
  mapEl: RefObject<HTMLDivElement | null>,
  blockInteractionRef: RefObject<boolean>,
) {
  const [camera, setCamera] = useState<MapCamera>({ zoom: 1, panX: 0, panY: 0 });
  const [gesturing, setGesturing] = useState(false);
  const [panning, setPanning] = useState(false);

  const camRef = useRef(camera);
  camRef.current = camera;

  const rafId = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout>>();
  const pinchRef = useRef<{ dist: number; zoom: number; midX: number; midY: number } | null>(null);
  const panCleanup = useRef<(() => void) | null>(null);

  const viewRect = useCallback(() => {
    if (viewEl.current) return viewEl.current.getBoundingClientRect();
    if (mapEl.current?.parentElement) return mapEl.current.parentElement.getBoundingClientRect();
    return { left: 0, top: 0, width: 600, height: 600 } as DOMRect;
  }, [viewEl, mapEl]);

  const baseSize = useCallback(
    (v?: { width: number; height: number }) => {
      const r = v || viewRect();
      return Math.min(r.width, r.height);
    },
    [viewRect],
  );

  const clampPan = useCallback(
    (zoom: number, px: number, py: number, v?: DOMRect) => {
      const r = v || viewRect();
      const ns = baseSize(r) * zoom;
      const ox = (ns - r.width) / 2;
      const oy = (ns - r.height) / 2;
      return {
        zoom,
        panX: ox > 0 ? Math.min(ox, Math.max(-ox, px)) : 0,
        panY: oy > 0 ? Math.min(oy, Math.max(-oy, py)) : 0,
      };
    },
    [viewRect, baseSize],
  );

  const paint = useCallback(
    (cam: MapCamera, transition = 'none') => {
      if (mapEl.current) applyTransform(mapEl.current, cam, transition);
    },
    [mapEl],
  );

  const schedulePaint = useCallback(
    (cam: MapCamera) => {
      camRef.current = cam;
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0;
        paint(camRef.current, 'none');
      });
    },
    [paint],
  );

  const commitCamera = useCallback(
    (cam: MapCamera, transition = 'none') => {
      camRef.current = cam;
      paint(cam, transition);
      setCamera(cam);
    },
    [paint],
  );

  const computeZoom = useCallback(
    (nz: number, fcx?: number, fcy?: number): MapCamera => {
      const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nz));
      const v = viewRect();
      const base = baseSize(v);
      const { zoom: oz, panX, panY } = camRef.current;
      const curSize = base * oz;
      const curLeft = v.left + v.width / 2 - curSize / 2 + panX;
      const curTop = v.top + v.height / 2 - curSize / 2 + panY;
      const fx = fcx ?? v.left + v.width / 2;
      const fy = fcy ?? v.top + v.height / 2;
      const ux = (fx - curLeft) / curSize;
      const uy = (fy - curTop) / curSize;
      const ns = base * z;
      const newLeft = fx - ux * ns;
      const newTop = fy - uy * ns;
      const baseLeft = v.left + v.width / 2 - ns / 2;
      const baseTop = v.top + v.height / 2 - ns / 2;
      return clampPan(z, newLeft - baseLeft, newTop - baseTop, v);
    },
    [viewRect, baseSize, clampPan],
  );

  const beginGesture = useCallback(() => {
    if (!gesturing) setGesturing(true);
    if (mapEl.current) {
      mapEl.current.style.willChange = 'transform';
    }
  }, [gesturing, mapEl]);

  const endGesture = useCallback(() => {
    if (mapEl.current) mapEl.current.style.willChange = '';
    setGesturing(false);
    setPanning(false);
    commitCamera(camRef.current);
  }, [commitCamera, mapEl]);

  const setZoom = useCallback(
    (nz: number, fcx?: number, fcy?: number, animated = false) => {
      const cam = computeZoom(nz, fcx, fcy);
      camRef.current = cam;
      if (animated) {
        commitCamera(cam, 'transform .14s ease');
      } else {
        schedulePaint(cam);
        clearTimeout(wheelTimer.current);
        wheelTimer.current = setTimeout(() => {
          commitCamera(camRef.current);
          if (mapEl.current) mapEl.current.style.willChange = '';
          setGesturing(false);
        }, WHEEL_DEBOUNCE_MS);
      }
    },
    [computeZoom, commitCamera, schedulePaint, mapEl],
  );

  const resetCamera = useCallback(() => {
    const cam = { zoom: 1, panX: 0, panY: 0 };
    commitCamera(cam, 'transform .14s ease');
  }, [commitCamera]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      beginGesture();
      const factor = e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR;
      setZoom(camRef.current.zoom * factor, e.clientX, e.clientY);
    },
    [beginGesture, setZoom],
  );

  const startPan = useCallback(
    (sx: number, sy: number) => {
      if (camRef.current.zoom <= 1 || blockInteractionRef.current) return;
      beginGesture();
      setPanning(true);
      const px0 = camRef.current.panX;
      const py0 = camRef.current.panY;

      const move = (ev: MouseEvent | TouchEvent) => {
        if (ev.cancelable) ev.preventDefault();
        const p = pt(ev);
        const c = clampPan(camRef.current.zoom, px0 + (p.x - sx), py0 + (p.y - sy));
        schedulePaint(c);
      };

      const finish = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', finish);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', finish);
        window.removeEventListener('touchcancel', finish);
        panCleanup.current = null;
        endGesture();
      };

      panCleanup.current = finish;
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', finish);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', finish);
      window.addEventListener('touchcancel', finish);
    },
    [blockInteractionRef, beginGesture, clampPan, schedulePaint, endGesture],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      startPan(e.clientX, e.clientY);
    },
    [startPan],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (blockInteractionRef.current) return;

      if (e.touches.length === 2) {
        panCleanup.current?.();
        pinchRef.current = {
          dist: touchDist(e.touches[0], e.touches[1]),
          zoom: camRef.current.zoom,
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        beginGesture();

        const move = (ev: TouchEvent) => {
          if (ev.cancelable) ev.preventDefault();
          const pinch = pinchRef.current;
          if (!pinch || ev.touches.length < 2) return;
          const dist = touchDist(ev.touches[0], ev.touches[1]);
          const ratio = dist / pinch.dist;
          const cam = computeZoom(pinch.zoom * ratio, pinch.midX, pinch.midY);
          schedulePaint(cam);
        };

        const finish = () => {
          window.removeEventListener('touchmove', move);
          window.removeEventListener('touchend', finish);
          window.removeEventListener('touchcancel', finish);
          pinchRef.current = null;
          endGesture();
        };

        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', finish);
        window.addEventListener('touchcancel', finish);
        return;
      }

      if (e.touches.length === 1) {
        const t = e.touches[0];
        startPan(t.clientX, t.clientY);
      }
    },
    [blockInteractionRef, beginGesture, computeZoom, schedulePaint, endGesture, startPan],
  );

  useEffect(() => {
    paint(camera, 'none');
  }, [paint, camera]);

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      clearTimeout(wheelTimer.current);
      panCleanup.current?.();
    },
    [],
  );

  const zoomed = camera.zoom > 1.001;

  return {
    camera,
    zoomed,
    gesturing,
    panning,
    onWheel,
    onMouseDown,
    onTouchStart,
    setZoom,
    resetCamera,
    camRef,
  };
}
