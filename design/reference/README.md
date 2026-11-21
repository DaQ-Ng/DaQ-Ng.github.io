# Reference sheets for DAT.EXE

Visual references only. They are **not** sliced into the game: the sprites and tiles were redrawn by hand as
pixel grids in `src/game/art.ts` and `src/game/tiles.ts` (16 px, black / white / two greys), using these for shape
and mood. Nothing in this folder is deployed.

| Folder | Contents |
|---|---|
| `01_boot_ui/` | Empty — no sheet was provided. The boot screen is built in HTML/CSS (`src/components/DatExe.astro`). |
| `02_player_and_robot/` | Dat's character sheets (top-down walk, poses, expressions, portraits, side view, UI). The robot BYTE has no sheet; it's drawn in `art.ts`. |
| `03_portfolio_interactables/` | Computers and server racks, terminals / crystal / chests, signs and boards. |
| `04_world_tiles_and_props/` | Ground tiles, buildings, props, cliffs/bridges/water, nature, walls/pipes, doors/portals. |
| `05_concept_reference/` | The overall portfolio mock-up. |
