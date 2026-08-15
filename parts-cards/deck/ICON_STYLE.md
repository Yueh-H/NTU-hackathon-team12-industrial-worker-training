# Icon style spec — 防火門單字圖卡（所有圖示共用）

Purpose: flashcard front-side pictograms for Indonesian factory workers learning
Chinese terms on a fire-door production sheet. The icon must make the concept
recognizable in ~1 s at 80 px wide. Schematic, not photorealistic.

## File
- One file per icon: `parts-cards/deck/icons/<slug>.svg` (slug given in the task list).
- Root element exactly:
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" role="img" aria-label="<english name>">`
- No `width`/`height` attributes, no `<style>`, no `<script>`, no external refs, no `<image>`.
- Well-formed XML (`xmllint --noout file.svg` must pass).
- ≤ 40 elements. Prefer `<path>`, `<rect>`, `<circle>`, `<line>`, `<polyline>`, `<g>`.

## Look
- Monoline: `stroke="#1f2937"`, `stroke-width="3"` (use `2` for fine detail),
  `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"` by default.
- Put shared stroke attrs on one wrapping `<g>` to keep files short.
- **Accent** `fill="#fbbf24"` (amber) ONLY on the thing being taught. Exactly one accent region per icon
  (may be a group of same-role shapes, e.g. three hinges).
- **Context** `fill="#e5e7eb"` (light grey) for surrounding parts that give meaning (door body, wall).
- Background transparent. Nothing outside 0..160 × 0..120; keep ≥ 6 px margin.
- No Chinese text. Latin/number labels only if essential and ≤ 6 chars
  (`font-family="system-ui, sans-serif" font-size="13" fill="#1f2937"`), e.g. `45°`, `t`, `W`.
- Arrows: simple open arrowheads (two strokes), not filled triangles.

## Shared conventions (use the same primitives so the deck reads as one system)
- **Door leaf (front elevation)**: rounded rect ~ x=55..105, y=15..105 (50×90), context fill,
  hinge side = LEFT edge (3 small ticks), lock side = RIGHT edge (small handle circle at y≈62).
- **Mother/child double door**: mother leaf 60 wide (x=30..90) + child leaf 36 wide (x=92..128), same height.
- **Board / plate**: parallelogram slab in light isometric (top face visible), thickness shown as side face.
- **Bar / tube**: long thin isometric prism, ~110 long, showing the end cross-section at the right.
- **Process verbs**: show tool + material + result; motion lines allowed (2–3 short strokes).
- **Field/units cards**: a small 3-column mini-table (3 rows) with the relevant cell accented.

## Self-check (mandatory before reporting)
```
xmllint --noout parts-cards/deck/icons/<slug>.svg
rsvg-convert -w 320 parts-cards/deck/icons/<slug>.svg -o /tmp/<slug>.png   # then Read the PNG and look at it
```
Fix anything that is unrecognizable, off-canvas, or has more than one accent region.
Report: slug list, any icon you are unsure reads well, and why.
