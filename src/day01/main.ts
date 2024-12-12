import { createDayRunner } from "../util.ts";

type Lists = [number[], number[]];

function parse(input: string): Lists {
  const left: number[] = [];
  const right: number[] = [];

  for (const line of input.split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const [l, r] = line.trim().split(/\s+/).map(Number);
    left.push(l);
    right.push(r);
  }

  return [left, right];
}

function silver(lists: Lists) {
  const leftSorted = [...lists[0]].sort((a, b) => a - b);
  const rightSorted = [...lists[1]].sort((a, b) => a - b);

  let diffTotal = 0;

  for (let i = 0; i < leftSorted.length; i++) {
    diffTotal += Math.abs(leftSorted[i] - rightSorted[i]);
  }

  return diffTotal;
}

function count(arr: number[]) {
  const counts = new Map<number, number>();

  for (const n of arr) {
    counts.set(n, (counts.get(n) || 0) + 1);
  }

  return counts;
}

function gold(lists: Lists) {
  const left = lists[0];
  const right = lists[1];
  const rightCounts = count(right);

  let similarityScore = 0;

  for (const n of left) {
    const rightCount = rightCounts.get(n);
    if (rightCount !== undefined) {
      similarityScore += n * rightCount;
    }
  }

  return similarityScore;
}

if (import.meta.main) {
  const exampleData = `3   4
4   3
2   5
1   3
3   9
3   3`;

  await createDayRunner({
    day: 1,
    parse,
    silver,
    gold,
  })(({ example, aoc }) => [
    example(exampleData, 11, 31),
    aoc(2580760, 25358365),
  ]);
}
