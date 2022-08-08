import { Z } from '@fncts/base/control/Z'
import type { SearchContainer } from '@ts-search/core/internal/search-container'
import { ZAny, ZAssociativeBoth, ZCovariant } from '@ts-search/core/internal/search-state'
import type { SearchState } from '@ts-search/core/internal/search-state'
import { constant } from '@tsplus/stdlib/data/Function'

const forEachZ = <A>() =>
  Chunk.ForEach.forEachF(HKT.intersect(
    ZCovariant<A, any>(),
    ZAny<A, any>(),
    ZAssociativeBoth<A, any>()
  ))
declare const opt: Maybe<any>
export function generalizedSearch<A>(next: (a: A) => A[], found: Predicate<A>) {
  // When we find it, use the error channel to short-circuit the loop
  return Z.getsZ(dequeue)
    .tap(visit)
    .tap(discover)
    .flatMap(getsQueue)
    .repeatUntil(q => q.isEmpty())
    // no failure means we didnt find it
    .map(constant(Maybe.none))
    .catchAll((e) => pipe(e, Maybe.fromNullable, Z.succeedNow))

  function dequeue({ queue }: SearchState<A>) {
    return queue.pop().fold(
      () => Z.failNow(void null),
      (node) => Z.succeedNow(node)
    )
  }

  // check if this is the node we want and, if so, fail with the
  // path list; otherwise mark the node as visited
  function visit(a: A) {
    return found(a) ?
      Z.getsZ(({ paths }: SearchState<A>) => Z.failNow(makePath(a, paths))) :
      Z.update(mark)

    // mark this node as having been visited
    function mark(state: SearchState<A>): SearchState<A> {
      return {
        ...state,
        visited: state.visited.add(a)
      }
    }

    // get the path to the node `v` by looking up its parent node recursively
    function makePath<A>(v: A, paths: HashMap<A, A>) {
      return iter(v, [v])

      function iter(p: A, ps: A[]): A[] {
        return paths.get(p).fold(
          constant(ps),
          (a) => iter(a, [a, ...ps])
        )
      }
    }
  }

  // discover a node's neighbors and add the ones
  // we havent visited to the queue
  function discover(node: A) {
    const forEach = forEachZ<A>()
    return Z.gets(walk)
      .flatMap(forEach(addNeigbor))

    function walk(state: SearchState<A>) {
      return pipe(
        next(node),
        Chunk.from,
        Chunk.$.filter((a) => !state.visited.has(a))
      )
    }

    function addNeigbor(neighbor: A) {
      return Z.update(
        ({ paths, queue, ...state }: SearchState<A>) => ({
          ...state,
          // dont update parent paths, only insert
          paths: paths.modify(neighbor, Maybe.$.orElse(Maybe(node))),
          queue: queue.push(neighbor)
        })
      )
    }
  }

  function getsQueue() {
    return Z.gets<SearchState<A>, SearchContainer<A>>(({ queue }) => queue)
  }
}
