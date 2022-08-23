import { bfs } from '@ts-search/core/bfs'
import { constant } from '@tsplus/stdlib/data/Function'

describe('bfs', () => {
  it('a predicate of const(true) returns initial element', () => {
    expect(
      bfs(
        (total) => Chunk(1, 2, 3).map((_) => _ + total).toArray,
        constant(true),
        0
      )
    ).to.deep.equal(Maybe.some([0]))
  })

  it('an empty find returns Maybe.none', () => {
    expect(bfs(
      constant([]),
      constant(false),
      0
    )).to.deep.equal(Maybe.none)
  })

  it('same output is skipped', async () => {
    const finder = vi.fn().mockImplementation(() => [0])
    const result = await Promise.resolve(bfs(
      finder,
      constant(false),
      0
    ))
    expect(result).to.deep.equal(Maybe.none)
    expect(finder).toHaveBeenCalledOnce()
  }, 1e3)

  it('finding the second node returns some', () => {
    const finder = vi.fn().mockImplementation(() => [1])
    const result = (bfs(
      finder,
      (node) => node == 1,
      0 as number
    ))
    expect(result).to.deep.equal(Maybe.some([0, 1]))
    expect(finder).toHaveBeenCalledOnce()
  }, 1e3)

  it('finding the fifth node of the nats returns all', () => {
    const finder = vi.fn().mockImplementation((n: number) => [n + 1])
    const result = (bfs(
      finder,
      (node) => node >= 5,
      0 as number
    ))
    expect(result).to.deep.equal(Maybe.some([0, 1, 2, 3, 4, 5]))
    expect(finder).toHaveBeenCalled()
  }, 1e3)

  it.skip('goes breadth first', () => {
    const next = (a: number) => a == 2 ? [4, 3] : a == 3 || a == 4 ? [5] : []
    const nextSpy = vi.fn(next)
    const result = bfs(nextSpy, (a) => a >= 5, 2)
    console.log('result is ', result)
    expect(nextSpy).toHaveBeenNthCalledWith(1, 2)
    expect(nextSpy).toHaveBeenNthCalledWith(2, 4)
    expect(nextSpy).toHaveBeenNthCalledWith(3, 3)
    expect(nextSpy).toHaveBeenNthCalledWith(4, 5)
    expect(result).to.deep.equal(Maybe.some([2, 3, 5]))
  })
  describe('bfs.legacy', () => {
    const next = (a: number) => [a - 1]
    it('when found is true returns initial element', () => {
      const result = bfs(next, constant(true), 5)
      expect(result).to.deep.equal(Maybe([5]))
    })
    it('found when true <= 3 has path of two', () => {
      const result = bfs(next, (a: number) => a <= 3, 5)
      expect(result).to.deep.equal(Maybe([5, 4, 3]))
    })
  })

  describe('adjacency lists', () => {
    const adjacencyList = {
      'foo': ['bar'],
      'bar': ['foobar', 'baz', 'bas'],
      'baz': ['foobar'],
      'bas': ['foobar'],
      'foobar': []
    }
    const adjacency = (a: string) => adjacencyList[a] || []
    it.skip('finds first path', () =>
      expect(bfs(adjacency, (a: string) => a == 'foobar', 'foo')).to.deep.equal(
        Maybe.some(['foo', 'foobar'])
      ))
  })
})
