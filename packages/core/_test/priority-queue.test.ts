import { PriorityQueue } from '@ts-search/core/internal/priority-queue'
import type { SearchContainer } from '@ts-search/core/internal/search-container'

describe('PriorityQueue', () => {
  describe('degenerate', () => {
    it('popping an empty queue is Maybe.none', () => {
      const q = new PriorityQueue(Ord.number)
      expect(q.pop()).to.equal(Maybe.none)
    })
    it('an empty queue is always empty', () => {
      const q = new PriorityQueue(Ord.number)
      expect(q.isEmpty()).to.be.true
    })
    it('pushing into an empty queue returns a non-empty queue', () => {
      let q: SearchContainer<number> = new PriorityQueue(Ord.number)
      q = q.push(5)
      expect(q.isEmpty()).to.be.false
    })
  })

  describe('trivial queue', () => {
    it('pop returns value', () => {
      let q = new PriorityQueue(Ord.number)
      q = q.push(5)
      expect(q.pop()).to.deep.equal(Maybe.some(5))
    })
    it('popping a trivial queue results in an empty queue', () => {
      let q = new PriorityQueue(Ord.number)
      q = q.push(5)
      q.pop()
      expect(q.isEmpty()).to.be.true
    })
  })

  describe('non-empty queue', () => {
    it('peeking returns smallest element', () => {
      let q = new PriorityQueue(Ord.number)
      q = q.push(7).push(17).push(5).push(19).push(24)
      expect(q.peek()).to.deep.equal(Maybe.some(5))
    })
    it('popping returns smallest elements', () => {
      let q = new PriorityQueue(Ord.number)
      q = q.push(7).push(17).push(5).push(19).push(24)
      expect(q.pop()).to.deep.equal(Maybe.some(5))
    })
    it('popping puts next smallest element on top', () => {
      let q = new PriorityQueue(Ord.number)
      q = q.push(7).push(17).push(5).push(19).push(24)
      q.pop()
      expect(q.peek()).to.deep.equal(Maybe(7))
    })
    it('popping twice puts third smallest element on top', () => {
      let q = new PriorityQueue(Ord.number)
      q = q
        .push(7)
        .push(17)
        .push(5)
        .push(19)
        .push(24)
        .push(100)
        .push(99)
        .push(55)
        .push(28)
      q.pop()
      q.pop()

      expect(q.peek()).to.deep.equal(Maybe(17))
    })
  })
})
