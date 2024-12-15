import { createDayRunner } from "../util.ts";

type Space = "wall" | "box" | "empty" | "lanternfish";
type WideSpace = "wall" | "boxleft" | "boxright" | "empty" | "lanternfish";
type Move = "up" | "down" | "left" | "right";
type Coordinate = [number, number];
type Input = {
  map: Space[][];
  lanternfishCoordinate: Coordinate;
  moves: Move[];
};

function parse(input: string): Input {
  const [mapPart, movesPart] = input.split("\n\n");

  let lanternfishCoordinate: Coordinate | undefined;

  const map = mapPart.split("\n").map((line, y) =>
    line.split("").map((char, x) => {
      switch (char) {
        case "#":
          return "wall";
        case "O":
          return "box";
        case ".":
          return "empty";
        default:
          if (lanternfishCoordinate) {
            throw new Error("Multiple lanternfish found");
          }
          lanternfishCoordinate = [x, y];
          return "lanternfish";
      }
    })
  );

  const moves = movesPart.split("\n").flatMap((line) =>
    line.split("").map((char) => {
      switch (char) {
        case "^":
          return "up";
        case "v":
          return "down";
        case "<":
          return "left";
        default:
          return "right";
      }
    })
  );

  if (!lanternfishCoordinate) {
    throw new Error("No lanternfish found");
  }

  return {
    map,
    lanternfishCoordinate,
    moves,
  };
}

const deltas = new Map<Move, Coordinate>([
  ["up", [0, -1]],
  ["down", [0, 1]],
  ["left", [-1, 0]],
  ["right", [1, 0]],
]);

function push(coordinate: Coordinate, move: Move, map: Space[][]): boolean {
  const [x, y] = coordinate;
  const space = map[y][x];

  if (space === "empty") {
    // true means you can push
    return true;
  } else if (space === "wall") {
    // false means you can't push
    return false;
  }

  // otherwise, we can move if the next space can move
  const delta = deltas.get(move)!;
  const nextCoord = [x + delta[0], y + delta[1]] as Coordinate;
  const nextPush = push(nextCoord, move, map);

  if (nextPush) {
    map[nextCoord[1]][nextCoord[0]] = space;
    map[y][x] = "empty";
  }

  return nextPush;
}

function calculateGPSCoordinate(map: (Space | WideSpace)[][]) {
  return map
    .flatMap((row, y) => row.map((space, x) => [space, x, y] as const))
    .filter(([space]) => space === "box" || space === "boxleft")
    .reduce((acc, [, x, y]) => acc + x + y * 100, 0);
}

function drawMap(map: (Space | WideSpace)[][]) {
  const output = map
    .map((row) => {
      return row
        .map((space) => {
          switch (space) {
            case "wall":
              return "#";
            case "box":
              return "O";
            case "empty":
              return ".";
            case "lanternfish":
              return "@";
            case "boxleft":
              return "[";
            case "boxright":
              return "]";
          }
        })
        .join("");
    })
    .join("\n");
  console.log(output);
}

function silver(input: Input) {
  const map = structuredClone(input.map);
  const lanternfishCoordinate = structuredClone(input.lanternfishCoordinate);

  for (const move of input.moves) {
    const wasPushed = push(lanternfishCoordinate, move, map);
    if (wasPushed) {
      const delta = deltas.get(move)!;
      lanternfishCoordinate[0] += delta[0];
      lanternfishCoordinate[1] += delta[1];
    }
  }

  return calculateGPSCoordinate(map);
}

function peekPush(
  coordinate: Coordinate,
  move: Move,
  map: WideSpace[][]
): boolean {
  const [x, y] = coordinate;
  const delta = deltas.get(move)!;
  const nextCoord = [x + delta[0], y + delta[1]] as Coordinate;
  const [nextX, nextY] = nextCoord;
  const nextSpace = map[y][x];

  if (nextSpace === "wall") {
    return false;
  } else if (nextSpace === "empty") {
    return true;
  }

  // other may account for another half of the box to move, but defaults to true
  let other = true;

  if (nextSpace === "boxleft" && (move === "up" || move === "down")) {
    other = peekPush([nextX + 1, nextY], move, map);
  } else if (nextSpace === "boxright" && (move === "up" || move === "down")) {
    other = peekPush([nextX - 1, nextY], move, map);
  }

  return peekPush(nextCoord, move, map) && other;
}

/**
 * Push stuff. This method must only be called if peekPush returns true.
 * @param coordinate
 * @param move
 * @param map
 * @returns
 */
function pushWide(
  coordinate: Coordinate,
  move: Move,
  map: WideSpace[][]
): void {
  const [x, y] = coordinate;
  const thisSpace = map[y][x];

  if (thisSpace === "empty" || thisSpace === "wall") {
    return;
  }

  const delta = deltas.get(move)!;
  const nextCoord = [x + delta[0], y + delta[1]] as Coordinate;
  const [nextX, nextY] = nextCoord;

  pushWide(nextCoord, move, map);

  if (thisSpace === "boxleft" && (move === "up" || move === "down")) {
    pushWide([nextX + 1, nextY], move, map);
  } else if (thisSpace === "boxright" && (move === "up" || move === "down")) {
    pushWide([nextX - 1, nextY], move, map);
  }

  map[nextY][nextX] = thisSpace;
  map[y][x] = "empty";

  if (thisSpace === "boxleft" && (move === "up" || move === "down")) {
    map[nextY][nextX + 1] = "boxright";
    map[y][x + 1] = "empty";
  } else if (thisSpace === "boxright" && (move === "up" || move === "down")) {
    map[nextY][nextX - 1] = "boxleft";
    map[y][x - 1] = "empty";
  }
}

function gold(input: Input) {
  const map = input.map.map((row) =>
    row.flatMap((space) => {
      switch (space) {
        case "box":
          return ["boxleft", "boxright"];
        case "lanternfish":
          return ["lanternfish", "empty"];
        case "wall":
          return ["wall", "wall"];
        default:
          return ["empty", "empty"];
      }
    })
  ) as WideSpace[][];
  // drawMap(map);

  let lanternfishCoordinate = [
    input.lanternfishCoordinate[0] * 2,
    input.lanternfishCoordinate[1],
  ] as Coordinate;
  // console.log(lanternfishCoordinate);

  for (const move of input.moves) {
    if (peekPush(lanternfishCoordinate, move, map)) {
      pushWide(lanternfishCoordinate, move, map);
      const delta = deltas.get(move)!;
      lanternfishCoordinate[0] += delta[0];
      lanternfishCoordinate[1] += delta[1];
    }
  }

  // drawMap(map);

  return calculateGPSCoordinate(map);
}

if (import.meta.main) {
  await createDayRunner({
    day: 15,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 2028, Skip),
    file([import.meta.dirname!, "example2.txt"], 10092, 9021),
    aoc(1349898, 1376686),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
