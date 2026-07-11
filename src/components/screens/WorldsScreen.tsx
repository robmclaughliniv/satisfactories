import { useState } from 'react';
import { initials } from '../../data/gameData';
import { SAMPLE_WORLD } from '../../data/templates';
import { useActions, useStore } from '../../state/store';
import type { World } from '../../types';
import { SG } from '../bits';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const ghostBtn = {
  background: 'transparent',
  border: '1px solid #262B34',
  borderRadius: 7,
  padding: '5px 10px',
  cursor: 'pointer',
  color: '#9AA0AA',
  fontSize: 11.5,
} as const;

export function WorldsScreen() {
  const { st, up } = useStore();
  const { createWorld, loadSampleWorld, renameWorld, deleteWorld } = useActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (w: World) => {
    setEditingId(w.id);
    setEditName(w.name);
    setConfirmDeleteId(null);
  };

  const commitRename = () => {
    if (editingId) renameWorld(editingId, editName);
    setEditingId(null);
  };

  const empty = st.worlds.length === 0;

  return (
    <div data-m-screen="" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 26 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 22, margin: 0 }}>Worlds</h1>
            <div style={{ fontSize: 12.5, color: '#7B828D', marginTop: 3 }}>Each world is a Satisfactory save.</div>
          </div>
          {!empty && (
            <button
              onClick={createWorld}
              style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 9, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
            >
              ＋ New world
            </button>
          )}
        </div>

        {empty && (
          <div
            style={{
              background: '#0F1116',
              border: '1px solid #1C2027',
              borderRadius: 14,
              padding: '44px 32px',
              textAlign: 'center',
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                margin: '0 auto 16px',
                background: 'linear-gradient(150deg,#F5882E,#E5651F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SG,
                fontWeight: 700,
                fontSize: 26,
                color: '#120A03',
                boxShadow: '0 2px 14px rgba(245,136,46,.35)',
              }}
            >
              S
            </div>
            <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 19, marginBottom: 6 }}>No worlds yet</div>
            <div style={{ fontSize: 12.5, color: '#7B828D', maxWidth: 380, margin: '0 auto 22px' }}>
              Create a fresh world to start planning from scratch, or load the sample world to explore with data already in place.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={createWorld}
                style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 9, padding: '11px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                ＋ New world
              </button>
              <button
                onClick={loadSampleWorld}
                style={{ background: '#15171D', color: '#E7E9ED', border: '1px solid #262B34', borderRadius: 9, padding: '11px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                Load sample world
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {st.worlds.map((w) => {
            const isActive = w.id === st.worldId;
            const isEditing = editingId === w.id;
            const isConfirming = confirmDeleteId === w.id;
            return (
              <div
                key={w.id}
                onClick={() => {
                  if (isEditing || isConfirming) return;
                  up({ worldId: w.id, screen: 'map', selFactory: null, mapLock: null });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: '#0F1116',
                  border: `1px solid ${isActive ? '#2E343F' : '#1C2027'}`,
                  borderRadius: 12,
                  padding: '15px 17px',
                  cursor: isEditing || isConfirming ? 'default' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: 'linear-gradient(150deg,#1A1D24,#0F1116)',
                    border: '1px solid #262B34',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: SG,
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#F5882E',
                    flex: '0 0 auto',
                  }}
                >
                  {initials(w.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{
                        background: '#15171D',
                        border: '1px solid #2E343F',
                        borderRadius: 7,
                        padding: '5px 9px',
                        color: '#E7E9ED',
                        fontFamily: SG,
                        fontWeight: 600,
                        fontSize: 15,
                        width: '100%',
                        maxWidth: 300,
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 16 }}>{w.name}</span>
                      {isActive && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#5BCB86', border: '1px solid #1B3A28', background: '#0E1A12', borderRadius: 5, padding: '1px 7px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#7B828D', marginTop: 3 }}>
                    {w.factories.length ? `${w.factories.length} factories · ${w.routes.length} routes` : 'Empty — no factories yet'}
                    {w.updatedAt && timeAgo(w.updatedAt) ? ` · updated ${timeAgo(w.updatedAt)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: '0 0 auto' }} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      <button onClick={commitRename} style={{ ...ghostBtn, color: '#5BCB86', borderColor: '#1B3A28' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} style={ghostBtn}>
                        Cancel
                      </button>
                    </>
                  ) : isConfirming ? (
                    <>
                      <span style={{ fontSize: 11.5, color: '#E5604D' }}>Delete this world?</span>
                      <button
                        onClick={() => {
                          deleteWorld(w.id);
                          setConfirmDeleteId(null);
                        }}
                        style={{ ...ghostBtn, color: '#E5604D', borderColor: '#4A2020' }}
                      >
                        Delete
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} style={ghostBtn}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startRename(w)} style={ghostBtn}>
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(w.id);
                          setEditingId(null);
                        }}
                        style={{ ...ghostBtn, color: '#C46A5C' }}
                      >
                        Delete
                      </button>
                      <span style={{ color: '#4B515B', fontSize: 18, marginLeft: 3 }}>›</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {!empty && (
            <div
              onClick={loadSampleWorld}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'transparent',
                border: '1px dashed #262B34',
                borderRadius: 12,
                padding: '15px 17px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  border: '1px dashed #2E343F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: SG,
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#7B828D',
                  flex: '0 0 auto',
                }}
              >
                {initials(SAMPLE_WORLD.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 15, color: '#C2C8D2' }}>
                  Load sample world · {SAMPLE_WORLD.name}
                </div>
                <div style={{ fontSize: 12, color: '#7B828D', marginTop: 3 }}>
                  {SAMPLE_WORLD.factories.length} factories · {SAMPLE_WORLD.routes.length} routes — a ready-made playground copy
                </div>
              </div>
              <span style={{ color: '#4B515B', fontSize: 18 }}>＋</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
