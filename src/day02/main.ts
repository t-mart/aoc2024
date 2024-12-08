import { createDayRunner } from "../util";

type Report = number[];

function parse(input: string): Report[] {
  const reports: Report[] = [];

  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  for (const line of lines) {
    reports.push(line.split(/\s+/).map(Number));
  }

  return reports;
}

function isSafe(report: Report) {
  let increasing: undefined | boolean = undefined;
  for (let index = 1; index < report.length; index++) {
    const [cur, prev] = [report[index], report[index - 1]];
    const diff = cur - prev;
    const diffAbs = Math.abs(diff);
    if (diffAbs < 1 || diffAbs > 3) {
      return false;
    }
    const curIncreasing = diff > 0;
    if (increasing === undefined) {
      increasing = curIncreasing;
    } else {
      if (increasing !== curIncreasing) {
        return false;
      }
    }
  }
  return true;
}

function silver(reports: Report[]) {
  let safeCount = 0;

  for (const report of reports) {
    if (isSafe(report)) {
      safeCount++;
    }
  }

  return safeCount;
}

function isSafe2(report: Report) {
  if (isSafe(report)) {
    return true;
  }

  for (let i = 0; i < report.length; i++) {
    // remove index i and try again
    const reportCopy = [...report];
    reportCopy.splice(i, 1);
    if (isSafe(reportCopy)) {
      return true;
    }
  }

  return false;
}

function gold(reports: Report[]) {
  let safeCount = 0;
  for (const report of reports) {
    if (isSafe2(report)) {
      safeCount++;
    }
  }

  return safeCount;
}

if (require.main === module) {
  const exampleData = `7 6 4 2 1
1 2 7 8 9
9 7 6 2 1
1 3 2 4 5
8 6 4 4 1
1 3 6 7 9`;

  await createDayRunner({
    day: 2,
    parse,
    silver,
    gold,
  })(({ example, aoc }) => [example(exampleData, 2, 4), aoc(287, 354)]);
}
