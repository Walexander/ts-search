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
  const _ord = isNull(ord) || isUndefined(ord) ? Ord(constant(0)) : ord
  const eff = Z.getsZ(dequeue)
    .flatMap((a) =>
      Z.unit
        .write(`visiting ${a}`)
        .zipSecond(
          visit(a)
            .tap(Maybe.$.fold(
              () => discover(a),
              () => Z.unit.write(`found ${a}`)
            ))
        )
        .write(`visited ${a}`)
    )
    .zip(getsQueue())
    .repeatUntil(([found, q]) => q.isEmpty() || found.isSome())
    .flatMap(([a]) =>
      a.fold(
        () => Z.succeedNow(Maybe.none),
        (node) => buildPath(node).map(Maybe.some)
      )
    )
    .catchAll(() => Z.succeedNow(Maybe.none))

  return eff

  function dequeue({ queue }: SearchState<A, K>) {
    return queue.pop().fold(
      () => Z.failNow(void null),
      (node) => Z.update(setCurrent(node)).map(constant(node))
    )
    function setCurrent(current: A): (state: SearchState<A, K>) => SearchState<A, K> {
      return (state) => ({
        ...state,
        current
      })
    }
  }

  // check if this is the node we want and, if so, fail with the
  // path list; otherwise mark the node as visited
  function visit(a: A) {
    return found(a)
      ? Z.succeedNow(Maybe.some(a))
      : Z.update(mark).map(constant(Maybe.none))

    // mark this node as having been visited
    function mark(state: SearchState<A, K>): SearchState<A, K> {
      return {
        ...state,
        visited: state.visited.add(makeKey(a))
      }
    }
  }

  // discover a node's neighbors and add the ones
  // we havent visited to the queue
  function discover(node: A) {
    const forEach = forEachZ<A, K>()
    return Z.unit
      .write(`neighbors of ${node}`)
      .flatMap(() => Z.gets(walk))
      .flatMap(forEach(addNeigbor))

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
        paths: paths.modify(
          makeKey(neighbor),
          Maybe.$.fold(
            () => Maybe(node),
            // update parent paths when `node` "better" `current`
            (curr) => better(node, curr) ? Maybe(node) : Maybe(curr)
          )
        ),
        queue: queue.push(neighbor)
      }))
        .write(`discovered ${node} => ${neighbor}`)
    }
  }

  /* returns true when `b` is better than `a` */
  function better(a: A, b: A): boolean {
    return _ord.compare(b, a) < 0
  }

  function getsQueue() {
    return Z.gets<SearchState<A, K>, SearchContainer<A>>(({ queue }) => queue)
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
