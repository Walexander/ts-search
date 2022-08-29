import { Z } from '@fncts/base/control/Z'
import { isNull, isUndefined } from '@fncts/base/util/predicates'
import type { SearchContainer } from '@ts-search/core/internal/search-container'
import { ZAny, ZAssociativeBoth, ZCovariant } from '@ts-search/core/internal/search-state'
import type { SearchState } from '@ts-search/core/internal/search-state'
import { constant } from '@tsplus/stdlib/data/Function'

const forEachZ = <A, K>() =>
  Chunk.ForEach.forEachF(HKT.intersect(
    ZCovariant<A, K, any>(),
    ZAny<A, K, any>(),
    ZAssociativeBoth<A, K, any>()
  ))
/**
 * `generalizedSearch` returns a Z that describes
 * 1. `dequeue`ing a node from `SearchState[queue]`
 * 2. `visit`ing that node to see if its satisfies `found`
 * 3. `walk`ing that node to `discover` its unvisited neighbors
 * 4. `repeatUntil` either the queue is empty or the node is found
 *
 * @param next - Function to generate neighbors
 * @param found {Predicate<A>} Test if this is the desired node
 * @param makeKey Generate a key `K` from an `A`
 * @return Returns path to the node satisfying `found` or None
 * @template A, K
 */
export function generalizedSearch<A, K>(
  next: (a: A) => A[],
  found: Predicate<A>,
  makeKey: (a: A) => K,
  ord?: Ord<A>
) {
  const ord_ = isNull(ord) || isUndefined(ord) ? Ord(constant(0)) : ord
  const forEach_ = forEachZ<A, K>()
  const getQueue = Z.gets<SearchState<A, K>, SearchContainer<A>>(
    ({ queue }) => queue
  )
  const step = Do(($) => {
    const current = $(dequeue())
    const maybeFound = $(visit(current))
    $(walk(current)(maybeFound))
    return maybeFound
  })

  return step
    .zip(getQueue)
    .repeatUntil(([found, q]) => q.isEmpty() || found.isSome())
    .flatMap(([a]) => unpack(a))
    .catchAll(() => Z.succeedNow(Maybe.none))

  function unpack(a: Maybe<A>) {
    return a.fold(
      () => Z.succeedNow(Maybe.none),
      (node) => buildPath(node).map(Maybe.some)
    )
  }

  function dequeue() {
    return Z.getsZ(({ queue }: SearchState<A, K>) =>
      queue.pop().fold(
        () => Z.failNow(void null),
        (node) => Z.succeedNow(node)
      )
    )
  }

  // check if this is the node we want and, if so, fail with the
  // path list; otherwise mark the node as visited
  function visit(a: A) {
    return Z.unit
      .write(`visiting ${a}`)
      .zipSecond(
        found(a)
          ? Z.succeedNow(Maybe.some(a))
          : Z.update(mark).map(constant(Maybe.none))
      )
    // mark this node as having been visited
    function mark(state: SearchState<A, K>): SearchState<A, K> {
      return {
        ...state,
        visited: state.visited.add(makeKey(a))
      }
    }
  }

  // if not found(a) discover(a)
  function walk(a: A) {
    return Maybe.$.fold(
      () => discover(a).write(`discovered neighbors of ${a}`),
      () => Z.unit.write(`found ${a}`)
    )
  }

  function discover(discoveryNode: A) {
    return Z.unit
      .write(`neighbors of ${discoveryNode}`)
      .flatMap(() => Z.gets(getNeighbors))
      .flatMap(forEach_(addNeigbor))

    function getNeighbors(state: SearchState<A, K>) {
      return pipe(
        next(discoveryNode),
        Chunk.from,
        Chunk.$.filter((a) => !state.visited.has(makeKey(a)))
      )
    }

    // this function sets the parent of `neighbor` to `discoveryNode` if
    //  1. `neighbor` does not have a parent
    //  2. `discoveryNode` is `better` than `currentParent`
    // and enqueues neighbor into `SearchState[queue]``
    function addNeigbor(neighbor: A) {
      return Z.update(({ paths, queue, ...state }: SearchState<A, K>) => ({
        ...state,
        paths: paths.modify(makeKey(neighbor), updateParent),
        queue: queue.push(neighbor)
      })).write(`discovered ${discoveryNode} => ${neighbor}`)

      function updateParent(a: Maybe<A>) {
        return a
          .map((current) => better(discoveryNode, current))
          .orElse(constant(Maybe(discoveryNode)))
      }
    }
  }

  // return `a` if better than `b`.  infix `(a better b)`
  function better(a: A, b: A): A {
    return ord_.compare(b, a) < 0 ? a : b
  }

  function buildPath(v: A) {
    return Z.gets(({ paths }: SearchState<A, K>) => makePath(v, paths))

    function makePath(v: A, paths: HashMap<K, A>) {
      return iter(v, [v])

      function iter(p: A, ps: A[]): A[] {
        return pipe(
          paths,
          HashMap.$.get(makeKey(p)),
          Maybe.$.fold(constant(ps), (a) => iter(a, [a, ...ps]))
        )
      }
    }
  }
}
