import { Z } from '@fncts/base/control/Z'
import type { Any } from '@tsplus/stdlib/prelude/Any'
import type { AssociativeBoth } from '@tsplus/stdlib/prelude/AssociativeBoth'
import type { Covariant } from '@tsplus/stdlib/prelude/Covariant'
import type { SearchContainer } from './search-container'

export interface ZFunctor<V, W = string> extends HKT {
  readonly type: Z<
    W,
    SearchState<V>,
    SearchState<V>,
    this['R'],
    this['E'],
    this['A']
  >
}
export type ZSearch<R, E, A> = Z<string, SearchState<A>, SearchState<A>, R, E, A>

export interface SearchState<A> {
  current: A
  queue: SearchContainer<A>
  visited: HashSet<A>
  paths: HashMap<A, A>
}

export function ZCovariant<V, W>() {
  return HKT.instance<Covariant<ZFunctor<V, W>>>({
    map: (f) => (fa) => fa.map(f)
  })
}

export function ZAssociativeBoth<V, W>() {
  return HKT.instance<AssociativeBoth<ZFunctor<V, W>>>({
    both: (fb) => (fa) => fa.zip(fb).map((t) => Tuple(...t))
  })
}
export function ZAny<V, W>() {
  return HKT.instance<Any<ZFunctor<V, W>>>({
    any: () => Z.succeedNow({})
  })
}
