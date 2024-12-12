import { createDayRunner, HashSet } from "../util.ts";

type Coordinate = [number, number];
type PuzzleMap = {
  xLength: number;
  yLength: number;
  antennaGroups: Map<string, Coordinate[]>;
};

function parse(input: string): PuzzleMap {
  const antenna = new Map<string, Coordinate[]>();
  let xLength = 0;
  let yLength = 0;

  input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .forEach((line, y) => {
      xLength = Math.max(xLength, line.length);
      yLength = Math.max(yLength, y + 1);
      line.split("").forEach((char, x) => {
        if (char !== ".") {
          if (!antenna.has(char)) {
            antenna.set(char, []);
          }
          antenna.get(char)?.push([x, y]);
        }
      });
    });

  return {
    xLength,
    yLength,
    antennaGroups: antenna,
  };
}

function isInBoundsFn(map: PuzzleMap): (x: number, y: number) => boolean {
  return (x, y) => x >= 0 && x < map.xLength && y >= 0 && y < map.yLength;
}

function silver(map: PuzzleMap) {
  const antinodes = new HashSet<Coordinate>(([x, y]) => y * map.xLength + x);
  const isInBounds = isInBoundsFn(map);

  for (const antennaGroup of map.antennaGroups.values()) {
    for (let aIndex = 0; aIndex < antennaGroup.length; aIndex++) {
      for (let bIndex = aIndex + 1; bIndex < antennaGroup.length; bIndex++) {
        const a = antennaGroup[aIndex];
        const b = antennaGroup[bIndex];
        const [xA, yA] = a;
        const [xB, yB] = b;
        const dx = xB - xA;
        const dy = yB - yA;
        const antinodeA = [xB + dx, yB + dy] as Coordinate;
        const antinodeB = [xA - dx, yA - dy] as Coordinate;
        if (isInBounds(...antinodeA)) {
          antinodes.add(antinodeA);
        }
        if (isInBounds(...antinodeB)) {
          antinodes.add(antinodeB);
        }
      }
    }
  }

  return antinodes.size();
}

// ??? after solving: this is the most trivial gold i've ever seen. am i missing
// something?
function gold(map: PuzzleMap) {
  const antinodes = new HashSet<Coordinate>(([x, y]) => y * map.xLength + x);
  const isInBounds = isInBoundsFn(map);

  for (const antennaGroup of map.antennaGroups.values()) {
    for (let aIndex = 0; aIndex < antennaGroup.length; aIndex++) {
      const a = antennaGroup[aIndex];
      const [xA, yA] = a;
      for (let bIndex = aIndex + 1; bIndex < antennaGroup.length; bIndex++) {
        const b = antennaGroup[bIndex];
        const [xB, yB] = b;
        
        const dx = xB - xA;
        const dy = yB - yA;

        antinodes.add(a);
        antinodes.add(b);

        let x = xB + dx;
        let y = yB + dy;
        while (isInBounds(x, y)) {
          antinodes.add([x, y]);
          x += dx;
          y += dy;
        }

        // now the other way
        x = xA - dx;
        y = yA - dy;
        while (isInBounds(x, y)) {
          antinodes.add([x, y]);
          x -= dx;
          y -= dy;
        }
      }
    }
  }

  return antinodes.size();
}

if (import.meta.main) {
  await createDayRunner({
    day: 8,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 14, 34),
    aoc(291, 1015),
    file([import.meta.dir, "bigboy.txt"], 4193901, 4194304),
  ]);
}
