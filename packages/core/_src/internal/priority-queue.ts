import type { SearchContainer } from '@ts-search/core/internal/search-container'

export class PriorityQueue<A> implements SearchContainer<A> {
  _store: Array<A | undefined>
  _size = 0
  constructor(readonly ord: Ord<A>) {
    this._store = new Array(this._size)
  }

  push(_: A): PriorityQueue<A> {
    // console.log('<< priority queue adding ', _)
    if (this._store.length > this._size) {
      this._store.length = this._store.length * 2
    }
    this._store[this._size++] = _
    this.swim(this._size - 1)
    return this
  }
  peek(): Maybe<A> {
    return Maybe.fromNullable(this._store[0])
  }

  pop(): Maybe<A> {
    // console.log('>> priority queue popping ')
    const value = this._store[0]
    const last = this._store[this._size - 1]
    this._store[this._size - 1] = undefined
    this._size--
    if (!last) return Maybe.fromNullable(value)
    this._store[0] = last
    this.sink(0)
    return Maybe.fromNullable(value)
  }

  isEmpty(): boolean {
    return this._size <= 0
  }

  sink(oldIndex: number) {
    const oldValue = this._store[oldIndex]
    const [left, right] = [oldIndex * 2 + 1, oldIndex * 2 + 2]
    const [lc, rc] = [this._store[left], this._store[right]]
    const [newIndex, newValue] = oldValue && lc && rc && this.ord.compare(lc, rc) > 0 ?
      [right, rc] :
      [left, lc]
    if (oldValue && newValue && this.ord.compare(oldValue, newValue) > 0) {
      this._store[oldIndex] = newValue
      this._store[newIndex] = oldValue
      this.sink(newIndex)
    }
    return
  }

  swim(index: number) {
    const v = this._store[index]
    const parentIndex = Math.floor((index - 1) / 2)
    const parent = this._store[parentIndex]

    if (!parent || !v || this.ord.compare(v, parent) >= 0) return

    this._store[index] = parent
    this._store[parentIndex] = v
    this.swim(parentIndex)
  }
}
