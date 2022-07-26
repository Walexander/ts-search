import { dfs } from '@tsplus-search/core'
import { constant } from '@tsplus/stdlib/data/Function'

describe('dfs', () => {
  describe('degenerate', () => {
    it('an empty next with a false found is none', () =>
      expect(
        dfs((_: number) => [], constant(false), 0)
      ).to.deep.equal(Maybe.none))

    it('an always false found is none', () =>
      expect(
        dfs((_: number) => [_], constant(false), 0)
      ).to.deep.equal(Maybe.none))

    it('an always true found contains initial element', () =>
      expect(
        dfs((_: number) => [], constant(true), 5)
      ).to.deep.equal(Maybe.some([5])))
  })

  describe('short paths', () => {
    it('found for second node contains initial and second', () =>
      expect(dfs(
        (_: number) => [_ - 1],
        (a) => a % 2 == 0,
        5
      )).to.deep.equal(Maybe.some([5, 4])))

    it('finds straight paths', () =>
      expect(dfs(
        (_: number) => [_ - 1],
        (a) => a == 0,
        3
      )).to.deep.equal(Maybe.some([3, 2, 1, 0])))

    it('finds the second straight path', () =>
      expect(dfs(
        (_: number) => [_ - 2, _ - 1],
        (a) => a <= 1,
        5
      )).to.deep.equal(Maybe.some([5, 4, 3, 2, 1])))
  })

  describe('adjacency lists', () => {
    const adjacencyList = {
      'foo': ['bar'],
      'bar': ['foobar', 'baz', 'bas'],
      'baz': ['foobar'],
      'bas': ['foobar'],
      'foobar': ['winner']
    }
    const adjacency = (a: string) => adjacencyList[a] || []
    it('finds second path', () =>
      expect(dfs(adjacency, (a: string) => a == 'winner', 'foo')).to.deep.equal(
        Maybe.some(['foo', 'bar', 'bas', 'foobar', 'winner'])
      ))
  })
})
