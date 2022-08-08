import { generalizedSearch } from '@ts-search/core/internal/generalized-search'
import { SearchQueue } from '@ts-search/core/internal/search-container'
import type { SearchState } from '@ts-search/core/internal/search-state'

export { SearchQueue }

/**
 * The next(a) callback returns the edges of `a`
 * @callback nextNeighbors
 * @param {A}
 * @returns {A[]}
 */

/**
 * `bfs` uses a queue to find the first node that satisfies the given predicate returning a Maybe for the path to the solution node or Maybe.none if none exists
 *
 * @param next {nextNeighbors} - Generate the neighbors
 * @param found {Predicate<A>} - A predicate to determine if the node is found
 * @param initial - The initial node from which to start
 *
 * @example
 * function countChange(target: number) {
 *   return bfs(addCoin, (a) => a == target, 0)
 *   function addCoin(amt: number) {
 *     const Coins = [25, 10, 5, 1]
 *     return Coins.map(_ => _ + amt).filter(_ => _ <= target)
 *   }
 * }
 * countChange(12) // Maybe.some([10, 11, 12])
 * countChange(-1) // Maybe.none
 */
export function bfs<A>(next: (a: A) => A[], found: Predicate<A>, initial: A) {
  const queue = MutableQueue.unbounded<A>()
  queue.offer(initial)
  const state0: SearchState<A> = {
    current: initial,
    queue: new SearchQueue(queue),
    visited: HashSet.empty(),
    paths: HashMap.empty()
  }
  return generalizedSearch(next, found).unsafeRunStateResult(state0)
}
