# Project 50 Tool Standards

> **Version:** 1.0
> **Status:** Active Standard
> **Applies To:** Every Project 50 tool, shared system, category page, and future feature.

---

# Table of Contents

1. Purpose
2. Project Philosophy
3. Engineering Principles
4. Project Priorities
5. Technology Stack
6. Browser Support
7. Project Architecture
8. Tool Architecture
9. File & Folder Standards
10. Coding Standards
11. HTML Standards
12. CSS Standards
13. JavaScript Standards
14. Shared Systems
15. Validation Standards
16. Storage Standards
17. Result Rendering Standards
18. Related Tools Standards
19. SEO Standards
20. Accessibility Standards
21. Performance Standards
22. Integration Standards
23. Testing Standards
24. Release Standards
25. Change Management
26. Lessons Learned
27. Golden Rules

---

# 1. Purpose

This document defines the engineering standards for every tool developed under Project 50.

Its purpose is to ensure that every calculator and utility:

* behaves consistently
* shares a common architecture
* provides a consistent user experience
* remains maintainable as the project grows
* can be safely extended without introducing technical debt

This document is the primary technical reference for all Project 50 development.

If a conflict exists between implementation and this document, this document takes precedence unless a newer approved standard supersedes it.

---

# 2. Project Philosophy

Project 50 is **not** simply a collection of calculators.

It is a unified product consisting of 50 browser-native tools that should feel like one cohesive application.

Users should never feel like each tool was built independently.

Every tool should share:

* visual language
* interaction patterns
* architecture
* terminology
* navigation
* validation behaviour
* accessibility behaviour
* overall quality

Consistency is considered a feature.

---

## Core Objectives

Project 50 exists to create tools that are:

* genuinely useful
* easy to understand
* extremely fast
* mobile-first
* SEO friendly
* maintainable for years
* trustworthy

Every engineering decision should support these objectives.

---

# 3. Engineering Principles

Every implementation must follow these principles.

## 3.1 Correctness Before Everything

A beautiful calculator with incorrect results has no value.

Before writing code:

1. Verify formulas.
2. Verify assumptions.
3. Verify units.
4. Verify edge cases.

Implementation begins only after correctness has been established.

---

## 3.2 User Experience Over Clever Code

The simplest experience for users is preferred over the most technically clever implementation.

Users should never need documentation to understand how to use a tool.

---

## 3.3 Consistency Over Creativity

Project 50 values consistency more than novelty.

If two solutions are equally good, always choose the one that matches existing Project 50 patterns.

Do not redesign established UI or interaction patterns without approval.

---

## 3.4 Maintainability Over Shortcuts

Project 50 contains 50 tools.

Code that is easy to maintain is preferred over code that is merely shorter.

Avoid duplication when a shared system already exists.

Avoid unnecessary abstraction when it only benefits a single tool.

---

## 3.5 Progressive Enhancement

Every tool should provide value even before JavaScript executes.

The page should:

* explain the concept
* contain meaningful content
* remain crawlable
* remain accessible

JavaScript enhances the experience—it should not be the only way to understand the page.

---

## 3.6 Evidence Before Implementation

Every feature must follow this sequence:

```text
Research
↓
Formula Verification
↓
Edge Case Analysis
↓
UX Planning
↓
Implementation
↓
Testing
↓
Release
```

Never begin implementation based on assumptions.

---

# 4. Project Priorities

All engineering decisions should follow this order.

## Priority 1 — Correctness

Calculations must always be accurate.

Never compromise correctness for convenience.

---

## Priority 2 — User Experience

Interfaces should be:

* intuitive
* forgiving
* responsive
* readable

Users should immediately understand what to do.

---

## Priority 3 — Consistency

Every tool should feel like part of the same product.

Consistency applies to:

* UI
* UX
* terminology
* layouts
* interactions
* validation
* messaging

---

## Priority 4 — Maintainability

The project should remain easy to update even after all 50 tools have been completed.

Shared systems should be reused whenever appropriate.

---

## Priority 5 — Accessibility

Accessibility is part of quality—not an optional enhancement.

All users should be able to use Project 50 tools effectively.

---

## Priority 6 — Performance

Project 50 should remain lightweight and fast.

Avoid unnecessary JavaScript, CSS, and rendering work.

---

## Priority 7 — SEO

SEO is important because Project 50 depends on organic traffic.

However, SEO should never reduce usability or correctness.

Useful content is preferred over keyword stuffing.

---

## Priority 8 — Clean Code

Readable, well-organized code is expected.

However, clean code should naturally result from following the priorities above—not replace them.

---

# 5. Technology Stack

Project 50 intentionally uses a minimal technology stack.

## Frontend

* HTML5
* Vanilla CSS
* Modern JavaScript (ES6+)

Frameworks are intentionally avoided.

---

## Not Allowed

The following technologies must not be introduced without explicit approval:

* React
* Vue
* Angular
* Svelte
* Bootstrap
* Tailwind CSS
* Bulma
* Foundation
* jQuery

The project's own shared systems should be used instead.

---

## JavaScript Philosophy

Modern JavaScript should improve readability—not complexity.

Preferred features include:

* `const`
* `let`
* arrow functions
* template literals
* destructuring
* array methods
* default parameters

Optional chaining and nullish coalescing may be used where they clearly improve readability.

Avoid using modern syntax solely because it is new.

Readable code is always preferred.

---

# 6. Browser Support

Project 50 officially supports modern evergreen browsers.

Supported:

* Latest Google Chrome
* Latest Microsoft Edge
* Latest Mozilla Firefox
* Latest Apple Safari

Not Supported:

* Internet Explorer
* Legacy Microsoft Edge
* Outdated Android browsers
* Unsupported legacy browsers

No engineering effort should be spent supporting obsolete browsers.

---

# 7. Performance Targets

Every tool should strive to achieve:

| Metric                 | Target |
| ---------------------- | ------ |
| Lighthouse Performance | 95+    |
| Accessibility          | 100    |
| Best Practices         | 100    |
| SEO                    | 100    |

These are targets, not guarantees.

If trade-offs are required, they should always favour correctness and user experience over synthetic benchmark scores.

---

# 8. Project Architecture

Project 50 follows a shared architecture.

Every tool should reuse existing infrastructure whenever possible.

Core principles:

* Single source of truth
* Reusable shared systems
* Minimal duplication
* Modular structure
* Predictable organization

Do not introduce alternative architectures for individual tools unless there is a compelling engineering reason.

---

> **End of Part 1**
>
> The next part covers:
>
> * Tool Architecture
> * File & Folder Standards
> * HTML Standards
> * CSS Standards
> * JavaScript Standards
> * Naming Conventions
> * Code Style Rules

# 9. Tool Architecture

Every Project 50 tool must follow the same architectural pattern.

A predictable architecture improves:

* maintainability
* debugging
* onboarding
* consistency
* scalability

No tool should invent its own architecture.

---

## Standard Tool Structure

Every tool lives inside its own folder.

Example:

```text
tools/
└── bmi-calculator/
    ├── index.html
    ├── bmi.css
    └── bmi.js
```

Unless there is a compelling engineering reason, no additional files should be created.

---

## Standard Page Structure

Every tool page should follow the same structure.

```text
Header

↓

Breadcrumb

↓

Tool Header

↓

Calculator Card

↓

Results

↓

Related Tools

↓

SEO Content

↓

FAQ

↓

Footer
```

Users should immediately recognize the Project 50 layout regardless of the tool they open.

---

## Tool Lifecycle

Every calculator should follow this flow.

```text
Load

↓

Restore Inputs

↓

Render Initial State

↓

User Input

↓

Validation

↓

Calculation

↓

Render Results

↓

Persist Inputs
```

Results should always be derived from the current state.

Never calculate directly from scattered DOM values.

---

# 10. File & Folder Standards

Project 50 follows a predictable folder structure.

## Root Structure

```text
assets/
components/
data/
docs/
pages/
scripts/
styles/
tools/
```

Do not create unnecessary top-level folders.

---

## Tool Files

Each tool must contain:

```text
index.html
tool-name.css
tool-name.js
```

Examples:

```text
bmi.css
cgpa.css
attendance.css
```

Avoid generic names such as:

```text
style.css
script.js
main.js
```

inside tool folders.

---

## Shared Files

Reusable logic belongs inside shared systems.

Examples:

```text
scripts/

P50Storage
P50Utils
P50Renderers
P50ToolBase
```

Do not duplicate shared functionality inside individual tools.

---

## Documentation

Project documentation belongs only inside:

```text
docs/
```

Do not place documentation inside tool folders.

---

# 11. HTML Standards

HTML should prioritize:

* semantics
* accessibility
* readability
* SEO

---

## Semantic Structure

Use semantic HTML whenever appropriate.

Preferred:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
```

Avoid excessive nesting of generic `<div>` elements.

---

## Headings

Only one:

```html
<h1>
```

per page.

Follow a logical heading hierarchy.

Never skip heading levels without reason.

---

## Forms

Every input must have:

* associated label
* unique id
* appropriate type
* autocomplete where appropriate

Never rely solely on placeholders.

---

## Buttons

Use:

```html
<button>
```

for actions.

Do not use clickable divs or spans.

---

## Images

Every informative image must contain meaningful alt text.

Decorative images should use empty alt attributes.

---

## Tables

Use tables only for tabular data.

Do not use tables for layout.

---

## Metadata

Every page should include:

* title
* meta description
* canonical URL
* Open Graph metadata
* favicon
* structured data when applicable

---

# 12. CSS Standards

Project 50 uses Vanilla CSS.

No CSS framework is permitted.

---

## Mobile First

Every component should be designed for mobile before desktop.

Breakpoints should enhance layouts rather than replace them.

---

## Design Consistency

Every tool must share the same:

* spacing system
* typography scale
* border radius
* shadows
* card styles
* button styles
* input styles

Individual tools must not introduce their own design language.

---

## CSS Organization

Structure styles logically.

Example:

```text
Variables

↓

Base

↓

Layout

↓

Components

↓

Utilities

↓

Responsive
```

---

## Naming

Prefer descriptive class names.

Examples:

```css
.tool-card
.result-summary
.form-grid
.input-error
```

Avoid names such as:

```css
.box1
.item2
.red
.left
```

---

## Reuse

If an existing shared component already exists, use it.

Do not recreate:

* cards
* buttons
* alerts
* form controls
* result layouts

---

## Animations

Animations should be subtle.

Avoid:

* excessive motion
* distracting transitions
* unnecessary effects

Animations should improve usability—not decoration.

---

# 13. JavaScript Standards

Project 50 uses modern Vanilla JavaScript.

---

## Code Style

Prefer:

```javascript
const
let
```

Avoid:

```javascript
var
```

unless required for compatibility.

---

## Naming

Variables:

```javascript
const totalCredits
```

Functions:

```javascript
calculateCGPA()
renderResults()
validateInputs()
```

Constants:

```javascript
const KCAL_PER_KG
```

Names should clearly describe purpose.

---

## Functions

Functions should perform one responsibility.

Avoid functions containing unrelated logic.

---

## State

Every interactive tool should maintain a predictable state object.

Example:

```javascript
const state = {
  semesters: [],
  results: null
};
```

State should be the single source of truth.

---

## Rendering

Prefer:

```text
State

↓

Render UI
```

Avoid:

```text
DOM

↓

Read

↓

Modify

↓

Read Again

↓

Modify Again
```

Repeated DOM queries reduce maintainability.

---

## Error Handling

Every tool must:

* fail gracefully
* preserve user input
* display helpful messages

Never use:

```javascript
alert()
```

for validation.

---

## Comments

Write comments only when they explain intent.

Avoid obvious comments.

Bad:

```javascript
// Increment counter
counter++;
```

Good:

```javascript
// Prevent duplicate semesters from being added
```

---

## Console

Production code should not contain:

```javascript
console.log()
console.debug()
console.table()
```

Temporary debugging code must be removed before release.

---

## Reuse Shared Systems

Before writing new functionality, check whether it already exists.

Examples:

* P50Storage
* P50Renderers
* P50ToolBase
* P50Utils
* P50Icons

Do not duplicate shared logic.

---

# 14. Naming Conventions

Consistency in naming improves readability across all 50 tools.

---

## Files

Use lowercase kebab-case.

Examples:

```text
cgpa-calculator
attendance-calculator
percentage-calculator
```

---

## CSS Classes

Use meaningful, component-based names.

Examples:

```css
.tool-card
.result-card
.summary-grid
.validation-message
```

---

## JavaScript

Variables:

```javascript
totalCredits
averageGPA
currentSemester
```

Functions:

```javascript
calculateResults()
renderSummary()
saveInputs()
restoreInputs()
```

Constants:

```javascript
MAX_SEMESTERS
DEFAULT_GPA_SCALE
```

---

## IDs

Use IDs only when uniqueness is required.

Do not use IDs for styling.

Prefer classes for reusable styling.

---

# 15. Code Quality Rules

Before considering implementation complete, verify:

* No duplicated logic
* No unused CSS
* No unused JavaScript
* No dead HTML
* No commented-out code
* No placeholder text
* No debugging statements
* No hardcoded metadata
* No inconsistent naming
* No unnecessary complexity

Every implementation should leave the project cleaner than it was before.

---

> **End of Part 2**

**Next Part Includes:**

* Shared Systems
* Validation Standards
* Storage Standards
* Result Rendering Standards
* Related Tools Standards
* Integration Standards


# 16. Shared Systems Standards

Project 50 follows a **shared-first architecture**.

Before implementing any feature, always check whether an existing shared system already provides the required functionality.

The goal is to maximize reuse and minimize duplication.

---

## Core Shared Systems

The following shared systems are considered part of the Project 50 core architecture.

### P50Storage

Responsible for:

* Saving user inputs
* Restoring saved inputs
* Clearing saved state
* Debounced persistence

Never access `localStorage` directly inside tools unless absolutely necessary.

---

### P50Renderers

Responsible for rendering reusable UI components.

Examples:

* Related Tools
* Tool Cards
* Empty States
* Shared Result Components

Avoid duplicating rendering logic across tools.

---

### P50ToolBase

Responsible for common tool initialization.

Typical responsibilities:

* Shared initialization
* Breadcrumb setup
* Related Tools loading
* Shared lifecycle helpers

---

### P50Utils

Contains reusable utility functions.

Examples:

* Number helpers
* Math helpers
* DOM helpers
* Unit conversion
* General utilities

Never duplicate utility functions inside individual tools.

---

### P50Icons

Provides access to the project's icon library.

Do not use emojis.

Do not import third-party icon packs inside individual tools.

---

### P50IconMap

Maps tool identifiers to project icons.

All tool icons should be registered through this system.

---

## Future Shared Systems

Future expansion may include:

* P50Validation
* P50Formatters
* P50SEO
* P50Accessibility
* P50Analytics
* P50Theme

These systems should only be introduced when at least **three tools** require the same functionality.

Never create a shared system for a single tool.

---

# 17. Validation Standards

Validation directly affects user trust.

Every tool must validate inputs before calculation.

---

## Validation Philosophy

Validation should:

* prevent invalid calculations
* preserve user input
* clearly explain problems
* recover gracefully

Validation should never frustrate users.

---

## Required Behaviour

Every validation system should:

* validate before calculation
* highlight invalid fields
* display inline messages
* focus the first invalid field
* avoid clearing valid inputs

---

## Invalid Input Examples

Reject:

* Empty values
* Negative values (where invalid)
* Non-numeric input
* Infinite values
* NaN
* Unsupported formats

Tool-specific rules may add additional validation.

---

## Error Messages

Error messages should be:

* concise
* specific
* actionable

Good:

```text
Enter a valid GPA greater than 0.
```

Bad:

```text
Invalid Input.
```

---

## Never Use

Never use:

```javascript
alert()
```

Validation should always be presented inline.

---

# 18. Storage Standards

Project 50 tools should remember user inputs whenever appropriate.

Storage improves user experience but must remain predictable.

---

## Storage Key

Every tool uses:

```text
p50_[tool_slug]
```

Examples:

```text
p50_bmi_calculator
p50_cgpa_calculator
```

---

## What To Store

Store only:

* User inputs
* User preferences (where appropriate)

Do NOT store:

* Calculated results
* Temporary UI state
* Errors
* Notifications

Results should always be recalculated.

---

## Debounce

Saving should use:

```text
300ms debounce
```

to avoid excessive writes.

---

## Restore

When the page loads:

* Restore inputs
* Re-render UI
* Recalculate if appropriate

Users should be able to continue where they left off.

---

## Reset

Reset must:

* Clear inputs
* Clear storage
* Reset UI
* Remove results

---

# 19. Result Rendering Standards

Results are the most important part of every Project 50 tool.

Users should understand results immediately.

---

## Result Hierarchy

Always prioritize the primary answer.

Standard order:

```text
Primary Result

↓

Supporting Summary

↓

Detailed Information

↓

Related Tools

↓

SEO Content
```

The primary answer should never be hidden beneath secondary information.

---

## Result Cards

Result cards should:

* share a common layout
* use consistent spacing
* use the project design system
* avoid unnecessary decoration

Do not invent custom layouts for individual tools.

---

## Precision

Internal calculations should use full precision.

Round only for display.

Never round intermediate calculations.

---

## Empty State

Before calculation:

* Results section should not display misleading values.
* Empty state should be clean and intentional.

---

# 20. Related Tools Standards

Related tools improve discoverability and internal linking.

They should always feel relevant.

---

## Data Source

Related tools must use:

```text
data/tools.json
```

Never hardcode related tools inside individual pages.

---

## Rules

Every related tools section must:

* Use the same category
* Exclude the current tool
* Display a maximum of 4 tools
* Support a fallback strategy

---

## Fallback

Fallback tools should remain within the same category whenever possible.

Do not mix unrelated categories simply to fill empty space.

If insufficient tools exist:

* show available tools only, or
* display a "More tools coming soon" placeholder

Do not recommend irrelevant tools.

---

## Rendering

Use shared renderer:

```text
P50Renderers.relatedToolCard()
```

or the current shared Project 50 rendering helper.

---

# 21. Integration Standards

Every new tool must integrate cleanly into Project 50.

---

## Required Registration

Every tool must be registered in:

* data/tools.json
* scripts/icon-map.js
* sitemap.xml

No other registrations unless necessary.

---

## Metadata

All metadata should originate from:

```text
tools.json
```

Never duplicate metadata across multiple files.

---

## URLs

Use predictable, lowercase, kebab-case URLs.

Example:

```text
/tools/cgpa-calculator/
```

---

## Search

Every tool must become searchable through the Project 50 search system.

No additional search implementation should be required.

---

## Shared Components

Use existing shared systems before creating custom implementations.

Integration should strengthen consistency rather than increase fragmentation.

---

# 22. Performance Standards

Project 50 prioritizes lightweight performance.

---

## General Rules

Avoid:

* unnecessary DOM updates
* repeated DOM queries
* duplicate calculations
* blocking JavaScript
* excessive animations

---

## DOM

Cache DOM references where appropriate.

Avoid querying identical selectors repeatedly.

---

## Rendering

Batch rendering whenever practical.

Avoid layout thrashing.

---

## CSS

Avoid:

* deeply nested selectors
* unnecessary specificity
* duplicated rules

---

## JavaScript

Prefer readable, efficient code.

Premature optimization is discouraged.

Measure performance before optimizing.

---

# 23. Accessibility Standards

Accessibility is mandatory.

---

## Keyboard

Every interactive element must be keyboard accessible.

---

## Labels

Every form control must have an associated label.

---

## Focus

Visible focus indicators must never be removed.

---

## Screen Readers

Use semantic HTML first.

ARIA should supplement semantics—not replace them.

---

## Live Regions

Dynamic results should announce meaningful updates when appropriate.

---

## Colour

Never rely solely on colour to communicate meaning.

---

## Contrast

Meet WCAG 2.2 AA contrast requirements.

---

## Motion

Respect user preferences for reduced motion where applicable.

---

> **End of Part 3**

**Next Part Includes:**

* SEO Standards
* Testing Standards
* QA Standards
* Release Standards
* Change Management
* Lessons Learned
* Golden Rules
* Final Engineering Checklist

# 24. SEO Standards

Project 50 is an SEO-first product.

Every tool should rank because it provides genuine value—not because of keyword stuffing or thin content.

SEO should support users first and search engines second.

---

## SEO Philosophy

Every tool page has two equally important responsibilities:

1. Solve the user's problem immediately through the calculator.
2. Teach the user something valuable through high-quality content.

If the calculator disappeared from the page, the content should still be useful.

This is known as the **Project 50 Golden SEO Rule**.

---

## URL Structure

Use short, descriptive, lowercase URLs.

Good:

```text
/tools/cgpa-calculator/
/tools/bmi-calculator/
/tools/attendance-calculator/
```

Avoid:

```text
/tools/calc1/
/tools/student-tool/
/tools/new-version/
```

---

## Metadata Requirements

Every page must include:

* Unique title
* Unique meta description
* Canonical URL
* Open Graph tags
* Twitter Card tags (if supported)
* Structured data where applicable

---

## Heading Structure

Every page should contain:

```text
H1 (one only)

↓

H2

↓

H3

↓

H4 (only when necessary)
```

Never skip heading levels unnecessarily.

---

## Standard SEO Sections

Every Project 50 tool should contain **8 standard informational sections** below the calculator.

### 1. What Is [Tool Name]?

Explain:

* Meaning
* Definition
* Purpose
* Who should use it

---

### 2. How Does [Tool Name] Work?

Explain:

* Formula
* Inputs
* Outputs
* Logic

---

### 3. How To Use This Calculator

Provide step-by-step instructions.

---

### 4. Understanding Your Results

Explain every result shown by the calculator.

---

### 5. Factors That Affect Results

Discuss the variables that influence calculations.

---

### 6. Benefits of Using This Tool

Explain why users should care about the metric or calculation.

---

### 7. Common Mistakes & Tips

Help users avoid common misunderstandings.

---

### 8. Frequently Asked Questions

Minimum:

* 8 FAQs

Recommended:

* 8–12 FAQs

Final FAQ should always address user privacy when applicable.

---

## SEO Content Quality

Every section should:

* Teach something useful
* Be written for beginners
* Avoid repetition
* Use natural language
* Be factually accurate

Avoid generic filler such as:

> "Health is important."

Prefer tool-specific explanations.

---

## Internal Linking

Related tools should support logical user journeys.

Example:

```text
CGPA Calculator
↓

GPA Calculator

↓

Percentage Calculator

↓

Required Marks Calculator
```

Do not link unrelated tools solely for SEO.

---

## Keyword Usage

Use keywords naturally.

Do not repeat keywords unnecessarily.

Content should be written for humans first.

---

## Content Length

Target:

* 1,500–2,000 words

Minimum:

* 1,200 words

Maximum:

* 2,500 words

Only add more content when it provides additional value.

---

# 25. Testing Standards

Every tool must be tested before release.

Implementation is not complete until testing passes.

---

## Formula Testing

Verify:

* Mathematical correctness
* Industry standards
* Project 50 consistency

Cross-check results using known examples.

---

## Validation Testing

Verify:

* Empty inputs
* Negative values
* Invalid values
* Maximum values
* Decimal values
* Boundary conditions

---

## Functional Testing

Verify every feature works as expected.

Examples:

* Add
* Remove
* Calculate
* Reset
* Restore

---

## Responsive Testing

Minimum supported widths:

* 320px
* 375px
* 480px
* 768px
* Desktop

Verify:

* No overflow
* No clipping
* No layout shifts

---

## Browser Testing

Verify functionality in supported browsers.

---

## Accessibility Testing

Verify:

* Keyboard navigation
* Screen reader compatibility
* Focus states
* Labels
* Contrast

---

## Performance Testing

Check:

* Page load
* Layout stability
* Rendering
* Lighthouse scores

---

# 26. QA Standards

QA is responsible for verifying compliance—not redesigning the tool.

---

## Required QA Audits

Every tool must pass:

* Formula Audit
* Edge Case Audit
* Validation Audit
* Storage Audit
* Mobile Audit
* Accessibility Audit
* Related Tools Audit
* Integration Audit
* SEO Audit
* Regression Audit

---

## QA Philosophy

QA should identify:

* Bugs
* Standard violations
* Regression risks
* Missing requirements

QA should not introduce new features.

---

## Regression

Every change should preserve:

* Existing functionality
* Shared systems
* Consistency across Project 50

Fixes should avoid creating new issues elsewhere.

---

# 27. Release Standards

A tool is considered complete only after all required standards have been satisfied.

Completion requires:

* Correct implementation
* Successful testing
* Passed QA
* Successful integration
* Approved SEO content

---

## Required Deliverables

Every completed tool should include:

* HTML
* CSS
* JavaScript
* Integration updates
* SEO content
* QA confirmation

---

## Patch Philosophy

When modifying existing files:

Prefer minimal patches.

Avoid rewriting entire files unless necessary.

This reduces review effort and minimizes regression risk.

---

# 28. Change Management

Project standards are intended to remain stable.

Do not change standards based solely on personal preference.

---

## Before Updating a Standard

Follow this process:

1. Identify the limitation.
2. Verify the improved approach.
3. Test it in a real implementation.
4. Update documentation.
5. Apply consistently going forward.

---

## Avoid Standard Drift

Changing standards frequently creates inconsistency.

Only update standards when there is a clear engineering benefit.

---

# 29. Lessons Learned

The Health & Fitness category established several important engineering lessons.

These lessons now apply to every future category.

---

## Separate Responsibilities

Do not reuse one variable for multiple unrelated purposes.

Each state value should have one clear responsibility.

---

## Verify Formulas First

Most calculation bugs originate from assumptions rather than code.

Always verify formulas before implementation.

---

## Round for Display Only

Never round intermediate calculations.

Always calculate using full precision.

---

## Respect Native HTML Behaviour

Do not accidentally override native browser behaviour with CSS or JavaScript.

Example:

Hidden elements should remain hidden.

---

## Shared Logic Must Stay Consistent

When multiple tools calculate the same metric, they must use identical formulas.

There should never be competing implementations.

---

## Reuse Before Rebuild

If a shared system already exists, use it.

Creating duplicate implementations increases maintenance costs.

---

# 30. Golden Rules

Every Project 50 engineer should remember these principles.

---

## 1. Correctness First

Wrong answers are unacceptable.

---

## 2. Consistency Is a Feature

Users should immediately recognize every Project 50 tool.

---

## 3. Reuse Before Building

Check existing shared systems before creating new code.

---

## 4. Simplicity Wins

Prefer simple, understandable solutions over clever implementations.

---

## 5. Think Before Coding

Research, analyze, and verify before implementation.

---

## 6. Every Tool Improves the Project

Each implementation should leave Project 50 cleaner, more consistent, and easier to maintain.

---

# 31. Final Engineering Checklist

Before marking any tool complete, verify:

* [ ] Formulas verified
* [ ] Validation implemented
* [ ] Mobile responsive
* [ ] Accessibility compliant
* [ ] Performance acceptable
* [ ] Shared systems reused
* [ ] Storage implemented correctly
* [ ] Related tools integrated
* [ ] SEO completed
* [ ] Testing passed
* [ ] QA approved
* [ ] Regression checked
* [ ] Integration completed
* [ ] Documentation updated (if required)

---

# Final Statement

Project 50 is built on the principle that **high-quality engineering is achieved through consistency, correctness, and continuous improvement**.

Every tool should strengthen the project as a whole.

When making implementation decisions, always prioritize:

1. Correctness
2. User Experience
3. Consistency
4. Maintainability
5. Accessibility
6. Performance
7. SEO
8. Clean Code

If a decision conflicts with these priorities, use this document as the source of truth.

---

**End of `docs/tool-standards.md` Version 1.0**
