import { createDayRunner } from "../util.ts";

type Stone = number;

function parse(input: string): Stone[] {
  return input.trim().split(" ").map(Number);
}

type Cache = Map<Stone, number>[];

function splitStone(
  stone: Stone,
  length: number | undefined = undefined
): [Stone, Stone] {
  if (length === undefined) {
    length = Math.floor(Math.log10(stone)) + 1;
  }
  const half = Math.floor(length / 2);
  const exp = 10 ** half;
  return [Math.floor(stone / exp), stone % exp];
}

function change(stone: Stone): Stone[] {
  if (stone === 0) {
    return [1];
  } else {
    const length = Math.floor(Math.log10(stone)) + 1;
    const isEvenLength = length % 2 === 0;
    if (isEvenLength) {
      return splitStone(stone, length);
    } else {
      return [stone * 2024];
    }
  }
}

function count(stones: Stone[], timesLeft: number, cache: Cache): number {
  if (timesLeft === 0) {
    return stones.length;
  }
  const changedStones = stones.map((s) => {
    const cacheCount = cache[timesLeft].get(s);
    if (cacheCount !== undefined) {
      return cacheCount;
    }
    const newStones = change(s);
    const newStoneCount = count(newStones, timesLeft - 1, cache);
    cache[timesLeft].set(s, newStoneCount);
    return newStoneCount;
  });

  return  changedStones.reduce((a, b) => a + b, 0);
}

function base(stones: Stone[], timesLeft: number) {
  const cache = Array.from(
    { length: timesLeft + 1 },
    () => new Map<Stone, number>()
  );
  return count(stones, timesLeft, cache);
}

function silver(stones: Stone[]) {
  return base(stones, 25);
}

function gold(stones: Stone[]) {
  return base(stones, 75);
}

if (import.meta.main) {
  await createDayRunner({
    day: 11,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 55312, Skip),
    aoc(212655, 253582809724830),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
