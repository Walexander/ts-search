import { bfs, bfs0 } from '@tsplus-search/core/bfs'
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
    console.log('i am starting')
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
})

describe('visit', () => {
  const _ = (a: number) => (a % 2 == 0 ? [] : [a + 1])
  void _
  it.todo('visits all nodes')
})

describe('bfs0', () => {
  const next = (a: number) => [a - 1]
  it('when found is true returns initial element', () => {
    const result = bfs0(next, constant(true), 5)
    expect(result).to.deep.equal(Maybe([5]))
  })

  it('an empty find returns Maybe.none', () => {
    expect(bfs0(
      constant([]),
      constant(false),
      0
    )).to.deep.equal(Maybe.none)
  })

  it.only('found when true <= 3 has path of two', () => {
    const result = bfs0(next, (a: number) => a <= 3, 5)
    expect(result).to.deep.equal(Maybe([5, 4, 3]))
  })

  it('a next of empty is none', () => {
    const result = bfs(() => [], constant(false), 5)
    expect(result).to.deep.equal(Maybe.none)
  })

  it('skips visited nodes', () => {
    expect(
      bfs(constant([5]), constant(false), 7)
    ).to.deep.equal(Maybe.none)
  })

  it('goes breadth first', () => {
    const next = (a: number) => a == 2 ? [4, 3] : a == 3 || a == 4 ? [5] : []
    const nextSpy = vi.fn(next)
    const result = bfs(nextSpy, (a) => a >= 5, 2)
    console.log('result is ', result)
    expect(nextSpy).toHaveBeenCalledWith(4)
    expect(nextSpy).toHaveBeenCalledWith(2)
    expect(nextSpy).toHaveBeenCalledWith(3)
    expect(nextSpy).toHaveBeenCalledTimes(3)
    expect(result).to.deep.equal(Maybe.some([2, 3, 5]))
  })
})
