# Project 50 New Tool Checklist

> **Version:** 1.0  
> **Status:** Mandatory  
> **Applies To:** Every new Project 50 tool before release.

---

# Purpose

This checklist is the final quality gate for every Project 50 tool.

A tool is **not considered complete** until every applicable checklist item has been reviewed and approved.

This checklist complements:

- `.claude/CLAUDE.md`
- `.claude/tool-standards.md`
- `.claude/design-system-and-ui-guidelines.md`
- `.claude/project-workflow.md`

(Note: `docs/tool-standards.md` and `docs/new-tool-checklist.md` also exist, but they are older, superseded drafts — e.g. they specify emoji icons and 3 SEO sections, which contradict the current standards in this repository. Use the `.claude/` versions.)

If any checklist item fails, the tool returns to the appropriate workflow step before release.

---

# Phase 1 — Discovery

## Documentation

- [ ] Read `CLAUDE.md`
- [ ] Read `tool-standards.md`
- [ ] Read `design-system-and-ui-guidelines.md`
- [ ] Read `project-workflow.md`

## Analysis

- [ ] Relevant existing tools reviewed
- [ ] Shared systems identified
- [ ] Existing patterns understood
- [ ] Related tools reviewed
- [ ] Competitor research completed (when applicable)

---

# Phase 2 — Product Definition

- [ ] Tool purpose defined
- [ ] Target users identified
- [ ] Inputs finalized
- [ ] Outputs finalized
- [ ] Validation rules defined
- [ ] Result hierarchy designed
- [ ] Mobile behaviour planned
- [ ] Edge cases identified

---

# Phase 3 — Formula & Logic

- [ ] Formula verified
- [ ] Units verified
- [ ] Precision verified
- [ ] Cross-tool consistency verified
- [ ] Example calculations tested

---

# Phase 4 — Architecture

- [ ] File structure finalized
- [ ] Shared systems identified
- [ ] Storage planned
- [ ] Validation planned
- [ ] Result rendering planned
- [ ] Related tools planned

---

# Phase 5 — Implementation

## HTML

- [ ] Semantic HTML used
- [ ] Accessibility considered
- [ ] Proper heading hierarchy
- [ ] Labels provided

## CSS

- [ ] Mobile-first
- [ ] Shared design system followed
- [ ] No duplicate components
- [ ] No unnecessary styles

## JavaScript

- [ ] State-driven where appropriate
- [ ] Shared utilities reused
- [ ] No duplicated logic
- [ ] Clean naming
- [ ] No debugging code

---

# Phase 6 — Integration

- [ ] Registered in `tools.json`
- [ ] Registered in `icon-map.js`
- [ ] Added to `sitemap.xml`
- [ ] Related tools configured
- [ ] Metadata verified

---

# Phase 7 — QA

## Formula Audit

- [ ] Passed

## Validation Audit

- [ ] Passed

## Edge Cases

- [ ] Passed

## Storage Audit

- [ ] Passed

## Mobile Audit

- [ ] Passed

## Accessibility Audit

- [ ] Passed

## Performance Audit

- [ ] Passed

## Related Tools Audit

- [ ] Passed

## SEO Audit

- [ ] Passed

---

# Responsive Verification

Checked at:

- [ ] 320px
- [ ] 375px
- [ ] 480px
- [ ] 768px
- [ ] Desktop

---

# SEO

- [ ] Meta title
- [ ] Meta description
- [ ] Canonical
- [ ] Structured data
- [ ] Eight SEO sections
- [ ] FAQ completed
- [ ] Internal links verified

---

# UI Review

- [ ] Matches Project 50 design
- [ ] Card system followed
- [ ] Typography consistent
- [ ] Spacing consistent
- [ ] Buttons consistent
- [ ] Forms consistent
- [ ] Hero Result visible
- [ ] Related Tools positioned correctly

---

# Accessibility

- [ ] Keyboard navigation
- [ ] Labels
- [ ] Focus states
- [ ] Contrast
- [ ] Screen reader friendly

---

# Performance

- [ ] Fast loading
- [ ] Efficient rendering
- [ ] No unnecessary JavaScript
- [ ] No layout shifts

---

# Regression

- [ ] Existing functionality unaffected
- [ ] Shared systems unaffected
- [ ] Navigation unaffected
- [ ] Search unaffected

---

# Final Approval

## Deliverables

- [ ] HTML
- [ ] CSS
- [ ] JavaScript
- [ ] Integration patches
- [ ] QA report
- [ ] SEO content
- [ ] Documentation updated (if required)

---

## Release Decision

Overall Status:

- [ ] PASS
- [ ] FAIL

If FAIL:

Return to the appropriate workflow step.

A Project 50 tool is only considered complete after every applicable checklist item has been reviewed and approved.

---

# Final Principle

> Every released tool should make Project 50 **more consistent, more reliable, and more valuable** than it was before.