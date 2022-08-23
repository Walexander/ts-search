import { dijkstra } from '@ts-search/core/dijkstra'
import { constant } from '@tsplus/stdlib/data/Function'

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
