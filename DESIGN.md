# Design System Document

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Academic Curator."** 

Moving away from the legacy portal's cluttered, table-heavy layout, this system reimagines the academic experience as a high-end editorial dashboard. It focuses on clarity, intellectual authority, and a "clean" contemporary aesthetic. By utilizing intentional asymmetry, breathing room (generous white space), and a sophisticated tonal palette, the system transforms administrative tasks into a seamless digital journey. We break the "template" look by layering surfaces rather than boxing them in, ensuring the interface feels like a professional workspace rather than a rigid database.

---

## 2. Colors
Our palette is rooted in the institution's heritage but refined for a digital-first application. We use a sophisticated hierarchy of blues and neutral "off-whites" to create depth.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning or layout containment is strictly prohibited. Information architecture must be defined through **background color shifts** or **tonal transitions**. For example, a student’s "Grades Overview" section should be distinguished from the main background by using `surface_container_low` against a `surface` backdrop, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
- **Background (`#f7f9ff`):** The canvas.
- **Surface Container Low (`#eff4fd`):** Secondary regions or sidebar foundations.
- **Surface Container Lowest (`#ffffff`):** The "highest" priority content cards, creating a natural lift against the deeper background.

### The "Glass & Gradient" Rule
To elevate the experience, use **Glassmorphism** for floating elements (like dropdown menus or mobile navigation). Use semi-transparent surface colors with a `backdrop-filter: blur(20px)`. 
- **Signature Texture:** Primary CTAs should utilize a subtle linear gradient from `primary` (`#2959ac`) to `primary_container` (`#4673c7`) at a 135-degree angle to add visual "soul" and dimension.

---

## 3. Typography
We transition from legacy fonts to **Inter**, a robust sans-serif that provides a contemporary, high-readability feel.

*   **Display & Headlines:** Used for dashboard welcomes and section titles. The large scale (`display-lg` at 3.5rem) should be used sparingly to create editorial impact and focal points.
*   **Titles:** Use `title-lg` for card headings. The font weight should be slightly heavier to establish a clear information hierarchy.
*   **Body:** `body-md` is the workhorse for student data and descriptions. We use a generous line height (1.5x) to prevent "academic fatigue."
*   **Labels:** Small, all-caps or high-contrast labels (`label-sm`) are used for metadata, ensuring that even the smallest details feel intentional and designed.

---

## 4. Elevation & Depth
In "The Academic Curator" system, depth is a tool for focus, not just decoration.

*   **The Layering Principle:** Avoid shadows where background shifts suffice. Placing a `surface_container_lowest` card on a `surface_container_low` background provides a soft, organic "lift."
*   **Ambient Shadows:** For "floating" components like Modals or Popovers, use highly diffused shadows.
    *   *Shadow Token:* `0 12px 32px -4px rgba(22, 28, 34, 0.08)`
    *   This mimics natural light and prevents the "dirty" look of standard grey drop shadows.
*   **The Ghost Border Fallback:** If accessibility requires a container edge, use a "Ghost Border": `outline_variant` (`#c3c6d3`) at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** Use `surface_variant` at 70% opacity with a blur to create "frosted glass" panels. This ensures the institutional blue "bleeds through," making the UI feel integrated into the brand environment.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (`primary` to `primary_container`), roundedness: `md` (0.375rem). No border.
*   **Secondary:** Ghost style. No background, `outline_variant` (at 20% opacity) for the edge, text in `primary`.
*   **Tertiary:** Text-only with an icon. High-end editorial look.

### Input Fields
*   **Style:** Background `surface_container_high`. No border. On focus, transition background to `surface_container_lowest` and add a 2px `primary` bottom-bar only. This removes the "boxy" feel of traditional forms.

### Cards & Lists
*   **Constraint:** **Forbid the use of divider lines.**
*   **Separation:** Use `spacing-6` (1.5rem) or `spacing-8` (2rem) of vertical white space to separate list items. For complex data lists, use alternating tonal backgrounds (`surface` and `surface_container_low`) to define rows.

### Academic Progress Chips
*   **Action Chips:** Use `secondary_container` for the background with `on_secondary_container` text. Roundedness: `full`.
*   **Status:** Use `tertiary_fixed_dim` (Gold) for "In Progress" states to pay homage to the brand's accent color without overpowering the professional blue.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a structural element. If a layout feels "empty," increase the typography scale rather than adding more boxes.
*   **DO** use asymmetrical layouts for the dashboard (e.g., a wide main column for "Schedule" and a narrow side column for "Quick Actions").
*   **DO** prioritize "inter" typography for all data points to ensure a modern, tech-forward feeling.

### Don't
*   **DON'T** use 1px solid lines to separate content. It creates visual noise and feels "legacy."
*   **DON'T** use the institutional Gold (`#FFCC00`) for large background areas. Use it only for high-priority alerts or "Signature" accents.
*   **DON'T** use sharp 90-degree corners. Everything must follow the `md` (0.375rem) or `lg` (0.5rem) roundedness scale to feel approachable and modern.
*   **DON'T** use pure black for text. Use `on_surface` (`#161c22`) to maintain a soft, premium contrast.