import { createDayRunner, Counter } from "../util.ts";

type Coordinate = [number, number];
type Robot = {
  position: Coordinate;
  velocity: Coordinate;
};

function parse(input: string): Robot[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) => {
      const [p, v] = line.split(" ");
      const [px, py] = p.split("=")[1].split(",").map(Number);
      const [vx, vy] = v.split("=")[1].split(",").map(Number);

      return {
        position: [px, py],
        velocity: [vx, vy],
      };
    });
}

function positiveModulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function wrappingMove1D(
  size: number,
  curPosition: number,
  velocity: number,
  iterations: number
): number {
  return positiveModulo(curPosition + velocity * iterations, size);
}

function wrappingMove(
  size: [number, number],
  curPosition: Coordinate,
  velocity: Coordinate,
  iterations: number
): Coordinate {
  return [
    wrappingMove1D(size[0], curPosition[0], velocity[0], iterations),
    wrappingMove1D(size[1], curPosition[1], velocity[1], iterations),
  ];
}

function calculateSafetyFactor(
  robotCoordinates: Coordinate[],
  size: [number, number]
): number {
  let topRightCount = 0;
  let topLeftCount = 0;
  let bottomRightCount = 0;
  let bottomLeftCount = 0;

  const midX = Math.floor(size[0] / 2);
  const midY = Math.floor(size[1] / 2);

  for (const [x, y] of robotCoordinates) {
    const isLeft = x < midX;
    const isRight = x > midX;
    const isTop = y < midY;
    const isBottom = y > midY;
    if (isTop && isLeft) {
      topLeftCount++;
    } else if (isTop && isRight) {
      topRightCount++;
    } else if (isBottom && isLeft) {
      bottomLeftCount++;
    } else if (isBottom && isRight) {
      bottomRightCount++;
    }
  }

  return topLeftCount * topRightCount * bottomLeftCount * bottomRightCount;
}

/**
 * Dangit Eric, you've crafted your example with different constraints than the actual problem.
 */
function isExample(robots: Robot[]): boolean {
  return robots.length === 12;
}

function silver(robots: Robot[]) {
  const iterations = 100;
  const size = (isExample(robots) ? [11, 7] : [101, 103]) as [number, number];
  const moved = robots.map((robot) =>
    wrappingMove(size, robot.position, robot.velocity, iterations)
  );
  const safetyFactor = calculateSafetyFactor(moved, size);
  return safetyFactor;
}

function drawRobots(robots: Robot[], size: [number, number]): void {
  const coordCounter = new Counter<Coordinate>(([x, y]) => x * size[1] + y);
  for (const robot of robots) {
    coordCounter.add(robot.position);
  }

  for (let y = 0; y < size[1]; y++) {
    let line = "";
    for (let x = 0; x < size[0]; x++) {
      const count = coordCounter.get([x, y]);
      line += count ? count : ".";
    }
    console.log(line);
  }
}

/**
 * Relative to the center of the grid, for each robot on the left, is there a robot reflected on the right? Robots in the center will be ignored.
 * @param robots
 * @param size
 * @returns
 */
function isLeftRightSymmetrical(
  robots: Robot[],
  size: [number, number]
): boolean {
  const counter = new Counter<Coordinate>(([x, y]) => x * size[1] + y);

  const midX = Math.floor(size[0] / 2);
  const midY = Math.floor(size[1] / 2);

  for (const robot of robots) {
    // translate into [distance from midX, y]
    // add to counter at this coordinate.
    const [x, y] = robot.position;
    if (x === midX) {
      continue;
    }
    const translatedX = x < midX ? midX - x : x - midX;
    counter.add([translatedX, y]);
  }

  // then check that for each coordinate, the count is 2 (or is even)
  for (const count of counter.values()) {
    if (count % 2 !== 0) {
      return false;
    }
  }
  return true;
}

function containsChristmasTree(
  robotCoordinates: Coordinate[],
  size: [number, number]
): boolean {
  let topRightCount = 0;
  let topLeftCount = 0;
  let bottomRightCount = 0;
  let bottomLeftCount = 0;

  const midX = Math.floor(size[0] / 2);
  const midY = Math.floor(size[1] / 2);

  for (const [x, y] of robotCoordinates) {
    const isLeft = x < midX;
    const isRight = x > midX;
    const isTop = y < midY;
    const isBottom = y > midY;
    if (isTop && isLeft) {
      topLeftCount++;
    } else if (isTop && isRight) {
      topRightCount++;
    } else if (isBottom && isLeft) {
      bottomLeftCount++;
    } else if (isBottom && isRight) {
      bottomRightCount++;
    }
  }

  // ok, we're changing the criteria. we want to return when one of the
  // quadrants' counts is, say 1.5 times larger than all others. 1.5 is
  // arbitrary. the problem's definition is poorly defined. i had to come to
  // this solution. before, i had tried things like checking if the robots were
  // symmetrically-positioned, but that didn't work because the tree 1) does not
  // utilize all robots and 2) is not centered on the grid.
  return (
    Math.max(topLeftCount, topRightCount, bottomLeftCount, bottomRightCount) >
    1.5 *
      (topLeftCount +
        topRightCount +
        bottomLeftCount +
        bottomRightCount -
        Math.max(
          topLeftCount,
          topRightCount,
          bottomLeftCount,
          bottomRightCount
        ))
  );
}

function gold(robots: Robot[]) {
  robots = structuredClone(robots);
  const size = (isExample(robots) ? [11, 7] : [101, 103]) as [number, number];
  let iterations = 0;
  let found = 0;
  while (true) {
    if (
      containsChristmasTree(
        robots.map((r) => r.position),
        size
      )
    ) {
      // console.log(iterations);
      // drawRobots(robots, size);
      return iterations;
    }
    robots = robots.map((robot) => ({
      ...robot,
      position: wrappingMove(size, robot.position, robot.velocity, 1),
    }));
    iterations++;
  }
}

if (import.meta.main) {
  await createDayRunner({
    day: 14,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 12, Skip),
    aoc(231221760, 6771),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
