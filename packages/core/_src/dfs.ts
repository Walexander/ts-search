import { generalizedSearch } from './internal/generalized-search'
import { SearchStack } from './internal/search-container'
import type { SearchState } from './internal/search-state'

export function dfs<A>(
  next: (a: A) => A[],
  found: Predicate<A>,
  initial: A
): Maybe<A[]> {
  void next, found, initial
  const state0: SearchState<A> = {
    current: initial,
    queue: new SearchStack<A>(new Stack(initial)),
    visited: HashSet.empty(),
    paths: HashMap.empty()
  }
  return generalizedSearch(next, found).unsafeRunStateResult(state0)
}
