import * as path from "jsr:@std/path";
import "jsr:@std/dotenv/load";

async function getInput(day: number, year: number = 2024) {
  const url = `https://adventofcode.com/${year}/day/${day}/input`;

  const response = await fetch(url, {
    headers: {
      cookie: `session=${Deno.env.get("SESSION_COOKIE")}`,
    },
  });
  return response.text();
}

async function readFile(...pathSegments: string[]) {
  return await Deno.readTextFile(path.join(...pathSegments));
}

type PuzzlePart<I, O> = (input: I) => O;
type ParserFn<I> = (input: string) => I;
type Puzzle<I, S, G = S> = {
  day: number;
  silver: PuzzlePart<I, S>;
  gold: PuzzlePart<I, G>;
} & (I extends string
  ? Partial<{ parse: ParserFn<I> }>
  : { parse: ParserFn<I> });

export function createDayRunner<I, S, G = S>(puzzle: Puzzle<I, S, G>) {
  const UnknownResult = Symbol("UnknownResult");
  const Skip = Symbol("Skip");

  type UnknownResultType = typeof UnknownResult;
  type SkipType = typeof Skip;
  type SilverTest = S | UnknownResultType | SkipType | undefined;
  type GoldTest = G | UnknownResultType | SkipType | undefined;
  type Data = string | Promise<string>;
  type TestableInput = {
    data: Data;
    name: string;
    expectedSilver: SilverTest;
    expectedGold: GoldTest;
  };

  function raw(
    data: Data,
    name: string,
    expectedSilver: SilverTest,
    expectedGold: GoldTest
  ): TestableInput {
    return {
      data,
      name,
      expectedSilver,
      expectedGold,
    };
  }
  type RawFn = typeof raw;

  function example(
    data: string,
    expectedSilver: SilverTest,
    expectedGold: GoldTest
  ) {
    return raw(data, "example", expectedSilver, expectedGold);
  }
  type ExampleFn = typeof example;

  function aoc(expectedSilver: SilverTest, expectedGold: GoldTest) {
    return raw(getInput(puzzle.day), "aoc", expectedSilver, expectedGold);
  }
  type AocFn = typeof aoc;

  function file(
    pathSegments: string[],
    expectedSilver: SilverTest,
    expectedGold: GoldTest
  ) {
    return raw(
      readFile(...pathSegments),
      pathSegments.join("/"),
      expectedSilver,
      expectedGold
    );
  }
  type FileFn = typeof file;

  type InputCollector = ({
    example,
    aoc,
    file,
    raw,
    UnknownResult,
    Skip,
  }: {
    raw: RawFn;
    example: ExampleFn;
    aoc: AocFn;
    file: FileFn;
    UnknownResult: UnknownResultType;
    Skip: SkipType;
  }) => (Promise<TestableInput> | TestableInput)[];

  return async (collect: InputCollector) => {
    const inputs = collect({
      raw,
      example,
      aoc,
      file,
      UnknownResult: UnknownResult,
      Skip: Skip,
    });

    let inputIndex = 0;

    console.log(`Day ${puzzle.day}\n`);

    for (const input of inputs) {
      const i = await input;
      const data = await i.data;
      const parsedInput =
        "parse" in puzzle && puzzle.parse !== undefined
          ? puzzle.parse(data)
          : (data as I);
      console.log(
        `Input #${inputIndex++} "${i.name}" (${data
          .slice(0, 10)
          .replace(/\n/g, "\\n")}...)`
      );

      const parts = [
        i.expectedSilver === Skip
          ? undefined
          : {
              name: "Silver",
              expected: i.expectedSilver,
              fn: puzzle.silver,
            },
        i.expectedGold === Skip
          ? undefined
          : {
              name: "Gold  ",
              expected: i.expectedGold,
              fn: puzzle.gold,
            },
      ];

      for (const part of parts) {
        if (!part) {
          continue;
        }
        const { name, expected, fn } = part;
        const start = performance.now();
        const output = fn(parsedInput);
        const end = performance.now();

        const diff = end - start;

        let expectedString = "";
        if (expected !== UnknownResult) {
          const eqIndicator = output === expected ? "✅" : "❌";
          expectedString = ` ${eqIndicator}`;
        }

        console.log(
          `  ${name}: ${output} (${diff.toFixed(2)}ms)${expectedString}`
        );
      }
    }
  };
}

type Hash = string | number | boolean | bigint;

export class HashMap<K, V> {
  private map: Map<Hash, { key: K; value: V }>;

  constructor(public readonly hashFunction: (key: K) => Hash) {
    this.map = new Map();
  }

  set(key: K, value: V) {
    const hash = this.hashFunction(key);
    this.map.set(hash, { key, value });
  }

  get(key: K) {
    const hash = this.hashFunction(key);
    return this.map.get(hash)?.value;
  }

  has(key: K) {
    const hash = this.hashFunction(key);
    return this.map.has(hash);
  }

  delete(key: K) {
    const hash = this.hashFunction(key);
    return this.map.delete(hash);
  }

  clear() {
    this.map.clear();
  }

  *keys() {
    for (const { key } of this.map.values()) {
      yield key;
    }
  }

  *values() {
    for (const { value } of this.map.values()) {
      yield value;
    }
  }

  *entries() {
    for (const { key, value } of this.map.values()) {
      yield [key, value] as [K, V];
    }
  }

  size() {
    return this.map.size;
  }
}

const setValue = Symbol("setValue");

export class HashSet<T> {
  private map: HashMap<T, typeof setValue>;

  constructor(hashFunction: (key: T) => Hash) {
    this.map = new HashMap(hashFunction);
  }

  add(key: T) {
    this.map.set(key, setValue);
  }

  has(key: T) {
    return this.map.has(key);
  }

  delete(key: T) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  *values() {
    for (const key of this.map.keys()) {
      yield key;
    }
  }

  size() {
    return this.map.size();
  }

  *iter() {
    for (const key of this.values()) {
      yield key;
    }
  }

  difference(other: HashSet<T>) {
    const result = new HashSet(this.map.hashFunction);
    for (const key of this.values()) {
      if (!other.has(key)) {
        result.add(key);
      }
    }
    return result;
  }

  intersection(other: HashSet<T>) {
    const result = new HashSet(this.map.hashFunction);
    for (const key of this.values()) {
      if (other.has(key)) {
        result.add(key);
      }
    }
    return result;
  }

  union(other: HashSet<T>) {
    const result = new HashSet(this.map.hashFunction);
    for (const key of this.values()) {
      result.add(key);
    }
    for (const key of other.values()) {
      result.add(key);
    }
    return result;
  }

  symmetricDifference(other: HashSet<T>) {
    return this.union(other).difference(this.intersection(other));
  }

  isDisjointFrom(other: HashSet<T>) {
    return this.intersection(other).size() === 0;
  }

  isSubsetOf(other: HashSet<T>) {
    return this.difference(other).size() === 0;
  }

  isSupersetOf(other: HashSet<T>) {
    return other.difference(this).size() === 0;
  }
}

export class Counter<T> {
  private map: HashMap<T, number>;

  constructor(hashFunction: (key: T) => Hash) {
    this.map = new HashMap(hashFunction);
  }

  add(key: T, amount: number = 1) {
    const current = this.map.get(key) ?? 0;
    this.map.set(key, current + amount);
  }

  get(key: T) {
    return this.map.get(key) ?? 0;
  }

  total() {
    return [...this.map.values()].reduce((acc, curr) => acc + curr, 0);
  }

  *keys() {
    for (const key of this.map.keys()) {
      yield key;
    }
  }

  *values() {
    for (const value of this.map.values()) {
      yield value;
    }
  }

  *entries() {
    for (const [key, value] of this.map.entries()) {
      yield [key, value] as [T, number];
    }
  }
}

export class Coordinate extends Array<number> {
  constructor(x: number, y: number) {
    super(2);
    this[0] = x;
    this[1] = y;
  }

  get x() {
    return this[0];
  }

  get y() {
    return this[1];
  }

  static fromArray(arr: [number, number]) {
    return new Coordinate(arr[0], arr[1]);
  }

  plus(other: Coordinate) {
    return new Coordinate(this[0] + other[0], this[1] + other[1]);
  }

  minus(other: Coordinate) {
    return new Coordinate(this[0] - other[0], this[1] - other[1]);
  }

  static origin() {
    return new Coordinate(0, 0);
  }

  right() {
    return this.plus(new Coordinate(1, 0));
  }

  left() {
    return this.plus(new Coordinate(-1, 0));
  }

  up() {
    return this.plus(new Coordinate(0, -1));
  }

  down() {
    return this.plus(new Coordinate(0, 1));
  }

  upRight() {
    return this.plus(new Coordinate(1, -1));
  }

  upLeft() {
    return this.plus(new Coordinate(-1, -1));
  }

  downRight() {
    return this.plus(new Coordinate(1, 1));
  }

  downLeft() {
    return this.plus(new Coordinate(-1, 1));
  }

  equals(other: Coordinate) {
    return this[0] === other[0] && this[1] === other[1];
  }

  distanceTo(other: Coordinate) {
    return Math.abs(this[0] - other[0]) + Math.abs(this[1] - other[1]);
  }
}

export class Grid<T> {
  constructor(private data: T[][]) {}

  /**
   * Create a new Grid from a string input.
   * @param input The string that represents the grid.
   * @param parse A function that converts a string to a value of type T.
   * @param splitRows A function that splits the input into rows. Defaults to splitting on newlines.
   * @param splitColumns A function that splits a row into columns. Defaults to splitting on each character.
   * @returns A new Grid instance.
   */
  static fromString<T>(
    input: string,
    parse: (item: string, x: number, y: number) => T,
    splitRows: (input: string) => string[] = (input) => input.split("\n"),
    splitColumns: (input: string) => string[] = (input) => input.split("")
  ) {
    const rows = splitRows(input)
      .map((row) => row.trim())
      .filter((row) => row.length > 0);
    const data = rows.map((row, y) =>
      splitColumns(row).map((item, x) => parse(item, x, y))
    );
    return new Grid(data);
  }

  get(coordinate: Coordinate): T | undefined {
    const [x, y] = coordinate;
    return this.data[y]?.[x];
  }

  set(coordinate: Coordinate, value: T) {
    const [x, y] = coordinate;
    const row = this.data[y];
    if (!row) {
      throw new Error(`Row ${y} does not exist`);
    }
    row[x] = value;
  }

  get width() {
    return this.data[0]?.length ?? 0;
  }

  get height() {
    return this.data.length;
  }

  *iter() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        yield [this.data[y][x], [x, y]] as [T, Coordinate];
      }
    }
  }

  *iter_rows() {
    for (let y = 0; y < this.height; y++) {
      yield [this.data[y], y] as [T[], number];
    }
  }

  clone() {
    return new Grid(structuredClone(this.data));
  }
}
