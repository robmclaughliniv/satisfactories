import { useEffect, useState } from 'react';
import { recipeById } from '../data/gameData';
import { allLines, lineName } from '../state/lineFeeds';
import { useStore } from '../state/store';
import type { Factory, Row } from '../types';

export function LineEditor({f,row,sectionId}:{f:Factory;row:Row;sectionId:string}) {
  const {mutateWorld}=useStore();
  const [name,setName]=useState(lineName(row));
  useEffect(() => setName(lineName(row)), [row.name]);
  const save=() => {
    if(!name.trim()) {setName(lineName(row));return;}
    mutateWorld(w => {const r=allLines(w.factories.find(x => x.id===f.id)!).find(x => x.id===row.id);if(r) r.name=name.trim();});
  };
  return <div className="line-editor">
    <label>Line name<input aria-label="Line name" value={name} onChange={e => setName(e.target.value)} onBlur={save} onKeyDown={e => {if(e.key==='Enter') e.currentTarget.blur();if(e.key==='Escape'){setName(lineName(row));}}}/></label>
    <label>Category<select aria-label="Line category" value={sectionId} onChange={e => {
      const id=e.target.value;
      mutateWorld(w => {
        const factory=w.factories.find(x => x.id===f.id)!;
        const from=factory.sections.find(s => s.rows.some(r => r.id===row.id));
        const to=factory.sections.find(s => s.id===id);
        const current=from?.rows.find(r => r.id===row.id);
        if(from && to && current) {from.rows=from.rows.filter(r => r.id!==row.id);to.rows.push(current);}
      });
    }}>{f.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <span>Recipe: {recipeById(row.recipeId)?.name}</span>
  </div>;
}
