# Responsive, zoom, motion, and contrast evidence

## EVD-RC-01 — Safari zoom and narrow layout

- Safari's Page Menu explicitly reported `200%` during the representative guest failure/safety review.
- At `200%`, the desktop shell changed to one column. The conversation drawer was named, initially focused Close conversations, trapped focus across its controls, closed on Escape, and restored focus to Show conversations.
- At `200%`, focusing Try again scrolled it into view. The focus ring remained substantially visible, although the sticky composer met the bottom edge of the focused control.
- Safari's minimum controllable window capture was 768 UI px wide. Safari's Page Menu explicitly reported `250%`, producing an approximate `307.2` CSS px layout (`768 / 2.5`), which is narrower than 320. Guest banner, safe error, header, composer, long text, and safety actions reflowed without a visible horizontal scrollbar.
- This is useful narrower-than-target evidence, but exact 320 CSS px was not set or measured. Exact 320 remains pending rather than inferred.
- A native `390 × 844` mobile viewport and software keyboard were unavailable. Desktop Safari at an approximate 384 CSS px (`768 / 2`) exercised the responsive drawer but is not a mobile-device substitute.

## EVD-RC-02 — Contrast calculations

Ratios were computed from the reviewed CSS tokens using the WCAG relative-luminance formula.

| Foreground / background | Ratio | Assessment |
|---|---:|---|
| `#FFFFFF` / primary `#6D4AFF` | 5.15:1 | passes normal text |
| `#FFFFFF` / primary hover `#5936DB` | 7.06:1 | passes |
| `#FFFFFF` / danger `#962F43` | 7.54:1 | passes |
| secondary `#625D72` / canvas `#FCFAFF` | 6.09:1 | passes |
| amber ink `#7A4B00` / amber soft `#FFF1C7` | 6.58:1 | passes |
| danger ink `#962F43` / danger soft `#FDE8EC` | 6.44:1 | passes |
| mint ink `#176247` / mint soft `#DDF7EC` | 6.47:1 | passes |
| focus `#4E2BC5` / white | 8.48:1 | passes |
| quiet text `#7B7589` / white | 4.42:1 | below 4.5, but reviewed uses were disabled/inactive controls |
| quiet text `#7B7589` / primary soft `#EDE8FF` | 3.70:1 | disabled/inactive control treatment |
| border strong `#CEC4DD` / white | 1.67:1 | fails 3:1 when required to identify a control |
| border `#E6E0EF` / white | 1.29:1 | fails 3:1 when required to identify a meaningful boundary |

Auth inputs, the composer, secondary buttons, and region controls use the low-contrast border tokens on white/similar surfaces. See `FIND-005`.

## EVD-RC-03 — Motion, forced colors, and text spacing

- Normal-mode source defines a three-dot, repeating `ss-fade-dot` animation for the reply indicator. This resembles a human typing indicator and conflicts with the checklist's explicit prohibition. See `FIND-004`.
- Reviewed CSS contains reduced-motion rules that suppress dot/spinner/skeleton/overlay animations, but the local control surface could not switch or emulate `prefers-reduced-motion`; this is structural evidence only, not a manual pass.
- Forced-colors/high-contrast mode was unavailable in Safari/macOS and remains pending.
- A standard text-spacing style (`line-height: 1.5`, paragraph spacing `2em`, letter spacing `.12em`, word spacing `.16em`) was attempted through Safari. Safari blocked JavaScript from the Smart Search field because its persistent Developer setting was off. The setting was not changed. Increased text spacing remains pending.
