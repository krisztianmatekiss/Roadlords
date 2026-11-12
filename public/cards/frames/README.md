# Faction card frames

Generated empty 1024 × 1536 UI paintings, integrated in 4.73.2.

- `orc.png`: rough timber, red leather, iron plates and large tusks.
- `undead.png`: cracked grave stone, skull, rib bones and carved funerary marks.

Both retain the Human frame's panel layout. Illustrations, text, category accents and rarity panel colours are rendered separately, so one painting supports every card type and rarity.

Generated originals remain in `/workspace/generated_images`:

- Orc: `exec-2b7103df-f9ce-497a-8528-54e6364c86ae.png`
- Undead: `exec-0ca83f04-1da6-4d57-bc35-b0e45d4da726.png`

`scripts/prepare-card-images.cjs` creates the quality-94 WebP delivery files; `src/data/web-card-images.json` records source and delivery checksums.

`node scripts/fit-faction-frame.cjs <race> <original.png> <output.png>` fits the approved painting to the existing writing panels at import time. Only band dimensions change; no browser-side slices or extra frame requests are needed. Original source files are never overwritten.
