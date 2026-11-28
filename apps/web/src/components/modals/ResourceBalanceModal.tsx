import { useEffect, useId, useRef } from 'react';
import { fmt } from '../../data/gameData';
import type { Flow } from '../../state/flows';
import type { ResourceProductionLine } from '../../state/lineFeeds';
import { ItemSquare } from '../bits';


export function efficiencyLabel(efficiency: number | null) {
  return efficiency === null ? 'N/A' : `${fmt(Math.round(efficiency * 1000) / 10)}%`;
}

export function ResourceBalanceModal({ balance, lines, consumers, flows, onClose }: {
  balance: { item: string; made: number; need: number; imp: number; local: number; exp: number; net: number; capacity: number; efficiency: number | null };
  lines: ResourceProductionLine[];
  consumers: { id: string; name: string; need: number; available: number }[];
  flows: Flow[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const totals = [
    ['Made here', balance.made],
    ['Imported', balance.imp],
    ['Local supply', balance.local],
    ['Required', -balance.need],
    ['Exported', -balance.exp],
    ['Net balance', balance.net],
  ] as const;

  return (
    <dialog ref={dialog} className="allocation-dialog resource-balance-dialog" aria-labelledby={title}
      onClose={onClose} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <header className="allocation-modal-heading">
        <div className="resource-dialog-title">
          <ItemSquare item={balance.item} size={32} radius={7} fontSize={10} />
          <div><span className="line-connection-heading">Resource balance</span><h2 id={title}>{balance.item}</h2></div>
        </div>
        <button type="button" className="supply-button" aria-label="Close resource details" onClick={() => dialog.current?.close()}>×</button>
      </header>
      <div className="allocation-modal-body">
        <section>
          <h3>Balance per minute</h3>
          <dl className="resource-balance-totals">
            {totals.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value > 0 ? '+' : ''}{fmt(value)}</dd></div>)}
          </dl>
        </section>
        <section>
          <h3>Production efficiency <strong>{efficiencyLabel(balance.efficiency)}</strong></h3>
          <p className="supply-help">
            {balance.efficiency === null ? 'No configured production capacity for this item.' :
              `${fmt(balance.made)}/min produced out of ${fmt(balance.capacity)}/min at full capacity. Each line’s least supplied input limits its output.`}
          </p>
          {lines.length > 0 && <ul className="resource-detail-list">
            {lines.map(line => (
              <li key={line.id}>
                <div><strong>{line.name}</strong><span>{fmt(line.actual)} / {fmt(line.capacity)} per min · {efficiencyLabel(line.capacity > 0 ? line.feed.efficiency : null)}</span></div>
                {line.feed.inputs.filter(input => input.available < input.need - 0.001).map(input =>
                  <p key={input.item} className="resource-shortage">{input.item}: {fmt(input.available)} supplied / {fmt(input.need)} required per min</p>,
                )}
              </li>
            ))}
          </ul>}
        </section>
        {consumers.length > 0 && <section>
          <h3>Required by</h3>
          <ul className="resource-detail-list">
            {consumers.map(line => <li key={line.id}><div><strong>{line.name}</strong><span>{fmt(line.available)} supplied / {fmt(line.need)} required per min</span></div></li>)}
          </ul>
        </section>}
        {flows.filter(flow => flow.legs.length > 0).map(flow => <section key={flow.key}>
          <h3>{flow.dir === 'import' ? 'Incoming supply' : 'Export deliveries'}</h3>
          <ul className="resource-detail-list">
            {flow.legs.map((leg, index) => <li key={index}>
              <div><strong>{leg.partner}{leg.localInputId ? ` ${index + 1}` : ''}</strong><span>{fmt(leg.rate)}/min · {leg.transport}</span></div>
            </li>)}
          </ul>
        </section>)}
      </div>
    </dialog>
  );
}
