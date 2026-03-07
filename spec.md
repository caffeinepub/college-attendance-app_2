# Attenly

## Current State
- Staff portal (StaffLoginPage, StaffDashboardPage) and Student Lookup page (StudentLookupPage) have plain white/light backgrounds with no animation.
- The "Add Subject" feature calls `saveSubjectsForDept` on the backend but errors silently -- the result check uses `result.__kind__ === "err"` which may not match the actual canister response shape, causing the error to surface as a toast but leaving subjects unsaved.

## Requested Changes (Diff)

### Add
- Floating small dots animation background layer on StaffLoginPage, StaffDashboardPage, and StudentLookupPage -- sky blue base color with small white/light dots floating upward (CSS keyframe animation, rendered as an absolute-positioned canvas or SVG dots layer).
- A reusable `FloatingDotsBackground` component (in `src/frontend/src/components/FloatingDotsBackground.tsx`) that renders the animated dots and can be placed behind page content.

### Modify
- StaffLoginPage: wrap content in `relative` container, add `FloatingDotsBackground` behind content, set page background to sky blue gradient.
- StaffDashboardPage: same treatment -- sky blue gradient background with floating dots behind all content.
- StudentLookupPage: same treatment -- sky blue gradient background with floating dots behind all content.
- All three pages' sticky headers should use a sky-blue-tinted backdrop blur instead of plain background.
- `useSaveSubjectsForDept` in `useQueries.ts`: fix the result check -- the backend `saveSubjectsForDept` returns a `Result` variant. The current check `result.__kind__ === "err"` may be incorrect; use proper variant checking (`'err' in result` or checking `result.ok` vs `result.err`).

### Remove
- Nothing removed.

## Implementation Plan
1. Create `FloatingDotsBackground` component with CSS-keyframe animated dots on a sky blue gradient background.
2. Add the component to StaffLoginPage, StaffDashboardPage, StudentLookupPage -- wrap each page root with `relative overflow-hidden`, and place the dots behind content with `absolute inset-0 -z-10`.
3. Update each page's root background class to sky blue (`bg-sky-500` gradient or similar) and update sticky header backdrop to sky-blue-tinted.
4. Fix `useSaveSubjectsForDept` result handling to correctly detect error vs success variant from the Motoko backend.
