import {
  createDayRunner,
  Coordinate,
  HashSet,
  HashMap,
  Counter,
} from "../util.ts";

type Input = {
  walls: HashSet<Coordinate>;
  start: Coordinate;
  end: Coordinate;
  xSize: number;
  ySize: number;
};

function parse(input: string): Input {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  let start: Coordinate | undefined;
  let end: Coordinate | undefined;
  const xSize = lines[0].length;
  const ySize = lines.length;
  const walls = new HashSet<Coordinate>((c: Coordinate) => c.x * ySize + c.y);
  lines.forEach((line, y) => {
    line.split("").forEach((char, x) => {
      if (char === "#") {
        walls.add(new Coordinate(x, y));
      } else if (char === "S") {
        start = new Coordinate(x, y);
      } else if (char === "E") {
        end = new Coordinate(x, y);
      }
    });
  });
  if (!start || !end) {
    throw new Error("No start or end");
  }
  return { walls, xSize, ySize, start, end };
}

function getDistanceFromStart(
  start: Coordinate,
  end: Coordinate,
  walls: HashSet<Coordinate>,
  xSize: number,
  ySize: number
): HashMap<Coordinate, number> {
  const distanceMap = new HashMap<Coordinate, number>(
    (c: Coordinate) => c.x * ySize + c.y
  );
  let current = start;
  let currentDistance = 0;

  while (!current.equals(end)) {
    distanceMap.set(current, currentDistance++);
    current = current
      .aroundManhattan()
      .find(
        (c) =>
          !walls.has(c) &&
          !distanceMap.has(c) &&
          c.x >= 0 &&
          c.x < xSize &&
          c.y >= 0 &&
          c.y < ySize
      )!;
  }

  distanceMap.set(current, currentDistance);

  return distanceMap;
}

function base(input: Input, cheatDuration: number) {
  const distances = getDistanceFromStart(
    input.start,
    input.end,
    input.walls,
    input.xSize,
    input.ySize
  );
  const timeSavedCounter = new Counter((c: number) => c);

  for (const [
    cheatStartCoord,
    cheatStartDistFromStart,
  ] of distances.entries()) {
    const cheats = [
      ...cheatStartCoord.iterUpToManhattanDistanceAway(cheatDuration),
    ].filter(
      ([cheat]) =>
        !input.walls.has(cheat) &&
        cheat.x >= 0 &&
        cheat.x < input.xSize &&
        cheat.y >= 0 &&
        cheat.y < input.ySize
    );
    for (const [cheatEndCoord, wallsPassedThrough] of cheats) {
      const normalDistance =
        distances.get(cheatEndCoord)! - cheatStartDistFromStart;
      const timeSaved = normalDistance - wallsPassedThrough;
      if (timeSaved > 0) {
        timeSavedCounter.add(timeSaved);
      }
    }
  }
  const threshold = 100;
  return [...timeSavedCounter.entries()]
    .filter(([timeSaved]) => {
      return timeSaved >= threshold;
    })
    .reduce((acc, [_timeSaved, count]) => acc + count, 0);
}

function silver(input: Input) {
  const cheatDuration = 2;
  return base(input, cheatDuration);
}

function gold(input: Input) {
  const cheatDuration = 20;
  return base(input, cheatDuration);
}

if (import.meta.main) {
  await createDayRunner({
    day: 20,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    // file([import.meta.dirname!, "example.txt"], 1, Skip),
    aoc(1358, 1005856),
  ]);
}
