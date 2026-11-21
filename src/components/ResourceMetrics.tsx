import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ResourceMetricSnapshot } from '../model/schema';
import { seriesColor } from './ResourceCharts';

const metrics = { produced: 'Production / min', consumed: 'Consumption / min', efficiency: 'Efficiency %' };

export default function ResourceMetrics({ history, visibleItems, open }: {
  history: ResourceMetricSnapshot[];
  visibleItems: { item: string }[];
  open: boolean;
}) {
  const [metric, setMetric] = useState<keyof typeof metrics>('produced');
  const [limit, setLimit] = useState('10');
  if (!open) return null;

  const start = limit === 'all' ? 0 : Math.max(0, history.length - Number(limit));
  const data = history.slice(start).map((snapshot, index) => ({
    commit: start + index + 1,
    values: Object.fromEntries(visibleItems.map(({ item }) => {
      // A resource absent from a saved world had zero rates and no configured efficiency.
      const value = snapshot.values[item]?.[metric] ?? (metric === 'efficiency' ? null : 0);
      return [item, value === null ? null : metric === 'efficiency' ? value * 100 : value];
    })),
  }));

  return (
    <section className="resource-metrics-body">
      <div className="resource-metrics-controls">
        <label>Metric
          <select value={metric} onChange={event => setMetric(event.target.value as keyof typeof metrics)}>
            {Object.entries(metrics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>Commits
          <select value={limit} onChange={event => setLimit(event.target.value)}>
            {[10, 25, 50, 100].map(count => <option key={count} value={count}>{count}</option>)}
            <option value="all">All</option>
          </select>
        </label>
        <span>{visibleItems.length} resources · {data.length} of {history.length} commits</span>
      </div>
      <p>Each factory commit saves a world-wide snapshot. Showing the latest saved commits, oldest to newest. Unsaved changes appear in the cards below.</p>
      {history.length === 0 ? <p>No saved commits yet. Commit a factory change to start tracking resource metrics.</p> :
        visibleItems.length === 0 ? <p>No resources match these filters.</p> : (
          <div style={{ height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} accessibilityLayer>
                <CartesianGrid stroke="#232934" strokeDasharray="3 3" />
                <XAxis dataKey="commit" tickFormatter={commit => `#${commit}`} stroke="#9097A1" />
                <YAxis domain={metric === 'efficiency' ? [0, 100] : [0, (max: number) => Math.max(1, max)]}
                  stroke="#9097A1" width={50} padding={{ bottom: 6, top: 6 }} />
                <Tooltip contentStyle={{ background: '#15181E', border: '1px solid #343B48' }}
                  labelFormatter={commit => {
                    const snapshot = history[Number(commit) - 1];
                    return snapshot ? `Commit #${commit} · ${snapshot.factoryName} · ${new Date(snapshot.savedAt).toLocaleString()}` : `Commit #${commit}`;
                  }} />
                <Legend />
                {visibleItems.map(({ item }) => (
                  <Line key={item} dataKey={row => row.values[item]} name={item} stroke={seriesColor(item)}
                    dot={data.length < 2} type="stepAfter" isAnimationActive={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
    </section>
  );
}
