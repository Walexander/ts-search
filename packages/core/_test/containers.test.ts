import { SearchQueue } from '@ts-search/core/bfs'

describe('SearchContainer', () => {
  it('queues', () => {
    const qq = MutableQueue.unbounded()
    const q = new SearchQueue(qq)
    q.push(0)
    qq.take(1)
    qq.poll(ImmutableQueue.empty)
    expect(qq.size).to.equal(0)
  })
  it('pops', () => {
    const qq = MutableQueue.unbounded()
    const q = new SearchQueue(qq)
    q.push(15)
    q.push(5)
    expect(q.pop()).to.deep.equal(Maybe.some(15))
    expect(q.size()).to.equal(1)
  })
})
