# Faction card frames

Generated empty 1024 × 1536 UI paintings, integrated in 4.73.1.

- `orc.png`: hammered iron, leather bindings and tusk corner badges.
- `undead.png`: dark stone, aged metal, bone pins and funerary runes.

Both retain the Human frame's panel layout. Illustrations, text, category accents and rarity panel colours are rendered separately, so one painting supports every card type and rarity.

Generated originals remain in `/workspace/generated_images`:

- Orc: `exec-c7e9866a-fed2-4506-a1e5-e4e2b7cef531.png`
- Undead: `exec-6e47c433-a3f3-4dd5-ad98-2731092bb98f.png`

`scripts/prepare-card-images.cjs` creates the quality-94 WebP delivery files; `src/data/web-card-images.json` records source and delivery checksums.
