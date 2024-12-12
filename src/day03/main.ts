import { createDayRunner } from "../util.ts";

type Program = string;

function parse(input: string): Program {
  return input.trim();
}

function silver(program: Program) {
  const pattern = /mul\((?<argA>\d{1,3}),(?<argB>\d{1,3})\)/g;

  let total = 0;

  // find all occurrences of pattern in program and extract argA and argB,
  // adding their product to total.
  for (const match of program.matchAll(pattern)) {
    const { argA, argB } = match.groups!;
    total += parseInt(argA) * parseInt(argB);
  }

  return total;
}

function gold(program: Program) {
  const pattern =
    /(mul\((?<argA>\d{1,3}),(?<argB>\d{1,3})\)|(?<do>do\(\))|(?<dont>don't\(\)))/g;

  let total = 0;
  let instuctionsEnabled = true;

  // find all occurrences of pattern in program and extract argA and argB,
  // adding their product to total.
  for (const match of program.matchAll(pattern)) {
    if (match.groups!.do) {
      instuctionsEnabled = true;
    } else if (match.groups!.dont) {
      instuctionsEnabled = false;
    } else {
      if (instuctionsEnabled) {
        const { argA, argB } = match.groups!;
        total += parseInt(argA) * parseInt(argB);
      }
    }
  }

  return total;
}

if (import.meta.main) {
  const p1Example =
    "xmul(2,4)%&mul[3,7]!@^do_not_mul(5,5)+mul(32,64]then(mul(11,8)mul(8,5))";
  const p2Example =
    "xmul(2,4)&mul[3,7]!^don't()_mul(5,5)+mul(32,64](mul(11,8)undo()?mul(8,5))";

  await createDayRunner({
    day: 3,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, UnknownResult, Skip }) => [
    example(p1Example, 161, Skip),
    example(p2Example, Skip, 48),
    aoc(161085926,82045421 ),
    file([import.meta.dir, "bigboy.txt"], 1491954950936, 748337990746)
  ]);
}
