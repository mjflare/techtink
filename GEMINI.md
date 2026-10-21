# TechTink Core Instructions & Guidelines

## 1. Vertical Small Screen First (Mandatory Core Priority)
- **Mobile-First Vertical Screen First:** Your approach to the website MUST ALWAYS be the vertical small screen (mobile phones, portrait orientation) FIRST.
- **Pristine Vertical Screen:** The vertical small screen experience must ALWAYS be pristine, pixel-perfect, thumb-friendly, and ergonomically flawless:
  - Immediate, natural visual hierarchy: Brand, model name, grade badge, and price must be immediately clear without requiring unnecessary vertical scrolling.
  - Zero accidental horizontal overflow: Never use fixed large minimum widths (e.g. tables with `min-width: 700px`) on mobile without dedicated card views or touch-scroll containers (`touch-scroll-x`).
  - Ergonomic touch targets: Interactive elements, pills, and configurator buttons must have a minimum tap target of 44-48px.
  - Safe area compliance: Persistent sticky action bars, bottom navigation, and drawers must integrate `env(safe-area-inset-bottom)`.
  - Native gesture handling: Touch swiping, tap feedback (`:active`), and seamless scrolling without sticky hover states or delayed taps.
- **Other Orientations & Large Screens:** Other screen sizes and orientations (desktop horizontal view, tablet landscape, wide displays) must be optimized to work great and take advantage of horizontal space (e.g. 2-column hero layouts, 12-column Bento grids, side-by-side data tables), but the vertical screen remains the primary, uncompromising foundation.

## 2. Single-Page App (SPA) Navigation & Scroll Integrity
- Always disable automatic browser scroll restoration for SPA routes (`history.scrollRestoration = 'manual'`).
- Whenever navigating to any product, category, or tab, ensure an instant, reliable scroll reset to top `(0, 0)` both before and after DOM rendering.
