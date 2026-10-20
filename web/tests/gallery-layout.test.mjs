import test from "node:test";
import assert from "node:assert/strict";
import { layoutGalleryTiles } from "../src/lib/gallery-layout.ts";

const photo = (id, spotlight) => ({ id, type: "image", spotlight });

function verify(tiles, columns) {
  const occupied = new Set();
  for (const tile of tiles) {
    assert.ok(
      tile.row >= 1 &&
        tile.column >= 1 &&
        tile.column + tile.span - 1 <= columns,
    );
    if (tile.span === 2) {
      assert.equal(tile.item.type, "image");
      assert.equal(
        tile.column,
        tile.item.spotlight === "left" ? 1 : columns - 1,
      );
    }
    for (let row = tile.row; row < tile.row + tile.span; row++) {
      for (
        let column = tile.column;
        column < tile.column + tile.span;
        column++
      ) {
        const key = `${row}:${column}`;
        assert.equal(occupied.has(key), false, `overlapping cell ${key}`);
        occupied.add(key);
      }
    }
  }
}

test("20 ordinary photos form four rows of five in source order", () => {
  const items = Array.from({ length: 20 }, (_, index) => photo(String(index)));
  const tiles = layoutGalleryTiles(items, 5);
  assert.deepEqual(
    tiles.map((tile) => tile.item.id),
    items.map((item) => item.id),
  );
  assert.deepEqual(
    tiles.map((tile) => [tile.row, tile.column]),
    items.map((_, i) => [Math.floor(i / 5) + 1, (i % 5) + 1]),
  );
  verify(tiles, 5);
});

test("left/right spotlights reserve exactly four cells and surrounding tiles fill the gaps", () => {
  const tiles = layoutGalleryTiles(
    [
      photo("left", "left"),
      photo("right", "right"),
      photo("a"),
      photo("b"),
      photo("c"),
    ],
    5,
  );
  assert.deepEqual(
    tiles.map((tile) => [tile.item.id, tile.row, tile.column, tile.span]),
    [
      ["left", 1, 1, 2],
      ["a", 1, 3, 1],
      ["right", 1, 4, 2],
      ["b", 2, 3, 1],
      ["c", 3, 1, 1],
    ],
  );
  verify(tiles, 5);
});

test("many spotlight combinations never overlap or occupy a middle position", () => {
  for (const columns of [5, 3, 1]) {
    for (let seed = 0; seed < 24; seed++) {
      const items = Array.from({ length: 60 }, (_, i) =>
        photo(
          String(i),
          (i + seed) % 4 === 0
            ? "left"
            : (i + seed) % 5 === 0
              ? "right"
              : undefined,
        ),
      );
      const tiles = layoutGalleryTiles(items, columns);
      assert.equal(tiles.length, 60);
      assert.equal(new Set(tiles.map((tile) => tile.item.id)).size, 60);
      verify(tiles, columns);
      if (columns === 1)
        assert.ok(tiles.every((tile) => tile.span === 1 && tile.column === 1));
    }
  }
});

test("filtering repacks remaining tiles and videos cannot become spotlight images", () => {
  const items = [
    photo("left", "left"),
    { id: "video", type: "video", spotlight: "right" },
    photo("a"),
    photo("b"),
  ];
  const all = layoutGalleryTiles(items, 5);
  assert.equal(all.find((tile) => tile.item.id === "video").span, 1);
  const videos = layoutGalleryTiles(
    items.filter((item) => item.type === "video"),
    5,
  );
  assert.deepEqual(
    videos.map((tile) => [tile.row, tile.column, tile.span]),
    [[1, 1, 1]],
  );
  assert.deepEqual(layoutGalleryTiles([], 5), []);
});
