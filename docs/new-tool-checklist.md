# New Tool Checklist — Project 50

Step-by-step guide for creating a new Project 50 tool.
Estimated time: **10–20 minutes** from copy to live-ready.

---

## Before You Start

- Know your tool's **slug** (e.g. `word-counter`) — lowercase, hyphens only.
- Know your tool's **category** and **category ID** from `data/tools.json`.
- Have your tool's emoji icon ready.
- Understand the calculation or logic the tool performs.

---

## Step 1 — Copy the Template

```bash
cp -r tools/_template tools/[tool-slug]
```

You should now have:

```
tools/[tool-slug]/
  index.html
  tool-name.css
  tool-name.js
```

---

## Step 2 — Rename Files

Rename `tool-name.css` and `tool-name.js` to match your slug:

```bash
mv tools/[tool-slug]/tool-name.css tools/[tool-slug]/[tool-slug].css
mv tools/[tool-slug]/tool-name.js  tools/[tool-slug]/[tool-slug].js
```

---

## Step 3 — Update index.html Metadata

Open `tools/[tool-slug]/index.html`. Find and replace every `[BRACKETED]` placeholder:

| Placeholder | Replace with |
|---|---|
| `[TOOL NAME]` | Human-readable name, e.g. `Word Counter` |
| `[tool-slug]` | URL slug, e.g. `word-counter` |
| `[category-slug]` | Category URL slug, e.g. `utility` |
| `[CATEGORY NAME]` | Category display name, e.g. `Utility Tools` |
| `[category-id]` | Category ID from tools.json, e.g. `utility-tools` |
| `[emoji]` | Tool emoji icon, e.g. `📝` |
| `[SEO description]` | 120–155 char meta description |
| `[OG description]` | Max 160 char Open Graph description |
| `[Twitter description]` | Max 120 char Twitter description |
| `applicationCategory` | Pick from: `HealthApplication`, `EducationApplication`, `FinanceApplication`, `UtilitiesApplication` |

**Tool colour** — set `--tool-color` in the `.tool-icon` style attribute:

| Category | Colour |
|---|---|
| Health & Fitness | `#10b981` |
| Student Tools | `#3b82f6` |
| Finance Tools | `#8b5cf6` |
| Utility Tools | `#f59e0b` |
| Creator Tools | `#ec4899` |

---

## Step 4 — Update Structured Data (Schema)

In the two `<script type="application/ld+json">` blocks:

- **SoftwareApplication schema** — set `name`, `url`, `applicationCategory`, `description`.
- **BreadcrumbList schema** — set category name/item (position 2) and tool name/item (position 3).

---

## Step 5 — Update the CSS Reference

In `index.html`, update the tool CSS link (line 9 of the CSS block):

```html
<link rel="stylesheet" href="[tool-slug].css">
```

---

## Step 6 — Update the JS Reference

In `index.html`, update the tool script tag (second-to-last script):

```html
<script src="[tool-slug].js" defer></script>
```

---

## Step 7 — Build the Form

In the `<div class="tool-form">` section:

- Add input fields using `.tool-field` + `.tool-field-label` + `.tool-input`.
- Each `<input>` must have a matching `<label for="...">`.
- Use `aria-describedby` to link hint text to its input.
- Update the button `id` and label text.

See `tools/bmi-calculator/index.html` for a real two-input example.  
See `tools/emi-calculator/index.html` for a slider-based example.

---

## Step 8 — Build the Result Card

In the `<div class="tool-result">` section:

- Set the `id` on the wrapper div.
- Update `tool-result-label`, `tool-result-number`, `tool-result-status` IDs and labels.
- Add a `.tool-note` disclaimer sentence.
- The card starts `hidden` — JS removes this attribute to reveal it.

---

## Step 9 — Write Tool Logic ([tool-slug].js)

In your tool's `.js` file, implement:

1. **DOM references** — cache all elements at the top.
2. **`validate()`** — check inputs, return `true`/`false`.
3. **`calculate()`** — pure logic, return a result object.
4. **`render(data)`** — write to DOM, call `resultEl.removeAttribute('hidden')`.
5. **Event listeners** — click on button, Enter on inputs.
6. **`P50ToolBase.renderRelatedTools(...)`** — call with your tool ID and category ID.

See `tools/bmi-calculator/bmi.js` for a complete example.

---

## Step 10 — Write SEO Content Sections

In `index.html`, fill in the three SEO sections:

**About This Tool**
- 2–3 sentences explaining what the tool does and why it's useful.
- Include 2–3 primary keywords naturally.
- If the tool uses a formula, mention it briefly.

**How To Use**
- 3–5 numbered steps describing the user flow.
- Bold the button label in step 3.

**FAQ**
- 3 questions minimum. The last one ("Does this tool store my data?") is pre-filled — keep it.
- Use natural-language questions matching real search queries.
- 2–4 sentence answers.

Update all `[tool-slug]` placeholders in the heading IDs and FAQ `aria-controls`/`id` pairs.

---

## Step 11 — Write Tool-Specific CSS ([tool-slug].css)

Only add styles for components that **don't exist in `tool.css`**.

Common additions:
- Custom result visualisations (scales, dials, colour bands).
- Tool-specific widget layouts (unit toggles, comparison grids).
- Colour states for result categories.

Do **not** re-declare anything already in `tool.css` (see the comment block at the top of the CSS template).

---

## Step 12 — Register in tools.json

Add your tool to **two** places in `data/tools.json`:

**`allTools` array** (required for search and related tools):

```json
{
  "id": "[tool-slug]",
  "name": "[Tool Name]",
  "description": "[1–2 sentence description for cards and search results]",
  "icon": "[emoji]",
  "category": "[category-id]",
  "tags": ["[tag1]", "[tag2]", "[tag3]"],
  "popular": false,
  "link": "/tools/[tool-slug]/"
}
```

**`popularTools` array** (only if this is a featured tool):

```json
{
  "id": "[tool-slug]",
  "name": "[Action-oriented headline, e.g. 'Count Words Instantly']",
  "shortName": "[Tool Name]",
  "description": "[Short benefit description for homepage hero]",
  "icon": "[emoji]",
  "category": "[Category Display Name]",
  "categoryId": "[category-id]",
  "tags": ["[tag1]", "[tag2]", "[tag3]"],
  "link": "/tools/[tool-slug]/"
}
```

---

## Step 13 — Test Mobile

Open DevTools → device toolbar. Test at:
- **320px** — minimum supported width
- **375px** — iPhone SE
- **768px** — tablet portrait

Check:
- [ ] No horizontal overflow
- [ ] Inputs full-width on mobile
- [ ] Button easily tappable (min 44px height)
- [ ] Result card readable
- [ ] SEO sections stack correctly

---

## Step 14 — Verify SEO

Check these before marking the tool done:

- [ ] `<title>` contains tool name and "Project 50"
- [ ] `<meta name="description">` is 120–155 chars
- [ ] `<link rel="canonical">` has correct URL
- [ ] Both `<script type="application/ld+json">` blocks are filled
- [ ] OG and Twitter tags are filled
- [ ] Breadcrumb nav reflects the correct category and tool name
- [ ] SEO sections (About / How To Use / FAQ) have real content
- [ ] FAQ accordion works (click to expand/collapse)

---

## Step 15 — Update sitemap.xml (if applicable)

If the project uses a static `sitemap.xml`, add an entry for the new tool.

---

## Done ✅

Your tool is live-ready. The following are automatic (no action needed):
- Header, footer, sidebar — injected by `partials.js`
- Theme (dark/light) — handled by `theme.js`
- Search indexing — handled by `search.js` reading `tools.json`
- Related tools — rendered by `P50ToolBase.renderRelatedTools()`
- FAQ accordion — activated by `faq-accordion.js`
- Fade-in animations — triggered by `animations.js`
