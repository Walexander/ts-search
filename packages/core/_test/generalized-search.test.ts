import { SearchQueue } from '@ts-search/core/bfs'
import { generalizedSearch } from '@ts-search/core/internal/generalized-search'

describe('generalizedSearch', () => {
  const simpleNext = (path: string) => {
    // 'A1B B5C'
    type Entry = Tuple<[string, string]>
    type GroupEntry = HashMap<string, string[]>
    const reducer = (prev: GroupEntry, current: Entry) =>
      prev.modify(current.at(0), (v) =>
        v.fold(
          () => Maybe([current.at(1)]),
          (a) => Maybe([current.at(1), ...a])
        ))
    const words = path
      .split(' ')
      .map((value) => {
        const [source = '', dest = ''] = value.split('')
        return Tuple(source, dest)
      })
      .reduce(reducer, HashMap.empty())

    return (node: string) => words.get(node).getOrElse(() => <Array<string>> [])
  }
  describe('generalizedSearchLogs', () => {
    const noSolution = {
      next: simpleNext('AB B2'),
      found: (a: string) => a == 'C'
    }
    const twoStep = {
      next: simpleNext('AB BC'),
      found: (a: string) => a == 'C'
    }

    it('generates visits when no solution', () => {
      const { found, next } = noSolution
      const queue = MutableQueue.unbounded<string>()
      queue.offer('A')
      const state = {
        current: 'A',
        queue: new SearchQueue<string>(queue),
        visited: HashSet.empty<string>(),
        paths: HashMap.empty<string, string>()
      }
      const eff = generalizedSearch(next, found, identity, Ord.string)
      const [log, exit] = eff.unsafeRunAll(state)
      expect(log.toArray).to.include('visiting A')
      expect(exit.isSuccess()).to.be.true
      exit.isSuccess() && expect(exit.value[1]).to.equal(Maybe.none)
    })

    it('gensearch - logs found node', () => {
      const { found, next } = twoStep
      const queue = MutableQueue.unbounded<string>()
      queue.offer('A')
      const state = {
        current: 'A',
        queue: new SearchQueue<string>(queue),
        visited: HashSet.empty<string>(),
        paths: HashMap.empty<string, string>()
      }
      const eff = generalizedSearch(next, found, identity, Ord.string)

      const [log, exit] = eff.unsafeRunAll(state)
      expect(exit.isSuccess()).to.be.true
      if (exit.isFailure()) assert.fail(`failure ?? ${exit.cause}`)
      expect(log.toArray).to.include('found C')
    })

    it('gensearch2 - logs visiting', () => {
      const { found, next } = twoStep
      const queue = MutableQueue.unbounded<string>()
      queue.offer('A')
      const state = {
        current: 'A',
        queue: new SearchQueue<string>(queue),
        visited: HashSet.empty<string>(),
        paths: HashMap.empty<string, string>()
      }
      const eff = generalizedSearch(next, found, identity, Ord.string)
      const [log, exit] = eff.unsafeRunAll(state)
      expect(log.toArray).to.include('visiting A')
      expect(log.toArray).to.include('visiting B')
      expect(log.toArray).to.include('visiting C')
      if (exit.isFailure()) assert.fail(`failure ?? ${exit.cause}`)
    })

    it('gensearch - logs discovery', () => {
      const { found, next } = twoStep
      const queue = MutableQueue.unbounded<string>()
      queue.offer('A')
      const state = {
        current: 'A',
        queue: new SearchQueue<string>(queue),
        visited: HashSet.empty<string>(),
        paths: HashMap.empty<string, string>()
      }
      const eff = generalizedSearch(next, found, identity, Ord.string)

      const [log, exit] = eff.unsafeRunAll(state)
      expect(exit.isSuccess()).to.be.true
      if (exit.isFailure()) assert.fail(`failure ?? ${exit.cause}`)
      expect(log.toArray).to.include('discovered A => B')
      expect(log.toArray).to.include('discovered B => C')
    })

    it('gensearch - logs discovery', () => {
      const next = simpleNext('AB BC DE BE CD')
      const queue = MutableQueue.unbounded<string>()
      queue.offer('A')
      const state = {
        current: 'A',
        queue: new SearchQueue<string>(queue),
        visited: HashSet.empty<string>(),
        paths: HashMap.empty<string, string>()
      }
      const eff = generalizedSearch(next, (a) => a == 'E', identity, Ord.string)

      const [log, exit] = eff.unsafeRunAll(state)
      console.log('logs are ', log.toArray)
      expect(exit.isSuccess()).to.be.true
      if (exit.isFailure()) assert.fail(`failure ?? ${exit.cause}`)
      expect(log.toArray).to.include('discovered A => B')
      expect(log.toArray).to.include('discovered B => C')
    })
  })
})
