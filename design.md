# Mold Science Technologies Design System

## Purpose

This document records the visual and motion language for the static site.
The implementation source of truth remains `styles/tokens.css`.
Tokens, colors, and font families are locked.
New components must derive from the existing tokens.

## Brand Palette

| Token | Value | Intended use |
|---|---:|---|
| `--primary` | `#8EB42E` | Primary calls to action and step rails only |
| `--on-primary` | `#0e0f0c` | Text and icons on primary green |
| `--primary-active` | `#A6CC48` | Active and hover state for primary controls |
| `--primary-neutral` | `#CFE39A` | Badges and step markers |
| `--primary-pale` | `#EEF4DA` | Pale green feature-card surfaces |
| `--ink` | `#0e0f0c` | Headlines, dark bands, footer |
| `--ink-deep` | `#26350A` | Text on pale green surfaces |
| `--body` | `#454745` | Default body copy |
| `--mute` | `#868685` | Metadata and supporting text |
| `--canvas` | `#ffffff` | Primary page and card surface |
| `--canvas-soft` | `#ECEEE6` | Sage bands and secondary surfaces |
| `--positive` | `#2ead4b` | Positive status only |
| `--positive-deep` | `#054d28` | Deep positive status only |
| `--warning` | `#ffd11a` | Warning and safety status only |
| `--warning-deep` | `#b86700` | Deep warning status only |
| `--negative` | `#d03238` | Error and negative status only |
| `--negative-deep` | `#a72027` | Deep error text only |

Status colors are not brand accents.
Green brand color should remain purposeful rather than decorative.
Surface contrast supplies elevation; default cards do not need shadows.

## Typography

Display type uses Manrope at weight 800.
Body and interface type use Inter at weights 400 and 600.
Heroes must never use a display weight below 800.

| Style | Token / size | Line height | Use |
|---|---|---:|---|
| Mega | `--display-mega-size` | `0.85` | Exceptional campaign statements |
| XXL | `--display-xxl-size` | `0.854` | Large editorial statements |
| XL | `--display-xl-size` | `0.844` | Page heroes |
| MD | `--display-md-size` | `0.85` | Section headings |
| SM | `--display-sm-size` | `1.125` | Card and component headings |
| Body large | `1.25rem` | `1.5` | Leads and section introductions |
| Body medium | `1rem` | `1.5` | Default copy |
| Body small | `0.875rem` | `1.43` | Compact supporting copy |
| Caption | `0.75rem` | `1.333` | Metadata and labels |
| Button | `1rem` | `1` | Control labels |

Display headings use tight `-0.02em` letter spacing.
Eyebrows use uppercase Inter 600 with `0.08em` tracking.
Body copy defaults to `--body`; headings default to `--ink`.

## Spacing and Shape

Spacing follows a 4px base scale.

| Token | Value |
|---|---:|
| `--sp-1` | 4px |
| `--sp-2` | 8px |
| `--sp-3` | 12px |
| `--sp-4` | 16px |
| `--sp-5` | 20px |
| `--sp-6` | 24px |
| `--sp-8` | 32px |
| `--sp-10` | 40px |
| `--sp-12` | 48px |
| `--sp-16` | 64px |
| `--sp-20` | 80px |

Bands use `--band-pad`, currently 48px vertically.
Cards use `--card-pad`, currently 24px.
Buttons use a 48px minimum height.
The content container is capped at 1200px.

| Shape token | Value | Use |
|---|---:|---|
| `--radius-card` | 24px | Cards and major media frames |
| `--radius-input` | 12px | Inputs and compact inner surfaces |
| `--radius-pill` | 9999px | Buttons and badges |

## Band Rhythm

The preferred page sequence begins with a sage hero.
Follow the hero with a white content band.
Alternate white, sage, and pale-green bands to maintain section clarity.
Use the dark band for the final conversion moment.
The dark footer follows the conversion band.
Avoid placing two visually identical content bands together without reason.
Use green headlines on dark conversion surfaces.
Keep content widths readable even inside the full-width band system.

## Button Hierarchy

Primary buttons use `--primary` with `--on-primary` text.
Primary buttons represent the strongest next action on a page or section.
Secondary buttons use a sage surface with ink text.
On sage bands, secondary buttons move to a white surface.
Tertiary buttons use a white surface and one-pixel ink border.
Do not invent additional button colors or shapes.
Keep labels concise and action oriented.
Use one primary action per local decision area where practical.

## Cards and Media

Cards use white by default and 24px corner radii.
Pale cards use `--primary-pale` and `--ink-deep` text.
Dark cards are reserved for promotional moments.
Media cards remove outer padding and place content inside `.card-body`.
Media should crop or contain intentionally and preserve useful focal points.
Linked cards may use `.card--link` or an anchor with `.card`.

## Signature Step Rail

The step rail communicates Clean, Protect, and Lock.
Nodes use brand green and Manrope 800 numerals.
Connectors visually establish one continuous system.
Product pages may use `aria-current="step"` to identify position.
Inactive nodes remain outlined and muted on current-step variants.
The compact variant is appropriate in tighter hero compositions.

## Motion Language

Motion reinforces hierarchy, sequence, and physical response.
It must never become a decorative layer detached from user intent.
Only animate `transform` and `opacity` for movement and reveals.
`box-shadow` and `background-color` may transition for interface state polish.
Do not animate layout properties such as width, height, top, left, or margin.

### Easing tokens

`--ease-out-expo` is `cubic-bezier(0.22, 1, 0.36, 1)`.
Use it for entrances, image scale, underline drawing, and settling states.
`--ease-spring` is `cubic-bezier(0.32, 0.72, 0, 1)`.
Use it for tactile card and control movement.

### Duration tokens

`--dur-fast` is 180ms for direct button feedback.
`--dur-med` is 500ms for cards, nav polish, and marker response.
`--dur-slow` is 700ms for content reveals and media movement.
The step-rail connector draws over 900ms.
Nav underlines draw over 240ms.

### Reveal system

Add `data-reveal` to an element that should enter when visible.
The JavaScript gate adds `html.js`, so no-JS visitors see all content.
Hidden reveal elements begin 20px lower with zero opacity.
Visible elements settle to their natural position and full opacity.
The observer uses a 0.15 threshold and an 8% lower viewport inset.
Each reveal runs once and is then unobserved.
Hero reveals become visible immediately on load rather than waiting to scroll.

Use `style="--reveal-i:N"` for an explicit sequence.
Use indices beginning at zero.
Each index adds a 70ms delay.
Hero order is eyebrow, heading, lead, actions, then hero card.

Add `data-reveal-group` to a grid or grouped container.
Add `data-reveal` to each direct child that should stagger.
JavaScript assigns `--reveal-i` to direct reveal children automatically.
Explicit inline indices remain useful for non-grid compositions.
Do not add reveal attributes to navigation or footer content.

### Hover physics

Linked cards lift 4px on devices that support hover.
Media images scale to 1.03 within their clipped card frame.
Primary buttons lift 1px on hover.
All buttons compress to 0.97 scale while active.
Hover movement must not displace surrounding layout.
Hover-only effects must stay inside `@media (hover: hover)`.

### Step rail motion

A revealed step rail draws connectors from left to right.
Connector scale uses a left transform origin.
Markers begin at 0.6 scale and settle to full size.
Second and third markers use 80ms incremental delays.
The sequence should read as one connected process.

### Navigation behavior

The navigation remains sticky at the top of the viewport.
After eight pixels of scrolling, JavaScript adds `.is-scrolled`.
The scrolled state adds a restrained divider and soft shadow.
The scroll listener is passive and updates through requestAnimationFrame.
Class state changes only when the threshold boolean changes.
Menu-link underlines draw from left to right.
The logo and button links do not receive the menu underline treatment.

### Reduced-motion policy

Honor `prefers-reduced-motion: reduce` without exception.
Reveal targets become immediately visible and have no transition.
Step-rail connectors and markers render in their completed state.
JavaScript still applies `.is-visible` so content can never remain hidden.
Core meaning and interaction must not depend on animation.

## Maintenance Rules

Do not modify locked palette, typography, spacing, or radius tokens casually.
Place motion overrides in `styles/motion.css` after `styles/site.css`.
Keep `js/motion.js` defensive when optional elements are absent.
Test every page with JavaScript enabled and disabled.
Test keyboard focus independently from hover behavior.
Test reduced motion at the operating-system or browser level.
Prefer fewer coordinated motions over many unrelated effects.
