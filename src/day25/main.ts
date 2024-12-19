import { createDayRunner } from "../util.ts";

type Input = {};

function parse(input: string): Input {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
}

function silver(input: Input) {
  return 1;
}

function gold(input: Input) {
  return 2;
}

if (import.meta.main) {
  await createDayRunner({
    day: 25,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 1, Skip),
    aoc(UnknownResult, Skip),
  ]);
}
