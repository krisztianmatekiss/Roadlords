# Illustrated world assets

The original generated PNGs are retained. Browser delivery uses the accompanying WebP images; no faction is made by recolouring another faction's texture or structure.

- `human-layers`, `orc-layers`, `undead-layers`: independently drawn atlases with background, road and foreground source rectangles in `src/data/chronicle-art.json`.
- `structures-original.png`: transparent source sheet, three faction columns, road tower above wall corner. Each `*-structures.webp` contains one faction's column. Team shields are a separate live overlay.
- `human-fortress`, `orc-fortress`, `undead-fortress`: complete transparent enclosures, each with four joined corners and two integrated gate bastions. Original PNG and browser WebP are retained; paths, dimensions, courtyard bounds and checksums are in `src/data/chronicle-art.json`.
- Current `*-fortress-gate` paintings replace the thin inner gate barrier with matching substantial timber/iron doors. `fortress.portal` records the actual painted opening in the 1000×1000 SVG coordinate system. The renderer reuses the same painting for the moving leaves; the gate emission helper uses the same bounds.
- `human-courtyard`, `orc-courtyard`, `undead-courtyard`: separate ground materials behind the ten-by-ten grid. These do not alter building art, placement rules or footprints.
- `../terrain/terrain-atlas`: six illustrated props in a three-column, two-row transparent sheet, selected by CSS background position. Forest, quarry and fertile soil are on the top row; foundation, ordinary ruins and ancient ruins below. Original PNG and delivered WebP are retained.
- `undead-paving-light`: the current opaque ash-grey paving, with lighter stone faces and clear joints. The former dark `undead-paving` remains a historical source.
- `menu-valley`: the current landscape behind the restored centered main menu. Source checksum and browser path are in `src/data/chronicle-shell-art.json`. Older menu images, including the discarded `command-atlas`, remain historical sources.
- The previous `*-terrain` files remain as original historical artwork; the current renderer loads the layer atlases.

`chronicle-terrain.js` composes the layers into a bounded viewport cache, preserving prop scale. It uses the quiet ground at the bottom of the background strip and an undecorated foreground behind the battle overview. The road bounds come directly from the square city layout, and the same bounds define lateral unit presentation and the tower range band. Camera movement reuses these textures. Territory ownership clips all layers at the same live boundary, including mirrored multiplayer views.

`chronicle-fortifications.js` places each complete enclosure around the independent ten-by-ten construction grid. Gate leaves slide into the integrated bastions; destroyed gate towers are masked into rubble. Existing building sprites remain unchanged. Towers still use their original live objects, targeting, damage and HP.
