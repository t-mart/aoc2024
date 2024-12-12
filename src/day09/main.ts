import { createDayRunner } from "../util.ts";

type FileId = number;
type DiskMap = (FileId | null)[];
type Input = string;

function parse(input: string): Input {
  return input.trim();
}

function build(input: string): DiskMap {
  let inFile = true;
  let curFileId: FileId = 0;
  let diskMap: DiskMap = [];

  for (const c of input.trim()) {
    diskMap = diskMap.concat(
      Array.from({ length: Number(c) }, () => (inFile ? curFileId : null))
    );
    if (inFile) {
      curFileId++;
    }
    inFile = !inFile;
  }

  return diskMap;
}

function checksum(diskMap: DiskMap): number {
  return diskMap.reduce<number>((acc, fileId, index) => {
    if (fileId === null) {
      return acc;
    } else {
      return acc + fileId * index;
    }
  }, 0);
}

function nextFreeIndex(curIndex: number, diskMap: DiskMap) {
  for (let i = curIndex; i < diskMap.length; i++) {
    if (diskMap[i] === null) {
      return i;
    }
  }
  return -1;
}

function prevFileIndex(curIndex: number, diskMap: DiskMap) {
  for (let i = curIndex; i >= 0; i--) {
    if (diskMap[i] !== null) {
      return i;
    }
  }
  return -1;
}

function silver(input: Input) {
  const diskMap = build(input);
  let freeIndex = nextFreeIndex(0, diskMap);
  let fileIndex = prevFileIndex(diskMap.length - 1, diskMap);

  while (freeIndex !== -1 && fileIndex !== -1 && freeIndex < fileIndex) {
    diskMap[freeIndex] = diskMap[fileIndex];
    diskMap[fileIndex] = null;

    freeIndex = nextFreeIndex(freeIndex, diskMap);
    fileIndex = prevFileIndex(fileIndex, diskMap);
  }

  return checksum(diskMap);
}

type Node = {
  id: FileId | null;
  size: number;
  prev: Node | null;
  next: Node | null;
};

function makeLinkedList(input: Input): {
  head: Node;
  tail: Node;
  nodesById: Map<FileId, Node>;
  maxId: FileId;
} {
  let curFileId: FileId = 0;

  if (input === "") {
    throw new Error("Empty input");
  }
  const head: Node = {
    id: curFileId++,
    size: parseInt(input[0]),
    prev: null,
    next: null,
  };
  const nodesById = new Map<FileId, Node>([[head.id!, head]]);

  let inFile = false;
  let curNode = head;
  let maxId = head.id!;

  for (let i = 1; i < input.length; i++) {
    const size = parseInt(input[i]);
    if (size !== 0) {
      const newNode = {
        id: inFile ? curFileId++ : null,
        size,
        prev: curNode,
        next: null,
      };
      if (inFile) {
        nodesById.set(newNode.id!, newNode);
        maxId = newNode.id!;
      }
      curNode.next = newNode;
      curNode = newNode;
    }
    inFile = !inFile;
  }

  return { head, tail: curNode, nodesById, maxId };
}

function checksum2(head: Node) {
  let cur: Node | null = head;
  let acc = 0;
  let index = 0;
  while (cur !== null) {
    // console.log(`id: ${cur.id}, next: ${cur.next?.id}`);
    for (let i = 0; i < cur.size; i++) {
      acc += (cur.id ?? 0) * index++;
    }
    cur = cur.next;
  }
  return acc;
}

function stitch(a: Node | null, b: Node | null) {
  if (a !== null) {
    a.next = b;
  }
  if (b !== null) {
    b.prev = a;
  }
}

function gold(input: Input) {
  const ll = makeLinkedList(input);
  const { head, nodesById } = makeLinkedList(input);
  let { maxId } = ll;
  // console.log(`maxId: ${maxId}`);

  // printLL(head);

  for (let id = maxId; id >= 0; id--) {
    let movingNode = nodesById.get(id)!;
    // console.log(`movingNodeId: ${movingNode.id}`);
    let cur: Node | null = head;

    // find the next non-null node thats free (i.e. id === null) and has enough space
    let foundFree: Node | null = null;
    while (cur !== null && cur.id !== id) {
      if (cur.id === null && cur.size >= movingNode.size) {
        foundFree = cur;
        break;
      }
      cur = cur.next;
    }

    if (!foundFree) {
      continue;
    }
    if (foundFree.size > movingNode.size) {
      // split the node, stitch the new node in
      // foundFreePrev -> movingNode -> remainder -> foundFreeNext
      // and
      // oldNodePrev -> blank -> oldNodeNext
      const foundFreePrev = foundFree.prev;
      const foundFreeNext = foundFree.next;
      const remainder = {
        id: null,
        size: foundFree.size - movingNode.size,
        prev: null,
        next: null,
      };
      const oldNodePrev = movingNode.prev;
      const blank = {
        id: null,
        size: movingNode.size,
        prev: null,
        next: null,
      };
      const oldNodeNext = movingNode.next;

      // foundFreeNext might be movingNode, so we need to

      stitch(foundFreePrev, movingNode);
      stitch(movingNode, remainder);
      stitch(remainder, foundFreeNext);

      stitch(oldNodePrev, blank);
      stitch(blank, oldNodeNext);
    } else {
      // size is equal
      // foundFreePrev -> movingNode -> foundFreeNext
      // and
      // oldNodePrev -> blank -> oldNodeNext
      const foundFreePrev = foundFree.prev;
      const foundFreeNext = foundFree.next;
      // const foundFreeNext = foundFree.next?.id === id ? foundFree.next?.next : foundFree.next;
      const oldNodePrev = movingNode.prev;
      const blank = {
        id: null,
        size: movingNode.size,
        prev: null,
        next: null,
      };
      const oldNodeNext = movingNode.next;

      if (foundFreeNext?.id === id) {
        // const lol = movingNode.next;
        // console.log("foundFreeNext is movingNode");
        stitch(foundFreePrev, movingNode);
        stitch(movingNode, foundFree);
        stitch(foundFree, oldNodeNext);

        // stitch(oldNodePrev, blank);
        // stitch(blank, oldNodeNext);
      } else {
        stitch(foundFreePrev, movingNode);
        stitch(movingNode, foundFreeNext);

        stitch(oldNodePrev, blank);
        stitch(blank, oldNodeNext);
      }
    }

    // printLL(head);
  }

  // console.log('done, checksumming');
  return checksum2(head);
}

function printLL(head: Node | null) {
  let cur = head;

  while (cur !== null) {
    const size = cur.size;
    const char = cur.id === null ? "." : String(cur.id);
    process.stdout.write(char.repeat(size));
    cur = cur.next;
  }
  process.stdout.write("\n");
}

if (import.meta.main) {
  await createDayRunner({
    day: 9,
    parse,
    silver,
    gold,
  })(({ example, aoc, file, Skip, UnknownResult }) => [
    file([import.meta.dir, "example.txt"], 60, Skip),
    file([import.meta.dir, "example2.txt"], 1928, 2858),
    aoc(6225730762521, 6250605700557),
    // file([import.meta.dir, "bigboy.txt"], Skip, 70351090993107482),
  ]);
}
