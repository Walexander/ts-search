import { isNonNullable } from '@fncts/base/util/predicates'

export interface SearchContainer<A> {
  push: (a: A) => SearchContainer<A>
  pop: () => Maybe<A>
  isEmpty: () => boolean
}
export class SearchStack<A> implements SearchContainer<A> {
  stack: Stack<A> | undefined
  constructor(stack: Stack<A>) {
    this.stack = stack
  }

  push(a: A): SearchContainer<A> {
    this.stack = new Stack(a, this.stack)
    return this
  }

  pop() {
    const value = this.stack?.value
    this.stack = this.stack?.previous
    return Maybe.fromNullable(value)
  }

  isEmpty() {
    return !isNonNullable(this.stack?.value)
  }
}

export class SearchQueue<A> implements SearchContainer<A> {
  constructor(readonly queue: MutableQueue<A> = MutableQueue.unbounded()) {}

  push(a: A): SearchContainer<A> {
    this.queue.offer(a)
    return this
  }

  pop() {
    const value = this.queue.poll(null)
    return Maybe.fromNullable(value)
  }
  size() {
    return this.queue.size
  }
  isEmpty() {
    return this.queue.size <= 0
  }
}
