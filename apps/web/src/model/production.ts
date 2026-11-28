import { recipeById } from '../data/gameData';
import type { Factory, World, OutputAllocation } from '../types';

/** Upgrade both working copies and committed snapshots without changing IDs. */
export function upgradeProduction(factory: Factory, world: Pick<World,'routes'|'stations'>): void {
  const rows = factory.sections.flatMap(s => s.rows);
  const exportBudgets = world.routes.filter(r => r.from === factory.id).map(r => ({ item:r.item, targetId:r.to, rate:r.rate, transport:r.t }));
  (world.stations || []).filter(s => s.role === 'export' && s.homeFactoryId === factory.id).forEach(station => {
    station.vehicles.forEach(vehicle => {
      const target = world.stations?.find(s => s.id === vehicle.destinationStationId);
      if (target) exportBudgets.push({item:station.resourceId,targetId:target.homeFactoryId,rate:vehicle.perVehicleRate,transport:station.type === 'train' ? 'Train' : station.type === 'truck' ? 'Truck' : 'Drone'});
    });
  });
  const used = new Set(rows.map(r => r.name).filter(Boolean));
  rows.forEach(row => {
    if (!row.name) {
      const base = recipeById(row.recipeId)?.outputs[0]?.item || 'Production line';
      let n=1; while(used.has(`${base} ${n}`)) n++;
      row.name=`${base} ${n}`;used.add(row.name);
    }
    if (!row.allocations?.length && row.destinations?.length) {
      const allocations: OutputAllocation[] = [];
      recipeById(row.recipeId)?.outputs.forEach(output => {
        const share = output.rate * row.count / row.destinations.length;
        row.destinations.forEach((destination,index) => {
          if (destination.kind === 'section') {
            const targets = factory.sections.find(s => s.id === destination.sectionId)?.rows.filter(r => r.id !== row.id && recipeById(r.recipeId)?.inputs.some(i => i.item === output.item)) || [];
            const totalNeed = targets.reduce((sum,r) => sum+(recipeById(r.recipeId)?.inputs.find(i => i.item===output.item)?.rate || 0)*r.count,0);
            targets.forEach(target => {
              const need=(recipeById(target.recipeId)?.inputs.find(i => i.item===output.item)?.rate || 0)*target.count;
              if(totalNeed>0) allocations.push({id:`${row.id}_${index}_${output.item}_${target.id}`,kind:'line',item:output.item,rate:share*need/totalNeed,targetId:target.id});
            });
            if(!targets.length) allocations.push({id:`${row.id}_${index}_${output.item}`,kind:'review',reviewFor:'line',item:output.item,rate:share,targetId:'Previous category destination'});
          } else {
            let remaining = share;
            exportBudgets.filter(b => b.item === output.item && b.rate > 0).forEach((budget,n) => {
              const rate = Math.min(remaining,budget.rate);
              if (rate <= 0) return;
              allocations.push({id:`${row.id}_${index}_${output.item}_export_${n}`,kind:'factory',item:output.item,rate,targetId:budget.targetId,transport:budget.transport});
              remaining -= rate; budget.rate -= rate;
            });
            if (remaining > 0.001) allocations.push({id:`${row.id}_${index}_${output.item}`,kind:'review',item:output.item,rate:remaining,targetId:'Choose an export factory'});
          }
        });
      });
      row.allocations=allocations;
    }
    row.allocations ??= [];
  });
  rows.forEach(row => {
    row.sources=(row.sources || []).map(source => {
      if(source.rate !== undefined) return source;
      const count=rows.filter(r => r.sources?.some(s => source.kind==='local' ? s.kind==='local' && s.localInputId===source.localInputId : s.kind==='import' && s.item===source.item)).length || 1;
      const supply=source.kind==='local' ? factory.localInputs.find(li => li.id===source.localInputId)?.rate || 0 :
        world.routes.filter(r => r.to===factory.id && r.item===source.item).reduce((sum,r) => sum+r.rate,0) +
        (world.stations || []).filter(s => s.role==='export' && s.resourceId===source.item).reduce((sum,s) => sum+s.vehicles.filter(v => world.stations?.some(dest => dest.id===v.destinationStationId && dest.homeFactoryId===factory.id)).reduce((n,v) => n+v.perVehicleRate,0),0);
      return {...source,rate:supply/count};
    });
    row.destinations=[];
  });
}
