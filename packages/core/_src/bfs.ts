import { generalizedSearch } from './internal/generalized-search'
import { SearchQueue } from './internal/search-container'
import type { SearchState } from './internal/search-state'

export { SearchQueue } from './internal/search-container'

export function bfs<A>(
  next: (a: A) => A[],
  found: Predicate<A>,
  initial: A
) {
  // breadth-first "queue"
  const queue = MutableQueue.unbounded<A>()
  queue.offer(initial)
  return generalizedSearch(next, found).unsafeRunStateResult(
    <SearchState<A>> {
      current: initial,
      queue: new SearchQueue(queue),
      visited: HashSet.empty(),
      paths: HashMap.empty()
    }
  )
}
