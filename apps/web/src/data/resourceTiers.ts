import unlockData from './resource-unlocks.json';

// Recipe unlocks come from the Satisfactory 1.0 game schematics parsed by
// https://github.com/greeny/SatisfactoryTools/blob/master/data/data1.0.json.
// Starting items, gathered resources and power generation by-products use
// their source or enabling milestone.
const unlocks: Record<string, string[]> = unlockData;

export function resourceUnlock(item: string) {
  const unlock = unlocks[item];
  if (!unlock) return null;
  const [group, name] = unlock;
  return { group, name, tier: /^\d+$/.test(group) ? Number(group) : null };
}

export const unlockGroups: [string, string][] = [
  ...Array.from({ length: 10 }, (_, tier): [string, string] => [String(tier), `Tier ${tier}`]),
  ['mam', 'MAM research'],
  ['shop', 'AWESOME Shop'],
  ['gathered', 'Gathered resources'],
  ['unknown', 'Other'],
];
