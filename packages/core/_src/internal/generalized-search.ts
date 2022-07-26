import { Z } from '@fncts/base/control/Z'
import { constant } from '@tsplus/stdlib/data/Function'
import { ZAny, ZAssociativeBoth, ZCovariant } from './search-state'
import type { SearchState } from './search-state'

const forEachZ = <A>() =>
  Chunk.ForEach.forEachF(HKT.intersect(
    ZCovariant<A, any>(),
    ZAny<A, any>(),
    ZAssociativeBoth<A, any>()
  ))

export function generalizedSearch<A>(next: (a: A) => A[], found: Predicate<A>) {
  return Z.getsZ(({ queue }: SearchState<A>) =>
    /* get the next entry from the container */
    queue.pop().fold(
      /* this should not happen */
      () => Z.failNow(void null),
      /* discover its neighbors, adding them to the queue */
      discover
    )
  )
    .tap((a) =>
      /* check the current node */
      found(a)
        ? celebrate(a) // return the path to the found node
        : Z.update(mark(a)) // or mark the node as visited
    )
    .flatMap(() => Z.modify((s: SearchState<A>) => [s.queue, s]))
    // if we havent failed, repeat until the queue is empty
    .repeatUntil((s) => s.size() <= 0)
    // success will be in the failure channel, so a "success" here
    // means we failed to find a satisfactory node -- hence
    // we map to Mabye.none
    .map(constant(Maybe.none))
    // catch "failure" by converting non-null values to a Maybe.some
    .catchAll((e) => pipe(e, Maybe.fromNullable, Z.succeedNow))

  function discover(node: A) {
    const forEach = forEachZ<A>()
    return Z.getsZ((state: SearchState<A>) => onDiscovered(node, state)).map(
      constant(node)
    )

    function onDiscovered(node: A, state: SearchState<A>) {
      return pipe(
        next(node),
        Chunk.from,
        Chunk.$.filter((a) => !state.visited.has(a)),
        forEach((a) => (
          Z.update((s) => ({
            ...s,
            paths: s.paths.modify(a, () => Maybe(node)),
            queue: s.queue.push(a)
          }))
        ))
      )
    }
  }

  function celebrate(a: A) {
    return Z.getsZ(({ paths }: SearchState<A>) => {
      const points = makeParents(a, paths)
      return Z.failNow(points)
    })
  }

  function mark(a: A): (state: SearchState<A>) => SearchState<A> {
    return (state) => (
      <SearchState<A>> {
        ...state,
        visited: state.visited.add(a)
      }
    )
  }
}

function makeParents<A>(v: A, parent: HashMap<A, A>) {
  return iter(v, [v])
  function iter(p: A, ps: A[]): A[] {
    return parent.get(p).fold(
      () => ps,
      (a) => iter(a, [a, ...ps])
    )
  }
}
