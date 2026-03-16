# Service Map Controls – Implementation Plan

## Overview

Add a left-side controls panel to the Service Map (aligned with [Figma design](https://www.figma.com/design/sgX7SIC0PkXCkOvRO7633d/Map-1.0---Customer-Sessions-Prototype) and the provided screenshot) with:

1. **Trigger**: Button on the left that opens a menu.
2. **Search bar** (top of menu): "Find in page" style; supports **go to service** (zoom/center on node when user selects a service by name).
3. **Group by** dropdown: APM fields to group services; use React Flow subflows; each group has its own color.
4. **Filters** (show/hide services):
   - **Alerts**: Toggle – show only services that have any active alerts.
   - **SLO status**: Multiselect – which SLO statuses to show (healthy, noData, degrading, violated).
   - **Anomaly status**: Multiselect – which anomaly/health statuses to show (healthy, warning, critical, unknown).

---

## 1. Left Panel Button + Menu

- **Location**: Left edge of the map (same area as current React Flow `<Controls>` in `graph.tsx`).
- **Behavior**: A single button (e.g. gear or "Controls") that toggles a slide-out panel or popover.
- **Content of menu** (top to bottom):
  - Search bar (see §2).
  - "Show only active alerts" toggle.
  - "Controls" section: badge toggles (Show SLOs badge, Show alerts badge, Show anomaly status) – can stay as in screenshot or be moved into this menu.
  - "Group by" dropdown (see §3).
  - "Presentation": Horizontal / Vertical layout (existing behavior if already present; otherwise add).
- **Implementation**: New component e.g. `ServiceMapControlsPanel` that wraps the existing `<Controls>` and adds a toggle + `EuiPopover` or `EuiCollapsibleNav` for the menu. State (panel open/closed, filter values, group-by, layout) can live in the Service Map page or in a context that the graph and this panel both consume.

**Files to touch**: `graph.tsx` (add panel + state), new `service_map_controls_panel.tsx` (or split into `service_map_controls_menu.tsx`).

---

## 2. Search Bar + Go to Service

- **Placement**: Top of the left menu.
- **Behavior**:
  - Input: "Find in page" / "Search services" – user types to filter or search service names.
  - When the user selects a service (e.g. from a dropdown or list of matches), trigger **go to service**: center the view on that node and optionally zoom (like the [Storybook story](https://ci-artifacts.kibana.dev/storybooks/pr-255575/apm/index.html?path=/story/app-servicemap-user-flows-service-map-alerts-and-slos-search-and-group-by--alerts-and-slos-search-and-group) and the implementation in [PR 255575](https://github.com/elastic/kibana/pull/255575)).
- **Implementation**:
  - Use existing `reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom, duration })` (see `popover.tsx` ~line 179). Alternatively `fitView({ nodes: [nodeId], duration })` if React Flow supports fitting to a single node.
  - Search: filter `nodes` (service nodes only by `data.label` or `id`) and show a list; on select, get node by id and call `setCenter`/fitView.
  - The search can be client-side over current map nodes; no API change required.

**Files**: New component e.g. `ServiceMapSearchBar.tsx` (or inside the controls panel), and pass `nodes` + `reactFlowInstance` (from `useReactFlow()` inside the graph) via callback or context so the panel can trigger "go to service".

---

## 3. Group By Dropdown + Subflows + Colors

- **Data**: Service nodes already have `data.label` (service name), and from `ServicesResponse` we have `service.name`, `agent.name`, `service.environment` (and optionally more from API). Use these for grouping.
- **APM fields for dropdown**: At minimum: `service.name` (no grouping / one per service), `service.environment`, `agent.name`. Can be extended with any APM field that exists on the service map response (e.g. from `@kbn/apm-types` or `common/es_fields/apm`). Reuse or mirror the list used in alerting rule "Group by" (e.g. `getAllGroupByFields` + service-map-specific fields).
- **Subflows**: Use React Flow’s **parent/child** model:
  - When "Group by" is set to a field (e.g. `service.environment`):
    - Create one **group node** per distinct value (e.g. "production", "staging").
    - Assign each service node’s `parentId` to the corresponding group node id.
  - Add a new **node type** (e.g. `SubflowGroupNode` or `ServiceMapGroupNode`) that renders as a container (rounded rectangle, label, distinct color). Register it in the graph’s `nodeTypes`.
  - **Colors**: Define a palette (e.g. from `euiTheme`) and assign each group a color by index (group 1 → color 1, etc.).
- **Layout**: Current `applyDagreLayout` uses `compound: false`. Options:
  - **A**: Run Dagre per group (subgraph of nodes in that group + internal edges), get positions, then offset by group node position; set group node size from bounding box of children. This keeps edges between groups as cross-group edges in React Flow.
  - **B**: Use React Flow’s built-in layout or a compound Dagre if available; otherwise same as A with manual offset.
- **Edges**: Edges between nodes in different groups remain edges between those nodes; React Flow will draw them across group boundaries. No change to edge type.

**Files**:
- New: `service_map_group_node.tsx` (group container component).
- `graph.tsx`: register new node type; accept `groupByField: string | null` and apply grouping (derive group nodes + set `parentId` on service nodes) before or after `applyDagreLayout`.
- Common: optional `service_map_grouping.ts` (or in `common/service_map/`) to compute group keys from node data and build group nodes + parentId mapping. Types in `common/service_map/types.ts` for group node data.

---

## 4. Filter: Show/Hide by Alerts, SLO, Anomaly

- **Data**: Already on service nodes: `alertsCount`, `sloStatus`, `sloCount`, `serviceAnomalyStats.healthStatus` (see `ServiceNodeData` in `common/service_map/types.ts` and `service_node_badges.tsx`).
- **Alerts (toggle)**:
  - "Show only active alerts": when ON, filter to nodes where `(data as ServiceNodeData).alertsCount > 0` (only for service nodes). Dependency/group nodes can be shown if they are connected to a visible service, or hidden (simplest: hide dependency nodes that have no visible service endpoints).
- **SLO status (multiselect)**:
  - Options: healthy, noData, degrading, violated (from `SloStatus` in `common/service_inventory.ts`).
  - When user selects one or more, show only service nodes whose `sloStatus` is in the selected set. If "no SLO" should be showable, add a synthetic option (e.g. "No SLO") for nodes with no `sloStatus`.
- **Anomaly status (multiselect)**:
  - Options: healthy, warning, critical, unknown (from `ServiceHealthStatus` in `common/service_health_status.ts`).
  - Show only service nodes whose `serviceAnomalyStats?.healthStatus` is in the selected set. Nodes without anomaly data can be "unknown" or a separate "No anomaly data" option.
- **Implementation**: Apply filters in the same layer that prepares `nodes` and `edges` for the graph (e.g. in the page or in a hook that takes API data + filter state and returns filtered nodes/edges). Remove edges that reference removed nodes; optionally remove dependency nodes that end up with no connections.
- **Default**: All toggles off / all options selected = show all (current behavior).

**Files**: Filter logic in `use_service_map.ts` (return filtered list) or in the page component that holds filter state; pass filter state into the graph. Optionally a small util `filterServiceMapNodes(nodes, edges, filters)` in `common/service_map/` or next to the graph.

---

## 5. State and Wiring

- **Where state lives**: Prefer the **Service Map page** (`service_map/index.tsx`) or a small **context** (e.g. `ServiceMapControlsContext`) so that:
  - Graph receives: `nodes`, `edges`, `groupByField`, `layoutDirection`, and optionally `onGoToService`.
  - Controls panel receives: same filter state, `groupByField`, `layoutDirection`, list of service nodes for search, and callbacks to update state and trigger "go to service".
- **URL/session**: Optionally persist panel open/closed, group-by, and filters in URL params or session storage so the view can be shared or restored.

---

## 6. Order of Implementation

1. **Left panel + menu shell**: Button and collapsible panel with placeholder sections (no behavior yet).
2. **Search + go to service**: Implement search list and setCenter/fitView when a service is selected.
3. **Filters**: Implement alerts toggle, SLO multiselect, anomaly multiselect, and wire filtered nodes/edges to the graph.
4. **Group by + subflows**: Add group node type, compute groups from field, set parentId and colors, adjust layout (Dagre per group or manual offset).
5. **Presentation (Horizontal/Vertical)**: If not already present, add layout direction to layout options and wire to `applyDagreLayout` rankdir.
6. **Polish**: i18n, a11y, tests, and alignment with Figma (spacing, labels).

---

## 7. References

- Figma: [Map 1.0 - Customer Sessions Prototype](https://www.figma.com/design/sgX7SIC0PkXCkOvRO7633d/Map-1.0---Customer-Sessions-Prototype?node-id=0-1)
- Storybook (search + group by): [alerts-and-slos-search-and-group](https://ci-artifacts.kibana.dev/storybooks/pr-255575/apm/index.html?path=/story/app-servicemap-user-flows-service-map-alerts-and-slos-search-and-group-by--alerts-and-slos-search-and-group)
- PR 255575 (go to service): [changes](https://github.com/elastic/kibana/pull/255575/changes)
- Existing "go to" in app: `popover.tsx` uses `reactFlowInstance.setCenter(selectedNode.position.x, selectedNode.position.y, { zoom, duration })`.
