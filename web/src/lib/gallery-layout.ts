import type { GallerySpotlight } from "../types/gallery.ts";

interface Tile {
  id: string;
  type: "image" | "video";
  spotlight?: GallerySpotlight;
}

export interface GalleryTilePlacement<T> {
  item: T;
  order: number;
  row: number;
  column: number;
  span: number;
}

// Shared by static HTML and viewport changes. Only edge positions exist.
export function layoutGalleryTiles<T extends Tile>(
  items: readonly T[],
  columns: 1 | 3 | 5,
): GalleryTilePlacement<T>[] {
  const occupied = new Set<number>();
  const fits = (row: number, column: number, span: number) => {
    if (column + span > columns) return false;
    for (let y = row; y < row + span; y++)
      for (let x = column; x < column + span; x++)
        if (occupied.has(y * columns + x)) return false;
    return true;
  };
  const placements = items.map((item, order) => {
    const spotlight =
      item.type === "image" &&
      (item.spotlight === "left" || item.spotlight === "right");
    const span = columns > 1 && spotlight ? 2 : 1;
    let row = 0;
    let column = span === 2 && item.spotlight === "right" ? columns - 2 : 0;
    if (span === 2) {
      while (!fits(row, column, span)) row++;
    } else {
      while (!fits(row, column, span)) {
        column++;
        if (column === columns) {
          column = 0;
          row++;
        }
      }
    }
    for (let y = row; y < row + span; y++)
      for (let x = column; x < column + span; x++)
        occupied.add(y * columns + x);
    return { item, order, row: row + 1, column: column + 1, span };
  });
  // DOM, keyboard and lightbox order follow the visible tile positions.
  return placements.sort((a, b) => a.row - b.row || a.column - b.column);
}
