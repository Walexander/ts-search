import { generalizedSearch } from '@ts-search/core/internal/generalized-search'
import { PriorityQueue } from '@ts-search/core/internal/priority-queue'
import type { SearchState } from '@ts-search/core/internal/search-state'
import { Ord } from '@tsplus/stdlib/prelude/Ord'

type CostState<A> = Tuple<[number, A]>
/**
 * `djikstra` uses a `next` that returns an array of (weight, Edge)[]
 * pairs.  Nodes are dequeued based on their relative priority and, as such,
 * returns a tuple of the total weights of all edges and the shortest
 * path from `initial` to `found`
 *
 * @param next - Generate the outbound edges and their weights
 * @param found {Predicate<A>} - A predicate to determine when the node is found
 * @param initial {A} - The starting value
 */
export function dijkstra<A>(
  next: (a: A) => CostState<A>[],
  found: Predicate<A>,
  initial: A
) {
  const ord_ = Ord.number.contramap((st: CostState<A>) => st.at(0))
  const queue = new PriorityQueue(ord_).push(Tuple(0, initial))

  const key_ = (st: CostState<A>) => st.at(1)
  const next_ = (st0: CostState<A>) =>
    pipe(key_(st0), next, (sts) =>
      sts.map((st) => {
        const cost = st0.at(0) + st.at(0)
        return Tuple(cost, key_(st))
      }))

  const found_ = (st: CostState<A>) => found(key_(st))
  const state0: SearchState<CostState<A>, A> = {
    current: Tuple(0, initial),
    queue,
    visited: HashSet.empty(),
    paths: HashMap.empty()
  }
  const reducer = (prev: Tuple<[number, A[]]>, curr: CostState<A>) =>
    Tuple(Math.max(curr.at(0), prev.at(0)), prev.at(1).concat(curr.at(1)))

  const [, result] = generalizedSearch(
    next_,
    found_,
    key_,
    ord_
  ).unsafeRun(state0)

  return result.map(
    (as) => as.reduce(reducer, Tuple(0, []))
  )
}
