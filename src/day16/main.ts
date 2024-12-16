import { HashSet } from "../util.ts";
import { createDayRunner, Coordinate, Grid, HashMap } from "../util.ts";

type Input = {
  map: Grid<string>;
  start: Coordinate;
  end: Coordinate;
};

function parse(input: string): Input {
  let start: Coordinate | undefined;
  let end: Coordinate | undefined;

  const map = Grid.fromString(input, (char, x, y) => {
    if (char === "S") {
      if (start) {
        throw new Error("Multiple start coordinates found");
      }
      start = new Coordinate(x, y);
      return ".";
    }
    if (char === "E") {
      if (end) {
        throw new Error("Multiple end coordinates found");
      }
      end = new Coordinate(x, y);
      return ".";
    }
    return char;
  });

  if (!start) {
    throw new Error("No start coordinate found");
  }
  if (!end) {
    throw new Error("No end coordinate found");
  }

  return {
    map,
    start,
    end,
  };
}

const directions = ["east", "north", "west", "south"] as const;
type Direction = (typeof directions)[number];
type DirectionCoordinate = {
  direction: Direction;
  coordinate: Coordinate;
};

/**
 * Returns a list of [neighbor, cost] pairs
 * @param dc
 * @param input
 * @returns
 */
function neighbors(
  current: DirectionCoordinate,
  input: Input
): [DirectionCoordinate, number][] {
  const result: [DirectionCoordinate, number][] = [];

  // return the spot in front of us (if its not a wall) at a cost of 1
  // and rotations CW and CCW at a cost of 1000

  let ahead = current.coordinate.right();
  if (current.direction === "north") {
    ahead = current.coordinate.up();
  } else if (current.direction === "west") {
    ahead = current.coordinate.left();
  } else if (current.direction === "south") {
    ahead = current.coordinate.down();
  }

  if (input.map.get(ahead) !== "#") {
    result.push([
      {
        direction: current.direction,
        coordinate: ahead,
      },
      1,
    ]);
  }

  if (current.direction === "east" || current.direction === "west") {
    result.push([
      {
        direction: "north",
        coordinate: current.coordinate,
      },
      1000,
    ]);
    result.push([
      {
        direction: "south",
        coordinate: current.coordinate,
      },
      1000,
    ]);
  }

  if (current.direction === "north" || current.direction === "south") {
    result.push([
      {
        direction: "east",
        coordinate: current.coordinate,
      },
      1000,
    ]);
    result.push([
      {
        direction: "west",
        coordinate: current.coordinate,
      },
      1000,
    ]);
  }

  return result;
}

function base(input: Input) {
  const hashCoord = (dc: DirectionCoordinate) =>
    dc.coordinate.x * input.map.height * directions.length +
    dc.coordinate.y * directions.length +
    directions.indexOf(dc.direction);

  const manhattanDistanceToEnd = (coordinate: Coordinate) =>
    coordinate.distanceTo(input.end);
  const openSet = new HashSet<DirectionCoordinate>(hashCoord);
  const cameFrom = new HashMap<
    DirectionCoordinate,
    HashSet<DirectionCoordinate>
  >(hashCoord);
  const gScore = new HashMap<DirectionCoordinate, number>(hashCoord);
  const fScore = new HashMap<DirectionCoordinate, number>(hashCoord);

  const start = {
    direction: "east" as Direction,
    coordinate: input.start,
  };

  openSet.add(start);
  gScore.set(start, 0);
  fScore.set(start, manhattanDistanceToEnd(input.start));

  while (openSet.size() > 0) {
    const current = [...openSet.values()].reduce((a, b) =>
      (fScore.get(a) ?? Infinity) < (fScore.get(b) ?? Infinity) ? a : b
    );

    if (current.coordinate.equals(input.end)) {
      return { bestScore: gScore.get(current) ?? 0, cameFrom, current };
    }

    openSet.delete(current);
    const neightbors = neighbors(current, input);

    for (const [neighbor, cost] of neightbors) {
      const currentGScore = gScore.get(current) ?? Infinity;
      const neighborGScore = gScore.get(neighbor) ?? Infinity;

      const tentativeGScore = currentGScore + cost;

      if (tentativeGScore <= neighborGScore) {
        const neighborCameFrom =
          cameFrom.get(neighbor) ?? new HashSet<DirectionCoordinate>(hashCoord);
        if (tentativeGScore < neighborGScore) {
          // clear if we're better
          neighborCameFrom.clear();
        }
        neighborCameFrom.add(current);
        cameFrom.set(neighbor, neighborCameFrom);

        gScore.set(neighbor, tentativeGScore);
        fScore.set(
          neighbor,
          tentativeGScore + manhattanDistanceToEnd(neighbor.coordinate)
        );
        openSet.add(neighbor);
      }
    }
  }

  throw new Error("No path found");
}

function silver(input: Input) {
  return base(input).bestScore;
}

function gold(input: Input) {
  // backtrack cameFrom via current to find all visited nodes and return the count of them
  const hashCoord = (dc: DirectionCoordinate) =>
    dc.coordinate.x * input.map.height * directions.length +
    dc.coordinate.y * directions.length +
    directions.indexOf(dc.direction);
  const { cameFrom, current } = base(input);
  const visited = new HashSet<DirectionCoordinate>(hashCoord);
  const queue = [current];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    const neighbors = [
      ...(
        cameFrom.get(current) ?? new HashSet<DirectionCoordinate>(() => "dummy")
      ).values(),
    ];
    for (const neighbor of neighbors) {
      queue.push(neighbor);
    }
  }

  // we only care about the coordinates, not the direction
  const visitedJustCoords = new HashSet<Coordinate>((c) => c.x * input.map.height + c.y);
  for (const dc of visited.values()) {
    visitedJustCoords.add(dc.coordinate);
  }

  return visitedJustCoords.size();
}

if (import.meta.main) {
  await createDayRunner({
    day: 16,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 7036, 45),
    file([import.meta.dirname!, "example2.txt"], 11048, 64),
    aoc(78428, 463),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
