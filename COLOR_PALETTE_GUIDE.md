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

### Issue 7: Discover Churches Page Theme Update
**Problem:** Discover Churches page was still using the old warm sacred earth theme (brown/gold colors) instead of the new blue sky palette.

**Solution:** Updated all discover page files to use blue colors:
1. Changed template to load `blue-sky-vars.css` and `blue-sky-theme.css` instead of warm-sacred-earth theme
2. Updated all brown/gold color references to blue in both CSS files
3. Replaced all `rgba(139, 69, 19, ...)` with `rgba(30, 144, 255, ...)`
4. Updated gradients from brown/cream to blue/white
5. Changed hover states and interactive elements to use blue accent colors

**Files Modified:**
- `templates/core/discover.html` - Updated theme CSS imports and container class
- `static/css/discover.css` - Replaced all brown colors with blue palette
- `static/css/pages/discover.css` - Replaced all brown colors with blue palette

**Color Changes:**
- Page header background: Brown gradient → White to Alice Blue gradient
- Search section borders: Brown → Blue (`rgba(30, 144, 255, 0.15)`)
- Button gradients: Brown/Gold → Dodger Blue/Royal Blue
- Church cards: Cream background → White to Alice Blue gradient
- Avatar placeholders: Teal → Blue gradient
- Focus states: Purple → Blue
- All shadows: Brown tints → Blue tints

### Issue 8: Church Detail Page Theme Update
**Problem:** Church Detail page was using the warm sacred earth theme with extensive brown/gold/parchment styling throughout the page.

**Solution:** Comprehensively updated the church detail page to use blue colors:
1. Changed template to load `blue-sky-vars.css` and `blue-sky-theme.css`
2. Updated church header from parchment texture to clean white/blue gradient
3. Replaced all brown color references with blue equivalents
4. Updated cover image placeholder backgrounds to blue gradients
5. Changed avatar placeholders from teal to blue gradient
6. Updated all stat items, buttons, and interactive elements to blue theme
7. Converted tabs from brown/cream to blue/white styling
8. Updated content sections from parchment cards to clean blue cards

**Files Modified:**
- `templates/core/church_detail.html` - Updated theme CSS imports and container class
- `static/css/pages/church_detail.css` - Replaced all brown/gold colors with blue palette

**Key Color Transformations:**
- Church header: Parchment texture → White to Alice Blue gradient
- Cover background: Cream (`#FFF9E6`) → Blue gradient (`#E8F4FF` → `#C8E0F7`)
- Avatar placeholder: Teal (`#0f766e`) → Blue (`#4169E1` → `#1E90FF`)
- Stat items: Brown background → Alice Blue background
- Follow button: Brown/Gold → Dodger Blue/Royal Blue
- Message button: Brown → Blue with blue hover
- Content sections: Parchment cards → Clean white/blue cards
- Tabs: Brown/cream → Blue/white with blue accents
- **Post cards**: Parchment texture → Clean white cards with blue borders
- **Post actions bar**: Brown/tan → Light blue background
- **Post action buttons**: Brown → Muted blue, hover to bright blue
- **Comment input**: Cream background → White with blue border
- All borders: `rgba(139, 69, 19, ...)` → `rgba(30, 144, 255, ...)`
- All shadows: Brown-tinted → Blue-tinted

**Post Card & Comments Update (2025-10-20):**
- Post cards now use clean white background instead of parchment texture
- Actions bar changed from brown/tan to light alice blue
- Like/Comment/Share buttons changed from brown to blue on hover
- Comment input fields changed from cream to white with blue borders
- All text colors updated to match blue theme (dark blue for text, muted blue for metadata)
- Comment section container backgrounds set to transparent
- Comment form backgrounds set to transparent to prevent beige overlay

**Final Updates - Tabs, Modals & Forms (2025-10-20):**
- Tab buttons: Base color brown → Muted blue with `!important` flag
- Form labels: Brown → Dark blue (`#1A3A52`)
- Form inputs: Cream with wood texture → Light blue-gray (`#F7F9FC`)
- Form borders: Brown → Blue (`rgba(30, 144, 255, 0.2)`)
- Textarea: Cream with paper texture → Light blue-gray
- Focus states: Gold → Blue with blue glow
- File upload area: Brown dashed border → Blue dashed border
- Upload icon: Brown → Blue
- Character counter: Brown → Muted blue
- Remove image button: Brown → Blue
- Primary buttons: Brown/Gold gradient → Blue gradient (`#1E90FF` → `#4169E1`)
- Secondary buttons: Cream → Light blue-gray with blue border
- Button hover states: All updated to blue variants

---

## Events Page Recoloring (2025-10-20)

**Template Updated:** `templates/core/events.html`
- Changed theme from Warm Sacred Earth to Blue Sky
- Updated CSS imports to use `blue-sky-vars.css` and `blue-sky-theme.css`
- Changed container class from `warm-sacred-earth` to `blue-sky`

**Result:** Events page now uses the blue sky theme with all post cards, buttons, and UI elements displaying in blue colors.

---

## My Appointments Page Recoloring (2025-10-20)

**Templates Updated:**
- `templates/core/my_appointments.html` - Changed theme from Warm Sacred Earth to Blue Sky

**CSS Files Updated:**
- `static/css/pages/appointments.css` - Comprehensive blue theme conversion

**Key Color Transformations:**
- Status pills container: Cream/parchment → Light blue gradient (`#F0F8FF` → `#E8F4FF`)
- Status pills: Brown borders → Blue borders (`rgba(30, 144, 255, 0.2)`)
- Active pill: Brown/gold gradient → Blue gradient (`#1E90FF` → `#4169E1`)
- Booking cards: Brown borders/shadows → Blue borders/shadows
- Service names: Brown → Dark blue (`#1A3A52`)
- Icons: Brown → Blue (`#1E90FF`)
- Action buttons: Brown → Blue with light blue hover
- All shadows: Brown-tinted → Blue-tinted

**Result:** My Appointments page now fully uses the blue sky theme with status filters, booking cards, and all interactive elements in blue colors.

---

## Following Page Recoloring (2025-10-20)

**Templates Updated:**
- `templates/core/following.html` - Changed theme from Warm Sacred Earth to Blue Sky

**CSS Files Updated:**
- `static/css/pages/following.css` - Comprehensive blue theme conversion

**Key Color Transformations:**
- Church cards: Parchment texture → Clean white to light blue gradient (`#FFFFFF` → `#F0F8FF` → `#E8F4FF`)
- Card borders: Brown → Blue (`rgba(30, 144, 255, 0.15)`)
- Card shadows: Brown-tinted → Blue-tinted (`rgba(30, 144, 255, 0.12)`)
- Avatar placeholder: Brown/Gold gradient → Blue gradient (`#4169E1` → `#1E90FF`)
- Avatar borders: Brown → Blue (`rgba(30, 144, 255, 0.2)`)
- Church badges: Brown background → Light blue background (`rgba(30, 144, 255, 0.1)`)
- Badge text: Brown → Blue (`#1E90FF`)
- Detail icons: Brown → Blue (`#1E90FF`)
- Follow button: Brown → Blue with gradient hover
- Follow button (active): Brown/Gold → Blue gradient (`#1E90FF` → `#4169E1`)
- Empty state: Parchment → White to light blue gradient
- All hover states: Brown tints → Blue tints

**New Components Added:**
- `.church-content` - Content section styling
- `.church-description` - Description text styling
- `.church-details` - Details container
- `.detail-item` - Individual detail items with icons
- `.church-badges` - Badge container
- `.denomination-badge`, `.size-badge` - Badge styling
- `.avatar-placeholder` - Avatar placeholder styling
- `.avatar-image` - Avatar image styling
- `.follow-btn` - Follow button with states
- `.empty-state` - Empty state message styling

**Result:** Following page now fully uses the blue sky theme with church cards, badges, buttons, and all interactive elements displaying in clean blue colors.

---

## Notifications Page Recoloring (2025-10-20)

**Templates Updated:**
- `templates/core/notifications.html` - Changed theme from Warm Sacred Earth to Blue Sky

**CSS Files Updated:**
- `static/css/pages/notifications.css` - Comprehensive blue theme conversion

**Key Color Transformations:**
- Page title: Brown gradient text → Dark blue (`#1A3A52`)
- Page subtitle: Brown → Muted blue (`#5A7A92`)
- Header border: Brown → Blue (`rgba(30, 144, 255, 0.2)`)
- "Mark All Read" button: Gold/Brown gradient → Blue gradient (`#1E90FF` → `#4169E1`)
- Filter tabs: Parchment texture → Clean white to light blue gradient
- Active filter tab: Gold gradient → Blue gradient with white text
- Notification items: Parchment texture → Clean white to light blue gradient
- Unread notifications: Enhanced parchment → Enhanced light blue gradient
- Notification indicator bar: Gold → Blue gradient
- Notification icons: Gold background → Blue gradient background with white icons
- Notification title: Brown → Dark blue (`#1A3A52`)
- Notification time: Brown → Muted blue (`#7A9AB2`)
- Notification message: Brown → Muted blue (`#5A7A92`)
- Action buttons: Brown outline → Blue outline, hover to blue gradient
- Mark read button: Parchment → Light blue, hover to blue gradient
- Notification dot: Gold → Blue with pulse animation
- Empty state: Parchment → White to light blue gradient
- Empty state icon: Gold background → Blue gradient background
- Priority urgent: Red accent with parchment → Red accent with white/blue
- Priority high: Orange accent with parchment → Orange accent with white/blue
- Priority low: Brown accent → Muted blue accent
- All shadows: Brown-tinted → Blue-tinted
- Font family: Georgia serif → System sans-serif

**Result:** Notifications page now fully uses the blue sky theme with all notification items, filters, buttons, and states displaying in clean blue colors with modern sans-serif typography.

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
- ✅ Discover Churches page (Updated 2025-10-20)
- ✅ Church Detail page (Updated 2025-10-20)
- ✅ Events page (Updated 2025-10-20)
- ✅ Appointments page (Updated 2025-10-20)
- ✅ Following page (Updated 2025-10-20)
- ✅ Notifications page (Updated 2025-10-20)
- Profile page
- ✅ Manage Church page (Updated 2025-10-19)

---

## Questions?
For color palette questions or suggestions, please contact the design team.
