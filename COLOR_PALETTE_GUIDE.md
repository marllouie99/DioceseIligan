# ChurchIligan Color Palette Guide

## Overview
This document defines the official color palette for the ChurchIligan system, inspired by Facebook's clean and professional design approach.

---

## Primary Color Palette

### Blue Accent Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Dodger Blue** | `#1E90FF` | rgb(30, 144, 255) | Primary buttons, links, active states, brand accent |
| **Royal Blue** | `#4169E1` | rgb(65, 105, 225) | Button gradients, secondary accents |
| **Bright Blue** | `#4A9EFF` | rgb(74, 158, 255) | Hover states, highlights |

### Background Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Alice Blue** | `#F0F8FF` | rgb(240, 248, 255) | Main page background (light) |
| **Very Light Blue** | `#E8F4FF` | rgb(232, 244, 255) | Background gradient middle |
| **Light Blue** | `#E0F0FF` | rgb(224, 240, 255) | Background gradient end |
| **Pure White** | `#FFFFFF` | rgb(255, 255, 255) | Cards, forms, content areas |

### Text Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Dark Blue-Gray** | `#1A3A52` | rgb(26, 58, 82) | Primary text, headings |
| **Muted Blue-Gray** | `#5A7A92` | rgb(90, 122, 146) | Secondary text, labels |
| **Light Muted Blue** | `#7A9AB2` | rgb(122, 154, 178) | Placeholder text, disabled text |

### Input & Form Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Light Gray** | `#F7F9FC` | rgb(247, 249, 252) | Input field backgrounds |
| **Border Gray** | `#E4E6EB` | rgb(228, 230, 235) | Input borders, dividers |

---

## Color Usage Guidelines

### 1. Backgrounds
- **Main Page Background**: Use subtle blue gradient (`#F0F8FF` → `#E8F4FF` → `#E0F0FF`)
- **Cards & Containers**: Use white (`#FFFFFF`) or near-white (`rgba(255, 255, 255, 0.95-0.98)`)
- **Keep it Clean**: Avoid heavy color overlays - let white dominate

### 2. Text
- **Primary Text**: Always use `#1A3A52` (Dark Blue-Gray) on white backgrounds
- **Secondary Text**: Use `#5A7A92` (Muted Blue-Gray) for less important text
- **Links**: Use `#1E90FF` (Dodger Blue) for all clickable links
- **Never use white text on white backgrounds**

### 3. Buttons

#### Primary Button
```css
background: linear-gradient(180deg, #1E90FF, #4169E1);
color: #FFFFFF;
```

#### Secondary Button
```css
background: rgba(255, 255, 255, 0.8);
border: 2px solid rgba(30, 144, 255, 0.2);
color: #1A3A52;
```

#### Button Hover States
- Add slight elevation with shadow
- Brighten by 5-10%
- Use blue glow: `box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1)`

### 4. Input Fields
```css
background: #F7F9FC;
border: 2px solid #E4E6EB;

/* On Focus */
background: #FFFFFF;
border: 2px solid #1E90FF;
box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
```

### 5. Interactive Elements
- **Hover**: Add blue tint `rgba(30, 144, 255, 0.1)`
- **Active/Selected**: Use solid blue `#1E90FF`
- **Focus**: Blue ring `0 0 0 3px rgba(30, 144, 255, 0.1)`
- **Disabled**: Reduce opacity to 0.6-0.7

---

## Design Principles

### ✅ DO
- Use white as the primary background color for cards and forms
- Use blue (`#1E90FF`) as accent color for interactive elements
- Maintain high contrast ratios (WCAG AA minimum)
- Keep backgrounds clean and minimal
- Use subtle shadows for depth
- **Keep navigation links dark by default, blue only on hover**
- Use dark text (`#1A3A52`) for all non-interactive content

### ❌ DON'T
- Don't make everything blue - use it sparingly as accent
- Don't use white text on white backgrounds
- Don't use heavy gradients or textures on main content areas
- Don't use low-contrast color combinations
- Don't mix warm and cool tones
- **Don't make navigation links blue by default** - reduces readability

---

## Design Patterns

### Navigation Link Pattern
**Rule:** Navigation links should be dark by default, blue only on hover/active.

**Applies to:**
- Sidebar navigation links
- Profile dropdown menu links
- Any navigation menu
- Breadcrumbs

**Example:**
```css
/* Default state - dark for readability */
.nav a, .dropdown a {
  color: #1A3A52;
}

/* Hover state - blue for interactivity */
.nav a:hover, .dropdown a:hover {
  color: #1E90FF;
  background: rgba(30, 144, 255, 0.08);
}

/* Active state - blue background */
.nav a.active {
  background: linear-gradient(135deg, #1E90FF 0%, #4169E1 100%);
  color: #FFFFFF;
}
```

### Text Color Hierarchy
1. **Primary text:** `#1A3A52` - Headings, names, navigation, important content
2. **Secondary text:** `#5A7A92` - Descriptions, labels, button text
3. **Tertiary text:** `#7A9AB2` - Timestamps, metadata
4. **Interactive text:** `#1E90FF` - Only on hover or as active links

---

## Accessibility

### Contrast Ratios (WCAG 2.1)
| Combination | Ratio | Status |
|-------------|-------|--------|
| `#1A3A52` on `#FFFFFF` | 10.8:1 | ✅ AAA |
| `#5A7A92` on `#FFFFFF` | 4.8:1 | ✅ AA |
| `#1E90FF` on `#FFFFFF` | 3.2:1 | ✅ AA Large |
| `#FFFFFF` on `#1E90FF` | 3.2:1 | ✅ AA Large |

---

## Component Examples

### Card
```css
background: rgba(255, 255, 255, 0.98);
border: 1px solid rgba(30, 144, 255, 0.15);
box-shadow: 0 20px 40px rgba(30, 144, 255, 0.12);
border-radius: 28px;
```

### Mission Statement / Info Box
```css
background: rgba(255, 255, 255, 0.95);
border: 1px solid rgba(30, 144, 255, 0.15);
box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
border-radius: 20px;
```

### Stats Display
```css
background: rgba(255, 255, 255, 0.95);
border: 1px solid rgba(30, 144, 255, 0.15);
/* Numbers in blue: #1E90FF */
/* Labels in dark text: #1A3A52 */
```

---

## CSS Variables Reference

```css
:root {
  /* Blue Sky Palette */
  --bg-start: #E8F4FF;
  --bg-end: #C8E0F7;
  --bg-medium: #A8D0F0;
  --text: #1A3A52;
  --text-light: #FFFFFF;
  --muted: #5A7A92;
  --muted-2: #7A9AB2;
  --border: rgba(30, 144, 255, 0.25);
  --card-bg: #F5FAFF;
  --pill-bg: #E8F4FF;
  --pill-border: #4A9EFF;
  --btn-start: #1E90FF;
  --btn-end: #4169E1;
  --brand: #1E90FF;
  --accent-blue: #4A9EFF;
  --warm-white: #FFFFFF;
}
```

---

## Migration Notes

### From Warm Sacred Earth Theme
| Old Color | New Color | Component |
|-----------|-----------|-----------|
| `#8B4513` (Brown) | `#1E90FF` (Blue) | Primary brand |
| `#DAA520` (Gold) | `#4A9EFF` (Bright Blue) | Accents |
| `#FFF9E6` (Cream) | `#FFFFFF` (White) | Backgrounds |
| `#2D1810` (Dark Brown) | `#1A3A52` (Dark Blue-Gray) | Text |

---

## Version History
- **v1.0** (2025-10-19): Initial blue palette implementation
  - Based on Facebook's design system
  - Optimized for clean, professional appearance
- **v1.1** (2025-10-19): Dashboard implementation with inline CSS overrides
  - Applied blue theme to dashboard page
  - Resolved CSS specificity conflicts

---

## Implementation Notes & Issues Encountered

### Issue 1: CSS Specificity Conflicts
**Problem:** Multiple CSS files (`church_detail.css`, `warm-sacred-earth-theme.css`, etc.) had hardcoded brown/gold colors that overrode the new blue theme variables.

**Solution:** Added inline CSS with `!important` flags in `dashboard.html` to override all hardcoded colors. This ensures the blue theme takes precedence.

**Files Affected:**
- `static/css/pages/church_detail.css` - Contains hardcoded brown colors
- `static/css/themes/warm-sacred-earth-theme.css` - Old theme file
- `static/css/components/chat-widget.css` - Brown color references

### Issue 2: Browser Caching
**Problem:** CSS changes not appearing immediately due to browser caching the old stylesheets.

**Solution:** 
- Run `python manage.py collectstatic --noinput` after every CSS change
- Hard refresh browser (Ctrl+Shift+R) to clear cache
- Use `?v={{ STATIC_VERSION }}` query parameters in template links

### Issue 3: Template-Level Theme Loading
**Problem:** `app_base.html` was loading `forest-serenity-theme.css` (green theme) before the blue theme.

**Solution:** Replaced `forest-serenity-theme.css` with `blue-sky-vars.css` in the base template to ensure blue variables load first.

### Issue 4: Component-Specific Overrides Needed
**Problem:** Individual components (post cards, comments, chat widget, events, activity feed) retained old colors.

**Solution:** Added comprehensive inline CSS overrides for:
- Post cards and action buttons
- Comments section
- Chat widget (header, body, messages)
- Upcoming Events section
- Recent Activity section
- All hover states

### Issue 5: Hover State Colors
**Problem:** Hover states were still showing brown/gold colors from hardcoded CSS.

**Solution:** Added global hover state overrides with high specificity:
```css
.post-action:hover,
[class*="action"]:hover {
  background: rgba(30, 144, 255, 0.1) !important;
  color: #1E90FF !important;
}
```

### Issue 6: Chat Widget Inconsistency Across Pages
**Problem:** Chat widget styling was only applied on dashboard page (inline CSS), but the widget appears on all pages, causing inconsistent appearance.

**Solution:** Moved chat widget overrides from inline CSS in `dashboard.html` to `blue-sky-theme.css` to ensure global application across all pages.

**Files Modified:**
- `static/css/themes/blue-sky-theme.css` - Added chat widget section with `!important` flags

---

## Recommended Future Improvements

### 1. Refactor CSS Files
Instead of using inline overrides, update the source CSS files:
- Replace all brown color codes in `church_detail.css` with CSS variables
- Update `components/chat-widget.css` to use theme variables
- Remove or archive `warm-sacred-earth-theme.css` and `forest-serenity-theme.css`

### 2. Create Component-Specific Theme Files
Split the large inline CSS block into separate files:
- `themes/blue-sky-dashboard.css`
- `themes/blue-sky-posts.css`
- `themes/blue-sky-chat.css`

### 3. Use CSS Custom Properties Consistently
Replace all hardcoded colors with CSS variables:
```css
/* Instead of: */
background: #8B4513;

/* Use: */
background: var(--brand);
```

### 4. Implement Theme Switcher
Create a system to toggle between themes:
- Store user preference in database
- Load appropriate theme CSS based on preference
- Add theme toggle in settings

### 5. Update Other Pages
Apply the blue theme to remaining pages:
- Discover Churches page
- Church Detail page
- Events page
- Appointments page
- Profile page
- Manage Church page

---

## Questions?
For color palette questions or suggestions, please contact the design team.
