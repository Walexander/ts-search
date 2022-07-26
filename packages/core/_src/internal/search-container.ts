import { isNull } from '@fncts/base/util/predicates'

export interface SearchContainer<A> {
  push: (a: A) => SearchContainer<A>
  pop: () => Maybe<A>
  size: () => number
}

export class SearchQueue<A> implements SearchContainer<A> {
  constructor(readonly queue: MutableQueue<A> = MutableQueue.unbounded()) {}

  push(a: A): SearchContainer<A> {
    this.queue.offer(a)
    return this
  }

  pop() {
    const value = this.queue.poll(null)
    return isNull(value) ? Maybe.none : Maybe.some(value)
  }
  size() {
    return this.queue.size
  }
}
