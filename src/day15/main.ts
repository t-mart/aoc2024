import { createDayRunner, Grid, Coordinate } from "../util.ts";

type Space = "wall" | "box" | "boxleft" | "boxright" | "empty" | "lanternfish";
type Input = {
  map: Grid<Space>;
  lanternfishCoordinate: Coordinate;
  moves: Coordinate[];
};

function parse(input: string): Input {
  const [mapPart, movesPart] = input.split("\n\n");

  let lanternfishCoordinate: Coordinate | undefined;

  const map = Grid.fromString(mapPart, (char, x, y) => {
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
        lanternfishCoordinate = new Coordinate(x, y);
        return "lanternfish";
    }
  });

  const origin = Coordinate.origin();

  const moves = movesPart.split("\n").flatMap((line) =>
    line.split("").map((char) => {
      switch (char) {
        case "^":
          return origin.up();
        case "v":
          return origin.down();
        case "<":
          return origin.left();
        default:
          return origin.right();
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

function calculateGPSCoordinate(map: Grid<Space>) {
  let sum = 0;
  for (const [space, coordinate] of map.iter()) {
    if (space === "box" || space === "boxleft") {
      sum += coordinate.x + coordinate.y * 100;
    }
  }
  return sum;
}

function drawMap(map: Grid<Space>) {
  const output = [...map.iter_rows()]
    .map(([row]) => {
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
  return base(input);
}

function moveIsUpOrDown(move: Coordinate): boolean {
  return move[1] !== 0;
}

function canPush(
  coordinate: Coordinate,
  move: Coordinate,
  map: Grid<Space>
): boolean {
  const thisSpace = map.get(coordinate)!;
  const nextCoord = coordinate.plus(move);

  if (thisSpace === "wall") {
    return false;
  } else if (thisSpace === "empty") {
    return true;
  }

  // other may account for another half of the box to move if applicable
  let other = true;

  if (moveIsUpOrDown(move)) {
    if (thisSpace === "boxleft") {
      other = canPush(nextCoord.right(), move, map);
    } else if (thisSpace === "boxright") {
      other = canPush(nextCoord.left(), move, map);
    }
  }

  return canPush(nextCoord, move, map) && other;
}

/**
 * Push stuff. This method must only be called if canPush returns true.
 * @param coordinate
 * @param move
 * @param map
 * @returns
 */
function push(
  coordinate: Coordinate,
  move: Coordinate,
  map: Grid<Space>
): void {
  const thisSpace = map.get(coordinate)!;

  if (thisSpace === "empty" || thisSpace === "wall") {
    return;
  }

  const nextCoord = coordinate.plus(move);

  push(nextCoord, move, map);

  if (moveIsUpOrDown(move)) {
    if (thisSpace === "boxleft") {
      // push([nextX + 1, nextY], move, map);
      push(nextCoord.right(), move, map);
    } else if (thisSpace === "boxright") {
      push(nextCoord.left(), move, map);
    }
  }

  map.set(nextCoord, thisSpace);
  map.set(coordinate, "empty");

  if (moveIsUpOrDown(move)) {
    if (thisSpace === "boxleft") {
      map.set(nextCoord.right(), "boxright");
      map.set(coordinate.right(), "empty");
    } else if (thisSpace === "boxright") {
      map.set(nextCoord.left(), "boxleft");
      map.set(coordinate.left(), "empty");
    }
  }
}

function base(input: Input) {
  const map = input.map.clone();

  let lanternfishCoordinate = new Coordinate(
    input.lanternfishCoordinate[0] * 2,
    input.lanternfishCoordinate[1]
  );

  for (const move of input.moves) {
    if (canPush(lanternfishCoordinate, move, map)) {
      push(lanternfishCoordinate, move, map);
      lanternfishCoordinate = lanternfishCoordinate.plus(move);
    }
  }

  return calculateGPSCoordinate(map);
}

function gold(input: Input) {
  const map = new Grid<Space>(
    [...input.map.iter_rows()].map(([row]) =>
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
    )
  );

  return base({ ...input, map });
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
    // file([import.meta.dirname!, "bigboy.txt"], 356166839889, 359696176529),
  ]);
}
