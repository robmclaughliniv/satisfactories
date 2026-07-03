import type { Factory, Row, Section, Status, World } from '../types';

function sec(id: string, name: string, rows: [string, number][]): Section {
  return {
    id,
    name,
    rows: rows.map((r, i): Row => ({ id: id + '_r' + i, recipeId: r[0], count: r[1] })),
  };
}

function f(
  id: string,
  name: string,
  color: string,
  status: Status,
  tier: string,
  tagline: string,
  tags: string[],
  x: number,
  y: number,
  sections: Section[],
): Factory {
  return { id, name, color, status, tier, tagline, tags, cover: '', x, y, sections, baseline: JSON.stringify(sections) };
}

export function seedWorlds(): World[] {
  const w1Factories: Factory[] = [
    f('cygnus', 'Cygnus Iron Foundry', '#F5882E', 'operational', 'Mega-factory', 'Backbone iron supply feeding the northern assembly grid.', ['Iron', 'Smelting'], 27, 31, [
      sec('s_smelt', 'Smelting', [['iron_ingot', 16]]),
      sec('s_basic', 'Plate & Rod Line', [['iron_plate', 8], ['iron_rod', 9], ['screw', 4]]),
    ]),
    f('polaris', 'Polaris Copper Junction', '#4FB477', 'operational', 'Transport Depot', 'Copper smelting and wiring hub for the western shoreline.', ['Copper', 'Wiring'], 19, 56, [
      sec('p_smelt', 'Copper Smelting', [['copper_ingot', 10]]),
      sec('p_wire', 'Wire & Cable', [['wire', 8], ['cable', 4]]),
    ]),
    f('vulcan', 'Vulcan Steelworks', '#D8553B', 'operational', 'Mid-sized Factory', 'Heavy steel production — ingots, beams and pipes.', ['Steel', 'Heavy'], 49, 51, [
      sec('v_found', 'Steel Foundry', [['steel_ingot', 12]]),
      sec('v_stock', 'Steel Stock', [['steel_beam', 6], ['steel_pipe', 6]]),
    ]),
    f('aurum', 'Aurum Caterium Refinery', '#E0B341', 'operational', 'Mini-factory', 'Caterium refining and quickwire for the electronics tree.', ['Caterium', 'Electronics'], 71, 23, [
      sec('a_ref', 'Refining', [['caterium_ingot', 8]]),
      sec('a_qw', 'Quickwire Line', [['quickwire', 6]]),
    ]),
    f('atlas', 'Atlas Frame Assembly', '#3FA7C4', 'construction', 'Mega-factory', 'Frame megafactory — the heart of the heavy build pipeline.', ['Frames', 'Assembly'], 67, 47, [
      sec('at_rip', 'Reinforced Plates', [['reinforced_iron_plate', 6]]),
      sec('at_mf', 'Modular Frames', [['modular_frame', 6]]),
      sec('at_hmf', 'Heavy Frame Line', [['heavy_modular_frame', 4]]),
    ]),
    f('meridian', 'Meridian Beam Works', '#8A6FC4', 'planned', 'Mid-sized Factory', 'Concrete and encased beams staged for the southern expansion.', ['Concrete', 'Beams'], 47, 70, [
      sec('m_conc', 'Concrete', [['concrete', 8]]),
      sec('m_beam', 'Encased Beams', [['encased_industrial_beam', 6]]),
    ]),
  ];
  const w1Routes: World['routes'] = [
    { id: 'rt1', from: 'cygnus', to: 'atlas', item: 'Iron Rod', rate: 75, t: 'Train' },
    { id: 'rt1b', from: 'cygnus', to: 'atlas', item: 'Iron Rod', rate: 60, t: 'Belt' },
    { id: 'rt2', from: 'cygnus', to: 'atlas', item: 'Screw', rate: 160, t: 'Train' },
    { id: 'rt3', from: 'vulcan', to: 'atlas', item: 'Steel Pipe', rate: 120, t: 'Pipe' },
    { id: 'rt4', from: 'vulcan', to: 'meridian', item: 'Steel Beam', rate: 90, t: 'Truck' },
    { id: 'rt5', from: 'meridian', to: 'atlas', item: 'Encased Industrial Beam', rate: 30, t: 'Belt' },
    { id: 'rt5b', from: 'vulcan', to: 'atlas', item: 'Encased Industrial Beam', rate: 18, t: 'Drone' },
    { id: 'rt6', from: 'aurum', to: 'polaris', item: 'Quickwire', rate: 120, t: 'Drone' },
  ];
  return [
    { id: 'w1', name: 'Northern Stretch', factories: w1Factories, routes: w1Routes },
    { id: 'w2', name: 'Dune Desert Run', factories: [], routes: [] },
  ];
}
