# aoc2024

To install dependencies:

```bash
bun install
```

Run days with:

```bash
# bun run <day>
bun run 12
```

Bigboy inputs are stored compressed with zstd because they sometimes might be
too large to store on GitHub. To decompress them, run:

```bash
# zstd -d <file>
zstd -d src/day09/bigboy.txt.zst
```

(to compress them, run `zstd -9 <file>`)