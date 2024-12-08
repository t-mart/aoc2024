import { createDayRunner } from "../util";

type WordSearch = string[];

function parse(input: string): WordSearch {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
}

// return the coordinates of a ray starting at (x0, y0) and going in the
// direction (dx, dy). x0 and y0 are excluded from the output
function* ray(x0: number, y0: number, dx: number, dy: number, n: number) {
  if (dx === 0 && dy === 0) {
    throw new Error("dx and dy cannot both be zero");
  }

  if (n < 1) {
    throw new Error("n must be at least 1");
  }

  for (let i = 1; i < n; i++) {
    yield [x0 + i * dx, y0 + i * dy];
  }
}

function* around(x: number, y: number, n: number) {
  yield ray(x, y, 0, -1, n); // north
  yield ray(x, y, 1, -1, n); // north east
  yield ray(x, y, 1, 0, n); // east
  yield ray(x, y, 1, 1, n); // south east
  yield ray(x, y, 0, 1, n); // south
  yield ray(x, y, -1, 1, n); // south west
  yield ray(x, y, -1, 0, n); // west
  yield ray(x, y, -1, -1, n); // north west
}

function silver(wordSearch: WordSearch) {
  const word = "XMAS";
  let foundCount = 0;

  for (let y = 0; y < wordSearch.length; y++) {
    for (let x = 0; x < wordSearch[y].length; x++) {
      if (wordSearch[y][x] !== word[0]) {
        continue;
      }
      for (const directionRay of around(x, y, word.length)) {
        // we already know index 0 matches
        let index = 1;
        let matching = true;
        for (const [x, y] of directionRay) {
          if (wordSearch[y]?.[x] !== word[index++]) {
            matching = false;
            break;
          }
        }
        if (matching) {
          foundCount++;
        }
      }
    }
  }

  return foundCount;
}

function gold(wordSearch: WordSearch) {
  const word = "MAS";
  let foundCount = 0;

  for (let y = 0; y < wordSearch.length; y++) {
    for (let x = 0; x < wordSearch[y].length; x++) {
      if (wordSearch[y][x] !== word[1]) {
        continue;
      }
      const northEast = wordSearch[y - 1]?.[x + 1];
      const southEast = wordSearch[y + 1]?.[x + 1];
      const southWest = wordSearch[y + 1]?.[x - 1];
      const northWest = wordSearch[y - 1]?.[x - 1];

      if (
        ((northEast === word[0] && southWest === word[2]) ||
          (northEast === word[2] && southWest === word[0])) &&
        ((southEast === word[0] && northWest === word[2]) ||
          (southEast === word[2] && northWest === word[0]))
      ) {
        foundCount++;
      }
    }
  }

  return foundCount;
}

if (require.main === module) {
  const exampleData = `MMMSXXMASM
MSAMXMSMSA
AMXSXMAAMM
MSAMASMSMX
XMASAMXAMM
XXAMMXXAMA
SMSMSASXSS
SAXAMASAAA
MAMMMXMMMM
MXMXAXMASX`;

  await createDayRunner({
    day: 4,
    parse,
    silver,
    gold,
  })(({ example, aoc, file }) => [
    example(exampleData, 18, 9),
    aoc(2573, 1850),
    file([import.meta.dir, "bigboy.txt"], 7025140, 879274),
  ]);
}
