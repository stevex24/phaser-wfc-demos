# IllusionWorld Day 4 — The Logical Level Model

Day 4 implements the rules and mathematics of **The False Junction**. It deliberately does not draw the puzzle or add the walking character; those are Days 5–6. Separating rules from graphics lets us prove what the puzzle means before judging its appearance.

## The central distinction

The model stores two kinds of position:

1. **Logical position `(x,y,z)`** — where a node belongs in the imagined 3D structure.
2. **Projected position `(screenX,screenY)`** — where that node is drawn on the flat screen.

The illusion occurs because distinct logical positions can have identical projected positions.

## The eight nodes

```text
start — low1 — low2 — lowJ ═ highJ — high1 — high2 — goal
```

| Node | `(x,y,z)` | Role |
|---|---:|---|
| `start` | `(-3,0,0)` | Character's initial position |
| `low1` | `(-2,0,0)` | Lower walkway |
| `low2` | `(-1,0,0)` | Lower walkway |
| `lowJ` | `(0,0,0)` | Lower half of false junction |
| `highJ` | `(1,1,2)` | Upper half of false junction |
| `high1` | `(2,1,2)` | Upper walkway |
| `high2` | `(3,1,2)` | Upper walkway |
| `goal` | `(4,1,2)` | Doorway/win position |

The ordinary edges connect neighboring nodes on the same walkway. The `lowJ—highJ` edge is explicitly marked `apparent`.

## Why the junction overlaps

The model implements the approved projection:

```text
screenX = originX + (x-y)×40
screenY = originY + (x+y)×24-z×24
```

For `lowJ=(0,0,0)`:

```text
screenX = originX
screenY = originY
```

For `highJ=(1,1,2)`:

```text
screenX = originX + (1-1)×40 = originX
screenY = originY + (1+1)×24-2×24 = originY
```

The equality is checked by an automated test. The constructor also rejects any edge labeled `apparent` whose endpoints do not share a projected point. This prevents later level data from claiming an illusion that its geometry does not actually produce.

## What each method does

### `node(nodeId)`

Returns the logical coordinates and path label for one named node. It rejects unknown names instead of silently returning missing data.

### `neighbors(nodeId)`

Returns a fresh list of directly connected node names. Because the graph is undirected, the character may walk forward or backward.

### `canMove(from,to)`

Answers whether two nodes share an edge. It knows nothing about pixels or sprites.

### `move(from,to)`

Returns the destination when the edge is legal and throws an `Illegal move` error otherwise. The model is stateless today: Day 5's player controller will own the character's current node.

### `project(node,origin)`

Converts logical `(x,y,z)` coordinates into screen coordinates. Supplying an origin lets the renderer center the same level anywhere without changing its mathematics.

### `isApparentEdge(from,to)`

Identifies the one educational edge. Day 6 can highlight or explain it without guessing from colors or node names.

### `isGoal(nodeId)`

Answers whether the character has reached the doorway. Win logic therefore remains independent of rendering.

## Why a graph is used

Pixel collision would make the illusion accidental: two pictures overlapping might or might not become traversable depending on drawing details. The graph makes the intended rule explicit. `lowJ` and `highJ` are separate nodes with a deliberate connection because the game temporarily treats the apparent 2D junction as walkable.

## Reveal policy

The first puzzle stores:

```js
revealPolicy: "always"
```

Future variants can use `"afterSolve"` without changing graph traversal or projection code.

## Verification

The Day 4 tests cover:

- all eight approved nodes;
- symmetric graph neighbors;
- legal and illegal moves;
- distinct logical junction coordinates;
- identical projected junction coordinates;
- the one apparent edge;
- goal detection;
- the always-available reveal policy;
- traversal of the complete start-to-goal route;
- rejection of geometrically false apparent edges.

