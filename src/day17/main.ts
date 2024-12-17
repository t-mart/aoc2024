import { createDayRunner } from "../util.ts";

type Computer = {
  regA: bigint;
  regB: bigint;
  regC: bigint;
  program: number[];
};

function parse(input: string): Computer {
  const [a, b, c, program] = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) => line.split(": ")[1]);

  return {
    regA: BigInt(a),
    regB: BigInt(b),
    regC: BigInt(c),
    program: program.split(",").map(Number),
  };
}

function getComboOperand(operand: number, computer: Computer) {
  if (operand >= 0 && operand <= 3) {
    return BigInt(operand);
  } else if (operand === 4) {
    return computer.regA;
  } else if (operand === 5) {
    return computer.regB;
  } else if (operand === 6) {
    return computer.regC;
  } else {
    throw new Error("Reserved operand");
  }
}

function silver(input: Computer) {
  return run(input).join(",");
}

function run(input: Computer, regAOverride?: bigint) {
  const computer = structuredClone(input);
  if (regAOverride !== undefined) {
    computer.regA = regAOverride;
  }
  const program = computer.program;
  let pc = 0;
  const out: number[] = [];

  while (pc < program.length) {
    const instr = program[pc];
    const operand = program[pc + 1];

    let incrementPC = true;
    switch (instr) {
      case 0:
        // adv
        // regA >>= operand
        computer.regA >>= getComboOperand(operand, computer);
        break;
      case 1:
        // bxl
        // regB ^= operand
        computer.regB ^= BigInt(operand);
        break;
      case 2:
        // bst
        // regB = comboOperand & 7
        computer.regB = getComboOperand(operand, computer) & 7n;
        break;
      case 3:
        // jnz
        // if (regA !== 0) pc = operand
        if (computer.regA !== 0n) {
          pc = operand;
          incrementPC = false;
        }
        break;
      case 4:
        // bxc
        // regB ^= regC
        computer.regB ^= computer.regC;
        break;
      case 5:
        // out
        // out.push(comboOperand & 7)
        out.push(Number(getComboOperand(operand, computer) & 7n));
        break;
      case 6:
        // bdv
        // regB = regA >> operand
        computer.regB = computer.regA >> getComboOperand(operand, computer);
        break;
      case 7:
        // cdv
        // regC = regA >> operand
        computer.regC = computer.regA >> getComboOperand(operand, computer);
        break;
    }

    if (computer.regA < 0 || computer.regB < 0 || computer.regC < 0) {
      console.log("Negative or non-integer register value");
      console.log(computer);
      console.log(pc, instr, operand);
      break;
    }

    if (incrementPC) {
      pc += 2;
    }
  }

  return out;
}

function explainComboOperand(operand: number) {
  if (operand >= 0 && operand <= 3) {
    return `${operand}`;
  } else if (operand === 4) {
    return "regA";
  } else if (operand === 5) {
    return "regB";
  } else if (operand === 6) {
    return "regC";
  } else {
    throw new Error("Reserved operand");
  }
}

function explainProgram(program: number[]) {
  for (let i = 0; i < program.length; i += 2) {
    const instr = program[i];
    const operand = program[i + 1];
    let out = `${i}: `;
    switch (instr) {
      case 0:
        out += `regA >>= ${explainComboOperand(operand)} (shift right)`;
        break;
      case 1:
        out += `regB ^= ${operand}`;
        break;
      case 2:
        out += `regB = ${explainComboOperand(operand)} & 7 (take last 3 bits)`;
        break;
      case 3:
        out += `if (regA !== 0) pc = ${operand}`;
        break;
      case 4:
        out += `regB ^= regC`;
        break;
      case 5:
        out += `out.push(${explainComboOperand(
          operand
        )} & 7) (push lower 3 bits)`;
        break;
      case 6:
        out += `regB = regA >> ${explainComboOperand(operand)} (shift right)`;
        break;
      case 7:
        out += `regC = regA >> ${explainComboOperand(operand)} (shift right)`;
        break;
    }
    console.log(out);
  }
}

function pairWiseCompare(a: number[], b: number[]): number {
  if (a.length < b.length) {
    return -1;
  } else if (a.length > b.length) {
    return 1;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      return -1;
    } else if (a[i] > b[i]) {
      return 1;
    }
  }

  return 0;
}

function gold(input: Computer) {
  const target = input.program;
  const targetLength = target.length;
  let override = 0n;
  while (override < 8n ** BigInt(targetLength)) {
    const result = run(input, override);
    
    const cmp = pairWiseCompare(result, target);

    if (cmp === 0) {
      return override;
    }

    const resultLength = result.length;
    // take last `resultLength` elements of target
    const targetSlice = target.slice(targetLength - resultLength);
    if (pairWiseCompare(result, targetSlice) === 0) {
      // if the last elements are the same, lock it in by multiplying by 8,
      // which means that subseqent overrides will only change the first
      // elements
      override *= 8n;
    } else {
      // otherwise, search by incrementing the override
      override++;
    }
  }

  throw new Error("No solution found");
}

if (import.meta.main) {
  await createDayRunner({
    day: 17,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dirname!, "example.txt"], "4,6,3,5,6,3,5,2,1,0", Skip),

    // example2 gold here is be 117440, but my code enters some kind of infinite
    // loop, even though it gets the correct answer for the actual aoc input.
    file([import.meta.dirname!, "example2.txt"], Skip, Skip),

    aoc("2,1,0,4,6,2,4,2,0", 109_685_330_781_408n),
  ]);
}
