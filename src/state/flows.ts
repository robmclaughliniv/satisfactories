import type { Factory, World } from '../types';
import { allocationShipments, hasFactoryAllocation, legacyRouteDelivery, transportFromStationType, vehicleHops } from '../model/logistics';
import { recipeById } from '../data/gameData';
import { itemSupply } from './derive';
export interface FlowLeg {
  partner:string; color:string; transport:string; rate:number;
  routeId?:string; localInputId?:string; stationId?:string; vehicleId?:string;
  allocationId?:string; sourceFactoryId?:string; sourceRowId?:string; requested?:number;
}
export interface Flow {key:string;dir:'import'|'export';item:string;total:number;legs:FlowLeg[];}
/** Every view uses the same delivered shipments as the production engine. */
export function buildFlows(world:World,f:Factory):Flow[] {
  const map = new Map<string,Flow>();
  const ensure=(dir:Flow['dir'],item:string) => {
    const key=dir+'|'+item;
    if(!map.has(key)) map.set(key,{key,dir,item,total:0,legs:[]});
    return map.get(key)!;
  };
  const add=(from:string,to:string,item:string,leg:FlowLeg) => {
    if(from!==f.id && to!==f.id) return;
    const dir=from===f.id?'export':'import';
    const other=world.factories.find(x => x.id===(dir==='export'?to:from));
    if(!other) return;
    const flow=ensure(dir,item);flow.total+=leg.rate;
    flow.legs.push({...leg,partner:other.name,color:other.color});
  };
  allocationShipments(world).forEach(a => add(a.from,a.to,a.item,{
    partner:'',color:'',rate:a.rate,requested:a.requested,transport:a.t,
    allocationId:a.allocationId,sourceFactoryId:a.from,sourceRowId:a.rowId,
  }));
  world.routes.forEach(r => {
    if(hasFactoryAllocation(world,r.from,r.to,r.item)) return;
    const rate=legacyRouteDelivery(world,r.from,r.to,r.item,r.rate);
    if(rate<=0.001) return;
    add(r.from,r.to,r.item,{partner:'',color:'',rate,transport:r.t,routeId:r.id});
  });
  vehicleHops(world).forEach(h => {
    if(hasFactoryAllocation(world,h.fromFactoryId,h.toFactoryId,h.item)) return;
    const rate=legacyRouteDelivery(world,h.fromFactoryId,h.toFactoryId,h.item,h.rate);
    if(rate<=0.001) return;
    add(h.fromFactoryId,h.toFactoryId,h.item,{partner:'',color:'',rate,transport:transportFromStationType(h.type),stationId:h.stationId,vehicleId:h.vehicleId});
  });
  f.localInputs.forEach(li => {
    const flow=ensure('import',li.item);flow.total+=li.rate;
    flow.legs.push({partner:'Local node',color:'#6B7280',transport:li.t,rate:li.rate,localInputId:li.id});
  });
  f.sections.forEach(s => s.rows.forEach(r => r.allocations?.filter(a => a.kind==='factory').forEach(a => {
    if(recipeById(r.recipeId)?.outputs.some(o => o.item===a.item)) ensure('export',a.item);
  })));
  (f.exportOrder || []).forEach(item => {if(itemSupply(world,f,item)>0.001) ensure('export',item);});
  (f.importOrder || []).forEach(item => ensure('import',item));
  return [...map.values()].sort((a,b) => a.dir===b.dir ? 0 : a.dir==='import'?-1:1);
}
export function applyFlowOrder(flows:Flow[],order:string[]|undefined):Flow[] {
  if(!order?.length) return flows;
  const remaining=new Map(flows.map(f => [f.item,f]));const result:Flow[]=[];
  order.forEach(item => {const flow=remaining.get(item);if(flow) {result.push(flow);remaining.delete(item);}});
  return [...result,...remaining.values()];
}
