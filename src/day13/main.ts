import { createDayRunner } from "../util.ts";

type Coordinate = [number, number];
type Machine = {
  a: Coordinate;
  b: Coordinate;
  prize: Coordinate;
};

function parse(input: string): Machine[] {
  return input.split("\n\n").map((machineSection) => {
    const [a, b, prize] = machineSection
      .trim()
      .split("\n")
      .map(
        (line) =>
          line
            .split(": ")[1]
            .split(", ")
            .map((s) => parseInt(s.slice(2))) as Coordinate
      );
    return { a, b, prize };
  });
}

function base(machines: Machine[], prizeOffset: number = 0): number {
  return machines
    .map((m) =>
      solveMachine({
        ...m,
        prize: [m.prize[0] + prizeOffset, m.prize[1] + prizeOffset],
      })
    )
    .filter((x) => x !== undefined)
    .reduce((a, b) => a + b, 0);
}

function silver(machines: Machine[]) {
  return base(machines);
}

function solveMachine(machine: Machine): number | undefined {
  const { a, b, prize } = machine;

  // system of equations:
  // a[0] * aPresses + b[0] * bPresses = prize[0]
  // a[1] * aPresses + b[1] * bPresses = prize[1]
  // solve for aPresses and bPresses via substitution

  const bPresses =
    (prize[1] * a[0] - a[1] * prize[0]) / (b[1] * a[0] - a[1] * b[0]);
  const aPresses = (prize[0] - bPresses * b[0]) / a[0];

  if (aPresses % 1 !== 0 || bPresses % 1 !== 0) {
    return undefined;
  }

  if (aPresses < 0 || bPresses < 0) {
    return undefined;
  }

  return 3 * aPresses + bPresses;
}

function gold(machines: Machine[]) {
  return base(machines, 10_000_000_000_000);
}

if (import.meta.main) {
  await createDayRunner({
    day: 13,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 480, Skip),
    aoc(37686, 77204516023437),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
