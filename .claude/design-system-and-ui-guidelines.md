# Project 50 Design System & UI Guidelines

> **Version:** 1.0  
> **Status:** Active Standard  
> **Applies To:** Every page, tool, category, shared component, and future feature within Project 50.

---

# Table of Contents

## 1. Purpose

## 2. Design Philosophy

## 3. Core Design Principles

## 4. Brand Personality

## 5. Design Priorities

## 6. Product Identity

## 7. User Experience Principles

## 8. Information Hierarchy

## 9. Visual Hierarchy

## 10. Category Customization Rules

## 11. Design Consistency Rules

## 12. Anti-Patterns

## 13. Golden Design Rules

---

# 1. Purpose

This document defines the official visual language, interaction patterns, user experience principles, and design standards for Project 50.

Every page, calculator, component, category, and future feature must follow these standards.

The purpose of this document is to ensure that:

- Every tool feels like part of one product.
- Every interaction is predictable.
- Every page maintains the same visual identity.
- Future development remains consistent.
- New categories can evolve without breaking the overall design language.

This document is the visual source of truth for Project 50.

If a design decision conflicts with this document, this document takes precedence unless an updated standard has been officially adopted.

---

# 2. Design Philosophy

Project 50 is **not** a collection of unrelated calculators.

It is a unified product containing fifty carefully designed browser-native tools.

Users should feel as though they are using one professional application—not fifty different websites.

The interface should disappear into the background, allowing users to focus entirely on solving their problem.

The best Project 50 interface is one that users understand immediately without needing instructions.

Design exists to support clarity—not decoration.

---

## Design Goals

Every interface should be:

- Fast
- Clean
- Predictable
- Professional
- Trustworthy
- Accessible
- Educational
- Mobile-first

Every screen should answer one question:

> **"Can the user complete their task with the least amount of effort?"**

If the answer is no, redesign the experience.

---

# 3. Core Design Principles

These principles guide every design decision made in Project 50.

---

## 3.1 Consistency Over Creativity

Consistency is considered a feature.

Users should never have to relearn the interface when switching between tools.

Layouts, buttons, spacing, forms, result cards, typography, and interactions should remain familiar.

Creativity should never reduce usability.

---

## 3.2 Clarity Over Decoration

Decorative elements should never compete with information.

Every visual element must have a purpose.

If removing an element improves readability without reducing functionality, remove it.

---

## 3.3 Function Before Beauty

Beautiful interfaces are valuable only when they remain functional.

Users visit Project 50 to solve problems—not admire animations.

Visual design should always support usability.

---

## 3.4 Simplicity Over Complexity

Avoid unnecessary features.

Avoid unnecessary controls.

Avoid unnecessary sections.

If a simpler solution exists that provides the same value, choose it.

---

## 3.5 Mobile First

Every interface begins with the smallest screen.

Desktop layouts expand naturally from the mobile experience.

Never design desktop first and attempt to compress it later.

---

## 3.6 Information Before Decoration

The user's answer should always be the most visually prominent element.

Decorative graphics should never receive more attention than the primary result.

---

# 4. Brand Personality

Project 50 should consistently communicate the following personality traits.

---

## Professional

The interface should feel reliable and trustworthy.

Avoid playful or gimmicky visuals.

---

## Calm

Users often visit because they need answers quickly.

The interface should reduce cognitive load.

Avoid noisy layouts.

---

## Intelligent

The product should appear knowledgeable without overwhelming users.

Explain concepts clearly.

Use simple language.

---

## Efficient

Users should reach their answer with minimal friction.

Every click should have purpose.

---

## Modern

Project 50 embraces modern interface standards while remaining lightweight.

Modern does not mean trendy.

Modern means timeless.

---

# 5. Design Priorities

Whenever design decisions conflict, follow this order.

## Priority 1

User Understanding

Can users immediately understand what to do?

---

## Priority 2

Task Completion

Can users finish their task quickly?

---

## Priority 3

Consistency

Does the interface behave like every other Project 50 tool?

---

## Priority 4

Accessibility

Can everyone comfortably use the interface?

---

## Priority 5

Performance

Does the interface remain lightweight?

---

## Priority 6

Visual Appeal

Only after all previous priorities have been satisfied.

---

# 6. Product Identity

Project 50 has a distinct identity.

It is:

- Educational
- Practical
- Data-driven
- Lightweight
- Privacy-first
- Browser-native

It is **not**:

- A dashboard
- A SaaS product
- A finance application
- A medical application
- A social platform

Every page should reinforce this identity.

---

# 7. User Experience Principles

Every Project 50 tool follows the same user journey.

```
Land on Page

↓

Understand Purpose

↓

Enter Information

↓

Calculate

↓

Understand Results

↓

Explore Related Tools

↓

Learn More

↓

Leave Confident
```

No unnecessary interruptions should exist within this flow.

---

## Reduce Cognitive Load

Users should never wonder:

- What should I enter?
- What does this button do?
- What does this result mean?

The interface should answer these questions naturally.

---

## Progressive Disclosure

Only reveal information when it becomes useful.

Examples:

- Show warnings only when relevant.
- Show advanced options only when needed.
- Display explanations after results.

Avoid overwhelming users with unnecessary information.

---

# 8. Information Hierarchy

Every tool should present information in the same order.

```
Header

↓

Breadcrumb

↓

Tool Header

↓

Calculator

↓

Primary Result

↓

Supporting Results

↓

Insights

↓

Related Tools

↓

Educational Content

↓

FAQ

↓

Footer
```

Users should never need to scroll through educational content before reaching their answer.

---

## Primary Question First

Every calculator answers one primary question.

Examples:

BMI Calculator

→ BMI

Macro Calculator

→ Daily Macro Targets

CGPA Calculator

→ CGPA

Attendance Calculator

→ Attendance Percentage

This answer should always appear first.

Everything else supports that answer.

---

# 9. Visual Hierarchy

Project 50 uses a strict visual hierarchy.

Level 1

Primary Result

Largest typography

Highest visual emphasis

---

Level 2

Supporting Metrics

Medium emphasis

Summary cards

---

Level 3

Explanations

Short paragraphs

Supporting content

---

Level 4

Warnings

Only when necessary

Never shown permanently

---

Level 5

Educational Content

SEO sections

FAQs

Related resources

---

Visual emphasis should decrease naturally as users move down the page.

---

# 10. Category Customization Rules

Project 50 allows controlled customization between categories.

Categories may introduce:

- Different accent colors
- Different result card emphasis
- Specialized components
- Category-specific illustrations
- Additional visual aids

However, the following must remain consistent:

- Layout
- Typography
- Card system
- Button styles
- Input styles
- Navigation
- Footer
- Form behaviour
- Result hierarchy
- Page spacing

A Student Tool should immediately feel like it belongs to Project 50—even if its accent color differs from a Health Tool.

---

# 11. Design Consistency Rules

Every new component must answer one question before it is created:

> **"Can an existing Project 50 component already solve this problem?"**

If yes:

Reuse it.

Do not redesign it.

Do not duplicate it.

New UI components should only be introduced when an existing component cannot reasonably satisfy the requirement.

---

# 12. Anti-Patterns

The following patterns are prohibited.

❌ Designing unique layouts for individual tools.

❌ Creating different button styles.

❌ Mixing icon libraries.

❌ Inventing new spacing systems.

❌ Using different border radii.

❌ Reordering page sections.

❌ Overusing animations.

❌ Adding decorative graphics without purpose.

❌ Making users scroll before seeing the primary result.

❌ Introducing visual inconsistency for personal preference.

---

# 13. Golden Design Rules

Every design decision should satisfy these principles.

1. Solve the user's problem first.
2. Keep the interface predictable.
3. Reuse before redesigning.
4. Reduce cognitive load.
5. Make the primary result impossible to miss.
6. Every screen should feel like Project 50.
7. Consistency is more valuable than originality.
8. Design systems evolve through evidence—not opinion.

---

**End of Part 1**

**Part 2 will cover:**

- Design Tokens
- Color System
- Typography
- Spacing System
- Grid System
- Layout System
- Breakpoints
- Container Rules
- Page Anatomy
- Visual Rhythm

# 14. Design Tokens

Project 50 uses a centralized design token system.

Every page and component should derive its visual appearance from these tokens rather than introducing custom values.

The objective is to make the entire project feel cohesive while allowing controlled evolution in the future.

---

## Design Token Philosophy

Design tokens should provide consistency for:

- Colors
- Typography
- Spacing
- Border Radius
- Shadows
- Borders
- Animations
- Layout
- Elevation

Individual tools must never invent their own design tokens.

---

## Token Rules

Design tokens must be:

- Reusable
- Predictable
- Scalable
- Easy to update
- Shared across the project

If multiple components use the same value, it should become a design token.

---

# 15. Color System

Project 50 primarily uses a dark interface designed to reduce eye strain while emphasizing content.

Colors communicate hierarchy and meaning—not decoration.

---

## Core Theme

The interface consists of four primary layers.

Layer 1

Application Background

Used for the page background.

---

Layer 2

Surface

Used for cards and containers.

---

Layer 3

Elevated Surface

Used when a component requires stronger emphasis.

Examples:

- Selected cards
- Featured results
- Important notices

---

Layer 4

Interactive Surface

Used for:

- Buttons
- Active controls
- Selected states

---

## Semantic Colors

Accent colors communicate meaning.

They should never be assigned randomly.

Recommended semantic usage:

### Blue

General information

Primary actions

Educational content

Student tools (default accent)

---

### Green

Positive

Success

Healthy

Recommended

Completed

---

### Orange

Calories

Warnings

Highlighted recommendations

Finance gains (where appropriate)

---

### Yellow

Caution

Fat-related metrics

Temporary warnings

---

### Red

Errors

Critical validation

Danger

Never use red for decorative purposes.

---

### Purple

Primary action gradient

Brand highlights

Interactive emphasis

---

### Teal

Water

Carbohydrates

Supporting informational metrics

---

## Category Accent Colors

Categories may introduce a dominant accent.

Example:

Health

Green

Student

Blue

Finance

Orange / Emerald

Utility

Blue / Cyan

Creator

Purple

However, only the accent changes.

Everything else remains part of the Project 50 design language.

---

# 16. Typography System

Typography is one of the strongest identifiers of Project 50.

Use typography to establish hierarchy—not color.

---

## Typography Principles

Typography should be:

- Readable
- Consistent
- Spacious
- Modern
- Accessible

Avoid decorative typography.

---

## Hierarchy

Project 50 follows a consistent heading hierarchy.

### H1

Tool Title

Largest heading on the page.

Only one H1.

---

### H2

Major Sections

Examples:

- Results
- About
- FAQs

---

### H3

Subsections

Examples:

- Protein Targets
- Summary
- Tips

---

### Body Text

Used for:

- Explanations
- SEO
- Instructions

Should prioritize readability.

---

### Caption

Used only for:

- Helper text
- Metadata
- Supporting information

Never use captions for important information.

---

## Numbers

Numbers receive higher emphasis than surrounding labels.

Example:

```
BMI

23.8

Normal
```

The value should always attract the user's attention first.

---

## Result Typography

Primary Result

Largest type on the page.

Supporting Metrics

Medium emphasis.

Descriptions

Smaller.

Helper Text

Smallest.

Never compete visually with the result.

---

# 17. Spacing System

Spacing creates consistency more effectively than decoration.

Project 50 uses generous whitespace.

Users should never feel crowded.

---

## Spacing Philosophy

Spacing should:

- Separate ideas
- Reduce cognitive load
- Improve scanning

Whitespace is considered an interface component.

---

## Section Rhythm

Major sections should maintain consistent spacing.

Example flow:

```
Tool Header

↓

Calculator

↓

Results

↓

Related Tools

↓

SEO

↓

FAQ

↓

Footer
```

Avoid inconsistent vertical gaps.

---

## Internal Card Spacing

Every card should maintain consistent internal padding.

Cards should breathe.

Never allow content to touch card edges.

---

## Form Spacing

Every input group should have:

Label

↓

Input

↓

Helper Text

↓

Gap

↓

Next Label

This pattern should remain identical across every tool.

---

# 18. Grid System

Project 50 uses a predictable grid.

The grid should support expansion without redesign.

---

## Principles

The grid should:

- Adapt naturally
- Prevent overflow
- Maintain rhythm
- Scale smoothly

---

## Cards

Cards should align consistently.

Avoid irregular card widths.

---

## Result Cards

Summary metrics should use shared grid layouts.

Avoid manually positioning cards.

---

## Related Tools

Related tools should always maintain a balanced grid.

Desktop

Two or four columns depending on available width.

Tablet

Two columns.

Mobile

Single column.

---

# 19. Layout System

Every Project 50 page follows the same anatomy.

---

## Page Structure

```
Header

↓

Breadcrumb

↓

Tool Header

↓

Calculator

↓

Results

↓

Related Tools

↓

SEO

↓

FAQ

↓

Footer
```

This structure should never be rearranged.

---

## Calculator Placement

The calculator is always the first interactive section.

Never place educational content before the calculator.

---

## Result Placement

Results appear immediately after calculation.

Never insert advertisements or unrelated content between:

Calculator

↓

Results

---

## Related Tools Placement

Related tools always appear after results.

Never place them before calculation.

---

## SEO Placement

Educational content appears after related tools.

This keeps the primary user journey uninterrupted.

---

# 20. Container Standards

Containers define the visual rhythm of Project 50.

---

## Containers Should

- Align consistently
- Use shared widths
- Maintain equal side margins
- Scale predictably

Avoid arbitrary container widths.

---

## Cards

Every card should visually belong to the same family.

Shared characteristics:

- Border radius
- Border treatment
- Background
- Internal spacing

Only semantic accents should differ.

---

# 21. Visual Rhythm

Visual rhythm is one of Project 50's defining characteristics.

Users should naturally understand where one section ends and the next begins.

---

## Rhythm Rules

Maintain consistent spacing between:

- Major sections
- Cards
- Form groups
- Result groups

Never alternate between cramped and oversized spacing.

---

## Reading Flow

The eye should naturally move downward.

Each section should clearly introduce the next.

Avoid abrupt layout changes.

---

## Chunking

Large amounts of information should be divided into logical sections.

Instead of:

One massive result card.

Prefer:

- Summary
- Analysis
- Insights
- Recommendations
- Education

Each within its own card.

This greatly improves readability.

---

# 22. Breakpoints

Responsive layouts should enhance—not redesign—the interface.

---

## Supported Widths

Minimum supported:

- 320px

Standard mobile:

- 375px

Large mobile:

- 480px

Tablet:

- 768px

Desktop:

- 1024px+

Large desktop:

- 1440px+

---

## Mobile Philosophy

Desktop layouts compress.

Mobile layouts stack.

The design language should remain identical.

Users should never feel like they are using a different application.

---

## Responsive Rules

Do:

✔ Stack grids.

✔ Increase touch targets.

✔ Preserve spacing.

✔ Preserve hierarchy.

Do NOT:

✘ Remove important information.

✘ Hide primary results.

✘ Change interaction patterns.

---

**End of Part 2**

**Part 3 Covers**

- Component Library
- Cards
- Buttons
- Forms
- Inputs
- Selects
- Validation
- Result Cards
- Tables
- Alerts
- Badges
- Icons
- Empty States
- Loading States

# 23. Component Library

Project 50 follows a component-first design system.

Every UI element should be built from reusable components rather than custom designs for individual tools.

If a component already exists, reuse it.

Never redesign an existing component without a strong engineering reason.

---

# 24. Card System

Cards are the primary building block of Project 50.

Nearly every section is presented inside a card.

Examples:

- Calculator
- Result Sections
- Related Tools
- SEO Sections
- FAQs
- Category Information
- Tips
- Tables

Cards create consistency across the product.

---

## Card Principles

Every card should:

- Have a single responsibility.
- Group related information.
- Maintain consistent spacing.
- Use the shared border radius.
- Use the shared background.
- Follow the shared elevation system.

Cards should never contain unrelated information.

---

## Card Anatomy

Every card should follow this structure.

```
Card

↓

Header

↓

Optional Description

↓

Main Content

↓

Optional Footer
```

Do not rearrange this structure.

---

## Card Types

Project 50 currently uses the following card types.

### Calculator Card

Contains:

- Form
- Inputs
- Buttons

Always appears first.

---

### Result Card

Displays calculated results.

Can contain:

- Hero Value
- Supporting Metrics
- Warnings
- Insights

---

### Summary Card

Displays quick metrics.

Usually arranged in a grid.

Examples:

- Total Credits
- Total Calories
- BMR
- TDEE

---

### Information Card

Contains educational content.

Examples:

- About
- How It Works
- Tips

---

### Related Tool Card

Shows:

- Icon
- Tool Name
- Description
- CTA

All related tool cards must share the same appearance.

---

### Warning Card

Displays:

- Safety warnings
- Validation notices
- Recommendations

Warnings should be informative rather than alarming.

---

# 25. Tool Header

Every calculator begins with the same hero section.

Structure:

```
Breadcrumb

↓

Tool Icon

↓

Tool Name

↓

Short Description
```

---

## Tool Icon

Always positioned beside the title.

Rules:

- Shared icon system
- Same size across tools
- Category accent color
- Rounded square container

Never use emojis.

---

## Tool Title

One H1.

Clear.

Descriptive.

Examples:

- BMI Calculator
- CGPA Calculator
- Attendance Calculator

Avoid marketing language.

---

## Description

One concise sentence.

Explain:

- What the tool does.
- Who it helps.

Maximum:

Two lines on desktop.

---

# 26. Forms

Forms are the heart of Project 50 calculators.

They should be:

- Predictable
- Fast
- Accessible
- Easy to scan

---

## Form Flow

Every form follows:

```
Label

↓

Input

↓

Helper Text

↓

Next Input
```

Never mix helper text above inputs.

---

## Input Grouping

Related inputs should remain grouped.

Examples:

Height

Feet + Inches

Weight

Value + Unit

Semester

GPA + Credits

Grouping improves scanning.

---

## Progressive Forms

Large calculators should group fields into logical sections.

Do not overwhelm users with long uninterrupted forms.

---

# 27. Input Standards

Inputs should remain visually identical across every tool.

Consistency is more important than novelty.

---

## Input Height

Every input uses the same height.

Never create tool-specific heights.

---

## Labels

Every input requires:

- Visible label
- Associated input
- Clear wording

Labels should never be replaced with placeholders.

---

## Placeholder Text

Placeholder text should provide examples.

Example:

```
e.g. 8.75
```

Not:

```
Enter value
```

---

## Helper Text

Helper text should explain:

- Units
- Valid range
- Optional information

Keep helper text concise.

---

## Units

Units should appear consistently.

Examples:

kg

cm

%

Credits

Semesters

Never mix styles.

---

# 28. Buttons

Project 50 intentionally limits button styles.

There are only two primary button types.

---

## Primary Button

Used for:

- Calculate
- Generate
- Convert

Characteristics:

- Brand gradient
- Full visual emphasis

Only one primary action per screen.

---

## Secondary Button

Used for:

- Reset
- Clear
- Cancel

Visual emphasis is intentionally lower.

---

## Icon Buttons

Reserved for:

- Theme
- Menu
- Search

Do not introduce new icon buttons unnecessarily.

---

## Disabled State

Disabled buttons should clearly communicate:

Unavailable—not broken.

---

# 29. Validation

Validation should improve confidence.

Never punish users.

---

## Inline Validation

Errors appear beneath the affected field.

Never at the top of the page.

---

## Error Messages

Good:

```
Credits must be greater than zero.
```

Bad:

```
Invalid.
```

---

## Focus

The first invalid field should receive focus automatically.

---

## Recovery

Users should never lose valid inputs because one field is incorrect.

---

# 30. Result Design

Results are the most important part of every calculator.

Everything else supports them.

---

## Hero Result

Every calculator should present one primary answer.

Examples:

BMI

CGPA

Attendance

Calories

Password

EMI

This result should dominate the page visually.

---

## Supporting Metrics

Secondary statistics appear beneath the hero result.

Examples:

CGPA

↓

Total Credits

↓

Highest GPA

↓

Average GPA

↓

Lowest GPA

Never compete with the primary answer.

---

## Explanation

Every major result should include a short explanation.

Users should understand:

- What it means.
- Why it matters.

---

## Insights

Where appropriate, include:

- Recommendations
- Warnings
- Tips

Insights should always relate to the calculated result.

---

# 31. Tables

Tables should only be used when information is genuinely tabular.

Examples:

- EMI Breakdown
- Goal Comparison
- Grade Lists

Never use tables for layout.

---

## Table Rules

Tables should:

- Scroll horizontally on small screens.
- Preserve readability.
- Maintain equal spacing.
- Highlight important rows.

---

# 32. Badges

Badges communicate status.

Not decoration.

Examples:

- Recommended
- Popular
- Optional
- Your Level

Badges should remain small and secondary.

---

# 33. Alerts & Notices

Alerts should communicate information—not create anxiety.

Types:

Success

Information

Warning

Critical

Each type should use its semantic color.

---

## Alert Placement

Alerts appear:

Below relevant content.

Never interrupt user input.

---

# 34. Icons

Icons reinforce recognition.

They never replace text.

---

## Rules

Every icon must:

- Come from the shared icon library.
- Match existing stroke width.
- Match existing size.
- Match category accent.

Never mix icon styles.

---

## Icon Usage

Use icons for:

- Tool headers
- Result section headers
- Navigation
- Status indicators

Avoid unnecessary decorative icons.

---

# 35. Empty States

Every tool should define an intentional empty state.

Before calculation:

- No misleading numbers.
- No placeholder results pretending to be real.
- No visual clutter.

The interface should encourage action naturally.

---

# 36. Loading States

Project 50 calculators are lightweight.

Most calculations happen instantly.

Loading indicators should only appear when truly necessary.

Never fake loading animations.

---

# 37. Component Consistency Rules

Before creating a new component ask:

1. Does this already exist?

2. Can an existing component solve this?

3. Will this improve the entire design system?

If the answer is no—

Do not create it.

---

## Component Evolution

The design system may evolve over time.

However:

Components should be improved globally—

Never individually.

A button improvement should improve every button.

A card improvement should improve every card.

Consistency always wins over isolated perfection.

---

**End of Part 3**

**Part 4 Covers**

- Result Architecture
- Related Tools
- SEO Content Layout
- FAQ Design
- Footer
- Mobile UX
- Accessibility UI
- Motion & Animation
- Category Customization Examples
- Anti-Patterns
- Final Design Checklist
```

# 38. Result Architecture

The result section is the most important part of every Project 50 tool.

Everything above it helps users calculate.

Everything below it helps users understand.

The result section itself delivers the answer.

---

## Result Philosophy

Every tool answers **one primary question**.

The interface should make that answer impossible to miss.

Examples:

BMI Calculator

→ BMI Score

Macro Calculator

→ Daily Macro Targets

CGPA Calculator

→ Overall CGPA

Attendance Calculator

→ Current Attendance

Password Generator

→ Generated Password

The primary answer always receives the highest visual priority.

---

## Standard Result Flow

Every calculator should follow this structure.

```
Primary Result

↓

Summary Metrics

↓

Insights / Recommendations

↓

Warnings (if required)

↓

Additional Details
```

Never rearrange this order without a strong reason.

---

## Hero Result Card

Every tool should contain one Hero Result card.

Purpose:

Provide the user's answer immediately.

Characteristics:

- Largest typography
- Highest emphasis
- Minimal distractions
- Easily scannable

Users should never search for the main answer.

---

## Supporting Cards

After the Hero Result, supporting information should be divided into logical cards.

Examples:

CGPA

↓

Academic Summary

↓

Performance Analysis

↓

Recommendations

NOT

One giant result card containing everything.

---

## Information Chunking

Large result sets should always be split.

Good

```
Summary

↓

Analysis

↓

Insights

↓

Recommendations
```

Bad

```
One card

↓

Everything inside
```

Chunking reduces cognitive load.

---

## Result Explanations

Every important result should answer:

- What is this?
- Why does it matter?
- What should I do next?

Users should never have to guess.

---

## Result Warnings

Warnings should only appear when required.

Examples:

- Unsafe calorie intake
- Attendance shortage
- Invalid assumptions

Warnings should never permanently occupy space.

---

## Recommendation Sections

Where appropriate, recommendations should appear after the primary result.

Examples:

- Improve attendance
- Increase calories
- Study strategy
- Savings recommendation

Recommendations should always be actionable.

---

# 39. Related Tools

Related Tools improve discoverability while helping users continue their journey.

They should never feel like advertisements.

---

## Placement

Always place Related Tools:

```
Results

↓

Related Tools

↓

SEO Content
```

Never place them before calculation.

---

## Content Rules

Related tools must:

- Belong to the same category
- Solve similar problems
- Help the user's next step

Avoid unrelated suggestions.

---

## Number of Cards

Maximum:

4

Minimum:

Show only available tools.

Do not invent unrelated tools to fill empty space.

---

## Card Structure

Every Related Tool card contains:

- Icon
- Tool Name
- Short Description
- CTA

All cards must share the same layout.

---

## Future Categories

If a category currently contains only one tool:

Display:

```
More Student Tools Coming Soon
```

or

Display only available category tools.

Never display tools from unrelated categories unless the project standard explicitly changes.

---

# 40. SEO Content Layout

Educational content begins only after the calculator experience has finished.

The calculator should never compete with educational content.

---

## Standard Order

```
Calculator

↓

Results

↓

Related Tools

↓

SEO Sections

↓

FAQ
```

---

## SEO Section Structure

Each section follows:

```
Heading

↓

Introduction

↓

Main Explanation

↓

Examples

↓

Tips (Optional)
```

Avoid long uninterrupted paragraphs.

---

## Paragraph Length

Prefer:

2–5 sentences.

Large blocks reduce readability.

---

## Lists

Whenever multiple ideas exist:

Use bullet lists.

Lists improve scanning.

---

## Tables

Use tables only when they improve understanding.

Do not force tables into every tool.

---

## Images

Educational illustrations may be used only if they genuinely improve comprehension.

Never add decorative images simply to fill space.

---

# 41. FAQ Design

Project 50 uses a shared FAQ component.

---

## Layout

Single accordion.

One question expanded at a time.

Avoid complex interactions.

---

## Question Style

Questions should reflect how real users search.

Examples:

"What is CGPA?"

"How do I calculate attendance?"

Avoid technical wording.

---

## Answer Style

Answers should be:

- Short
- Accurate
- Beginner-friendly

---

## Privacy Question

Where applicable, the final FAQ should answer:

```
Is my data stored or shared?
```

This reinforces user trust.

---

# 42. Footer Standards

The footer is global.

Individual tools must never customize it.

---

## Footer Responsibilities

- Navigation
- Copyright
- Policies
- About
- Contact

No tool-specific content belongs inside the footer.

---

# 43. Mobile UX Standards

Project 50 is designed Mobile First.

Desktop is an enhancement—not the starting point.

---

## Mobile Principles

Mobile layouts should:

- Stack naturally
- Preserve hierarchy
- Maintain spacing
- Avoid horizontal scrolling

---

## Touch Targets

Buttons and controls should remain comfortable to tap.

Avoid tiny interactive elements.

---

## Form Behaviour

Large forms should:

- Stack vertically
- Maintain clear grouping
- Preserve readability

Never compress forms to fit horizontally.

---

## Result Behaviour

Results should maintain the same hierarchy on mobile.

Do not remove information simply because screen width is smaller.

---

# 44. Accessibility UI

Visual accessibility is part of the design system.

---

## Focus Indicators

Visible focus states are mandatory.

Never remove browser focus without replacing it.

---

## Color Usage

Color should never be the only way to communicate meaning.

Examples:

Use:

- Icons
- Labels
- Text

Alongside color.

---

## Contrast

Maintain WCAG 2.2 AA contrast ratios.

Readability always comes before aesthetics.

---

## Motion

Respect reduced-motion preferences.

Avoid excessive animations.

---

# 45. Motion & Animation

Animation should enhance—not entertain.

---

## Principles

Animations should:

- Feel responsive
- Be subtle
- Support interactions

Avoid decorative animations.

---

## Appropriate Uses

- Hover
- Focus
- Expand / Collapse
- Success feedback

---

## Avoid

- Floating elements
- Continuous animations
- Long transitions
- Parallax
- Attention-seeking effects

Project 50 is a utility product—not a marketing website.

---

# 46. Category Customization

Each category may introduce small visual adjustments while preserving the core design system.

---

## Health

Examples:

- Nutrition cards
- Progress visuals
- Health status colors

---

## Student

Examples:

- Semester cards
- Grade summaries
- Academic insights

---

## Finance

Examples:

- EMI tables
- Payment breakdowns
- Comparison cards

---

## Utility

Examples:

- Copy actions
- Quick results
- Lightweight interfaces

---

## Creator

Examples:

- Live previews
- Export controls
- Character counters

These changes should feel evolutionary—not revolutionary.

---

# 47. Design Anti-Patterns

The following are prohibited.

❌ Creating one-off layouts.

❌ Different spacing systems.

❌ Different card styles.

❌ Different button styles.

❌ Different typography scales.

❌ Different border radii.

❌ Mixing icon libraries.

❌ Inconsistent gradients.

❌ Walls of text.

❌ Result sections below educational content.

❌ Decorative graphics without purpose.

❌ Hidden primary actions.

❌ Multiple competing primary buttons.

---

# 48. Final Design Checklist

Before approving any tool, verify:

- [ ] Matches Project 50 layout
- [ ] Uses shared card system
- [ ] Uses shared typography
- [ ] Uses shared spacing
- [ ] Uses shared buttons
- [ ] Uses shared inputs
- [ ] Hero Result appears first
- [ ] Supporting cards are logically grouped
- [ ] Related Tools use shared layout
- [ ] SEO sections follow standard structure
- [ ] FAQ uses shared accordion
- [ ] Mobile layout remains consistent
- [ ] Accessibility requirements satisfied
- [ ] No design anti-patterns introduced

---

# Final Design Statement

Project 50's design system exists to create **one cohesive product**, not fifty independent tools.

Every improvement should strengthen the overall experience rather than optimize a single page in isolation.

When making design decisions, always prioritize:

1. User Understanding
2. Task Completion
3. Consistency
4. Accessibility
5. Performance
6. Visual Appeal

If there is ever uncertainty, choose the solution that makes Project 50 feel **more unified, more predictable, and easier to use**.

---

**End of `docs/design-system-and-ui-guidelines.md` Version 1.0**