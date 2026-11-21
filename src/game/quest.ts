/**
 * Quest progress: which memory fragments are recovered, which side rooms were found,
 * and whether the save is restored. Pure functions only (no DOM), so it's easy to test.
 */

export type FragmentId = 'api' | 'dungeon' | 'notes';
export const FRAGMENTS: readonly FragmentId[] = ['api', 'dungeon', 'notes'];

/** Optional discoverables: skills bench, archive, personal room, signal beacon. */
export type DiscoveryId = 'skills' | 'education' | 'about' | 'contact';
export const DISCOVERIES: readonly DiscoveryId[] = ['skills', 'education', 'about', 'contact'];

export interface QuestState {
  /** Player chose RECOVER on the boot screen at least once. */
  recovered: boolean;
  fragments: FragmentId[];
  found: DiscoveryId[];
  restored: boolean;
}

export const initialQuest = (): QuestState => ({ recovered: false, fragments: [], found: [], restored: false });

export const hasFragment = (s: QuestState, f: FragmentId) => s.fragments.includes(f);
export const allFragments = (s: QuestState) => FRAGMENTS.every((f) => s.fragments.includes(f));

export function recover(s: QuestState): QuestState {
  return s.recovered ? s : { ...s, recovered: true };
}

export function collect(s: QuestState, f: FragmentId): QuestState {
  if (!FRAGMENTS.includes(f) || s.fragments.includes(f)) return s;
  // Keep a stable order so the HUD and saves are predictable.
  return { ...s, fragments: FRAGMENTS.filter((x) => x === f || s.fragments.includes(x)) };
}

export function discover(s: QuestState, d: DiscoveryId): QuestState {
  if (!DISCOVERIES.includes(d) || s.found.includes(d)) return s;
  return { ...s, found: DISCOVERIES.filter((x) => x === d || s.found.includes(x)) };
}

/** The restore chamber only works once all three fragments are back. */
export function restore(s: QuestState): QuestState {
  if (!allFragments(s) || s.restored) return s;
  return { ...s, restored: true };
}

/** The sealed chamber door opens when all fragments are recovered. */
export const chamberOpen = (s: QuestState) => allFragments(s);

/** One short line from the robot guide pointing at the next useful step. */
export function hint(s: QuestState): string {
  if (s.restored) return 'Save restored. Open the Portfolio menu any time to see everything.';
  if (allFragments(s)) return 'All three fragments! The restore chamber in the north-east is unsealed.';
  if (!hasFragment(s, 'api')) return 'That terminal by the wall is sparking. Maybe we can reconnect its circuits?';
  if (!hasFragment(s, 'dungeon')) return 'I detect a map terminal out in the corrupted forest, south of the pond.';
  return 'Last fragment: something in the workshop, east of here, has gone quiet.';
}

/** Turn saved JSON back into a valid state. Anything unexpected falls back to a fresh start. */
export function parseQuest(raw: unknown): QuestState {
  const fresh = initialQuest();
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Record<string, unknown>;
  const fragments = Array.isArray(r.fragments) ? FRAGMENTS.filter((f) => (r.fragments as unknown[]).includes(f)) : [];
  const found = Array.isArray(r.found) ? DISCOVERIES.filter((d) => (r.found as unknown[]).includes(d)) : [];
  const state: QuestState = { recovered: r.recovered === true, fragments, found, restored: false };
  // A restored flag only counts if the fragments back it up.
  return r.restored === true && allFragments(state) ? { ...state, restored: true } : state;
}
