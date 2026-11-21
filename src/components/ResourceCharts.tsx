import { fmt } from '../data/gameData';
export const seriesColor = (id: string) => { let hash = 0; for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0; return `hsl(${((hash % 360) + 360) % 360} 65% 65%)`; };
export function RateBars({ produced, consumed, maxP, maxC }: { produced: number; consumed: number; maxP: number; maxC: number }) {
  return <div className="resource-rate-bars">{[['PROD', produced, maxP, '#5BCB86'], ['CONS', consumed, maxC, '#E5604D']].map(([label, value, max, color]) => <div key={String(label)}><div className="resource-bar-label"><span style={{ color: String(color) }}>{label}</span><span>{fmt(Number(value))}/{fmt(Number(max))} · {Math.round(Number(value) / Number(max) * 100)}%</span></div><div className="resource-bar-track"><div style={{ width: `${Number(value) / Number(max) * 100}%`, background: String(color), height: '100%' }} /></div></div>)}</div>;
}
export function ShareBar({ title, entries }: { title: string; entries: { id: string; name: string; rate: number }[] }) {
  const total = entries.reduce((sum, entry) => sum + entry.rate, 0);
  return <section className="resource-share"><h3>{title}</h3>{total > 0 ? <><div className="resource-share-track" aria-label={title}>{entries.map(entry => <div key={entry.id} title={`${entry.name}: ${fmt(entry.rate)}/m · ${fmt(entry.rate / total * 100)}%`} style={{ width: `${entry.rate / total * 100}%`, background: seriesColor(entry.id) }} />)}</div><div className="resource-share-legend">{entries.map(entry => <div key={entry.id}><i style={{ background: seriesColor(entry.id) }} /><span>{entry.name}</span><span>{fmt(entry.rate / total * 100)}%</span></div>)}</div></> : <p>No production yet.</p>}</section>;
}
