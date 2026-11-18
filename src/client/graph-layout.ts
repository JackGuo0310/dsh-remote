/**
 * Commit-graph lane layout for the remote Git tab, matching the sidebar's own
 * graph geometry: one 28px row, lanes every 12px from x=10, a five-slot theme
 * palette, and rectangular edges with one rounded elbow.
 *
 * The input is the `git log` page (newest first, each commit carrying its
 * parents); output is one drawable row per commit. Nothing here touches the
 * DOM, so the layout is unit-testable.
 * @module dsh-remote-development/client/graph-layout
 */

/** Row height of one graph line, as the native panel draws it. */
export const ROW_HEIGHT = 28

/** Left offset of the first lane centre. */
const LANE_ORIGIN = 10

/** Horizontal distance between lane centres. */
const LANE_GAP = 12

/** Theme colour slots; lane N paints with slot N % 5. */
export const PALETTE_SIZE = 5

/** Lanes past this width are clamped (a pathological history must stay legible). */
const MAX_LANES = 10

/** One line segment in a row-local coordinate space (y: 0 top .. 1 bottom). */
export interface GraphSegment {
  /** Lane the segment leaves from (0-based). */
  fromLane: number
  /** Lane the segment arrives at. */
  toLane: number
  /** y of the start, 0..1. */
  fromY: number
  /** y of the end, 0..1. */
  toY: number
  /** Colour slot of the segment (the leaving lane's slot). */
  color: number
}

/** Everything one commit row draws. */
export interface GraphRow {
  /** The commit's own lane. */
  lane: number
  /** Lanes whose line passes straight through this row. */
  through: number[]
  /** Edges from the commit to its parents. */
  edges: GraphSegment[]
}

/**
 * Centre x of one lane.
 * @param lane - 0-based lane index.
 * @returns the x coordinate in pixels.
 */
export function laneX(lane: number): number {
  return LANE_ORIGIN + lane * LANE_GAP
}

/**
 * Total drawing width for a row set.
 * @param rows - laid-out rows.
 * @returns the SVG width in pixels.
 */
export function graphWidth(rows: readonly GraphRow[]): number {
  let max = 1
  for (const row of rows) {
    max = Math.max(max, row.lane + 2)
    for (const edge of row.edges) max = Math.max(max, edge.toLane + 2)
  }
  return laneX(Math.min(max, MAX_LANES))
}

/** One commit as the layout needs it. */
export interface GraphCommit {
  hash: string
  parents: string[]
}

/**
 * Lay out a log page. Rows arrive newest first; each commit keeps the lane it
 * was first assigned (its branch line), first parents continue that lane, and
 * extra parents open a lane of their own. A lane is released when the commit it
 * waited for has been drawn.
 * @param commits - commits newest first.
 * @returns the drawable rows.
 */
export function layoutGraph(commits: readonly GraphCommit[]): GraphRow[] {
  /** Hash each lane is waiting for, or undefined when the lane is free. */
  const lanes: (string | undefined)[] = []
  const rows: GraphRow[] = []

  for (const commit of commits) {
    let lane = lanes.indexOf(commit.hash)
    if (lane === -1) {
      // A line with no predecessor here (a merge's branch starting in this
      // page, or the very first row) takes a free lane, else a new one.
      lane = lanes.indexOf(undefined)
      if (lane === -1) lane = lanes.length
    }
    // Lanes that pass through this row: everything before the parents are
    // placed, minus the lane the dot now occupies.
    const before = lanes.slice()
    // Free the lane this commit occupies; its first parent will claim it back.
    lanes[lane] = undefined

    const parents = commit.parents
    const edges: GraphSegment[] = []
    parents.forEach((parent, index) => {
      // A parent two edges wait for converges: the row joins the lane that
      // already tracks it instead of keeping a second parallel line.
      const existing = lanes.indexOf(parent)
      let targetLane: number
      if (existing !== -1 && existing !== lane) {
        targetLane = existing
        if (index === 0) lanes[lane] = undefined
      } else if (index === 0) {
        targetLane = lane
        lanes[lane] = parent
      } else {
        targetLane = lanes.indexOf(undefined)
        if (targetLane === -1) targetLane = lanes.length
        lanes[targetLane] = parent
      }
      // A parent already drawn (shallow clone boundary) has no lane.
      if (targetLane >= MAX_LANES) targetLane = MAX_LANES - 1
      edges.push({ fromLane: lane, toLane: targetLane, fromY: 0.5, toY: 1, color: lane % PALETTE_SIZE })
    })

    // Verticals: lanes that were active above this row and still are below it.
    const through: number[] = []
    const after = lanes.slice()
    for (let index = 0; index < before.length; index += 1) {
      if (before[index] === undefined) continue
      if (index === lane) continue
      if (index >= MAX_LANES) continue
      // Still alive below (whatever it waits for), or it ends here (drawn as
      // the dot); either way a straight line is correct for the row.
      if (after[index] !== undefined) through.push(index)
    }
    rows.push({ lane, through, edges })
    // Keep lane indices dense enough for the geometry: trim trailing free
    // lanes so the graph does not drift right forever.
    while (lanes.length > 0 && lanes[lanes.length - 1] === undefined) lanes.pop()
  }
  return rows
}

/**
 * The SVG path of one edge: straight when the lanes are equal, otherwise a
 * rectangular line with one rounded elbow near the destination lane.
 * @param segment - the edge.
 * @param height - row height in pixels.
 * @returns the path data.
 */
export function edgePath(segment: GraphSegment, height: number = ROW_HEIGHT): string {
  const x1 = laneX(segment.fromLane)
  const x2 = laneX(segment.toLane)
  const y1 = segment.fromY * height
  const y2 = segment.toY * height
  if (x1 === x2 || y1 === y2) return `M ${x1} ${y1} L ${x2} ${y2}`
  const dx = Math.sign(x2 - x1)
  const dy = Math.sign(y2 - y1)
  const r = Math.min(4, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2)
  if (segment.fromY === 0.5) {
    // Leaves the node horizontally, rounds down into the new lane.
    return `M ${x1} ${y1} L ${x2 - dx * r} ${y1} Q ${x2} ${y1} ${x2} ${y1 + dy * r} L ${x2} ${y2}`
  }
  // Full-row crossing (not emitted today): bend at mid-height.
  return `M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2 - r} Q ${x1} ${(y1 + y2) / 2} ${x1 + dx * r} ${(y1 + y2) / 2} L ${x2 - dx * r} ${(y1 + y2) / 2} Q ${x2} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2 + r} L ${x2} ${y2}`
}
