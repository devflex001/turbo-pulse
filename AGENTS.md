<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project Standards

This project uses:

* Next.js
* TypeScript
* Tailwind CSS
* ShadCN UI

The objective is a professional, enterprise-grade user experience with minimal visual noise, predictable behavior, and maintainable code.

---

# Core Rules

## 1. Never Assume

If requirements are unclear:

* Stop.
* Ask questions.
* Request clarification.
* Do not invent requirements.
* Do not guess functionality.
* Do not infer business logic.

Questions are always preferred over assumptions.

---

## 2. ShadCN Only

UI components must come exclusively from the official ShadCN registry.

Allowed:

* Button
* Input
* Textarea
* Select
* Dialog
* Sheet
* Drawer
* Table
* Data Table
* Form
* Card
* Tabs
* Dropdown Menu
* Popover
* Tooltip
* Skeleton
* Alert
* Alert Dialog
* Sonner
* Any component officially available in the ShadCN registry

Requirements:

* Install components from the official ShadCN registry.
* Do not recreate existing ShadCN components.
* Do not build custom replacements for registry components.
* Prefer composition of existing ShadCN components.

---

## 3. No Custom Design Systems

Do not create:

* Custom button variants
* Custom input systems
* Custom card systems
* Custom modal systems
* Custom component libraries

Use ShadCN defaults whenever possible.

---

## 4. No Gradients

Forbidden:

* bg-gradient-*
* text gradients
* gradient borders
* decorative gradients

Use solid colors only.

---

## 5. Minimal Design

The interface must be:

* Clean
* Professional
* Enterprise-grade
* Focused on usability

Avoid:

* Visual clutter
* Decorative elements
* Excessive spacing
* Unnecessary cards
* Excessive icons
* Fancy animations
* Dashboard-style bloat

Every element must have a purpose.

---

## 6. Avoid Unnecessary Cards

Do not wrap everything inside cards.

Only use cards when:

* Information requires visual grouping
* The layout benefits from separation
* There is a clear UX reason

If a simple layout works, do not introduce cards.

---

## 7. International Standards

Follow established UX conventions:

### Forms

* Labels above inputs
* Required fields clearly marked
* Consistent validation
* Accessible error messages

### Tables

* Sortable when appropriate
* Responsive
* Clear column naming

### Navigation

* Predictable placement
* Consistent behavior
* Keyboard accessible

### Accessibility

* Semantic HTML
* Keyboard navigation
* Proper aria attributes
* Screen reader compatibility

WCAG compliance should be considered by default.

---

## 8. Hover States

All inputs must use the project's primary color for:

* Hover state
* Focus state
* Active state

Use ShadCN patterns and Tailwind utility classes.

Do not invent custom color systems.

---

## 9. Layout Standards

Prefer:

* Container layouts
* Proper spacing scales
* Responsive design
* Mobile-first implementation

Avoid:

* Arbitrary spacing values
* Magic numbers
* Positioning hacks

---

## 10. Code Quality

Code must be:

* Type-safe
* Reusable
* Readable
* Maintainable
* Efficient

Requirements:

* TypeScript strict mode
* No unused imports
* No dead code
* No duplicate logic
* No unnecessary abstractions

---

## 11. Component Structure

Prefer:

* Server Components when appropriate
* Client Components only when required
* Small focused components
* Composition over complexity

Avoid:

* Massive components
* Deep prop drilling
* Unnecessary wrappers

---

## 12. Styling Rules

Use:

* Tailwind utilities
* ShadCN styling conventions

Avoid:

* Inline styles
* Custom CSS files unless necessary
* Large custom class systems

Do not override ShadCN styling without justification.

---

## 13. Performance

Prioritize:

* Fast page loads
* Minimal rerenders
* Optimized images
* Efficient data fetching

Avoid:

* Premature optimization
* Unnecessary state
* Unnecessary effects

---

## 14. Before Implementing Any Feature

Always determine:

1. What is the exact requirement?
2. Is there ambiguity?
3. Are there missing business rules?
4. Is clarification needed?

If any answer is yes:

Stop and ask questions.

Never proceed with assumptions.

---

## 15. AI Agent Workflow

For every task:

1. Analyze requirements.
2. Identify missing information.
3. Ask clarifying questions if needed.
4. Choose existing ShadCN components.
5. Implement using TypeScript best practices.
6. Keep UI minimal.
7. Remove unnecessary complexity.
8. Verify accessibility.
9. Verify responsiveness.
10. Verify code quality.

---

## Success Criteria

Every implementation should be:

* Minimal
* Professional
* Accessible
* Responsive
* Maintainable
* Efficient
* Consistent with ShadCN
* Free of unnecessary UI elements
* Free of assumptions
* Built using official ShadCN components whenever available
