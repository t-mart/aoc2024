import { createDayRunner, Coordinate, HashSet, HashMap } from "../util.ts";
import { Heap } from "heap-js";

type Input = Coordinate[];

function parse(input: string): Input {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map(
      (line) =>
        new Coordinate(...(line.split(",").map(Number) as [number, number]))
    );
}

function isInBounds(c: Coordinate, size: number) {
  return c.x >= 0 && c.x < size && c.y >= 0 && c.y < size;
}

function manhattanDistance(a: Coordinate, b: Coordinate) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function base(input: Input, size: number) {
  const hashCoordinate = (c: Coordinate) => c.x * size + c.y;

  const corruptions = new HashSet<Coordinate>(hashCoordinate);
  for (const c of input) {
    corruptions.add(c);
  }

  const start = new Coordinate(0, 0);
  const end = new Coordinate(size - 1, size - 1);

  const hueristic = (c: Coordinate) => {
    return manhattanDistance(c, end);
  };

  const cameFrom = new HashMap<Coordinate, Coordinate>(hashCoordinate);
  const gScore = new HashMap<Coordinate, number>(hashCoordinate);
  const fScore = new HashMap<Coordinate, number>(hashCoordinate);
  const openSet = new Heap<Coordinate>(
    (a, b) => fScore.get(a)! - fScore.get(b)!
  );

  openSet.push(start);
  gScore.set(start, 0);
  fScore.set(start, hueristic(start));

  let found: Coordinate | undefined;

  while (openSet.size() > 0) {
    const current = openSet.pop()!;
    if (current.equals(end)) {
      found = current;
      break;
    }
    openSet.remove(current);
    const neighbors = [
      current.up(),
      current.down(),
      current.left(),
      current.right(),
    ].filter((c) => isInBounds(c, size) && !corruptions.has(c));
    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(current)! + 1;
      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + hueristic(neighbor));
        if (!openSet.contains(neighbor, (a, b) => a.equals(b))) {
          openSet.push(neighbor);
        }
      }
    }
  }

  if (!found) {
    return -1;
  }

  const totalPath = [found];
  let current = found;
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    totalPath.push(current);
  }

  // minus 1 because the start is included in the path
  return totalPath.length - 1;
}

function silver(input: Input) {
  const isExample = input[0].equals(new Coordinate(5, 4));
  const subsetSize = isExample ? 12 : 1024;
  const subset = input.slice(0, subsetSize);
  const size = isExample ? 7 : 71;

  return base(subset, size);
}

function gold(input: Input) {
  // go through the corruptions and find the first one that, once introduced,
  // causes the path to be blocked. binary search.

  const isExample = input[0].equals(new Coordinate(5, 4));
  const size = isExample ? 7 : 71;

  let lowIndex = 0;
  let highIndex = input.length - 1;

  while (lowIndex <= highIndex) {
    const midIndex = Math.floor((lowIndex + highIndex) / 2);
    const result = base(input.slice(0, midIndex + 1), size);
    // if result is -1, then the path is blocked, so we need a smaller subset
    if (result === -1) {
      highIndex = midIndex - 1;
    } else {
      lowIndex = midIndex + 1;
    }
  }

  return input[lowIndex].join(',');
}

if (import.meta.main) {
  await createDayRunner({
    day: 18,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 22, "6,1"),
    aoc(262, "22,20"),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
