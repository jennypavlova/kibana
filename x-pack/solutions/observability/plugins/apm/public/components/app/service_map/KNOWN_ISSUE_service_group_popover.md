# Known issue: Popover can throw on service group service map

## Summary

Opening a **service node** popover on the **service group** service map (Service groups → pick a group → Service map tab) can cause an uncaught error in `PopoverContent`, which crashes the error boundary.

**Error:** `Expected rangeFrom and rangeTo to be set`

**Location:** `popover/service_contents.tsx` — `ServiceContents` throws when the route `query` does not contain `rangeFrom` and `rangeTo`.

## Root cause

1. **ServiceContents** relies on `useAnyOfApmParams('/service-map', '/services/{serviceName}/service-map', '/mobile-services/{serviceName}/service-map')` and assumes `query` always has `rangeFrom` and `rangeTo`.
2. On the **service group** service map, the matched route is defined (in `home/index.tsx`) with params **only** `query: { serviceGroup: string }` — no `rangeFrom`/`rangeTo` in that route’s schema.
3. Depending on how the router merges parent/child params, `query` may only have `serviceGroup`, so the check fails and the code throws instead of handling missing date params.

## When it happens

- **Context:** User is on the service group service map (e.g. URL like `/service-map?serviceGroup=<id>` or navigated via Service groups → [group] → Service map).
- **Action:** User clicks a **service** node to open the popover.
- **Result:** `ServiceContents` runs, the throw fires, and the error boundary shows the “The above error occurred in PopoverContent” stack.

It may not reproduce after a refresh or when coming from a page that already set `rangeFrom`/`rangeTo` in the URL (e.g. global service map), because the effective query can still contain those params in some flows.

## History

- The throw was introduced in **August 2021** (commit #107717, “[APM] Make rangeFrom/rangeTo required”) when the service map still used **Cytoscape**.
- The same `ServiceContents` (with the same route/param logic and throw) was used by the Cytoscape popover, so this is an **existing bug**, not introduced by the React Flow migration.

## Suggested fix (for a separate change)

- Do **not** throw. If `query.rangeFrom` / `query.rangeTo` are missing, fall back to the `start` and `end` already passed into `ServiceContents` via `ContentsProps` (the parent passes them from the service map page).
- If neither query nor props provide a valid time range, **return null** (or a minimal “time range not set” state) instead of throwing, so the popover never crashes.

No code change is made for this in the current work; it is tracked as a separate issue.
