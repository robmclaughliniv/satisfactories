import { useEffect, useRef, useState } from 'react';
import { fmt, recipeById } from '../../data/gameData';
import { importedByItem } from '../../model/logistics';
import { availableInputSupply, assignInputSupply, inputSourceKey, validateInputSupply, type InputSupplyRequest } from '../../state/inputSupply';
import { useStore } from '../../state/store';
import type { Factory, Row, RowSource, World } from '../../types';
import { lineName } from '../../state/lineFeeds';

export function InputSupplyModal({ factory, line, world, source, onClose }: {
  factory: Factory; line: Row; world: World; source?: RowSource; onClose: () => void;
}) {
  const { mutateWorld } = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const inputs = recipeById(line.recipeId)?.inputs || [];
  const existingLocal = source?.kind === 'local' ? factory.localInputs.find(input => input.id === source.localInputId) : undefined;
  const [kind, setKind] = useState<InputSupplyRequest['kind']>(source?.kind || 'local');
  const [item, setItem] = useState(source?.kind === 'import' ? source.item : existingLocal?.item || inputs[0]?.item || '');
  const [localInputId, setLocalInputId] = useState(existingLocal?.id || '');
  const [rate, setRate] = useState(source ? String(source.rate || 0) : '');
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const request: InputSupplyRequest = { kind, item, localInputId, rate: Number(rate), previousKey: source ? inputSourceKey(source) : undefined };
  const available = availableInputSupply(world, factory, line.id, request);
  const localOptions = factory.localInputs.filter(input => input.item === item && !line.sources.some(s => s.kind === 'local' && s.localInputId === input.id && inputSourceKey(s) !== request.previousKey));
  const imported = importedByItem(world, factory, item);
  const need = (inputs.find(input => input.item === item)?.rate || 0) * line.count;
  const save = () => {
    const message = validateInputSupply(world, factory.id, line.id, request);
    if (message) { setError(message); return; }
    mutateWorld(w => { assignInputSupply(w, factory.id, line.id, request); });
    onClose();
  };
  const changeKind = (value: InputSupplyRequest['kind']) => { setKind(value); setLocalInputId(''); setRate(''); setError(''); };
  return <dialog ref={dialog} className="allocation-dialog input-supply-dialog" aria-label={source ? 'Edit supply claim' : 'Claim input supply'} onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); save(); }}>
      <div className="allocation-modal-heading"><div><span className="line-connection-heading">{lineName(line)}</span><h2>{source ? 'Edit supply claim' : 'Claim input supply'}</h2></div><button className="supply-button" type="button" aria-label="Close input supply" onClick={onClose}>×</button></div>
      <div className="allocation-modal-body">
        <p className="supply-help">Claim part or all of a factory input for this production line. Sources are shared across all lines.</p>
        <label>Resource<select aria-label="Input resource" value={item} onChange={event => {setItem(event.target.value); setLocalInputId(''); setRate(''); setError('');}}>{inputs.map(input => <option key={input.item}>{input.item}</option>)}</select></label>
        <label>Supply from<select aria-label="Supply from" value={kind} onChange={event => changeKind(event.target.value as InputSupplyRequest['kind'])}>
          <option value="local">Factory local inputs</option>
          <option value="import">Factory imports</option>
        </select></label>
        {kind === 'local' && <label>Local source<select aria-label="Local source" required value={localInputId} onChange={event => {setLocalInputId(event.target.value); setRate('');}}><option value="">Choose a local source</option>{localOptions.map((input,index) => <option value={input.id} key={input.id}>{input.item} source {index+1} · {fmt(input.rate)}/min</option>)}</select></label>}
        {kind === 'local' && !localOptions.length && <p className="supply-help">No available local sources for {item}. Add a node in the factory’s Input supply section first, or edit this line’s existing claim.</p>}
        {kind === 'import' && <div className="supply-import-details"><strong>{item} arriving at {factory.name}</strong><p>{fmt(imported)}/min imported</p>{imported <= 0.001 && <p>No incoming supply yet. Add an export of {item} to this factory from a producing line in another factory first.</p>}</div>}
        <div className="supply-demand"><span>This line requires</span><strong>{fmt(need)} /min {item}</strong></div>
        <div className="supply-demand"><span>Unassigned input supply</span><strong>{fmt(available)} /min</strong></div>
        <label>Claim for this line /min<input aria-label="Input supply rate" type="number" min="0.001" step="any" required max={available} value={rate} onChange={event => setRate(event.target.value)}/></label>
        {error && <p role="alert" className="supply-error">{error}</p>}
      </div>
      <div className="allocation-modal-footer"><button className="supply-button" type="button" onClick={onClose}>Cancel</button><button className="supply-button supply-primary" type="submit" disabled={!rate || Number(rate) <= 0 || !Number.isFinite(Number(rate)) || (kind === 'local' && !localInputId) || Number(rate) > available + 0.001}>{source ? 'Save claim' : 'Claim supply'}</button></div>
    </form>
  </dialog>;
}
