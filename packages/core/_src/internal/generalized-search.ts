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

export function generalizedSearch<A, K>(
  next: (a: A) => A[],
  found: Predicate<A>,
  makeKey: (a: A) => K,
  ord?: Ord<A>
) {
  // When we find it, use the error channel to short-circuit the loop
  return (
    Z.getsZ(dequeue)
      .tap(visit)
      .tap(discover)
      .flatMap(getsQueue)
      .repeatUntil((q) => q.isEmpty())
      // no failure means we didnt find it
      .map(constant(Maybe.none))
      .catchAll((e) => pipe(e, Maybe.fromNullable, Z.succeedNow))
  )

  function dequeue({ queue }: SearchState<A, K>) {
    return queue.pop().fold(
      () => Z.failNow(void null),
      (node) => Z.succeedNow(node)
    )
  }

  // check if this is the node we want and, if so, fail with the
  // path list; otherwise mark the node as visited
  function visit(a: A) {
    return found(a)
      ? buildPath(a)
      : Z.update(mark)

    // mark this node as having been visited
    function mark(state: SearchState<A, K>): SearchState<A, K> {
      return {
        ...state,
        visited: state.visited.add(makeKey(a))
      }
    }
  }

  function buildPath(v: A) {
    return Z.getsZ(({ paths }: SearchState<A, K>) => Z.failNow(makePath(v, paths)))

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

  // discover a node's neighbors and add the ones
  // we havent visited to the queue
  function discover(node: A) {
    const forEach = forEachZ<A, K>()
    return Z.gets(walk).flatMap(forEach(addNeigbor))
    function walk(state: SearchState<A, K>) {
      return pipe(
        next(node),
        Chunk.from,
        Chunk.$.filter((a) => !state.visited.has(makeKey(a)))
      )
    }

    function addNeigbor(neighbor: A) {
      return Z.update(({ paths, queue, ...state }: SearchState<A, K>) => ({
        ...state,
        // dont update parent paths, only insert
        paths: paths.modify(
          makeKey(neighbor),
          Maybe.$.fold(
            () => Maybe(node),
            (curr) => better(curr, node) ? Maybe(node) : Maybe(curr)
          )
        ),
        queue: queue.push(neighbor)
      }))
    }
  }
  /* returns true when `b` is better than `a` */
  function better(a: A, b: A): boolean {
    const _ord = isNull(ord) || isUndefined(ord) ? Ord(constant(0)) : ord
    return _ord.compare(a, b) < 0
  }

  function getsQueue() {
    return Z.gets<SearchState<A, K>, SearchContainer<A>>(({ queue }) => queue)
  }
}
