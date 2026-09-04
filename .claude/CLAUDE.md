# CLAUDE.md — Project 50 Project Memory

> Read this first. Do not re-audit the entire project. Only open files relevant to the current task.

---

## 1. Project Overview

**Project 50** is a browser-native multi-tool platform: 50 free, no-signup, client-side tools across 5 categories. No backend, no accounts, no data leaves the device.

- **URL:** https://project50.tools
- **Philosophy:** Fast, private, formula-accurate, mobile-first. Every tool is a standalone HTML/CSS/JS page.
- **Target:** 10 tools × 5 categories = 50 tools total.

---

## 2. Tech Stack & Structure

- **Stack:** Vanilla HTML + CSS (custom token system) + JavaScript (ES5 IIFEs). No framework, no build step.
- **Fonts:** Syne (display), DM Sans (body), JetBrains Mono (mono)
- **Icons:** `P50Icons` — Lucide-style stroke SVGs, no emoji, no images

**Key paths:**
- `data/tools.json` — single source of truth for all tools and categories
- `tools/_template/` — copy this to start every new tool
- `tools/[slug]/` — each tool: `index.html`, `[slug].css`, `[slug].js`
- `tools/[category-slug]/` — category landing pages
- `scripts/` — all shared JS globals (utils, storage, renderers, icons, search, partials, theme, animations)
- `styles/variables.css` — all design tokens | `styles/tool.css` — shared tool page infrastructure
- `.claude/new-tool-checklist.md` — mandatory pre-release checklist (phase-based). An older, superseded 15-step draft (emoji icons, 3 SEO sections) has been moved to `docs/_deprecated/new-tool-checklist.md` — do not follow it; it predates the current icon and SEO-section standards below.

---

## 3. Core Architecture

### tools.json — Single Source of Truth
Three sections: `categories[]`, `popularTools[]` (homepage hero), `allTools[]` (search + related tools).  
Each tool entry: `id`, `name`, `description`, `icon` (key string), `category` (category-id), `tags[]`, `popular`, `link`.  
**Never hardcode tool data. Always fetch from `/data/tools.json`.**

### Shared Global Systems
| Global | File | Purpose |
|---|---|---|
| `P50Utils` | `utils.js` | `escHtml()`, `fetchData()` (root-relative) |
| `P50Storage` | `storage.js` | `get(key, fallback)`, `set(key, value)`, `remove(key)` |
| `P50Renderers` | `renderers.js` | `toolCard(tool, variant)`, `relatedToolCard(tool)` |
| `P50Icons` | `icons/icons.js` | `svg(key, size, className)` → SVG string |
| `P50IconMap` | `icons/icon-map.js` | `forTool(id)`, `forCat(id)` → icon key |
| `P50Categories` | `config/categories.js` | Runtime category metadata by id |
| `P50ToolBase` | `tool-base.js` | Footer year, animation hook, related tools helper |

### Storage Pattern
- Key prefix: `p50_[tool-slug]` (e.g. `p50_macro_calculator`)
- Autosave: 300ms debounce on every input/select change — inputs only, never results
- Restore: called once on page load before user interaction
- Reset: clears timer + removes key + clears all fields

### Related Tools Architecture
- Each tool fetches `/data/tools.json`, filters by same category, excludes self, max 4
- Always include a hardcoded fallback array (shown only if fetch fails)
- Rendered via `P50Renderers.relatedToolCard()` or manual fallback HTML
- Container: `<div class="tool-related" id="[tool]-related-tools" style="--tool-related-color:[cat-color]">`
- **Placement after calculation:** DOM-repositioned to sit above `.tool-seo-sections`
- **On reset:** moved back inside `.tool-wrap`

### Script & CSS Load Order (fixed — do not reorder)
**JS:** utils → icons → icon-map → categories → storage → renderers → partials → theme → tool-base → [tool].js → faq-accordion  
**CSS:** reset → variables → style → buttons → header → sidebar → footer → tool → [tool-slug].css

---

## 4. UI/UX Design System

**Primary benchmark: Macro Calculator** (`tools/macro-calculator/`). When uncertain, copy its structure exactly — **except SEO section count**: Macro Calculator predates the current 8-section SEO standard (see SEO Section Rules below) and should not be copied for that part.

### Category Colors
| Category | Color |
|---|---|
| Health & Fitness | `#10b981` |
| Student Tools | `#3b82f6` |
| Utility Tools | `#f59e0b` |
| Finance Tools | `#8b5cf6` |
| Creator Tools | `#ec4899` |

### Page Structure (every tool)
1. Breadcrumb (`tool-breadcrumb`) → Home › Category › Tool
2. Tool header: colored icon circle (`.tool-icon`, `--tool-color`) + `<h1>` + subtitle
3. Form (`.tool-form`): inputs with `.tool-field` + `.tool-field-label` + `.tool-input` + `.tool-field-hint`
4. Validate/Calculate button (`.btn.btn-primary.btn-lg`) + Reset (`.btn.btn-secondary.btn-lg`)
5. Results: multiple `.macro-section-card` blocks, hidden until calculated
6. Related tools grid (2-col, same category)
7. SEO sections: 8 required informational sections + FAQ accordion (see SEO Section Rules below)

### Result Card Rules
- Summary/quick-answer card always comes **first**
- Each card has `.macro-section-title` with inline SVG icon + heading
- 3-value range grids (min / recommended / optimal) use `.macro-range-card`; highlight recommended with `.macro-range-card--highlight`
- Stat rows (BMR/TDEE/adjustment) use `.tool-stat-grid` (3-col)
- Every result card must provide **unique value** — no duplicate information across cards

### Form Rules
- Selects use `.macro-select-wrap` + custom SVG chevron — never native `<select>` arrow
- Unit toggles: inline select beside the label (`.macro-unit-label-row`)
- Height: cm ↔ ft+in (two inputs for imperial). Weight: kg ↔ lbs. Store `dataset.prevUnit`.
- Internal calculation always in metric — convert on input, not output
- Validation: single `<div role="alert" aria-live="assertive" hidden>`, show only first error
- Prevent wheel scroll on all number inputs

### SEO Section Rules
> Verified against the repository (Sept 2026): the original Health & Fitness and Finance tools (BMI, Macro, EMI, and the rest of that early June 2026 batch) were built with 3 sections (About, How To Use, FAQ). Every Student Tools category tool built since (SGPA, CGPA, Attendance, Marks %, Grade/Required Marks, CGPA↔% Converter, Study Hours & Exam Planner) — the most recent work in the project — implements **8 required informational sections plus FAQ**, and labels this explicitly in its own HTML (`<!-- SEO SECTIONS — 8 required sections -->`). Treat 8 sections + FAQ as the current standard for new tools; the 3-section pattern is superseded.

- **Current standard — 8 sections + FAQ** (see `tool-standards.md` §24 for the canonical list and adapt section 5–6 to the tool's domain):
  1. What Is [Tool Name]?
  2. How Does/Is [Tool Name] Calculated/Work?
  3. How To Use This Calculator
  4. Understanding Your Results
  5. A domain-specific section (e.g. "Grade Scales", "Attendance Rules")
  6. A second domain-specific section (e.g. "Factors That Affect Results", "Tips")
  7. Common Mistakes (& Tips)
  8. FAQ
- Last FAQ item is always "Does this tool store my data?" — keep it, pre-filled
- FAQ uses `.tool-faq-item` / `.tool-faq-question` / `.tool-faq-answer` — activated by `faq-accordion.js`

---

## 5. Project50 UI Rules

- **Macro Calculator is the primary benchmark.** All new tools copy its multi-card result architecture.
- **Water Intake Calculator now follows Macro architecture** — use it as a secondary reference for single-metric tools.
- **Every result card must provide unique value.** Do not repeat the same number in two cards.
- **Avoid duplicate information.** If a value appears in the summary card, do not show it again lower.
- **Related Tools placement order:** Form → Results → Related Tools → SEO Sections.
- Tool-specific CSS must only style elements that don't exist in `tool.css`. Never re-declare shared classes.
- Never invent new card containers. Use `.macro-section-card` for all result blocks.

---

## 6. Current Project State

> Verified against `data/tools.json` and the actual `tools/` directory. Last reconciled: documentation-consistency pass, Sept 2026.

### Health & Fitness — 10/10 built (category complete)
- ✅ BMI Calculator
- ✅ Daily Calorie Planner
- ✅ Body Fat Calculator
- ✅ Macro Calculator ← primary UI benchmark
- ✅ Water Intake Calculator
- ✅ Calorie Burn Calculator
- ✅ Ideal Weight Calculator
- ✅ TDEE Calculator
- ✅ Protein Calculator
- ✅ Target Weight Timeline Calculator

### Student Tools — 7/10 built
- ✅ SGPA Calculator
- ✅ CGPA Calculator
- ✅ Attendance Calculator
- ✅ Marks Percentage Calculator
- ✅ Grade & Required Marks Calculator
- ✅ CGPA & Percentage Converter
- ✅ Study Hours & Exam Planner
- 3 more student tools remain to reach the category's planned `toolCount` of 10; none are registered in `tools.json` yet.

### Finance Tools — 1/10 built
- ✅ EMI Calculator
- 9 more finance tools remain to reach the category's planned `toolCount` of 10; none are registered in `tools.json` yet.

### Utility Tools — 0/10 built
- ⚠️ **Password Generator** — registered in `data/tools.json` (`allTools`, `popular: true`) but no `tools/password-generator/` directory exists. Treat as a planned/reserved slot, not a shipped tool, until a folder exists.
- 9 more utility tools remain unregistered and unbuilt.

### Creator Tools — 0/10 built
- ⚠️ **Color Palette Generator** (`id: color-palette`) — registered in `data/tools.json` (`allTools`, `popular: true`) but no matching `tools/` directory exists. Treat as a planned/reserved slot, not a shipped tool, until a folder exists.
- 9 more creator tools remain unregistered and unbuilt.

### Known data inconsistency (unresolved — do not silently fix)
Password Generator and Color Palette Generator are marked `popular: true` in `allTools` but, unlike every other `popular: true` tool, have no matching entry in the separate `popularTools` array. This is consistent with early roadmap placeholders rather than proof the registrations are wrong, but it should be confirmed with the project owner before either building them out or removing the entries.

---

## 7. Project50 Tool Workflow

1. **Market Gap Analysis** — Is this tool missing from the category? Does it have search demand?
2. **Formula Audit** — Identify the scientific formula(s). Document them at the top of the JS file.
3. **Feature Planning** — What inputs are required? What optional fields add precision?
4. **UX Planning** — How many result cards? Which is the "quick answer" card? What contextual info earns its place?
5. **Results Architecture** — Define every result card before writing HTML: title, data shape, layout type (stat grid / range grid / table / schedule).
6. **Technical Architecture** — Define DOM IDs, storage key, unit conversion needs, validation rules.
7. **Integration Planning** — Register in `tools.json` (`allTools[]` + `popularTools[]` if featured). Add to `P50IconMap` if new icon needed.
8. **Implementation** — Copy `tools/_template/`, rename files, replace all `[BRACKETED]` placeholders, implement logic, write SEO content, test at 320/375/768px, verify SEO checklist in `.claude/new-tool-checklist.md`.

---

## 8. NEVER / ALWAYS Rules

**NEVER:**
- Invent a new design system — use `tool.css`, `variables.css`, and `.macro-section-card`
- Hardcode related tools — always fetch `tools.json` with a fallback array
- Use emoji as icons — use `P50Icons.svg()` with Lucide key strings
- Create tools not registered in `tools.json`
- Cross category boundaries in related tools
- Re-declare classes already in `tool.css`
- Use the native `<select>` arrow — always use `.macro-select-wrap` + SVG chevron
- Run calculations server-side

**ALWAYS:**
- Follow Macro Calculator structure for UI and result cards
- Use `P50Storage` for all localStorage access — never call `localStorage` directly
- Load scripts and CSS in the canonical order (fixed)
- Set `--tool-color` on `.tool-icon` and `--tool-related-color` on `.tool-related`
- Include aria attributes: `role="alert"` on validation, `aria-live="polite"` on results
- Register new tools in `tools.json` before implementing
- Include all 8 required SEO sections plus FAQ on every new tool page (see §4 SEO Section Rules) — do not copy Macro Calculator's 3-section pattern for new tools; it predates this standard

---

## 9. Instructions For Future Claude Sessions

- **Read this file first. Do not re-audit the entire project unless explicitly asked.**
- Only open files relevant to the current task. For a new health tool: read `tools/macro-calculator/` + `data/tools.json` — nothing else unless needed.
- Reuse existing globals: `P50Storage`, `P50Renderers`, `P50ToolBase`, `P50Icons`, `P50Categories`.
- All new tools must match Macro Calculator for UI, result card structure, autosave, validation, and related tools.
- `tools.json` must be updated before or alongside any new tool — search, related tools, and category pages all depend on it.
- If unsure about any design decision: open `tools/macro-calculator/index.html` and copy the pattern.

---

## 10. Health Category Standards (Permanent — All Health Tools Must Follow)

> Established June 2026. Source of truth for all Health & Fitness category tools.
> Do NOT override these in tool-specific logic.

### BMR
Mifflin-St Jeor only. No substitutions.
- Male:   `10×W(kg) + 6.25×H(cm) − 5×A + 5`
- Female: `10×W(kg) + 6.25×H(cm) − 5×A − 161`

### Activity Levels (use exact labels and multiplier values everywhere)
| # | Label | TDEE Multiplier |
|---|---|---|
| 1 | Sedentary | 1.20 |
| 2 | Lightly Active | 1.375 |
| 3 | Moderately Active | 1.55 |
| 4 | Very Active | 1.725 |
| 5 | Athlete | 1.90 |

"Extra Active" is retired. Never use it.

### Calorie Adjustments
- Lose Fat:        TDEE − 500 kcal
- Maintain Weight: TDEE ± 0
- Build Muscle:    TDEE + 300 kcal

### Weight Change Constant
7700 kcal = 1 kg (all tools, no exceptions)

### Calorie Floor (source of truth: TDEE Calculator)
- Male floor:   1500 kcal
- Female floor: 1200 kcal
- Applies only to deficit (lose) goals
- Must clamp the output AND show a visible warning element (`role="alert"`)
- Never silent — no silent Math.max adjustments without a user-facing message

### Canonical Goals
| Key | Label |
|---|---|
| `lose` | Lose Fat |
| `maintain` | Maintain Weight |
| `build` | Build Muscle |

TDEE Calculator may extend with `aggressive` (Aggressive Fat Loss), `lean` (Lean Muscle Gain), `gain` (Weight Gain) as advanced tiers only.

### Protein Standard (source of truth: Protein Calculator)
Base rates (g/kg bodyweight, rec tier shown — min is −0.3, opt is +0.3):
| Goal | Min | Rec | Opt |
|---|---|---|---|
| Lose Fat (`lose`) | 1.6 | 1.9 | 2.2 |
| Maintain Weight (`maintain`) | 1.2 | 1.4 | 1.6 |
| Build Muscle (`build`) | 1.8 | 2.1 | 2.4 |

Activity bonus — add to all tiers:
| Activity | Bonus (g/kg) |
|---|---|
| Sedentary (1.20) | +0.0 |
| Lightly Active (1.375) | +0.1 |
| Moderately Active (1.55) | +0.2 |
| Very Active (1.725) | +0.3 |
| Athlete (1.90) | +0.4 |

If BF% is known, use lean body mass as the weight basis (not total bodyweight).
Tools showing a single protein value (e.g. Calorie Planner) use the `rec` tier.

### Fat Standard
Fat targets (g/kg bodyweight, goal-independent):
- Min: 0.6 g/kg
- Rec: 0.8 g/kg
- Upper: 1.0 g/kg

### Validation Ranges (all health tools)
| Field | Min | Max |
|---|---|---|
| Age | 15 | 100 |
| Height (cm) | 100 | 250 |
| Weight (kg) | 20 | 300 |
| Weight (lbs) | 44 | 661 |
| Body Fat % | 3 | 60 |
