# Tool Standards — Project 50

Defines the quality bar every Project 50 tool must meet.

---

## 1. File Structure

Every tool lives in `tools/[tool-slug]/` and contains exactly:

```
tools/[tool-slug]/
  index.html         — page shell (metadata, layout, SEO sections)
  [tool-slug].css    — tool-specific styles ONLY
  [tool-slug].js     — tool-specific logic ONLY
```

No other files are created unless a tool genuinely requires additional assets.

---

## 2. HTML Standards

### Canonical Stack
Every `index.html` must use the canonical CSS and JS load order defined in `tools/_template/index.html`. The order is documented in both CSS and JS comment blocks in the template. Do not add, remove, or reorder files without understanding the dependency graph.

### Mount Points
Every page must include all three partial mount points:

```html
<div id="partial-header"></div>
<div id="partial-sidebar"></div>
...
<div id="partial-footer"></div>
```

These are replaced at runtime by `partials.js`. Do not pre-populate them with static HTML.

### Breadcrumb
Every tool must have a `<nav class="tool-breadcrumb">` with correct Home → Category → Tool links. The last item must carry `aria-current="page"`.

---

## 3. SEO Standards

Every tool must include:

| Element | Requirement |
|---|---|
| `<title>` | `[Tool Name] — Project 50` |
| `<meta name="description">` | 120–155 characters. Describe the tool and its key benefit. |
| `<link rel="canonical">` | Absolute URL: `https://project50.tools/tools/[slug]/` |
| Open Graph tags | `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:site_name` |
| Twitter Card tags | `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image` |
| SoftwareApplication schema | Valid JSON-LD with `name`, `url`, `applicationCategory`, `description`, `offers`, `isPartOf` |
| BreadcrumbList schema | Three levels: Home → Category → Tool |

### SEO Content Sections

Every tool page must include a `<div class="tool-seo-sections">` containing:

1. **About This Tool** — What it does, why it's useful, methodology if relevant. 2–3 paragraphs. Keywords used naturally.
2. **How To Use** — Numbered steps. Reference the button label in bold.
3. **FAQ** — Minimum 3 questions. Last entry must be the privacy FAQ (pre-filled in template). Use natural-language questions.

---

## 4. Accessibility Standards

| Requirement | Implementation |
|---|---|
| Skip navigation | `<a href="#main-content" class="skip-link">` — first element in `<body>` |
| Label/input pairing | Every `<input>`, `<select>`, `<textarea>` must have a `<label for="matching-id">` |
| Hint text | Use `aria-describedby="[input-id]-hint"` to associate hint text with its field |
| Live region | Result card must carry `aria-live="polite"` and `aria-atomic="true"` |
| Decorative icons | All decorative icons and emoji must have `aria-hidden="true"` |
| Keyboard access | Enter key on any input must trigger the primary calculate action |
| Focus management | After validation error, move focus to the first invalid input |
| ARIA roles | FAQ answers must have `role="region"`. Icon-only buttons must have `aria-label`. |

### ARIA Pattern: FAQ Accordion

```html
<button class="tool-faq-question" aria-expanded="false" aria-controls="faq-a1">
  [Question]
</button>
<div class="tool-faq-answer" id="faq-a1" role="region">
  [Answer]
</div>
```

`faq-accordion.js` manages `aria-expanded` toggling automatically.

---

## 5. Mobile Standards

| Rule | Detail |
|---|---|
| Minimum viewport | Must render correctly at **320px** width |
| Input widths | Use `width: 100%` — no fixed pixel widths on inputs |
| Touch targets | Buttons and interactive elements: minimum **44px** height |
| Overflow | No horizontal scrollbar at any standard viewport width |
| Text wrapping | All text containers must allow `overflow-wrap: break-word` |
| Breakpoints | Use `768px` (tablet) and `480px` (mobile) consistently |
| Fluid layout | Prefer `%`, `ch`, `rem` over `px` for widths |

Test at 320px, 375px, and 768px before marking a tool complete.

---

## 6. JavaScript Standards

### Structure
Every tool script must follow this pattern:

```
1. Immediately-invoked function expression (IIFE) — no global leakage
2. 'use strict'
3. DOM references — cached at top, not inside handlers
4. validate() — pure input check, returns boolean
5. calculate() — pure logic, returns result object
6. render(data) — DOM writes only, no logic
7. Event listeners — click and Enter key
8. P50ToolBase.renderRelatedTools() call
```

### Rules
- Do not attach anything to `window` or `document` beyond event listeners.
- Do not fetch data directly — use `P50ToolBase` helpers.
- Do not use `innerHTML` with unescaped user input — use `P50Utils.escHtml()`.
- Do not use `localStorage` directly — use `P50Storage`.
- Validate before calculating. Never run `calculate()` on invalid input.

---

## 7. CSS Standards

### What Goes in [tool-slug].css
Only styles that do not exist in `tool.css`. When in doubt, check `tool.css` first.

Appropriate additions:
- Custom result visualisations unique to this tool.
- Tool-specific layout variants not in the shared system.
- Colour states for result categories (e.g. BMI ranges, risk levels).

### Rules
- Use CSS custom properties from `variables.css` for colours and spacing.
- Do not re-declare classes already defined in `tool.css`.
- Include a responsive breakpoint block at `768px` and `480px` if adding new layout.
- Name classes with a tool-specific prefix (e.g. `.bmi-scale`, `.emi-chart`).

---

## 8. Validation and Error States

Every tool must handle invalid or missing input gracefully:

- Do not run the calculation if inputs are invalid.
- Move focus to the first invalid input.
- Show an inline error message (use `.tool-field--error` pattern or equivalent).
- Never display `NaN`, `Infinity`, or empty strings in the result card.
- Keep the result card `hidden` until a valid calculation has been performed.

---

## 9. Related Tools

Every tool must render related tools using `P50ToolBase`:

```js
P50ToolBase.renderRelatedTools(
  'tool-related-grid',  // id of the container in HTML
  '[tool-slug]',        // current tool — excluded from results
  '[category-id]'       // prefer same-category tools
);
```

The HTML container must exist:

```html
<section class="tool-related" aria-labelledby="[tool-slug]-related-heading">
  <h2 class="tool-related-title" id="[tool-slug]-related-heading">Related Tools</h2>
  <div class="tool-related-grid" id="tool-related-grid"
       data-tool-id="[tool-slug]" data-category-id="[category-id]"></div>
</section>
```

---

## 10. tools.json Registration

Every tool must have an entry in `data/tools.json` under `allTools`. The standard format is:

```json
{
  "id": "[tool-slug]",
  "name": "[Tool Name]",
  "description": "[1–2 sentence description for cards and search]",
  "icon": "[emoji]",
  "category": "[category-id]",
  "tags": ["[tag1]", "[tag2]", "[tag3]"],
  "popular": false,
  "link": "/tools/[tool-slug]/"
}
```

**Required fields** — all eight fields must be present. Do not add new top-level fields without updating this standard and the renderers that consume the data.

**`popular: true`** — only for tools that also appear in `popularTools`. If setting `popular: true`, add the corresponding entry to `popularTools` with the extended format (includes `shortName`, `categoryId`).

---

## 11. Privacy

Project 50 tools are 100% client-side. No tool may:

- Send user input to an external server.
- Set cookies for analytics or tracking within tool logic.
- Request permissions (camera, microphone, location) without explicit user action.

The privacy FAQ item in every tool's FAQ section confirms this.

---

## Quick Reference — Shared CSS Classes

| Class | Provided by | Purpose |
|---|---|---|
| `.tool-wrap` | `tool.css` | Page content wrapper |
| `.tool-wrap--wide` | `tool.css` | Wider variant for grids |
| `.tool-header` | `tool.css` | Icon + title row |
| `.tool-form` | `tool.css` | Form card |
| `.tool-field` | `tool.css` | Label + input pair |
| `.tool-input` | `tool.css` | Text/number input |
| `.tool-select` | `tool.css` | Select element |
| `.tool-result` | `tool.css` | Result card |
| `.tool-stat-grid` | `tool.css` | 3-col stat layout |
| `.tool-range` | `tool.css` | Range slider |
| `.tool-seo-sections` | `tool.css` | SEO content wrapper |
| `.tool-faq-list` | `tool.css` | FAQ accordion wrapper |
| `.tool-related-grid` | `tool.css` | Related tools grid |
| `.btn.btn-primary.btn-lg` | `buttons.css` | Primary action button |
