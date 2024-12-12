import { createDayRunner } from "../util.ts";

// this problem is awful. in trying to stay on theme, the creator has confused
// how this problem is described.
// - pages are identified by numbers, but those numbers are not the order of the
//   pages
// - the pages do not have a total order. in other words, this book is not
//   something that can be read front to back. its instead a graph of pages with
//   cycles. is this like some kind of rolodex?

type Rule = {
  before: number;
  after: number;
};
type PageSequence = number[];
type Updates = {
  rules: Rule[];
  pageSequences: PageSequence[];
};

function parse(input: string): Updates {
  const [rulesPart, pageSequencesPart] = input
    .split("\n\n")
    .map((l) => l.trim())
    .filter((l) => l);

  const rules = rulesPart.split("\n").map((rule) => {
    const [before, after] = rule.split("|").map(Number);
    return { before, after };
  });

  const pageSequences = pageSequencesPart
    .split("\n")
    .map((pageSequence) => pageSequence.split(",").map(Number));

  return { rules, pageSequences };
}

function base(updates: Updates, countIfSorted: boolean) {
  const afters = new Map<number, Set<number>>();
  for (const rule of updates.rules) {
    let set = afters.get(rule.before);
    if (!set) {
      set = new Set();
      afters.set(rule.before, set);
    }
    set.add(rule.after);
  }

  function cmp(a: number, b: number) {
    // if (a === b) return 0;
    return afters.get(a)?.has(b) ?? false ? -1 : 1;
  }

  let middlesTotal = 0;

  for (const pageSequence of updates.pageSequences) {
    const sorted = [...pageSequence];
    sorted.sort(cmp);

    const wasSorted = pageSequence.every((v, i) => v === sorted[i]);

    if (countIfSorted === wasSorted) {
      const middle = sorted[Math.floor(pageSequence.length / 2)];
      middlesTotal += middle;
    }
  }

  return middlesTotal;
}

function silver(updates: Updates) {
  return base(updates, true);
}

function gold(updates: Updates) {
  return base(updates, false);
}

if (import.meta.main) {
  await createDayRunner({
    day: 5,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 143, 123),
    aoc(5588, 5331),
    file([import.meta.dir, "bigboy.txt"], 14346279, 14357204),
  ]);
}
