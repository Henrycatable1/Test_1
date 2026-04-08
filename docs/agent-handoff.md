# Agent Handoff

## Purpose
This file helps future agents understand the product, architecture direction, constraints, and documentation workflow before making changes.

## Product Summary
This project is a cat health log app focused on:
- capturing daily cat health and care logs
- surfacing useful follow-up prompts and warnings
- showing trends over time
- sharing recent summaries with vets

MVP 1.0 is web-first and optimized for quick validation.

## Current Product Constraints
- Start with one user managing one cat
- Use rules-based feedback, not LLM-generated health analysis
- Prioritize speed of logging and clarity of dashboard prompts
- Keep the codebase easy for humans and future AI agents to extend

## Required Docs To Read Before Editing
- `README.md`
- `RULE.md`
- `planning.md`
- `docs/game-plan.md`
- `docs/data-model.md`
- `docs/log-catalog.md`
- `docs/rule-catalog.md`
- `docs/change-playbook.md`
- `docs/product-decisions.md`
- `backlog.md`

## Working Assumptions
- New log items must be cataloged before implementation
- New rules must be cataloged before implementation
- Product logic must not be hidden in UI components
- Future Figma integration should adapt to the existing architecture, not replace it

## Figma Implementation Notes
- Use the official Figma MCP when the design prototype is ready
- Pull frame-level design context into the existing feature structure
- Reuse components and naming conventions where possible
- Keep product logic, rules, and schema independent from visual styling

## Deferred Areas
- multi-cat support
- shared caretakers
- subscription billing
- LLM-generated analysis
- native mobile client

## Commenting Expectations
- Use short `###` comments for non-obvious intent and assumptions
- Avoid low-value comments that only restate code

## If You Are Asked To Add Something New
1. Check `backlog.md` to see whether the item was already discussed.
2. Ask for missing product details.
3. Update the relevant catalog doc first.
4. Then update implementation.
