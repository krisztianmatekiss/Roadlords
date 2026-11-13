# Chronicle environment layers

Original generated ink-and-colour landscape plates for the 4.74 presentation.

- Human: warm ochre road, sage/golden grass, broadleaf trees.
- Orc: rust-red earth, dry scrub, sparse thorn trees.
- Undead: ash/violet ground, dead trees, grey slate.

The images contain environment only. Buildings, the 10×10 grid, city walls, units, towers, team colours, health and controls are independent live layers. Existing city building and battle-unit artwork is retained.

The renderer clips the two faction textures at the current `territoryBoundary()` world coordinate every frame. It uses the actual local player/opponent races, including mirrored multiplayer snapshots. No faction-specific AI or test-only renderer is involved.

Web delivery: quality-92 WebP. PNG originals are preserved; source hashes and dimensions are recorded in `src/data/chronicle-art.json`.

Horizontal repeats use a reflected cached canvas. Cache height is capped at 900 pixels and retains one tile per faction; CSS backdrop blobs are revoked when replaced. Only factions taking part in the match are warmed during setup.

Generated originals:

- `/workspace/generated_images/exec-59556ebd-0e36-4bf0-95df-49452f0ad45f.png`
- `/workspace/generated_images/exec-73d898c8-a8ae-41fb-8318-f0b809db97ba.png`
- `/workspace/generated_images/exec-57aab3cc-547f-4b4b-91e0-1d88ff3b574e.png`
