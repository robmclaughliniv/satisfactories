import { InputSupplyModal } from './modals/InputSupplyModal';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { fmt, recipeById } from '../data/gameData';
import { importedByItem } from '../model/logistics';
import { freshId } from '../model/world';
import { allLines, computeFactoryLineFeeds, effectiveOutputRate, lineName, outputRemaining, type FactoryLineFeeds } from '../state/lineFeeds';
import { useStore } from '../state/store';
import type { Factory, OutputAllocation, Row, RowSource, Transport, World } from '../types';

const field: CSSProperties = { width:'100%',padding:'10px 12px',border:'1px solid #343B47',borderRadius:7,background:'#0C0E13',color:'#E7E9ED',font:'inherit' };
const button: CSSProperties = {padding:'7px 11px',border:'1px solid #343B47',borderRadius:6,background:'#181C24',color:'#CDD3DC',cursor:'pointer',font:'inherit'};
const muted: CSSProperties = {color:'#8A939F',fontSize:11};
type Draft = {kind:'line'|'factory';id?:string;item:string;targetId:string;rate:string;transport?:Transport};

export function ProductionLineConnections({f,row,world,feeds}:{f:Factory;row:Row;world:World;feeds:FactoryLineFeeds}) {
  const { mutateWorld } = useStore();
  const [draft,setDraft] = useState<Draft|null>(null);
  const [inputDraft,setInputDraft] = useState<{source?:RowSource}|null>(null);
  const [error,setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if(draft && !dialog.current?.open) dialog.current?.showModal();
    if(!draft && dialog.current?.open) dialog.current.close();
  },[!!draft]);
  const rec=recipeById(row.recipeId);
  if(!rec) return null;
  const lines=allLines(f);
  const allocations=row.allocations || [];
  const editRow=(fn:(r:Row,factory:Factory,w:World)=>void) => mutateWorld(w => {
    const factory=w.factories.find(x => x.id===f.id);
    const current=factory && allLines(factory).find(r => r.id===row.id);
    if(factory && current) fn(current,factory,w);
  });
  const open=(kind:Draft['kind'],allocation?:OutputAllocation) => {
    setError('');setDraft({kind,id:allocation?.id,item:rec.outputs.find(o => o.item===allocation?.item)?.item || rec.outputs[0]?.item || '',targetId:allocation?.targetId || '',rate:allocation ? String(allocation.rate) : '',transport:allocation?.transport || 'Unset'});
  };
  const sourceOptions = rec.inputs.flatMap(input => [
    ...f.localInputs.filter(li => li.item===input.item).map((li,index) => ({id:`local:${li.id}`,label:`Local ${li.item} ${index+1} · ${fmt(li.rate)}/m`,item:li.item,supply:li.rate})),
    {id:`import:${input.item}`,label:`Imported · ${input.item}`,item:input.item,supply:importedByItem(world,f,input.item)},
  ]);
  const sourceKey=(s:RowSource) => s.kind==='local' ? `local:${s.localInputId}` : `import:${s.item}`;
  const budget=draft ? outputRemaining(feeds,row,draft.item,draft.id) : 0;
  const targets=draft?.kind==='factory' ? world.factories.filter(x => x.id!==f.id).map(x => ({id:x.id,label:x.name})) :
    lines.filter(r => r.id!==row.id && recipeById(r.recipeId)?.inputs.some(i => i.item===draft?.item)).map(r => ({id:r.id,label:`${f.sections.find(s => s.rows.some(x => x.id===r.id))?.name} / ${lineName(r)}`}));
  const save=() => {
    if(!draft) return;
    const rate=Number(draft.rate);
    if(!draft.targetId || !Number.isFinite(rate) || rate<=0) {setError('Choose a destination and enter a positive rate.');return;}
    const available=outputRemaining(feeds,row,draft.item,draft.id);
    if(rate>available+0.001) {setError(`Only ${fmt(Math.max(0,available))}/m is available. Adjust the rate.`);return;}
    if(!targets.some(t => t.id===draft.targetId)) {setError('Choose a compatible destination.');return;}
    editRow((current,factory,w) => {
        const valid=draft.kind==='line' ? allLines(factory).some(r => r.id===draft.targetId && r.id!==current.id && recipeById(r.recipeId)?.inputs.some(i => i.item===draft.item)) : w.factories.some(x => x.id===draft.targetId && x.id!==factory.id);
        if(!valid || !recipeById(current.recipeId)?.outputs.some(o => o.item===draft.item)) return;
        current.allocations=current.allocations.filter(a => a.id!==draft.id);
        current.allocations.push({id:draft.id || freshId('allocation'),item:draft.item,rate,kind:draft.kind,targetId:draft.targetId,transport:draft.transport});
    });
    setDraft(null);
  };
  return <div className="line-connections">
    <div className="line-connection-column">
      <div className="line-connection-heading">Input supply</div>
      {feeds.byRowId[row.id]?.inputs.map(input => <div key={input.item} className="line-input-balance">
        <strong>{input.item}</strong><span style={{color:input.available+0.001<input.need?'#E98170':'#69CD94'}}>{fmt(input.available)} / {fmt(input.need)}/m</span>
      </div>)}
      {f.sections.flatMap(s => s.rows).flatMap(source => (source.allocations || []).filter(a => a.kind==='line' && a.targetId===row.id).map(a => <div className="line-allocation" key={a.id}><span>{lineName(source)}<small>{a.item}</small></span><span>{fmt(feeds.delivered[a.id] || 0)} / {fmt(a.rate)}/m</span></div>))}
      {row.sources.map(source => {
        const id=sourceKey(source);const option=sourceOptions.find(o => o.id===id);
        return <div className="line-allocation" key={id}><span>{option?.label || 'Missing source'}<small>{fmt(source.rate || 0)}/m assigned</small></span><button style={button} onClick={() => {setInputDraft({source});}}>Edit</button><button style={button} aria-label="Remove input assignment" onClick={() => editRow(r => {r.sources=r.sources.filter(s => sourceKey(s)!==id);})}>×</button></div>;
      })}
      {rec.inputs.length>0 && <button style={button} onClick={() => {setInputDraft({});}}>+ Input supply</button>}
      {rec.inputs.length===0 && <span style={muted}>No inputs required</span>}
    </div>
    <div className="line-connection-column">
      <div className="line-connection-heading">Output allocations</div>
      {rec.outputs.map(output => {
        const remaining=outputRemaining(feeds,row,output.item);
        return <div className="line-output-budget" key={output.item}><strong>{output.item}</strong><span>{fmt(effectiveOutputRate(feeds,row,output.item))}/m produced</span><b style={{color:remaining< -0.001?'#E98170':'#69CD94'}}>{remaining< -0.001 ? `${fmt(-remaining)}/m overallocated` : `${fmt(remaining)}/m surplus`}</b>{remaining< -0.001 && <small>Delivery paused. Adjust allocations to match available output.</small>}</div>;
      })}
      {allocations.map(a => <div className="line-allocation" key={a.id}>
        <span>{a.kind==='line' ? lineName(lines.find(r => r.id===a.targetId) || {...row,name:'Missing line'}) : a.kind==='factory' ? world.factories.find(x => x.id===a.targetId)?.name || 'Missing factory' : 'Needs review'}<small>{a.item} · {a.kind==='factory'?'Export':a.kind==='review'?a.targetId:'Production line'}</small></span>
        <span style={{color:(feeds.delivered[a.id] || 0)+0.001<a.rate?'#E98170':'#69CD94'}}>{fmt(feeds.delivered[a.id] || 0)} / {fmt(a.rate)}/m</span>
        <button style={button} onClick={() => open(a.kind==='line' || a.reviewFor==='line'?'line':'factory',a)}>Edit</button>
        <button style={button} aria-label="Remove output allocation" onClick={() => editRow(r => {r.allocations=r.allocations.filter(x => x.id!==a.id);})}>×</button>
      </div>)}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button style={button} onClick={() => open('line')}>+ Production Line</button><button style={button} onClick={() => open('factory')}>+ Export</button></div>
    </div>
    {inputDraft && <InputSupplyModal factory={f} line={row} world={world} source={inputDraft.source} onClose={() => setInputDraft(null)} />}
    <dialog aria-label={draft?.kind==='line' ? 'Assign to production line' : 'Export to factory'} ref={dialog} className="allocation-dialog" onCancel={() => setDraft(null)} onClick={e => {if(e.target===dialog.current) setDraft(null);}}>
      {draft && <form onSubmit={e => {e.preventDefault();save();}}>
        <div className="allocation-modal-heading"><div><span className="line-connection-heading">{lineName(row)}</span><h2>{draft.kind==='line'?'Assign to production line':'Export to factory'}</h2></div><button type="button" style={button} aria-label="Close dialog" onClick={() => setDraft(null)}>×</button></div>
        <div className="allocation-modal-body">
          <>
            <label>Output item<select aria-label="Output item" autoFocus style={field} value={draft.item} onChange={e => setDraft({...draft,item:e.target.value,targetId:'',rate:''})}>{rec.outputs.map(o => <option key={o.item}>{o.item}</option>)}</select></label>
            <label>{draft.kind==='line'?'Production line':'Destination factory'}<select aria-label={draft.kind==='line'?'Production line':'Destination factory'} style={field} value={draft.targetId} onChange={e => setDraft({...draft,targetId:e.target.value})}><option value="">Choose destination</option>{targets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
            {targets.length===0 && <p style={muted}>{draft.kind==='line'?'No other lines consume this output. Add a compatible production line first.':'Create another factory in this world to export here.'}</p>}
            {draft.kind==='factory' && <label>Transport<select aria-label="Transport" style={field} value={draft.transport || 'Unset'} onChange={e => setDraft({...draft,transport:e.target.value as Transport})}>{['Unset','Belt','Pipe','Train','Truck','Drone'].map(t => <option key={t}>{t}</option>)}</select></label>}
            {draft.kind==='line' && draft.targetId && <p style={muted}>Target input: {(() => {const input=feeds.byRowId[draft.targetId]?.inputs.find(i => i.item===draft.item);return input ? `${fmt(input.available)}/${fmt(input.need)}/m supplied` : '—';})()}</p>}
          </>
          <div className="allocation-available"><span>Available to allocate</span><strong>{fmt(Math.max(0,budget))}<small> /min</small></strong></div>
          <label>Amount /min<div style={{display:'flex',gap:8}}><input aria-label="Amount per minute" style={field} type="number" min="0.001" step="any" max={Math.max(0,budget)} required value={draft.rate} onChange={e => setDraft({...draft,rate:e.target.value})}/><button style={button} type="button" onClick={() => setDraft({...draft,rate:String(Math.max(0,budget))})}>Use remaining</button></div></label>
          <p style={muted}>Exact amounts only. Other allocations keep their assigned rates.</p>
          {error && <p role="alert" style={{color:'#E98170'}}>{error}</p>}
        </div>
        <div className="allocation-modal-footer"><button type="button" style={button} onClick={() => setDraft(null)}>Cancel</button><button style={{...button,background:'#F5882E',color:'#170D06',fontWeight:600}} disabled={!draft.targetId || !draft.rate || Number(draft.rate)<=0 || Number(draft.rate)>budget+0.001} type="submit">Save allocation</button></div>
      </form>}
    </dialog>
  </div>;
}
