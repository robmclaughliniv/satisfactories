import { fmt } from '../data/gameData';
import { importedByItem } from '../model/logistics';
import { allLines, lineName } from '../state/lineFeeds';
import { buildFlows } from '../state/flows';
import { useActions } from '../state/store';
import type { Factory, World } from '../types';

export function FactoryInputPool({factory,world}:{factory:Factory;world:World}) {
  const {openLocalInput} = useActions();
  const lines = allLines(factory);
  const importedItems = new Set(buildFlows(world,factory).filter(flow => flow.dir === 'import' && flow.legs.some(leg => !leg.localInputId)).map(flow => flow.item));
  lines.forEach(line => line.sources.forEach(source => { if (source.kind === 'import') importedItems.add(source.item); }));
  const entries = [
    ...factory.localInputs.map((source,index) => ({
      id:source.id,item:source.item,label:`Local ${source.item} ${index+1}`,total:source.rate,
      claims:lines.flatMap(line => line.sources.filter(s => s.kind === 'local' && s.localInputId === source.id).map(s => ({id:line.id,name:lineName(line),rate:s.rate || 0}))),
    })),
    ...[...importedItems].map(item => ({
      id:`import:${item}`,item,label:`Imported ${item}`,total:importedByItem(world,factory,item),
      claims:lines.flatMap(line => line.sources.filter(s => s.kind === 'import' && s.item === item).map(s => ({id:line.id,name:lineName(line),rate:s.rate || 0}))),
    })),
  ];
  return <section className="factory-input-pool" aria-label="Factory input supply">
    <div className="factory-input-heading"><div><h2>Factory input supply</h2><p>Attach resource nodes to this factory. Production lines claim amounts from these shared inputs and factory imports.</p></div><button className="supply-button" onClick={() => openLocalInput(factory.id)}>+ Local source</button></div>
    {!entries.length && <p className="supply-help">No factory inputs yet. Add a local source, or export resources here from another factory.</p>}
    <div className="factory-input-grid">{entries.map(entry => {
      const claimed=entry.claims.reduce((sum,claim) => sum+claim.rate,0);
      const remaining=entry.total-claimed;
      return <div className="factory-input-card" key={entry.id}>
        <div className="factory-input-heading"><strong>{entry.label}</strong>{!entry.id.startsWith('import:') && <button className="supply-button" onClick={() => openLocalInput(factory.id,entry.item,entry.id)}>Edit source</button>}</div>
        <dl><div><dt>Incoming</dt><dd>{fmt(entry.total)}/m</dd></div><div><dt>Claimed</dt><dd>{fmt(claimed)}/m</dd></div><div><dt>{remaining < -0.001 ? 'Overclaimed' : 'Unclaimed'}</dt><dd style={{color:remaining < -0.001?'#E98170':'#69CD94'}}>{fmt(Math.abs(remaining))}/m</dd></div></dl>
        {entry.claims.length ? <ul>{entry.claims.map(claim => <li key={claim.id}><span>{claim.name}</span><span>{fmt(claim.rate)}/m</span></li>)}</ul> : <p className="supply-help">Available for production lines to claim.</p>}
      </div>;
    })}</div>
  </section>;
}
