import { bfs, dfs } from '@tsplus-search/core'

const countChange_bfs = (target: number) => bfs(addOne(target), (a) => a == target, 0)
const countChange_dfs = (target: number) => dfs(addOne(target), (a) => a == target, 0)
console.log('BFS 67 =', countChange_bfs(67).value)
console.log('DFS 67 =', countChange_dfs(67).value)

const adjacencyList = Object.fromEntries([
  [1, [2, 3]],
  [2, [4]],
  [3, [4]],
  [4, []]
])
//     1
//    / \
//   2   3
//    \ /
//     4
const neighbors = (n: number) => adjacencyList[n] || []
console.log('path 1->4 : ', dfs(neighbors, (a) => a == 4, 1))

// const result2 = countChange(67)
// console.log('change for 67 =', result2.value)

function addOne(target: number) {
  return (amt: number) => {
    const Coins = [25, 10, 5, 1]
    return Coins.map(_ => _ + amt).filter(_ => _ <= target)
  }
}
