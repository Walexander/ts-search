### Functional graph search algorithms

Three graph search algorithms:
1. Breadth-first-search `bfs`
2. Depth-first search `dfs`
3. Dijkstras algorithm `dijkstra`

## Usage
Each function takes three parameters
1. `next: (a: A) => A[]`
The `next` function should take a node and return a list of neighboring new nodes.
2. `found: Predicate<A>`
The `found` predicate returns true when we found the node
3. `initial: A`
The starting node

## Examples
You can find examples in the [packages/core/_examples/](examples) folder
