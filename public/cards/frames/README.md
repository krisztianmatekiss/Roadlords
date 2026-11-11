# Faction card frames

`orc-undead-frames.png` is the original generated frame atlas. The game loads the
smaller WebP encoding. Both are 1536 × 1024 with alpha.

The Orc frame uses hammered iron, red leather and tusks; the Undead frame uses
bone, skulls and necromantic stone. No labels are baked into the artwork.
`src/ui/faction-card-frame.js` selects each frame using an SVG viewport;
`src/styles/faction-cards.css` positions live titles, illustrations and effects
inside the measured panels. Rarity glow and badges are separate UI layers.
