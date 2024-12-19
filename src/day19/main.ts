import { createDayRunner, HashMap } from "../util.ts";

const colors = [
  "w", // white
  "b", // black
  "u", // blue
  "r", // red
  "g", // green
] as const;
type Color = (typeof colors)[number];
type Combination = Color[];

type Input = {
  available: Combination[];
  needed: Combination[];
};

function parse(input: string): Input {
  const [availablePart, neededPart] = input.split("\n\n").map((p) => p.trim());
  const available = availablePart
    .split(", ")
    .map((line) => line.split("") as Combination);
  const needed = neededPart
    .split("\n")
    .map((line) => line.split("") as Combination);
  return { available, needed };
}

function arrayEqual(a: Combination, b: Combination): boolean {
  return a.every((v, i) => v === b[i]);
}

function match(
  needed: Combination,
  available: Combination[],
  cache: HashMap<Combination, number>
): number {
  if (needed.length === 0) {
    return 1;
  }

  const cachedResult = cache.get(needed);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  let found = false;
  for (const a of available) {
    if (a.length > needed.length) {
      continue;
    }

    const [prefix, rest] = [needed.slice(0, a.length), needed.slice(a.length)];

    if (arrayEqual(a, prefix)) {
      const result = match(rest, available, cache);
      if (result) {
        cache.set(needed, (cache.get(needed) ?? 0) + (cache.get(rest) ?? 1));
        found = true;
      }
    }
  }

  if (!found) {
    cache.set(needed, 0);
    return 0;
  }
  return cache.get(needed)!;
}

function silver(input: Input) {
  // console.log(input)
  const cache = new HashMap<Combination, number>((c: Combination) =>
    c.join("")
  );
  return input.needed
    .map<number>((needed) =>
      match(needed, input.available, cache) > 0 ? 1 : 0
    )
    .reduce((a, b) => a + b);
}

function gold(input: Input) {
  const cache = new HashMap<Combination, number>((c: Combination) =>
    c.join("")
  );
  return input.needed
    .map<number>((needed) => match(needed, input.available, cache))
    .reduce((a, b) => a + b);
}

if (import.meta.main) {
  await createDayRunner({
    day: 19,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], 6, 16),
    aoc(255, 621820080273474),
  ]);
}
