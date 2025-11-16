# Landing Page — Developer Guide

## Overview

The new `Landing.tsx` component is a **modern, accessible, conversion-focused homepage** built with React, TypeScript, Tailwind CSS, and lucide-react icons. It's designed to be warm, empathetic, and mobile-first, with clear calls-to-action for reporting lost/found pets and adoption.

**Location:** `Frontend/src/pages/Landing.tsx`

---

## Sections & Components

### 1. **HeroSection**
**Purpose:** Above-the-fold emotional hook with primary CTAs and animated stats counter.

**Features:**
- Responsive two-column layout (mobile-stacked, lg+ side-by-side)
- H1 headline + H2 subheading + supporting copy
- Dual primary CTAs: "Report Found Pet" & "Report Lost Pet" (authenticated users) or "Get Started" & "Create Account" (guests)
- **AnimatedCounter** component — numbers animate into view when scrolled into viewport
  - Pets Reunited: 847
  - Adoptions: 342
  - Community Members: 12,500
- Hero image on right (large screens) with gradient overlay and caption
- Decorative background blur elements for visual depth

**Customization:**
```tsx
// Update counter values in HeroSection:
<AnimatedCounter end={847} label="Pets Reunited" />  // Change 847 to your value

// Update hero image:
src="https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&q=80"  // Replace with your CDN URL
```

**Analytics Hooks:**
- `data-analytics="cta_report_found"` — Report Found Pet button
- `data-analytics="cta_report_lost"` — Report Lost Pet button
- `data-analytics="cta_browse"` — Browse Pets button
- `data-analytics="cta_signin"` / `data-analytics="cta_signup"` — Auth CTAs

---

### 2. **QuickSearchSection**
**Purpose:** Instant search & filter for lost, found, adoptable pets.

**Features:**
- 300ms debounced search with keyword, species, and status filters
- Real-time preview of up to 4 matching pets below search bar
- Keyboard-accessible form with ARIA labels
- Link search results to individual pet pages
- Currently uses **mock data**; ready for backend integration

**Form Inputs:**
1. **Keyword** — Search by pet name or breed
2. **Species** — Dropdown (Dog, Cat, Bird, Rabbit, Other)
3. **Status** — Dropdown (Found, Lost, Available for Adoption)

**Backend Integration (TODO):**
```tsx
// Replace mock search with real API call:
// In the useEffect debounced search, replace:
const mockPets = [...]  // with:
const res = await fetch(`${API_URL}/pets/search?q=${keyword}&species=${species}&status=${status}`);
const { items } = await res.json();
setResults(items.slice(0, 4));
```

**Analytics Hooks:**
- `data-analytics="search_submit"` — Search button

---

### 3. **FeaturedCarousel**
**Purpose:** Eye-catching carousel of adoptable pets.

**Features:**
- Horizontal carousel with manual navigation (prev/next buttons + dot indicators)
- Large PetCard with image, name, breed, location, and "View Profile" CTA
- Responsive: carousel on desktop, simplified view on mobile
- Lazy-loading images
- Smooth transitions (300ms duration)

**Mock Data (animals[]):**
- Luna (Siamese Cat) — Brooklyn, NY
- Max (Golden Retriever) — Manhattan, NY
- Bella (Mixed Breed Dog) — Queens, NY

**Backend Integration (TODO):**
```tsx
// Replace mock pets array with API call:
const [pets, setPets] = useState<any[]>([]);
useEffect(() => {
  const fetchPets = async () => {
    const res = await fetch(`${API_URL}/pets?status=Available for Adoption&limit=10`);
    const data = await res.json();
    setPets(data.items);
  };
  fetchPets();
}, []);
```

**Analytics Hooks:**
- `data-analytics="pet_view"` — View Profile button on carousel

---

### 4. **HowItWorksSection**
**Purpose:** Three-step explainer for the platform workflow.

**Steps:**
1. **Report or Search** (Heart icon) — Find or report a pet instantly
2. **Verification & Matching** (Shield icon) — Admin verification and smart matching
3. **Reunite or Adopt** (Home icon) — Secure connections and safe adoptions

**Design:**
- Three-column grid on md+, stacked on mobile
- Icon badges with gradient background
- Connecting line animation between steps (desktop only)
- Clear, concise copy

---

### 5. **TrustSection**
**Purpose:** Build trust with adoption policy highlights and safety accordion.

**Subsections:**
1. **Adoption Policy Card**
   - Highlights: Background checks, medical care, lifetime support
   - Link to full policy page

2. **Safety Tips Accordion**
   - Collapsible sections for Dogs, Cats (expandable)
   - Quick tips for microchipping, vaccinations, enrichment
   - Link to full safety guidelines

**Customization:**
```tsx
// Update accordion sections:
<Collapsible open={openAccordion === 'dogs'} ...>
  // Add more categories (Birds, Rabbits, etc.) by duplicating the pattern
```

---

### 6. **TestimonialsSection**
**Purpose:** Social proof via user success stories.

**Mock Testimonials:**
- Raj Kumar (Pet Owner) — "Found my Golden Retriever in two days"
- Maria Santos (Animal Rescuer) — "Easy to connect found pets"
- James Lee (Adoptive Owner) — "Adopted my best friend Bella"

**Customization:**
```tsx
const testimonials = [
  {
    quote: 'Your testimonial here...',
    author: 'Name',
    role: 'Role',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unique-seed',
  },
  // Add more...
];
```

**Avatar Generation:**
- Uses DiceBear API for random avatars (free, deterministic by seed)
- Replace with real user photos: `image: 'https://your-cdn.com/avatar.jpg'`

---

### 7. **CTABand**
**Purpose:** High-visibility call-to-action to drive urgent action.

**Design:**
- Full-width gradient background (orange-to-orange)
- Left: Headline + subline
- Right: "Report Now" button

**Customization:**
```tsx
<h3>Seen a lost pet? Help reunite a family today.</h3>
<p>Your report could bring a pet home in hours, not days.</p>
// Update headline/subline as needed
```

---

### 8. **FooterSection**
**Purpose:** Navigation, social links, and newsletter signup.

**Content:**
- **Brand section** — Logo, mission statement, social links
- **Product links** — Found Pets, Lost Pets, Adoptions
- **Support links** — Adoption Policy, Safety Guidelines, Contact
- **Newsletter** — Email signup with submit button

**Features:**
- Responsive grid (1 col on mobile, 4 cols on md+)
- Newsletter form with local state management
- Social icons (Facebook, Twitter, Instagram) with hover effects
- Quick legal links (Privacy, Terms)

**Backend Integration (TODO):**
```tsx
const handleNewsletterSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  } catch (err) {
    console.error('Newsletter signup failed:', err);
  }
};
```

---

## Accessibility Features

✅ **Semantic HTML**
- Proper use of `<header>`, `<main>`, `<section>`, `<footer>`
- H1, H2 hierarchy
- ARIA labels on form inputs and buttons

✅ **Keyboard Navigation**
- All interactive elements focus-visible
- Skip-to-content link at top (sr-only, visible on focus)
- Tab order follows natural document flow
- Carousels navigable via keyboard (arrow keys can be added)

✅ **Color Contrast**
- WCAG AA compliant (tested with Contrast Ratio)
- Orange (#FF7A59) on white
- Dark gray (#1F2937) on light backgrounds
- Sufficient text color contrast throughout

✅ **Images & Alt Text**
- All images have descriptive `alt` attributes
- `loading="lazy"` for performance
- `loading="eager"` for hero image (above fold)

✅ **Reduced Motion**
- Animations use CSS transitions (respect `prefers-reduced-motion` via Tailwind)
- Can add: `motion-safe:animate-fade-in motion-reduce:opacity-100` classes

---

## Performance & Optimization

### Image Optimization
- **Format:** WebP with JPEG fallback (via CDN)
- **Dimensions:** Use responsive sizes (e.g., `w=400&q=80` for mobile, `w=800&q=90` for desktop)
- **Lazy Loading:** Applied to all off-fold images
- **Blur-Up:** Use Unsplash's `blur=60` parameter or implement via CSS backdrop-filter

### Bundle Size
- **No external libraries** beyond React, lucide-react, shadcn/ui
- **Tailwind CSS:** Tree-shaken by build process
- **Component splitting:** All sub-components are self-contained

### Rendering Performance
- **Debounced search:** 300ms to avoid excessive re-renders
- **Intersection Observer:** Used for animated counter (fires once on scroll)
- **Memoization:** Can wrap heavy components with `React.memo()` if needed

---

## Integration Checklist

### Backend Endpoints to Wire

#### Required (Critical Path)
- [ ] **GET `/api/pets/search`** — Quick search with filters
  ```
  Query: ?q=keyword&species=Dog&status=Found&limit=4
  Response: { items: Pet[], total: number }
  ```

- [ ] **GET `/api/pets?status=Available for Adoption&limit=10`** — Featured carousel
  ```
  Response: { items: Pet[], total: number }
  ```

- [ ] **POST `/api/newsletter/subscribe`** — Newsletter signup
  ```
  Body: { email: string }
  Response: { success: boolean, message: string }
  ```

#### Optional (Enhancement)
- [ ] **GET `/api/stats`** — Dynamic counter values
  ```
  Response: { reunited: number, adoptions: number, members: number }
  ```

### Environment Variables

Add to `.env.local` (Frontend):
```env
VITE_API_URL=http://localhost:8000/api
VITE_LANDING_HERO_IMAGE=https://your-cdn.com/hero.jpg
VITE_OG_IMAGE=https://your-cdn.com/og-image.jpg
```

### Analytics Integration

Track CTA clicks with your analytics tool (e.g., Google Analytics, Mixpanel):

```tsx
// Example: Google Analytics
import { useAnalytics } from '@/hooks/useAnalytics';

// Inside component:
const handleCTAClick = (eventName: string) => {
  analytics.track(eventName, {
    timestamp: new Date(),
    page: 'landing',
  });
};

// Use data-analytics attributes:
<button data-analytics="cta_report_found" onClick={() => handleCTAClick('cta_report_found')}>
  Report Found Pet
</button>
```

### A/B Testing Placeholder

To test headline variants:

```tsx
const heroVariant = process.env.VITE_HERO_VARIANT || 'default'; // 'a' or 'b'

const headlineVariants = {
  default: 'Find, Reunite, Adopt',
  a: 'Find Your Pet, Reunite Families',
  b: 'Pets Deserve Safe Returns',
};

<h1>{headlineVariants[heroVariant]}</h1>
```

---

## Customization Guide

### Colors & Branding

**Primary Color (Orange):**
```tsx
// Replace across entire file:
// Old: bg-orange-500, text-orange-600, border-orange-*
// Search for "orange" and replace with your brand color
bg-orange-500  // Primary action buttons
bg-orange-50   // Light backgrounds
text-orange-600 // Text + hover states
border-orange-* // Borders
```

**Tailwind Config Update:**
```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#FF7A59',  // Your orange
        dark: '#1F2937',     // Dark gray
        light: '#F8FAFC',    // Light background
      },
    },
  },
}
```

### Typography

**Hero Headline Sizes:**
- Mobile: `text-4xl` (36px)
- Tablet: `text-5xl` (48px)
- Desktop: `text-6xl` (60px)

Update in `HeroSection`:
```tsx
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
  Your new headline
</h1>
```

### Mock Data → Real Data

**Pattern:** Replace all mock data structures with API fetch calls.

Example (FeaturedCarousel):
```tsx
// Before: hardcoded pets array
const pets = [
  { id: 1, name: 'Luna', ... },
  { id: 2, name: 'Max', ... },
];

// After: fetch from backend
const [pets, setPets] = useState<Pet[]>([]);
useEffect(() => {
  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/pets?status=adoptable&limit=10`);
      const { items } = await res.json();
      setPets(items);
    } catch (err) {
      console.error('Failed to load pets:', err);
    }
  };
  fetchPets();
}, []);
```

---

## Responsive Design

### Breakpoints (Tailwind Default)
- **Mobile:** 0px (default)
- **sm:** 640px (tablets)
- **md:** 768px (small laptops)
- **lg:** 1024px (large laptops)
- **xl:** 1280px (desktops)

### Layout Changes by Screen
1. **HeroSection:**
   - Mobile: Single column (text above image)
   - lg+: Two-column (text left, image right)

2. **QuickSearchSection:**
   - Mobile: 2 columns (keyword + species)
   - sm+: 4 columns (keyword + species + status + search button)

3. **FeaturedCarousel:**
   - Mobile: Simplified (carousel hidden, show single pet)
   - md+: Full carousel with 3 cards visible

4. **Footer:**
   - Mobile: Single column
   - md+: Four-column grid

---

## SEO & Meta Tags

**Head / Next.js:** The landing page should be wrapped with meta tags for SEO.

**TODO: Add to `index.html` or use a Helmet wrapper:**
```html
<head>
  <title>Find, Reunite & Adopt — PawsUnite | Pet Rescue & Adoption Platform</title>
  <meta name="description" content="Report lost or found pets, connect with verified rescuers, and adopt animals in need. Trusted by 12,500+ pet lovers." />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Find, Reunite & Adopt — PawsUnite" />
  <meta property="og:description" content="Help reunite lost pets with families or adopt your new best friend." />
  <meta property="og:image" content="https://your-cdn.com/og-image.jpg" />
  <meta property="og:url" content="https://pawsunite.com" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Find, Reunite & Adopt — PawsUnite" />
  <meta name="twitter:description" content="Join thousands reuniting lost pets and adopting rescues." />
  <meta name="twitter:image" content="https://your-cdn.com/twitter-card.jpg" />
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PawsUnite",
    "url": "https://pawsunite.com",
    "logo": "https://your-cdn.com/logo.png",
    "description": "Pet rescue and adoption platform",
    "sameAs": [
      "https://facebook.com/pawsunite",
      "https://twitter.com/pawsunite",
      "https://instagram.com/pawsunite"
    ]
  }
  </script>
</head>
```

---

## Testing Checklist

### Functional Testing
- [ ] Search form debouncing works (300ms delay)
- [ ] Carousel navigation (prev/next buttons, dot indicators)
- [ ] Accordion toggle (Dogs, Cats)
- [ ] Newsletter form submission (success message appears)
- [ ] All CTAs navigate to correct routes
- [ ] Analytics data-attributes present on buttons

### Accessibility Testing
- [ ] Keyboard navigation (Tab through all interactive elements)
- [ ] Skip-to-content link works and is visible on focus
- [ ] Form labels associated with inputs (id + htmlFor)
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Screen reader: All text, images, and alt text are read correctly
- [ ] Reduced motion: Animations respect `prefers-reduced-motion`

### Responsive Testing
- [ ] Mobile (375px): All text readable, images fit, CTAs clickable
- [ ] Tablet (768px): Two-column hero displays correctly, carousel visible
- [ ] Desktop (1024px+): Full layout, animations smooth, no horizontal scroll

### Performance Testing
- [ ] Lighthouse score ≥90 (Performance, Accessibility, Best Practices)
- [ ] Time to Interactive (TTI) <3s on 3G
- [ ] Largest Contentful Paint (LCP) <2.5s
- [ ] Cumulative Layout Shift (CLS) <0.1

### Browser Testing
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

---

## Troubleshooting

### Carousel doesn't show on mobile
**Issue:** Carousel cards hidden on md breakpoint.
**Fix:** Remove `hidden md:block` or adjust breakpoint in `FeaturedCarousel`.

### Search results not appearing
**Issue:** Mock data or backend call failing.
**Fix:** Check network tab, verify API endpoint, add console logging.

### Animated counters not triggering
**Issue:** Intersection Observer not firing.
**Fix:** Verify `data-counter` attribute exists on container, check viewport threshold.

### Accordion not expanding
**Issue:** Collapsible component state not updating.
**Fix:** Ensure `Collapsible` component from shadcn/ui is installed; verify `open` prop binding.

---

## Component Dependencies

**Required Packages:**
```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "lucide-react": "^latest",
  "shadcn/ui": "installed (Button, Card, Input, Select, Collapsible)"
}
```

**Installed shadcn/ui Components:**
- `button`
- `card`
- `input`
- `label`
- `select`
- `collapsible`

---

## Future Enhancements

1. **Animated Map** — Show pins of recent lost/found reports
2. **Video Testimonials** — Autoplay muted user stories with captions
3. **Multi-Language** — i18n support (es, fr, de)
4. **Dark Mode** — Toggle dark theme
5. **Live Chat** — Real-time support widget
6. **Social Feed** — Embed Twitter/Instagram posts
7. **Image Upload** — Direct image drag-and-drop in search preview

---

## Support & Questions

For issues or customization help:
- Check the **Troubleshooting** section above
- Review component code comments (inline `// TODO` notes)
- Consult Tailwind CSS docs: https://tailwindcss.com/
- Shadcn/ui components: https://ui.shadcn.com/

---

**Last Updated:** November 2024 | **Version:** 1.0.0
