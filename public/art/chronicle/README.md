# Illustrated world assets

The original generated PNGs are retained. Browser delivery uses the accompanying WebP images; no faction is made by recolouring another faction's texture or structure.

- `human-layers`, `orc-layers`, `undead-layers`: independently drawn atlases with background, road and foreground source rectangles in `src/data/chronicle-art.json`.
- `structures-original.png`: transparent source sheet, three faction columns, road tower above wall corner. Each `*-structures.webp` contains one faction's column. Team shields are a separate live overlay.
- `menu-original.png`, `menu.webp`: dedicated menu landscape. Source checksum and browser path are in `src/data/chronicle-shell-art.json`.
- The previous `*-terrain` files remain as original historical artwork; the current renderer loads the layer atlases.

`chronicle-terrain.js` composes the three layers into a bounded viewport cache, preserving prop scale. The road bounds come directly from the square city layout, and the same bounds define lateral unit presentation and the tower range band. Camera movement reuses these textures. Territory ownership clips all three layers at the same live boundary, including mirrored multiplayer views.

`chronicle-fortifications.js` builds separate stone, timber/iron/tusk and gothic cemetery wall patterns. The ten-by-ten construction grid and existing building sprites remain independent from these decorative layers. All towers still use their original live tower objects, targeting, damage and HP.
