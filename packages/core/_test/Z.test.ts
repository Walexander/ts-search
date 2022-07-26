import * as Z from '@fncts/base/control/Z'
import { constant } from '@tsplus/stdlib/data/Function'
import type * as Any from '@tsplus/stdlib/prelude/Any'
import type * as AB from '@tsplus/stdlib/prelude/AssociativeBoth'
import type * as C from '@tsplus/stdlib/prelude/Covariant'

// type Z0 = Z.Z<W, S1, S2, R, E, A>
interface ZF<W, S1, S2> extends HKT {
  readonly type: Z.Z<W, S1, S2, this['R'], this['E'], this['A']>
}
function Covariant<W, S1>(): C.Covariant<ZF<W, S1, S1>> {
  return HKT.instance<C.Covariant<ZF<W, S1, S1>>>({
    map: (f) => (fa) => fa.map(f)
  })
}
function AssociativeBoth<W, S1>(): AB.AssociativeBoth<ZF<W, S1, S1>> {
  return HKT.instance({
    both: <R2, E2, B>(fb: Z.Z<W, S1, S1, R2, E2, B>) =>
      <R, E, A>(fa: Z.Z<W, S1, S1, R, E, A>) => fa.zip(fb).map((t) => Tuple(...t))
  })
}

function AnyF<W, S1>(): Any.Any<ZF<W, S1, S1>> {
  return HKT.instance({
    any: () => Z.succeedNow<any, never, S1, S1>({})
  })
}
describe('Z', () => {
  type State = readonly [HashSet<number>, ImmutableQueue<number>]
  const process = (n: number) =>
    Z.get<State>()
      .map(([v]) => v.has(n))
      .flatMap((visited) =>
        Z.update(([v, q]: State) =>
          visited ? ([v, q] as State) : ([v.add(n), q.append(n)] as State)
        ).write(`${n} was${visited ? '' : ' NOT'} visited ${visited ? 'already' : 'yet'}`)
      )
      .flatMap(() => Z.get<State>().map(([_, q]) => q))
  const covariant = Covariant<string, State>()
  const associativeBoth = AssociativeBoth<string, State>()
  const any = AnyF<string, State>()
  const _ = HKT.intersect(covariant, associativeBoth, any)
  const forEach = Chunk.ForEach.forEachF(_)

  it('success', () => {
    const _z = Z.unit
      .write(`hello`)
      .write('World')
      .listens((log) => {
        log.forEach((_) => console.warn('log ine is ', _))
      })
      .map(() => 15)
    expect(_z.unsafeRunResult).to.equal(15)
  })

  it('forEach', () => {
    const covariant = Covariant<never, number>()
    const associativeBoth = AssociativeBoth<never, number>()
    const any = AnyF<never, number>()
    const _ = HKT.intersect(covariant, associativeBoth, any)
    const forEach = Chunk.ForEach.forEachF(_)
    const __ = forEach((n: number) =>
      Z.update((s: number) => s + n)
        .flatMap(() => Z.get<number>().map((a) => a + n))
    )

    const result = __(Chunk(2, 4, 6)).unsafeRunStateResult(5)
    console.log('value is ', Chunk.getShow(Show.number).show(result))
    assert.isTrue(
      result == Chunk(9, 15, 23)
    )
  })

  it('stateful', () => {
    const hi = HashSet<number[]>()
    const iq = ImmutableQueue<number[]>()
    const init: State = [hi, iq] as const
    const result = forEach(process)(Chunk(5, 9, 1, 5, 3)).unsafeRunAll(init)
    result[0].forEach((v) => console.log('process line : %s ', v))
    if (result[1].isFailure()) {
      assert.fail('should not fail')
    } else {
      const [[_, queue], a] = result[1].value
      assert.equal(queue.size, 4)
      assert.equal(a.length, 5)
    }
  })

  it('repeatUntil', () => {
    const z = Do((Δ) => {
      const state = Δ(Z.get<number[]>())
      const [_, ...rest] = state
      Δ(pipe(Z.update(() => rest).write(`this is written: ${_}`)))
      return rest.length
    })
    const [logs, exit] = z.repeatUntil((a) => a <= 0)
      .unsafeRunAll([1, 3, 4])

    logs.forEach((entry) => console.log(`entry is: ${entry}`))
    exit.isSuccess() ?
      expect(exit.value[0]).to.deep.equal([]) :
      assert.fail(`should not be a failure`)
  })

  it('repeatUntil drained', () => {
    type QN = ImmutableQueue<number>
    const z = Z.get<QN>()
      .flatMap((state) =>
        state.dequeue.fold(
          () => Z.succeedNow(ImmutableQueue.empty<number>()).write(`empty queue???`),
          ({ tuple: [_, rest] }) =>
            Z.update(() => _ % 2 == 0 ? rest : rest.append(_ + 1))
              .write(`value from queue: ${_}`)
              .map(constant(rest))
        )
      )
    const queue: QN = ImmutableQueue(1, 3, 5, 7)
    const [logs, exit] = z.repeatUntil((a) => a.size <= 0)
      .unsafeRunAll(queue)

    logs.forEach((entry) => console.log(`entry is: ${entry}`))
    exit.isSuccess() ?
      expect(exit.value[0]).to.deep.equal(ImmutableQueue.empty<number>()) :
      assert.fail(`should not be a failure`)
  })

  it('tap fail', () => {
    const z = Z.succeedNow('you dont suck')
      .tap(() => Z.failNow(`you suck`))
      .catchAll((e) => Z.succeedNow(e))
    const output = z.unsafeRunResult
    expect(output).to.equal('you suck')
  })
})
