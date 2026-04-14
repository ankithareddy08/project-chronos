# Design System Strategy: The Kinetic Observatory

## 1. Overview & Creative North Star
This design system is anchored by the **"Kinetic Observatory"**—a creative North Star that transforms data monitoring into an immersive, cinematic experience. We are moving away from the static "box-and-grid" layout of traditional SaaS dashboards. Instead, we treat the UI as a multi-layered viewport into a digital ecosystem.

The system breaks the "template" look through **intentional asymmetry** and **focal depth**. By utilizing a central 3D visualization (the Globe) as an anchor, surrounding UI elements are treated as satellite panels that orbit the data. High-contrast typography scales and overlapping glass surfaces create a sense of professional authority, mimicking a high-end aerospace control center rather than a standard web application.

## 2. Colors & Atmospheric Depth
Our palette is rooted in the void of deep space, using tonal shifts to define structure rather than rigid lines.

*   **Core Background (`#0B0E14`):** A textured, near-black blue that provides the "canvas" for the glow.
*   **Primary Glow (Cyan - `primary` / `#99f7ff`):** Used for active data streams, primary calls to action, and focus states.
*   **Secondary Vitality (Lime - `secondary` / `#a4fa00`):** Reserved for positive growth, success states, and secondary telemetry.
*   **Tertiary Alert (Amber - `tertiary` / `#ffc965`):** Used for warnings, pending states, and high-importance highlights.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` panel sitting on a `surface` background creates a natural, sophisticated edge.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass.
*   **Base:** `surface` (`#0b0e14`)
*   **Lower Tier:** `surface-container-low` (`#10131a`) for large background sections.
*   **Floating Tier:** `surface-container-high` (`#1c2028`) for interactive widgets.
*   **The "Glass & Gradient" Rule:** All floating panels must utilize Glassmorphism. Apply a 15%–25% opacity to the surface color combined with a `backdrop-filter: blur(20px)`. Main CTAs should use a subtle linear gradient from `primary` to `primary-container` to provide "visual soul."

## 3. Typography
The typography system balances technical precision with editorial impact.

*   **Display & Headlines (Space Grotesk):** Chosen for its geometric, futuristic apertures. Use `display-lg` and `headline-md` for high-impact data points to command immediate attention.
*   **Body & Labels (Inter):** A workhorse sans-serif for utility. It provides high legility at small scales (`label-sm`) for metadata and technical specs.
*   **Brand Identity through Scale:** We employ a high-contrast ratio. A massive `3.5rem` display metric sitting adjacent to a `0.75rem` label creates an "editorial" hierarchy that feels intentional and premium.

## 4. Elevation & Depth
In the Kinetic Observatory, depth is achieved through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Stack `surface-container` tiers to create lift. An inner card using `surface-container-highest` placed atop a `surface-container-low` sidebar creates a soft, natural elevation.
*   **Ambient Shadows:** When a "floating" effect is required, use extra-diffused shadows. Values should be large (blur > 30px) and low-opacity (4%-8%). The shadow color should be a tinted version of `primary` or `surface-variant` to mimic natural light bleed from the glowing UI elements.
*   **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use a **Ghost Border**: a 1px stroke using the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

## 5. Components

### Buttons
*   **Primary:** A vibrant `primary` gradient fill with `on-primary` text. No border. Apply a soft `0 0 15px` glow using the `primary` color.
*   **Secondary:** A "Glass" button. Semi-transparent `surface-container-highest` with a `0.5rem` corner radius and a Ghost Border.
*   **Tertiary:** Text-only using `primary` color, reserved for low-priority navigation.

### Input Fields
*   **Text Inputs:** Use `surface-container-lowest` backgrounds. The active state should not use a thick border; instead, the background should shift to `surface-container-high` with a 1px `primary` bottom-border "accent line."

### Chips & Status Indicators
*   **Data Chips:** Use high-saturation `secondary` or `tertiary` colors for status. These should feel like small LED indicators.
*   **Selection Chips:** Rounded (`full`) with a soft glow when active.

### Cards & Data Visualization
*   **Rule:** Forbid divider lines. Use vertical white space (`1.5rem` from the spacing scale) to separate list items.
*   **Charts:** Line and bar charts must utilize the "Glow Accent." Line charts should have a 2px stroke width with a 5px gaussian blur glow of the same color underneath. 
*   **3D Globe:** The central visualization should be the only element with high-motion animation. Satellite panels should "float" slightly above the globe's radius to reinforce the Z-axis depth.

## 6. Do’s and Don'ts

### Do:
*   **Do** use intentional asymmetry. Offset panels to create a dynamic, "live" feel.
*   **Do** use `backdrop-filter: blur` on all overlapping containers to maintain legibility over the 3D globe.
*   **Do** prioritize "Data as Art." Use the `display-lg` typography scale for primary KPIs.

### Don't:
*   **Don't** use pure white (#FFFFFF). Use `on-surface` (`#ecedf6`) to avoid visual fatigue in dark environments.
*   **Don't** use standard grid-gutters. Use varying spacing widths to create "clusters" of information.
*   **Don't** use 100% opaque, high-contrast borders or dividers. They shatter the cinematic immersion.
*   **Don't** over-animate. Motion should be "kinetic" (meaning it reacts to user presence) rather than constantly looping, which distracts from the data.