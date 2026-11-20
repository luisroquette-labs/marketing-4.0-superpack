# ADR 0002: Graph interaction and rendering

Status: accepted

## Context

Graph labels and IDs originate in source documents and can contain HTML metacharacters. Neighbor links are rebuilt in `innerHTML` when the selected node changes. Hyperedges need stable outlines around nodes placed by vis-network.

## Decisions

Escape graph-derived text and attribute values before interpolating them into HTML. Use a delegated listener for neighbor links so rebuilding the link list does not remove their behavior. This replaced an inline event-handler path implicated in stored XSS (issue #1838 in the graph's source history).

Draw hyperedges in the network coordinates already supplied to `afterDrawing`. Order member positions with a monotone-chain convex hull before tracing the perimeter; arbitrary member order can cross itself. For fewer than three distinct hull points, retain the points as a degenerate outline.

## Consequences

Document-derived values stay inside text and attribute boundaries, and neighbor links remain interactive after redraws. Hyperedge outlines follow the visible node perimeter without another pan, zoom, or pixel-ratio transform. Issue #3 tracks removal of the separate hover-based click-selection workaround.
