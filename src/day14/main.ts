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
 * this method is brittle and is tainted by being aware of the intended result
 * before writing.
 *
 * we want to return true when one of the quadrants' counts is, arbitrarily, 1.5
 * times larger than all others. 1.5 is just something i chose because the
 * robots' position will be dense in one of these quadrants.
 *
 * the problem's definition is poorly defined. i had to look online for help for
 * what the tree looked like. there were so many approaches:
 * - rendering to PNG and looking at images manually
 * - rendering to PNG and finding minimum size (because dense robots are easier
 *   to compress by PNG algo)
 * - looking for high occurrences of neighboring robots
 * - and more.
 *
 * before, i had tried things like checking if the robots were stritcly
 * symmetrically-positioned, but that didn't work because the tree
 * 1) does not utilize all robots and 2) is not centered on the grid.
 *
 * instead, we use this implementation, which is practically an extension of the
 * first "silver" part's calculateSafetyFactor method (and therefore is probably
 * what eric intended): we count the number of robots in each quadrant and return
 * true if one of the quadrants has a lot more robots than the others (1.5 times
 * more).
 */
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

  const factor = 1.5;

  return (
    Math.max(topLeftCount, topRightCount, bottomLeftCount, bottomRightCount) >
    factor *
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
  while (true) {
    if (
      containsChristmasTree(
        robots.map((r) => r.position),
        size
      )
    ) {
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
