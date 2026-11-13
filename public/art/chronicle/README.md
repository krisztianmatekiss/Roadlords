# Illustrated world assets

The original generated PNGs are retained. Browser delivery uses the accompanying WebP images; no faction is made by recolouring another faction's texture or structure.

- `human-layers`, `orc-layers`, `undead-layers`: independently drawn atlases with background, road and foreground source rectangles in `src/data/chronicle-art.json`.
- `structures-original.png`: transparent source sheet, three faction columns, road tower above wall corner. Each `*-structures.webp` contains one faction's column. Team shields are a separate live overlay.
- `human-fortress`, `orc-fortress`, `undead-fortress`: complete transparent enclosures, each with four joined corners and two integrated gate bastions. Original PNG and browser WebP are retained; paths, dimensions, courtyard bounds and checksums are in `src/data/chronicle-art.json`.
- `undead-paving`: separate, opaque cracked-stone road, without the old foggy wash.
- `command-atlas`: the main menu's campaign atlas on a war table. Source checksum and browser path are in `src/data/chronicle-shell-art.json`. Older menu images remain historical sources.
- The previous `*-terrain` files remain as original historical artwork; the current renderer loads the layer atlases.

`chronicle-terrain.js` composes the layers into a bounded viewport cache, preserving prop scale. It uses the quiet ground at the bottom of the background strip and an undecorated foreground behind the battle overview. The road bounds come directly from the square city layout, and the same bounds define lateral unit presentation and the tower range band. Camera movement reuses these textures. Territory ownership clips all layers at the same live boundary, including mirrored multiplayer views.

`chronicle-fortifications.js` places each complete enclosure around the independent ten-by-ten construction grid. Gate leaves slide into the integrated bastions; destroyed gate towers are masked into rubble. Existing building sprites remain unchanged. Towers still use their original live objects, targeting, damage and HP.
