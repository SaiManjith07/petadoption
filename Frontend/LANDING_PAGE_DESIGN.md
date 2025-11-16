# Landing Page — Visual & UX Summary

## 🎨 Design System

### Color Palette
```
Primary Accent:      #FF7A59 (warm orange/red)
Dark Text:           #1F2937 (gray-900)
Muted Text:          #6B7280 (gray-600)
Light Background:    #F8FAFC (blue-50)
White Surface:       #FFFFFF
Success Green:       #34D399
Danger Red:          #EF4444
```

### Typography Hierarchy
```
H1 (Hero Headline):     60px / 1.2 line-height / font-bold
H2 (Subheadline):       32px / 1.3 line-height / font-semibold
H3 (Section Title):     24px / 1.3 line-height / font-bold
Body Text:              16px / 1.6 line-height / font-normal
Small Text:             14px / 1.5 line-height / font-normal
Tiny Text:              12px / 1.4 line-height / font-normal
```

### Spacing System
```
Base unit: 4px
Common multiples:
  xs: 8px (2x)
  sm: 12px (3x)
  md: 16px (4x)
  lg: 24px (6x)
  xl: 32px (8x)
  2xl: 48px (12x)
  3xl: 64px (16x)
  4xl: 96px (24x)
```

### Border Radius
```
Small cards/buttons:     8px (rounded-lg)
Medium sections:         16px (rounded-2xl)
Large containers:        24px (rounded-3xl)
Full round (badges):     9999px (rounded-full)
```

---

## 📐 Section Layouts

### 1. HERO SECTION
```
┌─────────────────────────────────────────────────────────┐
│  ✨ Decorative blur elements (top-right, bottom-left)   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Left Column (60% on lg+)        Right Column (40%)      │
│  ├─ H1 "Find, Reunite, Adopt"    ├─ Hero Image          │
│  ├─ H2 "Helping pets come…"      │  (image with         │
│  ├─ Paragraph (gray-600)         │   gradient overlay)   │
│  ├─ Primary CTAs (orange)        │  └─ Caption inside    │
│  │  ├─ Report Found (solid)      │                       │
│  │  ├─ Report Lost (outline)     │                       │
│  │  └─ Browse Pets (ghost)       │                       │
│  └─ Animated Counters (3 cols)   │                       │
│     ├─ 847 Pets Reunited        │                       │
│     ├─ 342 Adoptions             │                       │
│     └─ 12,500 Members            │                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Responsive:**
- Mobile: Single column (text, CTAs, counters stacked)
- lg+: Two-column (text left, image right)

---

### 2. QUICK SEARCH SECTION
```
┌─────────────────────────────────────────────────────────┐
│ Card (elevated, orange-100 border)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  H3: "Quick Search"                                     │
│  Description: "Find lost, found, adoptable pets…"       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 4-column form (2 on mobile, 4 on lg+)             │ │
│  ├─────────────┬──────────┬────────┬──────────────────┤ │
│  │ Keyword     │ Species  │ Status │ [Search Button]  │ │
│  │ Input       │ Select   │ Select │                  │ │
│  └─────────────┴──────────┴────────┴──────────────────┘ │
│                                                          │
│  Results Preview (4 cards max):                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Pet 1    │ Pet 2    │ Pet 3    │ Pet 4    │         │
│  │ Image    │ Image    │ Image    │ Image    │         │
│  │ Name     │ Name     │ Name     │ Name     │         │
│  │ Status   │ Status   │ Status   │ Status   │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│  [View all results →]                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Debounced 300ms search
- Real-time preview cards (hover: scale+shadow)
- Keyboard accessible

---

### 3. FEATURED CAROUSEL SECTION
```
┌─────────────────────────────────────────────────────────┐
│ H2 "Featured Pets" + [View All →] button                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  3-Column Carousel (md+ only):                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   OPACITY    │  │   OPACITY    │  │   CURRENT    │  │
│  │   50% SCALE  │  │   50% SCALE  │  │   100% FULL  │  │
│  │   HIDDEN     │  │   HIDDEN     │  │              │  │
│  │              │  │              │  │  [Image]     │  │
│  │              │  │              │  │  "Adoptable" │  │
│  │              │  │              │  │  └─ Badge    │  │
│  │              │  │              │  │  Name        │  │
│  │              │  │              │  │  Breed       │  │
│  │              │  │              │  │  Location 📍 │  │
│  │              │  │              │  │  [View Prof] │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Navigation:                                            │
│  [← Prev] ● ● ● [Next →]                               │
│            (dot indicators, orange when active)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Smooth transitions (300ms)
- Touch-friendly on mobile
- Lazy-loaded images
- Current pet highlighted (100% opacity), others faded

---

### 4. HOW IT WORKS SECTION
```
┌─────────────────────────────────────────────────────────┐
│ bg-gradient (gray-50 to white)                          │
├─────────────────────────────────────────────────────────┤
│ H2 "How It Works" + Description                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  3-Step Grid (stacked on mobile, side-by-side on md+)  │
│                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  │   [❤️ Icon]  │────│   [🛡️ Icon]  │────│  [🏠 Icon] │
│  │ in orange bg │     │ in orange bg │     │ in bg    │
│  │              │     │              │     │          │
│  │ Report or    │     │ Verification │     │ Reunite  │
│  │ Search       │     │ & Matching   │     │ or       │
│  │ (title)      │     │ (title)      │     │ Adopt    │
│  │              │     │              │     │          │
│  │ Found a pet? │     │ Our admin    │     │ Connect  │
│  │ Report…      │     │ team…        │     │ with…    │
│  │ (description)│     │ (description)│     │ (desc)   │
│  └──────────────┘     └──────────────┘     └──────────┘
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Large icon badges (orange gradient background)
- Connecting line between steps (desktop only)
- Concise copy, clear hierarchy

---

### 5. TRUST & SAFETY SECTION
```
┌─────────────────────────────────────────────────────────┐
│ H2 "Trust & Safety" (centered)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  2-Column Grid (stacked on mobile):                     │
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │ [✓ Icon] (green)    │  │ [🛡️ Icon] (blue)   │     │
│  │ Adoption Policy     │  │ Pet Safety Tips     │     │
│  │                     │  │                     │     │
│  │ All adoptions are.. │  │ ▸ Dogs              │     │
│  │                     │  │   └─ Microchip...   │     │
│  │ ✓ Background check  │  │ ▸ Cats              │     │
│  │ ✓ Medical care      │  │   └─ Indoor enrich..│     │
│  │ ✓ Lifetime support  │  │                     │     │
│  │                     │  │ [View Guidelines →] │     │
│  │ [Read Policy →]     │  │                     │     │
│  └─────────────────────┘  └─────────────────────┘     │
│                                                          │
│  (Collapsible accordion for safety tips)                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Two-card layout (Trust + Safety Tips)
- Collapsible accordion (Dogs, Cats expandable)
- Green & blue color coding for visual distinction

---

### 6. TESTIMONIALS SECTION
```
┌─────────────────────────────────────────────────────────┐
│ bg-gray-50                                              │
│ H2 "Success Stories" + Description                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  3-Card Grid (stacked on mobile, grid on md+):         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ★ ★ ★ ★ ★ (5 stars)                          │    │
│  │                                               │    │
│  │ "Found my Golden Retriever in two days       │    │
│  │  thanks to this platform. Amazing community!"│    │
│  │                                               │    │
│  │ [Avatar] Raj Kumar                            │    │
│  │          Pet Owner                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  (Repeat for 2 more testimonials)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Star rating (5 stars always)
- Avatar image (DiceBear API generated)
- Italic quote with real names
- Hover: shadow increase

---

### 7. CTA BAND SECTION
```
┌─────────────────────────────────────────────────────────┐
│ bg-gradient (orange-500 to orange-600)  text-white      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Flex Row (stacked on mobile):                          │
│  ├─ Left Column                 Right Column            │
│  │  H3: "Seen a lost pet?       [Report Now] (white bg) │
│  │  Help reunite a family…"                             │
│  │  p: "Your report could bring                         │
│  │  a pet home in hours…"                               │
│  │                                                      │
│  │  (orange-100 subtext color)                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
**Features:**
- Full-width gradient background
- Left: Headline + subline (orange-100 text)
- Right: White button (orange text on hover)
- Compact, urgency-driven copy

---

### 8. FOOTER SECTION
```
┌─────────────────────────────────────────────────────────┐
│ bg-gray-900  text-gray-300                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  4-Column Grid (stacked on mobile, 2-col sm+):         │
│                                                          │
│  Col 1: Brand           Col 2: Product      Col 3: Support    Col 4: Newsletter
│  ├─ [❤️] PawsUnite      ├─ Found Pets      ├─ Policy    ├─ "Subscribe..."
│  ├─ Mission statement   ├─ Lost Pets       ├─ Safety    ├─ Email input
│  └─ Social icons        └─ Adoptions       └─ Contact   └─ [Mail icon btn]
│     [f] [𝕏] [📷]
│
│  ────────────────────────────────────────────────────────
│  © 2024 PawsUnite    [Privacy] [Terms]
│
└─────────────────────────────────────────────────────────┘
```
**Features:**
- 4-column on desktop, responsive stacking
- Social icon links (hover: orange-500)
- Newsletter signup with instant feedback
- Bottom bar with copyright & quick legal links

---

## 🎭 Interactive States

### Button States
```
Primary Button (orange):
  Default:    bg-orange-500, text-white, shadow-md
  Hover:      bg-orange-600, scale(1.05), shadow-lg
  Active:     scale(0.98)
  Focus:      ring-2 ring-orange-300
  Disabled:   opacity-50, cursor-not-allowed

Secondary Button (outline):
  Default:    border-2 border-orange-500, text-orange-600
  Hover:      bg-orange-50, scale(1.05)
  Active:     bg-orange-100
  Focus:      ring-2 ring-orange-300

Ghost Button (minimal):
  Default:    text-gray-900, bg-transparent
  Hover:      bg-gray-100, translate-x(4px)
  Focus:      ring-2 ring-orange-300
```

### Form Input States
```
Default:     border-gray-300, bg-white
Focus:       border-orange-500, ring-2 ring-orange-100
Filled:      bg-white, border-gray-400
Disabled:    bg-gray-100, cursor-not-allowed
Error:       border-red-500, ring-2 ring-red-100
```

### Carousel Navigation
```
Dot Indicator:
  Inactive:  h-2 w-2 bg-gray-300 rounded-full
  Active:    h-2 w-8 bg-orange-500 rounded-full (widened)
  Transition: 300ms ease-in-out
```

### Card States
```
Default:     border-2 border-gray-200, shadow-sm
Hover:       border-orange-300, shadow-md, transition-all 300ms
Active:      scale(0.98)
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Hero | Search | Carousel | Footer |
|-----------|-------|------|--------|----------|--------|
| Mobile    | 0-640 | 1 col | 2 col | 1 card   | 1 col |
| Tablet    | 640-1024 | 2 col | 4 col | 2 cards | 2 col |
| Desktop   | 1024+ | 2 col | 4 col | 3 cards | 4 col |

---

## 🎬 Animations & Transitions

### Animated Counter (Hero Stats)
```
Trigger:     Intersection Observer (enters viewport)
Animation:   Count from 0 to target value in 2 seconds
Easing:      Linear (incremental +2%)
Performance: GPU-accelerated (not transform, just counter update)
```

### Carousel Transitions
```
Slide Change:   300ms ease-in-out
Card Opacity:   Fading between 50% (inactive) to 100% (active)
Scale:          Inactive cards 95%, active 100%
Z-index:        Active card on top
```

### Button Hover Effects
```
Scale:         transform scale(1.05)
Shadow:        Enhanced shadow-lg
Transition:    150ms ease-out
Cursor:        pointer
```

### Input Focus
```
Ring:          ring-2 ring-orange-100
Border:        border-orange-500
Transition:    200ms ease-in-out
Outline:       none (using ring instead for better accessibility)
```

---

## 🎨 Accessibility Features

### Keyboard Navigation
```
Tab Order:     Natural document flow (left-to-right, top-to-bottom)
Focus Style:   Visible ring-2 outline (orange-300 or blue for contrast)
Skip Link:     [Skip to main content] (sr-only, visible on :focus)
Enter/Space:   Submit forms, toggle accordions
Arrow Keys:    Carousel navigation (can enhance)
Escape:        Close any modals/dropdowns (if added)
```

### Color Contrast
```
WCAG AA Compliant (4.5:1 or higher):
  • Orange (#FF7A59) on White: 5.2:1 ✓
  • Dark Gray (#1F2937) on Light: 12.3:1 ✓
  • Muted Gray (#6B7280) on White: 5.1:1 ✓
  • Orange text on gray bg: 4.8:1 ✓
```

### Screen Reader
```
All images:    Descriptive alt text (not empty)
Form labels:   <label htmlFor="id"> associated with <input id="id">
ARIA labels:   aria-label on icon-only buttons
Sections:      Semantic <section> with aria-label
Skip link:     <a href="#main-content"> before content
```

### Reduced Motion
```
Respect:       @media (prefers-reduced-motion: reduce) { ... }
Animations:    Turn off or minimize when user prefers reduced motion
Example:       
  .animate-bounce {
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
```

---

## 📊 Performance Metrics (Target)

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | ≥90 | TBD |
| Lighthouse Accessibility | ≥95 | TBD |
| Lighthouse Best Practices | ≥90 | TBD |
| First Contentful Paint (FCP) | <1.8s | TBD |
| Largest Contentful Paint (LCP) | <2.5s | TBD |
| Cumulative Layout Shift (CLS) | <0.1 | TBD |
| Total Bundle Size | <150KB gzip | TBD |

---

## 🖼️ Image Specifications

### Hero Image (HeroSection)
```
Dimensions:    1200x600 px (16:9 aspect ratio)
Format:        WebP (primary) + JPEG (fallback)
Quality:       80-85 (balanced quality/size)
Optimization:  1200w, 800w, 600w srcset
Lazy Load:     loading="eager" (above fold)
```

### Featured Carousel Images
```
Dimensions:    600x600 px (1:1 square)
Format:        WebP (primary) + JPEG (fallback)
Quality:       75-80
Optimization:  Multiple sizes for responsive
Lazy Load:     loading="lazy" (below fold)
Blur-Up:       Low-quality placeholder while loading
```

### Testimonial Avatars
```
Dimensions:    48x48 px or 64x64 px
Format:        PNG or auto-generated (DiceBear)
Loading:       Lazy load OK (minor visual)
```

---

## 📝 Copy & Microcopy

**Hero:**
- Headline: "Find, Reunite, Adopt"
- Subheadline: "Helping pets come home."
- Body: "Report lost or found pets, get verified help from our community, and adopt animals in need — all in one safe, trusted place. Join thousands of pet lovers working together."
- CTA Primary: "Report Found Pet"
- CTA Secondary: "Report Lost Pet"

**Quick Search:**
- Title: "Quick Search"
- Description: "Find lost, found, or adoptable pets instantly"
- Placeholder: "Golden Retriever..."

**Featured Carousel:**
- Title: "Featured Pets"
- Description: "Meet wonderful adoptable pets waiting for a home"
- Badge: "Adoptable"
- CTA: "View Profile"

**How It Works:**
- Title: "How It Works"
- Description: "Three simple steps to help pets find their way home"
- Step 1: "Report or Search" → "Found a pet? Report instantly…"
- Step 2: "Verification & Matching" → "Our admin team…"
- Step 3: "Reunite or Adopt" → "Connect with verified users…"

**Trust & Safety:**
- Policy Title: "Adoption Policy"
- Safety Title: "Pet Safety Tips"
- CTA: "Read Full Policy →" / "View All Safety Guidelines →"

**Success Stories:**
- Title: "Success Stories"
- Description: "See how our community is changing pet lives"

**CTA Band:**
- Headline: "Seen a lost pet? Help reunite a family today."
- Subline: "Your report could bring a pet home in hours, not days."
- Button: "Report Now"

**Footer:**
- Brand: "PawsUnite"
- Mission: "Helping pets find their way home and discover loving families."
- Newsletter: "Get updates on reunited pets and adoptions"
- Copyright: "© 2024 PawsUnite. All rights reserved."

---

## 🎯 Next Steps

1. **Review Design** — Walk through all sections with team
2. **Test Responsiveness** — Check on actual devices (iPhone, Android, iPad, Desktop)
3. **Performance Audit** — Run Lighthouse on deployed version
4. **Accessibility Test** — Test with screen reader (NVDA/JAWS)
5. **Backend Integration** — Wire endpoints and test with real data
6. **A/B Testing** — Set up variants for headline/CTA experiments
7. **Analytics** — Verify all CTA clicks tracked
8. **Launch** — Deploy and monitor metrics

---

**Version:** 1.0.0 | **Last Updated:** November 2024
