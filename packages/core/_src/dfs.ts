import { generalizedSearch } from '@tsplus-search/core/internal/generalized-search'
import { SearchStack } from '@tsplus-search/core/internal/search-container'
import type { SearchState } from '@tsplus-search/core/internal/search-state'

/**
 * `dfs` uses a stack to find the first node that satisfies the given predicate returning a Maybe for the path to the solution node or Maybe.none if none exists. The `next` function should return values in the order they should be added to the stack - i.e. in reverse order of traversal
 *
 * @param next - Generate the neighbors
 * @param found {Predicate<A>} - A predicate to determine if the node is found
 * @param initial - The initial node from which to start
 *
 * @example
 * function countChange(target: number) {
 *   return dfs(addCoin, (a) => a == target, 0)
 *   function addCoin(amt: number) {
 *     const Coins = [25, 10, 5, 1]
 *     return Coins.map(_ => _ + amt).filter(_ => _ <= target)
 *   }
 * }
 * countChange(12) // Maybe.some([0, 1, 2, 12])
 * countChange(-1) // Maybe.none
 */
export function dfs<A>(
  next: (a: A) => A[],
  found: Predicate<A>,
  initial: A
): Maybe<A[]> {
  const state0: SearchState<A> = {
    current: initial,
    queue: new SearchStack<A>(new Stack(initial)),
    visited: HashSet.empty(),
    paths: HashMap.empty()
  }
  return generalizedSearch(next, found).unsafeRunStateResult(state0)
}
