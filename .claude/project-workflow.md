# Project 50 Development Workflow

> **Version:** 1.0
> **Status:** Active Standard
> **Applies To:** Every Project 50 tool, category, feature, refactor, and future enhancement.

---

# Table of Contents

1. Purpose
2. Workflow Philosophy
3. Core Principles
4. Team Roles & Responsibilities
5. Development Lifecycle
6. Decision Hierarchy
7. Development Rules
8. Standard Workflow Overview
9. Step 1 – Discovery & Analysis
10. Step 2 – Product Definition

---

# 1. Purpose

This document defines the official development workflow for Project 50.

Unlike `tool-standards.md`, which defines **how code should be written**, this document defines **how a tool is built from idea to release**.

Every Project 50 tool must follow this workflow.

No steps should be skipped unless explicitly approved.

---

# 2. Workflow Philosophy

Project 50 follows an **Analysis → Implementation → Verification** workflow.

The goal is simple:

> **Think first. Build second. Verify third.**

Most software bugs originate from assumptions—not code.

Therefore, implementation is intentionally delayed until planning has been completed.

---

## Project 50 Development Lifecycle

Every tool follows the same lifecycle.

```text
Research

↓

Analysis

↓

Planning

↓

Implementation

↓

Integration

↓

Testing

↓

Review

↓

Release
```

Implementation is only one stage of development.

Planning and verification are equally important.

---

# 3. Core Principles

Every workflow decision should follow these principles.

---

## 3.1 Research Before Coding

Never begin coding immediately after selecting a tool.

Research:

* User intent
* Search demand
* Existing competitors
* Formula standards
* Edge cases

---

## 3.2 One Decision, One Time

Product decisions should only be made during planning.

Implementation should not redesign the product.

Examples:

✔ Planning decides:

* Features
* Layout
* Results
* Validation
* UX

Implementation simply follows those decisions.

---

## 3.3 Freeze Before Build

Before implementation begins, the following should already be finalized:

* Features
* Formula
* Validation
* UI
* UX
* Architecture

Claude should implement—not invent.

---

## 3.4 Build Small, Verify Often

Every phase should be reviewed before continuing.

Fixing problems early is significantly cheaper than redesigning later.

---

## 3.5 Consistency Over Speed

A slower, consistent workflow is preferred over a faster but inconsistent one.

Project 50 contains fifty tools.

Consistency compounds.

---

# 4. Team Roles & Responsibilities

Project 50 uses specialized roles.

Each role has one responsibility.

---

## Project Architect (ChatGPT)

Responsible for:

* Product decisions
* Architecture
* UI/UX standards
* Engineering standards
* Workflow
* Formula verification
* Code review
* QA review
* Long-term consistency

The Architect defines the blueprint.

---

## Builder (Claude)

Responsible for:

* HTML
* CSS
* JavaScript
* Applying standards
* Integration patches

The Builder implements exactly what has already been decided.

The Builder must not redesign the product.

---

## Reviewer (Claude)

Responsible for:

* Architecture review
* UI consistency review
* Bug identification
* Regression detection

The Reviewer does not redesign features.

The Reviewer only verifies compliance.

---

## SEO Writer (Claude)

Responsible for:

* Educational content
* FAQs
* SEO sections

The SEO Writer does not modify code.

---

## QA Reviewer (Claude)

Responsible for:

* Edge cases
* Validation
* Formula verification
* Accessibility review
* Mobile review
* Storage review

QA verifies implementation.

QA does not redesign features.

---

# 5. Development Lifecycle

Every tool follows the same lifecycle.

```text
Idea

↓

Research

↓

Planning

↓

Implementation

↓

Review

↓

Testing

↓

Release
```

Skipping stages increases long-term maintenance costs.

---

# 6. Decision Hierarchy

When conflicts occur, decisions should follow this hierarchy.

```
User Needs

↓

Project Standards

↓

Architecture

↓

Design System

↓

Implementation

↓

Optimization
```

Implementation should never override architecture.

Optimization should never override user experience.

---

# 7. Development Rules

These rules apply throughout the workflow.

---

## Rule 1

Never implement before understanding the problem.

---

## Rule 2

Never redesign during implementation.

---

## Rule 3

Never skip verification.

---

## Rule 4

Never duplicate shared functionality.

---

## Rule 5

Never trade consistency for convenience.

---

## Rule 6

Every completed tool should improve Project 50.

---

# 8. Standard Workflow Overview

Every Project 50 tool follows eight mandatory steps.

```
Step 1

Discovery & Analysis

↓

Step 2

Product Definition

↓

Step 3

Formula & Logic Audit

↓

Step 4

Architecture Planning

↓

Step 5

Implementation

↓

Step 6

Integration

↓

Step 7

QA, Testing & SEO

↓

Step 8

Final Review & Release
```

No implementation should begin before Step 4 has been completed.

---

# 9. Step 1 — Discovery & Analysis

Purpose:

Understand before building.

---

## Read Only Required Files

Priority:

1. `.claude/CLAUDE.md`
2. Relevant existing tools
3. Shared systems
4. `tools.json`

Do **not** scan the entire project.

Read only files relevant to the current task.

---

## Analyze

Identify:

* Existing patterns
* Shared components
* Storage usage
* Related tools implementation
* Existing UI patterns
* Design consistency

---

## Research

Identify:

* User intent
* Search demand
* Competitor gaps
* Opportunities for improvement

The objective is not to copy competitors.

The objective is to build the best Project 50 version.

---

## Deliverables

Step 1 produces:

* Analysis summary
* Files reviewed
* Reusable systems
* Initial observations

No code.

---

# 10. Step 2 — Product Definition

Purpose:

Transform research into a complete product specification.

---

## Define

* Tool purpose
* User problems
* Target audience
* Inputs
* Outputs
* Validation rules
* User journey

---

## Features

List every feature.

Each feature should have a clear purpose.

Avoid unnecessary functionality.

---

## User Flow

Document the complete interaction.

```
Open Tool

↓

Enter Inputs

↓

Calculate

↓

Understand Results

↓

Explore Related Tools

↓

Read Educational Content
```

---

## Result Planning

Design:

* Primary result
* Supporting cards
* Recommendations
* Warnings
* Empty state

Result hierarchy should already be finalized before implementation.

---

## Mobile Planning

Determine:

* Form stacking
* Responsive behaviour
* Card layout
* Result layout

Do not wait until implementation to consider mobile.

---

## Deliverables

Step 2 produces:

* Complete product specification
* Feature list
* User flow
* Result plan
* Mobile strategy

No implementation.

---

**End of Part 1**

**Part 2 Covers**

* Step 3 – Formula & Logic Audit
* Step 4 – Architecture Planning
* Step 5 – Implementation
* Builder Workflow
* Prompt Generation
* Implementation Rules


# 11. Step 3 — Formula & Logic Audit

Purpose:

Ensure every calculation is mathematically correct before implementation begins.

Project 50 calculators are trusted because they produce accurate results.

Accuracy is never assumed.

It is verified.

---

## Formula Verification

Every formula must be verified against:

- Industry standards
- Academic references
- Government documentation (where applicable)
- Official specifications
- Existing Project 50 standards

Never invent formulas.

---

## Cross-Tool Consistency

If another Project 50 tool already performs the same calculation:

The formula must match exactly.

Examples:

- Protein Calculator
- Macro Calculator

↓

Same protein recommendations.

Examples:

- TDEE Calculator
- Timeline Calculator

↓

Same calorie calculations.

Users should never receive different answers from different tools.

---

## Units

Verify:

- Units
- Conversions
- Rounding
- Precision

Every unit must be documented before implementation.

---

## Edge Cases

Identify:

Minimum values

Maximum values

Impossible values

Boundary values

Unexpected user behaviour

The implementation should already know how to handle these situations.

---

## Formula Documentation

Every formula should document:

Purpose

Variables

Units

Example

Expected output

Future developers should understand the formula without reverse engineering the code.

---

## Deliverables

Step 3 produces:

- Formula audit
- Unit verification
- Edge case list
- Calculation examples

No code.

---

# 12. Step 4 — Architecture Planning

Purpose:

Design the implementation before writing code.

Architecture should already answer every major implementation question.

---

## Files

Identify required files.

Usually:

```text
index.html

tool-name.css

tool-name.js
```

Avoid creating unnecessary files.

---

## Shared Systems

Determine:

Which shared systems will be reused.

Examples:

- P50Storage
- P50Renderers
- P50ToolBase
- P50Utils
- P50Icons

Reuse existing systems whenever possible.

---

## State Planning

If state is required:

Define it now.

Example:

```javascript
const state = {
    semesters: [],
    results: null
};
```

State should become the single source of truth.

---

## Storage Planning

Determine:

- Storage key
- Restore behaviour
- Save timing
- Reset behaviour

Never decide storage behaviour during implementation.

---

## Result Structure

Plan:

Hero Result

↓

Summary Cards

↓

Insights

↓

Warnings

↓

Related Tools

↓

SEO

Everything should already have a purpose.

---

## Validation Planning

Define:

- Required fields
- Invalid values
- Error messages
- Recovery behaviour

---

## Deliverables

Step 4 produces:

- Implementation blueprint
- Architecture plan
- State model
- Storage plan
- Validation strategy

No implementation.

---

# 13. Step 5 — Implementation

Purpose:

Convert the approved architecture into working code.

Implementation should contain very few product decisions.

Most decisions have already been made.

---

## Builder Responsibilities

The Builder should:

- Read project standards
- Read design system
- Read workflow
- Read relevant files

Then implement.

The Builder should not redesign the tool.

---

## HTML

Responsibilities:

- Semantic structure
- Accessibility
- Shared layout
- Calculator UI
- Results
- SEO placeholders

---

## CSS

Responsibilities:

- Follow design system
- Mobile first
- Shared components
- Responsive layout

Avoid creating custom visual styles.

---

## JavaScript

Responsibilities:

- State
- Validation
- Calculation
- Rendering
- Storage
- Integration

Do not duplicate shared functionality.

---

## Builder Rules

The Builder must:

✓ Follow Project 50 standards.

✓ Follow Design System.

✓ Reuse components.

✓ Use shared systems.

✓ Produce maintainable code.

---

## Builder Must Not

✗ Redesign layouts.

✗ Introduce new UI patterns.

✗ Change formulas.

✗ Skip validation.

✗ Ignore accessibility.

✗ Ignore storage standards.

---

## Deliverables

Step 5 produces:

- HTML
- CSS
- JavaScript

Implementation only.

---

# 14. Builder Prompt Generation

Once planning has finished,

The Project Architect generates a Builder Prompt.

The Builder Prompt contains:

- Tool definition
- Requirements
- Architecture
- UI requirements
- Formula
- Validation
- Shared systems
- Storage
- SEO requirements
- Output format

The Builder should receive a complete blueprint.

The Builder should not have to make major product decisions.

---

# 15. Prompt Philosophy

Project 50 intentionally separates:

Thinking

↓

Implementation

Planning belongs to the Project Architect.

Implementation belongs to the Builder.

This separation greatly improves consistency across fifty tools.

---

# 16. Output Rules

Builder outputs should follow these rules.

---

## New Files

Provide complete file contents.

Examples:

- index.html
- tool.css
- tool.js

---

## Existing Files

Provide patches only.

Examples:

Good:

```
Insert after...

Replace block...

Add object...
```

Bad:

```
Entire tools.json

Entire sitemap.xml
```

Patch-based outputs reduce review time and lower regression risk.

---

## Integration

Every implementation should clearly separate:

Created files

Modified files

Patch files

This makes review significantly easier.

---

## Completion

Implementation is **not** considered complete after Step 5.

Implementation simply means:

The code now exists.

Verification begins in the next stage.

---

**End of Part 2**

**Part 3 Covers**

- Step 6 – Integration
- Step 7 – QA, Testing & SEO
- Step 8 – Final Review & Release
- Reviewer Workflow
- QA Workflow
- Bug Workflow
- Regression Workflow
- Release Standards
- Final Project Workflow Rules

# 17. Step 6 — Integration

Purpose:

Integrate the completed tool into the Project 50 ecosystem.

A calculator is not considered part of Project 50 until it has been fully integrated.

---

## Required Integration

Every new tool must update:

1. data/tools.json
2. scripts/icon-map.js
3. sitemap.xml

These three files represent the minimum integration requirements.

No additional project files should be modified unless absolutely necessary.

---

## Tools Metadata

The single source of truth for tool metadata is:

```
data/tools.json
```

Never duplicate metadata across multiple files.

Metadata includes:

- Tool name
- Description
- Category
- URL
- Keywords
- Icon
- SEO metadata

---

## Icon Registration

Every tool must have a registered icon.

Rules:

- Use the shared icon library.
- Never use emojis.
- Never mix icon packs.
- Icons should match category style.

---

## Sitemap

Every released tool must appear in the sitemap.

Broken or missing sitemap entries reduce discoverability.

---

## Related Tools

Verify:

- Same category only.
- Current tool excluded.
- Maximum of four tools.
- Graceful fallback.

---

## Integration Deliverables

Step 6 produces:

- Integration patches
- Updated metadata
- Registered icon
- Updated sitemap

No QA is performed during this stage.

---

# 18. Step 7 — QA, Testing & SEO

Purpose:

Verify that implementation satisfies every Project 50 standard.

Implementation is **not complete** until QA has passed.

---

## Formula Audit

Verify:

- Formula correctness
- Industry compliance
- Cross-tool consistency
- Precision
- Units

---

## Validation Audit

Verify:

- Empty input
- Invalid input
- Negative values
- Boundary values
- Recovery behaviour

Every validation rule defined in Step 2 should now exist.

---

## Edge Case Audit

Test unusual situations.

Examples:

- Minimum values
- Maximum values
- Decimal values
- Large datasets
- Unexpected user behaviour

Edge cases should never crash the application.

---

## Mobile Audit

Minimum supported widths:

- 320px
- 375px
- 480px
- 768px

Verify:

- No overflow
- No clipping
- Proper spacing
- Touch-friendly controls

---

## Storage Audit

Verify:

✓ Save

✓ Restore

✓ Reset

✓ Debounce

✓ No result persistence

---

## Related Tools Audit

Verify:

- Same category
- Maximum four
- Self excluded
- Shared renderer used

---

## Accessibility Audit

Verify:

- Labels
- Keyboard navigation
- Focus indicators
- Screen reader compatibility
- Contrast
- Semantic HTML

---

## SEO Audit

Verify:

- Meta title
- Meta description
- Canonical
- FAQ
- Structured data
- Heading hierarchy
- Internal links

Also verify educational quality.

Content should remain valuable even if the calculator disappeared.

---

## Performance Audit

Verify:

- Fast rendering
- Efficient DOM updates
- Lighthouse targets
- No unnecessary JavaScript

---

## QA Deliverables

Step 7 produces:

- QA Report
- Passed audits
- Failed audits
- Required fixes

Implementation does not continue until failed audits are resolved.

---

# 19. Step 8 — Final Review & Release

Purpose:

Determine whether the tool is ready for production.

This is the final quality gate.

---

## Regression Audit

Verify the implementation has not negatively affected:

- Shared systems
- Existing tools
- Search
- Navigation
- Design consistency

Every release should improve Project 50—not introduce regressions.

---

## Consistency Audit

Verify the tool follows:

- CLAUDE.md
- Tool Standards
- Design System
- Project Workflow

No undocumented deviations should remain.

---

## Release Review

Confirm:

✓ Product goals achieved

✓ User problems solved

✓ Design consistent

✓ Mobile responsive

✓ Accessible

✓ SEO complete

✓ Integration complete

✓ QA passed

---

## Final Verdict

Every release concludes with one of two outcomes.

PASS

Tool is production ready.

or

FAIL

Return to the appropriate workflow step.

Never release a partially completed tool.

---

# 20. Bug Workflow

When bugs are discovered, follow a structured process.

Never guess.

---

## Workflow

```
Bug Report

↓

Reproduce

↓

Root Cause Analysis

↓

Minimal Fix

↓

Regression Test

↓

Release
```

---

## Root Cause Analysis

Before writing code, identify:

- Why the bug occurred.
- Which standard was violated.
- Which file is responsible.
- Whether similar bugs may exist elsewhere.

---

## Minimal Fix Philosophy

Fix only what is necessary.

Avoid redesigning unrelated systems while fixing bugs.

---

## Debugging Rules

When necessary:

1. Add temporary logs.
2. Observe runtime behaviour.
3. Identify the cause.
4. Remove temporary logs.
5. Apply the minimal patch.

Never patch blindly.

---

# 21. Prompt Workflow

Project 50 separates planning from implementation.

---

## Stage 1

Project Architect

Produces:

- Analysis
- Product Definition
- Formula Audit
- Architecture

---

## Stage 2

Builder

Produces:

- HTML
- CSS
- JavaScript
- Integration

---

## Stage 3

Reviewer

Verifies:

- Code quality
- Architecture
- Design consistency

---

## Stage 4

SEO Review

Verifies:

- Educational content
- FAQs
- Metadata
- Internal linking

---

## Stage 5

QA Review

Verifies:

- Formula
- Validation
- Accessibility
- Mobile
- Performance

---

## Stage 6

Release

Tool becomes part of Project 50.

---

# 22. Lessons Learned

The Health category established several workflow improvements.

These standards now apply to every category.

---

## Think Before Building

Most implementation problems were caused by incomplete planning.

Planning saves more time than it costs.

---

## Freeze Product Decisions

Changing UX during implementation creates inconsistency.

Finalize decisions before coding.

---

## Build Once

Avoid repeated rewrites.

A strong architecture reduces future maintenance.

---

## Verify Everything

Never assume:

- Formula correctness
- UI consistency
- Mobile behaviour
- Storage behaviour

Verification is mandatory.

---

## Documentation Evolves Slowly

Core documents should remain stable.

Only update them when a genuine engineering improvement has been proven.

Avoid changing standards based on preference.

---

# 23. Golden Workflow Rules

Every Project 50 contributor should remember these rules.

1. Research before coding.
2. Understand before implementing.
3. Reuse before rebuilding.
4. Verify before releasing.
5. Patch before rewriting.
6. Consistency beats speed.
7. Every release should improve Project 50.
8. Documentation is the project's long-term memory.

---

# 24. Final Workflow Checklist

Before marking a tool complete, verify:

- [ ] Step 1 completed
- [ ] Step 2 completed
- [ ] Step 3 completed
- [ ] Step 4 completed
- [ ] Step 5 completed
- [ ] Step 6 completed
- [ ] Step 7 completed
- [ ] Step 8 completed

Project documents reviewed:

- [ ] CLAUDE.md
- [ ] tool-standards.md
- [ ] design-system-and-ui-guidelines.md
- [ ] project-workflow.md
- [ ] new-tool-checklist.md

Technical verification:

- [ ] Formula verified
- [ ] Validation complete
- [ ] Accessibility verified
- [ ] Mobile verified
- [ ] Performance verified
- [ ] Integration verified
- [ ] SEO verified
- [ ] QA passed
- [ ] Regression passed

---

# Final Workflow Statement

Project 50 is built through **structured engineering, not improvisation**.

The workflow exists to ensure that every tool—from Tool #1 to Tool #50—is planned carefully, implemented consistently, verified thoroughly, and released confidently.

Following this workflow is mandatory. Improvements to the workflow should be based on real experience and documented evidence, not personal preference or convenience.

---

**End of `docs/project-workflow.md` Version 1.0**