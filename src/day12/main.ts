import { createDayRunner, HashSet, Counter } from "../util.ts";

type Coordinate = [number, number];
type PlotMap = { data: string[][]; xSize: number; ySize: number };

function parse(input: string): PlotMap {
  const data = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) => line.split(""));

  return {
    data,
    xSize: data[0].length,
    ySize: data.length,
  };
}

type Region = {
  area: number;
  perimeter: number;
};

function floodRegion(
  start: Coordinate,
  leftSet: HashSet<Coordinate>,
  plotMap: PlotMap,
  coordHasher: (coord: Coordinate) => number
): Region {
  let area = 0;
  // lazy for now. this needs to support coords with negative values, and our
  // normal coord hasher function can't handle that. (maybe offset the coords by the size of the map?)
  const borderHits = new Counter<Coordinate>(([x, y]) => `${x},${y}`);
  const stack = [start];
  const [startX, startY] = start;
  const regionId = plotMap.data[startY][startX];

  while (stack.length) {
    const coord = stack.pop()!;
    const [x, y] = coord;
    const id = plotMap.data[y]?.[x] ?? null;
    if (id === regionId) {
      if (!leftSet.has(coord)) {
        continue;
      }
      area++;
      leftSet.delete(coord);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    } else {
      borderHits.add(coord);
    }
  }

  return {
    area,
    perimeter: borderHits.total(),
  };
}

function silver(plotMap: PlotMap) {
  const coordHasher = ([x, y]: Coordinate) => x * plotMap.ySize + y;
  const left = new HashSet<Coordinate>(coordHasher);
  for (let y = 0; y < plotMap.ySize; y++) {
    for (let x = 0; x < plotMap.xSize; x++) {
      left.add([x, y]);
    }
  }
  let cost = 0;

  while (left.size() > 0) {
    const start: Coordinate = left.values().next().value!;
    const region = floodRegion(start, left, plotMap, coordHasher);
    cost += region.area * region.perimeter;
  }

  return cost;
}

const sides = ["left", "right", "top", "bottom"] as const;
type Side = (typeof sides)[number];
type FenceCoordinate = { coord: Coordinate; side: Side };
type SidedRegion = {area: number; fenceSides: number};

function floodRegion2(
  start: Coordinate,
  leftSet: HashSet<Coordinate>,
  plotMap: PlotMap,
): SidedRegion {
  let area = 0;
  const fences = new HashSet<FenceCoordinate>(
    ({ side, coord: [x, y] }) =>
      // sides.indexOf(side) + x * sides.length + y * sides.length * plotMap.xSize
    `${side},${x},${y}`
  );
  const stack = [start];
  const [startX, startY] = start;
  const regionId = plotMap.data[startY][startX];

  // invariant: if a coord is in the stack, it's in the region

  while (stack.length) {
    const coord = stack.pop()!;
    leftSet.delete(coord);
    const [x, y] = coord;
    area++;

    for (const [dx, dy, side] of [
      [1, 0, "right"],
      [-1, 0, "left"],
      [0, 1, "bottom"],
      [0, -1, "top"],
    ] as const) {
      const [nx, ny] = [x + dx, y + dy];
      const id = plotMap.data[ny]?.[nx] ?? null;
      if (id === regionId) {
        const nextCoord = [nx, ny] as Coordinate;
        if (!leftSet.has(nextCoord)) {
          continue;
        }
        stack.push(nextCoord);
        leftSet.delete(nextCoord);
      } else {
        fences.add({ coord: [x, y], side });
      }
    }
  }

  // now fences has all fences. we need to count the number of sides.
  // this should be done by picking a side, and then adjusting the x or y
  // coords by 1 and seeing if that's in the set. if it is, it's a fence.
  // keep incrementing until the coord is not in the set and increment the
  // number of sides. do this there are no more fences.
  let fenceSides = 0;

  while (fences.size() > 0) {
    const start = fences.values().next().value!;
    fenceSides++;
    fences.delete(start);
    
    if (start.side === "right") {
      // go up
      let f = {coord: [start.coord[0], start.coord[1] - 1] as Coordinate, side: "right" as Side};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0], f.coord[1] - 1], side: "right"};
      }
      // go down
      f = {coord: [start.coord[0], start.coord[1] + 1], side: "right"};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0], f.coord[1] + 1], side: "right"};
      }
    } else if (start.side === "left") {
      // go up
      let f = {coord: [start.coord[0], start.coord[1] - 1] as Coordinate, side: "left" as Side};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0], f.coord[1] - 1], side: "left"};
      }
      // go down
      f = {coord: [start.coord[0], start.coord[1] + 1], side: "left"};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0], f.coord[1] + 1], side: "left"};
      }
    } else if (start.side === "top") {
      // go left
      let f = {coord: [start.coord[0] - 1, start.coord[1]] as Coordinate, side: "top" as Side};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0] - 1, f.coord[1]], side: "top"};
      }
      // go right
      f = {coord: [start.coord[0] + 1, start.coord[1]], side: "top"};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0] + 1, f.coord[1]], side: "top"};
      }
    } else {
      // go left
      let f = {coord: [start.coord[0] - 1, start.coord[1]] as Coordinate, side: "bottom" as Side};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0] - 1, f.coord[1]], side: "bottom"};
      }
      // go right
      f = {coord: [start.coord[0] + 1, start.coord[1]], side: "bottom"};
      while (fences.has(f)) {
        fences.delete(f);
        f = {coord: [f.coord[0] + 1, f.coord[1]], side: "bottom"};
      }
    }
  }

  return {
    area,
    fenceSides,
  };
}

function gold(plotMap: PlotMap) {
  const coordHasher = ([x, y]: Coordinate) => x * plotMap.ySize + y;
  const left = new HashSet<Coordinate>(coordHasher);
  for (let y = 0; y < plotMap.ySize; y++) {
    for (let x = 0; x < plotMap.xSize; x++) {
      left.add([x, y]);
    }
  }
  let cost = 0;

  while (left.size() > 0) {
    const start: Coordinate = left.values().next().value!;
    const region = floodRegion2(start, left, plotMap);
    cost += region.area * region.fenceSides;
  }

  return cost;
}

if (import.meta.main) {
  await createDayRunner({
    day: 12,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example2.txt"], 140, 80),
    file([import.meta.dirname!, "example.txt"], 1930, 1206),
    aoc(1461806, 887932),
    // file([import.meta.dirname!, "bigboy.txt"], 1, 2),
  ]);
}
