import { createDayRunner, HashSet } from "../util";

// this was the easiest day yet.

type Coordinate = [number, number];
type Height = number;
type TopographicMap = {
  trailheads: Coordinate[];
  data: Height[][];
  xSize: number;
  ySize: number;
};

function parse(input: string): TopographicMap {
  const trailheads: Coordinate[] = [];
  const data = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line, y) => {
      return line.split("").map((char, x) => {
        if (char === "0") {
          trailheads.push([x, y]);
        }
        return parseInt(char);
      });
    });

  return {
    trailheads,
    data,
    xSize: data[0].length,
    ySize: data.length,
  };
}

function around(coordinate: Coordinate): Coordinate[] {
  const [x, y] = coordinate;
  return [
    [x, y - 1], // up
    [x - 1, y], // left
    [x + 1, y], // right
    [x, y + 1], // down
  ];
}

type Runner = {
  position: Coordinate;
  trailheadPosition: Coordinate;
};

function hashRunnerFn(xSize: number, ySize: number) {
  return (runner: Runner) =>
    runner.position[0] +
    runner.position[1] * xSize +
    runner.trailheadPosition[0] * xSize * ySize +
    runner.trailheadPosition[1] * xSize * ySize * xSize;
}

function base(
  topographicMap: TopographicMap,
  accumulator: { add: (runner: Runner) => void; size: () => number }
) {
  let runners = topographicMap.trailheads.map((trailhead) => {
    return {
      position: trailhead,
      trailheadPosition: trailhead,
    };
  });

  for (let step = 0; step < 10; step++) {
    const advancingRunners: Runner[] = [];
    for (const runner of runners) {
      const [x, y] = runner.position;
      const curHeight = topographicMap.data[y][x];

      if (curHeight === 9) {
        accumulator.add(runner);
        continue;
      }

      for (const [nextX, nextY] of around(runner.position)) {
        const nextHeight = topographicMap.data[nextY]?.[nextX];
        if (nextHeight === undefined || nextHeight !== curHeight + 1) {
          continue;
        }
        advancingRunners.push({
          position: [nextX, nextY],
          trailheadPosition: runner.trailheadPosition,
        });
      }
    }
    runners = advancingRunners;
  }

  return accumulator.size();
}

function silver(topographicMap: TopographicMap) {
  const completions = new HashSet<Runner>(
    hashRunnerFn(topographicMap.xSize, topographicMap.ySize)
  );
  return base(topographicMap, {
    add(runner: Runner) {
      completions.add(runner);
    },
    size() {
      return completions.size();
    },
  });
}

function gold(topographicMap: TopographicMap) {
  let completions = 0;
  return base(topographicMap, {
    add() {
      completions++;
    },
    size() {
      return completions;
    },
  });
}

if (require.main === module) {
  await createDayRunner({
    day: 10,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 36, 81),
    aoc(825, 1805),
    file([import.meta.dir, "bigboy.txt"], 433087, 624588),
  ]);
}
