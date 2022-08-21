import { Z } from '@fncts/base/control/Z'
import type { SearchContainer } from '@ts-search/core/internal/search-container'
import type { Any } from '@tsplus/stdlib/prelude/Any'
import type { AssociativeBoth } from '@tsplus/stdlib/prelude/AssociativeBoth'
import type { Covariant } from '@tsplus/stdlib/prelude/Covariant'

export interface ZFunctor<V, K, W = string> extends HKT {
  readonly type: Z<
    W,
    SearchState<V, K>,
    SearchState<V, K>,
    this['R'],
    this['E'],
    this['A']
  >
}
export type ZSearch<R, E, A, K> = Z<string, SearchState<A, K>, SearchState<A, K>, R, E, A>

export interface SearchState<A, K> {
  current: A
  queue: SearchContainer<A>
  visited: HashSet<K>
  paths: HashMap<K, A>
}

export function ZCovariant<V, K, W>() {
  return HKT.instance<Covariant<ZFunctor<V, K, W>>>({
    map: (f) => (fa) => fa.map(f)
  })
}

export function ZAssociativeBoth<V, K, W>() {
  return HKT.instance<AssociativeBoth<ZFunctor<V, K, W>>>({
    both: (fb) => (fa) => fa.zip(fb).map((t) => Tuple(...t))
  })
}
export function ZAny<V, K, W>() {
  return HKT.instance<Any<ZFunctor<V, K, W>>>({
    any: () => Z.succeedNow({})
  })
}
