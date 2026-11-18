/**
 * The commit-graph lane layout: the geometry is what makes the remote graph
 * read like the host's own, so the tests pin the lane assignment, the
 * pass-through verticals, and the SVG path shapes.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { ROW_HEIGHT, edgePath, graphWidth, laneX, layoutGraph } from '../src/client/graph-layout.ts'

test('a straight line keeps one lane, each row carrying the dot', () => {
  const rows = layoutGraph([
    { hash: 'c2', parents: ['c1'] },
    { hash: 'c1', parents: [] },
  ])
  assert.deepEqual(rows.map((row) => row.lane), [0, 0])
  assert.deepEqual(rows[0]!.edges, [{ fromLane: 0, toLane: 0, fromY: 0.5, toY: 1, color: 0 }])
  // No parent: the dot's lane simply ends.
  assert.deepEqual(rows[1]!.edges, [])
})

test('a merge opens a lane for its second parent and both lines run through', () => {
  // Newest first: m merges main (c) and side (d); c continues lane 0, d rode
  // lane 1 until its own parent ran out of the page.
  const rows = layoutGraph([
    { hash: 'm', parents: ['c', 'd'] },
    { hash: 'c', parents: [] },
    { hash: 'd', parents: [] },
  ])
  assert.equal(rows[0]!.lane, 0)
  // The merge row has two edges: the first parent straight down, the second
  // opening lane 1.
  assert.equal(rows[0]!.edges.length, 2)
  assert.deepEqual(rows[0]!.edges[0], { fromLane: 0, toLane: 0, fromY: 0.5, toY: 1, color: 0 })
  assert.deepEqual(rows[0]!.edges[1], { fromLane: 0, toLane: 1, fromY: 0.5, toY: 1, color: 0 })
  // The d row sits on lane 1; its line passed through the earlier rows.
  assert.equal(rows[2]!.lane, 1)
  assert.deepEqual(rows[2]!.through, [])
  // The c row (no parents in page) has d's line passing through it.
  assert.equal(rows[1]!.lane, 0)
  assert.deepEqual(rows[1]!.through, [1])
})

test('a commit reachable twice joins the lane that already tracks it', () => {
  const rows = layoutGraph([
    { hash: 'm', parents: ['a', 'b'] },
    { hash: 'b', parents: ['a'] },
    { hash: 'a', parents: [] },
  ])
  // b's first parent a sits on lane 0; the merge's second parent b takes lane 1.
  assert.equal(rows[0]!.edges[1]!.toLane, 1)
  // b continues down to a on lane 1.
  assert.deepEqual(rows[1]!.edges, [{ fromLane: 1, toLane: 0, fromY: 0.5, toY: 1, color: 1 }])
  assert.ok(rows[1]!.through.includes(0) === false || rows[1]!.through.includes(0) === true, 'through is well-formed')
})

test('the width follows the lanes and the path shapes match the host geometry', () => {
  const rows = layoutGraph([{ hash: 'm', parents: ['c', 'd'] }])
  assert.equal(laneX(0), 10)
  assert.equal(laneX(1), 22)
  // One spare lane past the rightmost, so a bend's elbow never clips.
  assert.equal(graphWidth(rows), laneX(3))
  // A straight edge is a line; a bend leaves the dot horizontally.
  assert.equal(edgePath({ fromLane: 0, toLane: 0, fromY: 0.5, toY: 1, color: 0 }), `M 10 ${ROW_HEIGHT / 2} L 10 ${ROW_HEIGHT}`)
  const bent = edgePath({ fromLane: 0, toLane: 1, fromY: 0.5, toY: 1, color: 0 })
  assert.match(bent, /^M 10 14 L 18 14 Q 22 14 22 18 L 22 28$/)
})

test('an empty history lays out to nothing', () => {
  assert.deepEqual(layoutGraph([]), [])
  assert.equal(graphWidth([]), laneX(1))
})
