---
name: WOD Engine
description: A lab-instrument counter that reports your day's training assignment as a live measurement, not a suggestion.
colors:
  ground: "#0d0906"
  panel: "#1c140d"
  panel-recessed: "#140f0a"
  ink: "#f2ece2"
  ink-soft: "#b8ab97"
  ink-faint: "#9c8f7a"
  border: "#3a2c1c"
  glow: "#ff9130"
  glow-dim: "#7a4416"
  danger: "#d1503f"
typography:
  display:
    fontFamily: "Rajdhani, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  digit:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace"
    fontSize: "clamp(1.5rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0px"
  control: "9999px"
spacing:
  sm: "8px"
  md: "20px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-primary-energized:
    backgroundColor: "transparent"
    textColor: "{colors.glow}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  panel-recessed:
    backgroundColor: "{colors.panel-recessed}"
    textColor: "{colors.glow}"
    rounded: "{rounded.none}"
    padding: "16px 12px"
---

# Design System: WOD Engine

## Overview

**Creative North Star: "The Nixie Laboratory Counter"**

WOD Engine reads out your day's assignment the way a lab instrument reports a measurement, not the way a fitness app pitches a plan. The system is built from one physical object: a bank of glass nixie tubes on a blackened steel instrument panel, each tube a glowing digit reporting a real quantity — a time cap, a round count, a streak, a personal record. Nothing decorates; everything either measures or holds still.

The world runs on a strict two-layer distinction. Library data — the WOD's name, its movements, its prescribed reps — is engraved: fixed, flat, rendered in warm neutral ink on a recessed plate that never lights up. Live session state — the running clock, the current round, a personal record just set — is the only thing allowed to glow. A visitor should always be able to tell, at a glance and without reading labels, which numbers on screen are the plan and which ones are happening right now.

This is a redesign, not an extension: it replaces an earlier warm editorial system (olive ground, amber/teal accents, a condensed display serif) rather than refining it. The old system is anti-reference, not a starting point.

**Key Characteristics:**
- Near-black steel-and-glass ground with exactly one glow hue — a Restrained color strategy, not a palette
- Fixed content is engraved (flat, neutral, never lit); live content glows
- Flat rectangular panels throughout; the only circles are physical point-controls (steppers, the toggle dot)
- State is marked by shape and pattern first, color second
- Depth comes from emitted light (a centered glow), never from a directional drop shadow

## Colors

The palette is Restrained: two near-black neutrals for ground and panel, three warm neutral inks for text at different emphasis, one signal color, and one reserved danger color. Nothing else is permitted a hue.

### Primary
- **Nixie Glow** (`#ff9130`): the system's only signal color. Marks every live or lit value — the running clock, the current round, an active toggle, a personal record, the active tab. Used at full saturation for text/icons, with a soft centered glow (`text-shadow`/`box-shadow`, `0 0 Npx`, zero offset) standing in for a directional drop shadow — the world's material is emitted light, not surface lighting.

### Neutral
- **Ground** (`#0d0906`): the base field behind every screen. Near-black, warm brown-black — blackened steel/glass, not a cool "dark mode" black.
- **Panel** (`#1c140d`): the chassis surface — cards, list containers, the tab bar. One step lighter than Ground so panels read as physical plates sitting on the chassis, not as a color change.
- **Panel Recessed** (`#140f0a`): the well a digit readout sits inside — darker than Panel so the glow has somewhere to emanate from.
- **Ink** (`#f2ece2`): primary text — WOD names, movement rep counts, primary readouts on dark buttons.
- **Ink Soft** (`#b8ab97`): secondary text — movement names, list body copy.
- **Ink Faint** (`#9c8f7a`): captions and labels — "TIME CAP (MIN)", inactive tab labels, section headers. Chosen to clear 4.5:1 contrast against both Ground and Panel (6.26:1 / 5.73:1); the system's original faint gray (`#7a6f5f`) failed this floor and was corrected during finish review.
- **Border** (`#3a2c1c`): hairline separators and panel edges.

### Reserved
- **Danger** (`#d1503f`): cancel/destructive actions only (the Cancel label, the cancel-confirmation panel). Never used for anything else — a second signal color would break the One Glow Rule below.

### Named Rules
**The One Glow Rule.** Only `glow` (`#ff9130`) marks something live, active, or record-setting. If a value is fixed, historical, or inert, it renders in an ink tone — never in glow, however visually similar the two contexts feel.

**The Engraved-vs-Lit Rule.** Every screen keeps two visually distinct layers: engraved (flat, ink-toned, on Panel or Panel Recessed — the plan) and lit (glowing, on Panel Recessed — what's happening now). A future screen may not blur the two by giving a fixed value a glow, or a live value flat ink.

## Typography

**Display Font:** Rajdhani (with system sans fallback)
**Body Font:** system sans (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`)
**Label/Mono Font:** JetBrains Mono

**Character:** Rajdhani is a condensed, geometric, engineering-signage face — it carries the WOD nameplate ("FRAN'S COUSIN") with the character of stenciled equipment lettering, not a friendly app headline. JetBrains Mono does double duty as both the digit-bank numeral face (genuine tabular figures, so digit banks never jitter in width) and the engraved-caption face — uppercase, wide-tracked, reading like a panel's stamped legend. System sans is reserved for the one place the world doesn't need a voice: short body prose (empty states, form hints).

### Hierarchy
- **Display** (800, `clamp(2.25rem, 6vw, 3.75rem)`, leading-none, uppercase): WOD nameplates and screen titles (Today's WOD name, "History", "Stats").
- **Digit** (700, `clamp(1.5rem, 5vw, 3.75rem)`, leading-none, tabular-nums): every live or fixed numeric readout — time caps, round counts, streaks, PRs, the running clock.
- **Label** (600, 11px, tracking `0.14em`, uppercase, JetBrains Mono): captions, section headers, tab labels, badges.
- **Body** (400, 14px, system sans): prose — empty states, helper text, notes fields. The only role that isn't mono or Rajdhani.

### Named Rules
**The Tabular Rule.** Any number that can change while the user watches (the clock, a round count, a stepper value) must render with `font-variant-numeric: tabular-nums` in JetBrains Mono, so digits never shift the layout as they tick.

## Layout

Mobile-first, single column, capped at `max-w-md` (28rem) and centered — the product is a phone-in-hand instrument, not a desktop dashboard, per the confirmed use scene (held close, glanced at between reps). Screen padding is 24px (`p-6`). The three tabbed screens (Today, History, Stats) live inside a scrollable panel with a fixed bottom tab bar; Today's panel is a flex column with its primary action pushed to the true bottom via `margin-top: auto`, so the control anchors to the bottom edge of the panel regardless of content length — never left to drift wherever the content happens to end. The live tracker (Active Workout) is a fixed full-height column with its own scrollable "splits" region at the bottom.

Digit-bank readouts lay out in a `grid-cols-2` pair. Movement lists and history rows use `divide-y` hairline separation on a shared Panel background, never individually bordered cards.

## Elevation & Depth

This system has no shadows in the conventional sense — no ambient drop shadow ever appears. Depth is conveyed by light emission: a live value gets a soft, zero-offset, tinted glow (`text-shadow: 0 0 12px glow-tint, 0 0 2px glow`) radiating symmetrically outward, the way light actually leaves a glass tube. A fixed/engraved element gets no glow at all and sits flush with its panel. The absence of glow is itself a depth signal, not an oversight.

### Named Rules
**The Emission Rule.** Depth comes from light a surface emits, never from a directional shadow implying an external light source. A drop shadow with an offset would imply ambient lighting this world doesn't have; if an element needs to feel "raised," give it glow, not shadow.

## Shapes

Panels, buttons, and containers are flat rectangles with zero corner radius (`rounded: none`) — the instrument-panel chassis has no soft edges. The only circles in the system are physical point-controls: the stepper +/− buttons and the toggle-switch indicator dot (`rounded-full`). This is a deliberate contrast, not an inconsistency — flat plates hold information, round controls are things a finger presses.

## Components

### Buttons
- **Shape:** flat rectangle, zero radius, full width in context.
- **Primary (`button-primary`):** solid glow background, ground-colored text — the un-energized state of a toggle action (e.g. "START WORKOUT").
- **Energized (`button-primary-energized`):** glow-tinted transparent background, glow border and text — the active/in-progress state of the same control (e.g. "RESUME WORKOUT"), always paired with a small lit indicator dot.
- **Danger (`button-danger`):** solid danger background, ground-colored text — destructive confirmation only (e.g. "CANCEL WORKOUT").
- **Secondary/Ghost:** panel-recessed background, bordered, ink text — used for a completed/inert action (e.g. "VIEW RESULT").

### Digit Readout (signature component)
The system's defining primitive (`DigitReadout`): a value in glowing tabular JetBrains Mono over a small tracked label, on a Panel Recessed field with a hairline Border. Comes in three sizes (`sm`/`md`/`lg`) and a `dim` variant (glow-dim color, no glow effect) for de-energized/unavailable values (e.g. a rest day's blank time cap). Reused everywhere the product's real content is a number: Today's time cap/rounds, Stats' streak/longest/logged tiles.

### Steppers
- **Style:** a value in glowing tabular digits flanked by two circular icon buttons (authored SVG minus/plus, not text glyphs), border-only at rest.
- **Increment button:** glow border and icon.
- **Decrement button:** ink-faint border and icon.

### Panels / Lists
- **Corner Style:** none.
- **Background:** Panel, with Panel Recessed for nested readouts.
- **Border:** 1px solid Border on the container; internal rows separated by the same hairline via `divide-y`, never individually boxed.
- **Internal Padding:** 16–20px.

### Navigation (Tab Bar)
Three flat-mono labels in a row on a Panel background, top hairline border. Active tab is Glow with a soft text-shadow; inactive tabs are Ink Faint. No icons, no pill/indicator background — the glow alone carries the active state.

### Confirmation Sheet
A fixed bottom sheet over a dimmed (`rgba(ground, 0.7)`) backdrop, Panel background with a Danger-colored border for a destructive confirmation. Two flat buttons: a neutral "keep going" and a Danger "confirm" action. Used in place of a native browser `confirm()` dialog, which would break the instrument-panel illusion at the product's highest-stakes screen.

### Status Marks
Scheduled/current/cleared and similar tri-state indicators render as small filled or hollow circles (never text glyphs, never Unicode symbols standing in for an icon), distinguished by fill and border, not by hue alone — a locked rung is a hollow ring, a cleared rung is a dim filled dot, the current rung is a glowing filled dot.

### Named Rules
**The Status-by-Shape Rule.** Any tri-state or multi-state indicator (WOD status, progression rung status) must be distinguishable by mark shape/fill before color is even considered — the system should still read correctly in grayscale.

## Do's and Don'ts

### Do:
- **Do** keep the glow (`#ff9130`) to values that are live, active, or record-setting — never decorative.
- **Do** render every changeable number in tabular JetBrains Mono so digit banks don't jitter.
- **Do** anchor a screen's primary action to the true bottom of its panel (`margin-top: auto`), not wherever the content happens to end.
- **Do** use zero-offset glow for anything that needs to feel "raised" — never a directional drop shadow.
- **Do** self-host Rajdhani and JetBrains Mono from `/fonts` rather than a Google Fonts CDN `@import`.

### Don't:
- **Don't** introduce a second saturated accent color — the One Glow Rule is the point, not a starting palette.
- **Don't** round the corners of a panel, card, button, or container — flat rectangles are the chassis language; reserve circles for physical point-controls only.
- **Don't** use a Unicode glyph (◆, ●, –, +) as a stand-in icon — author an SVG in the existing stroke language (2.2px stroke, round caps) instead.
- **Don't** use a native browser dialog (`window.confirm`, `alert`) for any in-product confirmation — build it in-world as a panel/sheet.
- **Don't** give a fixed/engraved value a glow, or a live value flat ink — the two-layer distinction is the system's core legibility device.
