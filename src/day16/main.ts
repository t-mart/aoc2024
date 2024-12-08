import { createDayRunner } from "../util";

type Foo = string[];

function parse(input: string): Foo {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
}

function silver(foo: Foo) {
  return 1;
}

function gold(foo: Foo) {
  return 2;
}

if (require.main === module) {
  const exampleData = ``;

  await createDayRunner({
    day: 16,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    example(exampleData, 1, 2),
    aoc(UnknownResult, UnknownResult),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
