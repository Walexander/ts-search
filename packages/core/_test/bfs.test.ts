import { bfs } from '@ts-search/core/bfs'
import { dijkstra } from '@ts-search/core/dijkstra'
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

describe('dijkstra', () => {
  const simpleNext = (path: string) => {
    // 'A1B B5C'
    type Entry = Tuple<[string, Tuple<[number, string]>]>
    type GroupEntry = HashMap<string, Tuple<[number, string]>[]>
    const reducer = (prev: GroupEntry, current: Entry) =>
      prev.modify(current.at(0), (v) =>
        v.fold(
          () => Maybe([current.at(1)]),
          (a) => Maybe([current.at(1), ...a])
        ))
    const words = path
      .split(' ')
      .map((value) => {
        const [source = '', cost = '0', dest = ''] = value.split('')
        return Tuple(source, Tuple(parseInt(cost, 10), dest))
      })
      .reduce(reducer, HashMap.empty())

    return (node: string) => words.get(node).getOrElse(() => <Tuple<[number, string]>[]> [])
  }
  describe('degenerate', () => {
    it('returns none', () => {
      const next = constant([])
      const found = constant(false)
      expect(dijkstra(next, found, 0)).to.deep.equal(Maybe.none)
    })

    it('trivial undirected', () => {
      const next = constant([Tuple(0, 'A')])
      const found = constant(true)
      expect(dijkstra(next, found, 'A')).to.deep.equal(Maybe.some(Tuple(0, ['A'])))
    })

    it('simple next', () => {
      const next = simpleNext('A1B B2C C5Z')
      const found = (n: string) => n == 'Z'
      const result = dijkstra(next, found, 'A')
      expect(result).to.deep.equal(Maybe(Tuple(8, ['A', 'B', 'C', 'Z'])))
    })
  })

  describe('multiple paths', () => {
    it('finds shortest', () => {
      const next = simpleNext('A5C A1B B2C')
      const found = (n: string) => n == 'C'
      const result = dijkstra(next, found, 'A')
      expect(result).to.deep.equal(Maybe(Tuple(3, ['A', 'B', 'C'])))
    })
  })
})
