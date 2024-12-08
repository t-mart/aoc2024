import { createDayRunner, HashSet } from "../util";

type Coordinate = [number, number];
type Orientation = "N" | "E" | "S" | "W";
type Pose = {
  position: Coordinate;
  orientation: Orientation;
};
type Map = {
  obstacles: Coordinate[];
  maxX: number;
  maxY: number;
  startingPose: Pose;
};

function parse(input: string): Map {
  const obstacles: Coordinate[] = [];
  let startingPose: Pose | undefined = undefined;
  let maxX = 0;
  let maxY = 0;

  input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .forEach((line, y) => {
      maxY = Math.max(maxY, y);
      line.split("").forEach((char, x) => {
        maxX = Math.max(maxX, x);
        if (char === "#") {
          obstacles.push([x, y]);
        } else if (char === "^") {
          if (startingPose) {
            throw new Error("Multiple starting poses");
          }
          startingPose = {
            position: [x, y],
            orientation: "N",
          };
        }
      });
    });

  if (!startingPose) {
    throw new Error("No starting pose");
  }

  return {
    obstacles,
    maxX,
    maxY,
    startingPose,
  };
}

function inBoundsFn(map: Map): (position: Coordinate) => boolean {
  return ([x, y]) => x >= 0 && x <= map.maxX && y >= 0 && y <= map.maxY;
}

function orienationIndex(orientation: Orientation): number {
  switch (orientation) {
    case "N":
      return 0;
    case "E":
      return 1;
    case "S":
      return 2;
    case "W":
      return 3;
  }
}

// type HashSet<T> = {
//   add: (t: T) => void;
//   has: (t: T) => boolean;
//   size: () => number;
//   iter: () => T[];
// };

// function makeArbirtraryHashSet<T>(
//   hasher: (t: T) => number,
//   dehasher: (h: number) => T
// ): HashSet<T> {
//   const set = new Set<number>();
//   return {
//     add: (t) => set.add(hasher(t)),
//     has: (t) => set.has(hasher(t)),
//     size: () => set.size,
//     iter: () => [...set.values()].map(dehasher),
//   };
// }

function makeCoordinateHashSet(maxX: number) {
  const hasher = ([x, y]: Coordinate) => y * (maxX + 1) + x;
  return new HashSet(hasher);
}

function makePoseHashSet(maxX: number, maxY: number) {
  const hasher = ({ position: [x, y], orientation }: Pose) =>
    orienationIndex(orientation) * (maxY + 1) * (maxX + 1) + y * (maxX + 1) + x;
  return new HashSet(hasher);
}

const turnRight = (orientation: Orientation): Orientation => {
  switch (orientation) {
    case "N":
      return "E";
    case "E":
      return "S";
    case "S":
      return "W";
    case "W":
      return "N";
    default:
      throw new Error("Invalid orientation");
  }
};

const step = (pose: Pose): Coordinate => {
  switch (pose.orientation) {
    case "N":
      return [pose.position[0], pose.position[1] - 1];
    case "E":
      return [pose.position[0] + 1, pose.position[1]];
    case "S":
      return [pose.position[0], pose.position[1] + 1];
    case "W":
      return [pose.position[0] - 1, pose.position[1]];
    default:
      throw new Error("Invalid orientation");
  }
};

function silver(map: Map) {
  const inBounds = inBoundsFn(map);
  const visited = makeCoordinateHashSet(map.maxX);

  const obstacles = makeCoordinateHashSet(map.maxX);
  for (const obstacle of map.obstacles) {
    obstacles.add(obstacle);
  }

  let pose = structuredClone(map.startingPose);

  while (inBounds(pose.position)) {
    visited.add(pose.position);
    const nextCoord = step(pose);
    if (obstacles.has(nextCoord)) {
      pose.orientation = turnRight(pose.orientation);
    } else {
      pose.position = nextCoord;
    }
  }

  return visited.size();
}

function gold(map: Map) {
  // do the map once:
  const inBounds = inBoundsFn(map);
  const visited = makeCoordinateHashSet(map.maxX);

  const obstacles = makeCoordinateHashSet(map.maxX);
  for (const obstacle of map.obstacles) {
    obstacles.add(obstacle);
  }

  let pose = structuredClone(map.startingPose);

  while (inBounds(pose.position)) {
    visited.add(pose.position);
    const nextCoord = step(pose);
    if (obstacles.has(nextCoord)) {
      pose.orientation = turnRight(pose.orientation);
    } else {
      pose.position = nextCoord;
    }
  }

  // now, for each visited coordinate, run the map again with all the normal
  // obstacles AND a new obstacle at that coordinate
  const newObstacles = makeCoordinateHashSet(map.maxX);
  for (const coord of visited.values()) {
    newObstacles.add(coord);
  }

  let loops = 0;
  for (const newObstacle of newObstacles.values()) {
    // create new obstacles
    const obstaclesWithNew = makeCoordinateHashSet(map.maxX);
    for (const obstacle of map.obstacles) {
      obstaclesWithNew.add(obstacle);
    }
    obstaclesWithNew.add(newObstacle);

    // create new visited set
    const visitedWithNew = makePoseHashSet(map.maxX, map.maxY);

    let pose = structuredClone(map.startingPose);

    // now run again, but halt if we hit a loop
    while (inBounds(pose.position)) {
      if (!visitedWithNew.has(pose)) {
        visitedWithNew.add(pose);
      } else {
        loops++;
        break;
      }

      const nextCoord = step(pose);
      if (obstaclesWithNew.has(nextCoord)) {
        pose.orientation = turnRight(pose.orientation);
      } else {
        pose.position = nextCoord;
      }
    }
  }

  return loops;
}

if (require.main === module) {
  await createDayRunner({
    day: 6,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 41, 6),
    aoc(4515, 1309),

    // we OOM here, but so do many other posters. it's ok.
    // file([import.meta.dir, "bigboy.txt"], 4559, 2095),
  ]);
}
