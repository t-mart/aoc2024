import { createDayRunner } from "../util.ts";

type Equation = {
  result: number;
  operands: number[];
};

function parse(input: string): Equation[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) => {
      const [result, operands] = line.split(": ");
      return {
        result: parseInt(result),
        operands: operands
          .split(" ")
          .map((operand) => parseInt(operand.trim())),
      };
    });
}

type OperatorFunction = (a: number, b: number) => number;
const operatorFunctions: OperatorFunction[] = [
  (a: number, b: number) => a + b,
  (a: number, b: number) => a * b,
  (a: number, b: number) => a * 10 ** Math.floor(Math.log10(b) + 1) + b,
];

// a recursive generator function that yields all possible permutations of
// length n of the operators. takes an argument withConcatenation that
// determines whether the concatenation operator is included in the set of
// operators.
function* getOperators(
  length: number,
  withConcatenation: boolean
): Generator<OperatorFunction[]> {
  if (length === 0) {
    yield [];
  } else {
    const end = withConcatenation ? 3 : 2;
    for (let i = 0; i < end; i++) {
      for (const rest of getOperators(length - 1, withConcatenation)) {
        yield [operatorFunctions[i], ...rest];
      }
    }
  }
}

function base(equations: Equation[], withConcatenation: boolean) {
  let total = 0;

  for (const equation of equations) {
    const length = equation.operands.length - 1;
    for (const operators of getOperators(length, withConcatenation)) {
      let subResult = equation.operands[0];
      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        const operand = equation.operands[i + 1];
        subResult = operator(subResult, operand);
        if (subResult > equation.result) {
          break;
        }
      }
      if (subResult === equation.result) {
        total += subResult;
        break;
      }
    }
  }

  return total;
}

function silver(equations: Equation[]) {
  return base(equations, false);
}

function gold(equations: Equation[]) {
  return base(equations, true);
}

if (import.meta.main) {
  await createDayRunner({
    day: 7,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 3749, 11387),
    aoc(7579994664753, 438027111276610),
    // file([import.meta.dir, "bigboy.txt"], 1, 2),
  ]);
}
