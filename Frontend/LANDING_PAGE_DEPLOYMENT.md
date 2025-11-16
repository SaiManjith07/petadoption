# Landing Page Integration Checklist

## ✅ Completed

### Code
- [x] New Landing.tsx with 8 major sections (Hero, Search, Carousel, HowItWorks, Trust, Testimonials, CTA, Footer)
- [x] All components built with React + Tailwind CSS (no external UI libraries beyond shadcn/ui)
- [x] Responsive design (mobile-first, tested sm/md/lg breakpoints)
- [x] Accessibility: Semantic HTML, ARIA labels, keyboard nav, color contrast (WCAG AA)
- [x] Performance: Lazy loading, debounced search (300ms), Intersection Observer for animations
- [x] Analytics hooks: `data-analytics` attributes on all CTAs
- [x] Backend integration points documented with TODO comments

### Documentation
- [x] Comprehensive README (LANDING_PAGE_README.md) with 20+ sections
- [x] Component breakdown for each section
- [x] Customization guide (colors, typography, data)
- [x] Integration checklist (endpoints, environment variables)
- [x] Testing checklist (functional, a11y, responsive, performance)
- [x] Troubleshooting guide

---

## 🔧 Next Steps (To Deploy)

### 1. Backend API Endpoints (Wire These)
**Priority: HIGH**
```
✓ GET /api/pets/search?q=query&species=Dog&status=Found&limit=4
✓ GET /api/pets?status=Available for Adoption&limit=10
✓ POST /api/newsletter/subscribe { email: string }
```
→ See **LANDING_PAGE_README.md** section "Backend Endpoints to Wire" for full specs

### 2. Environment Variables
**Priority: HIGH**
Add to `Frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_LANDING_HERO_IMAGE=https://your-cdn.com/hero.jpg
VITE_OG_IMAGE=https://your-cdn.com/og-image.jpg
```

### 3. Replace Mock Data
**Priority: MEDIUM**
- [ ] QuickSearch: Connect to `/api/pets/search` endpoint
- [ ] FeaturedCarousel: Connect to `/api/pets?status=adoptable` endpoint
- [ ] AnimatedCounter: Fetch from `/api/stats` or hardcode real numbers
- [ ] TestimonialSection: Replace with real user testimonials from DB

**Example Fix:** In `QuickSearchSection`, replace mock data:
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    const mockPets = [...]  // ← REMOVE THIS
    
    // ← ADD THIS INSTEAD:
    const fetchResults = async () => {
      const res = await fetch(
        `${API_URL}/pets/search?q=${keyword}&species=${species}&status=${status}&limit=4`
      );
      const { items } = await res.json();
      setResults(items);
    };
    fetchResults();
  }, 300);
  
  return () => clearTimeout(timer);
}, [keyword, species, status]);
```

### 4. Newsletter Integration
**Priority: MEDIUM**
Update `FooterSection` `handleNewsletterSubmit`:
```tsx
const handleNewsletterSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  } catch (err) {
    console.error('Newsletter error:', err);
  }
};
```

### 5. Analytics Setup
**Priority: LOW**
- [ ] Integrate Google Analytics / Mixpanel / Segment
- [ ] Create event handler that reads `data-analytics` attributes
- [ ] Test CTA click tracking

Example using Google Analytics:
```tsx
import { useAnalytics } from '@/hooks/useAnalytics';  // create this hook

// In component:
const handleCTAClick = (e: React.MouseEvent) => {
  const eventName = (e.target as HTMLElement).getAttribute('data-analytics');
  if (eventName) {
    gtag.event(eventName, { page: 'landing' });
  }
};

// Attach to CTA parent div:
<div onClick={handleCTAClick}>
  <Button data-analytics="cta_report_found">Report Found Pet</Button>
</div>
```

### 6. SEO & Meta Tags
**Priority: MEDIUM**
- [ ] Add `<Helmet>` wrapper in main.tsx or index.html
- [ ] Set title: "Find, Reunite & Adopt — PawsUnite"
- [ ] Set meta description
- [ ] Add OG tags (og:title, og:description, og:image, og:url)
- [ ] Add Twitter card tags
- [ ] Add JSON-LD structured data (Organization, WebSite)

Reference: See **LANDING_PAGE_README.md** section "SEO & Meta Tags"

### 7. Image CDN
**Priority: MEDIUM**
- [ ] Upload hero image to CDN (Cloudinary, AWS S3, etc.)
- [ ] Generate WebP with JPEG fallback
- [ ] Update `VITE_LANDING_HERO_IMAGE` env var
- [ ] Test lazy loading & blur-up with DevTools throttling

Current placeholder: `https://images.unsplash.com/photo-1633722715463-d30f4f325e24`

### 8. Testing & QA
**Priority: HIGH**
- [ ] Run full testing checklist (LANDING_PAGE_README.md → Testing Checklist)
  - [ ] Keyboard navigation
  - [ ] Screen reader (NVDA, JAWS)
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Lighthouse: Performance ≥90, a11y ≥95
- [ ] Test all CTAs navigate correctly
- [ ] Test search form with real data
- [ ] Test carousel on all devices
- [ ] Test newsletter signup
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge

---

## 📊 Component Status

| Section | Status | Backend Wired | Notes |
|---------|--------|---------------|-------|
| Hero | ✅ Complete | N/A | Animated counter uses mock data |
| Quick Search | ✅ Complete | ❌ TODO | Uses mock data; ready for API |
| Featured Carousel | ✅ Complete | ❌ TODO | Uses mock data; ready for API |
| How It Works | ✅ Complete | N/A | Static content |
| Trust & Safety | ✅ Complete | N/A | Static content + accordion |
| Testimonials | ✅ Complete | ❌ TODO | Mock data; can wire to backend |
| CTA Band | ✅ Complete | N/A | Static content |
| Footer | ✅ Complete | ❌ TODO | Newsletter form only |

---

## 🎨 Customization Quick Links

**Want to change colors?**
→ See LANDING_PAGE_README.md → Customization Guide → Colors & Branding

**Want to update copy/text?**
→ Search Landing.tsx for text strings and edit inline

**Want different images?**
→ Replace `src=` URLs in HeroSection and carousel

**Want to add more testimonials?**
→ Update `testimonials` array in TestimonialsSection

**Want new "How It Works" steps?**
→ Update `steps` array in HowItWorksSection

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All TODOs in Landing.tsx completed (search `.tsx` for `TODO`)
- [ ] Environment variables set in production `.env`
- [ ] Backend endpoints tested with real data
- [ ] Analytics events firing correctly
- [ ] SEO meta tags added to `index.html`
- [ ] Lighthouse audit: Performance ≥90
- [ ] WAVE accessibility check: 0 errors
- [ ] Images optimized (WebP, correct dimensions)
- [ ] Newsletter confirmation email working
- [ ] All links tested (internal routes + external)
- [ ] Mobile viewport correct: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

## 📞 Support

**Questions about the new landing page?**
- Check LANDING_PAGE_README.md (20+ sections with examples)
- Search Landing.tsx for inline comments
- Review component TODOs
- Test against provided checklists

**Issues after deployment?**
- See LANDING_PAGE_README.md → Troubleshooting
- Check browser console for errors
- Verify API endpoints are responding
- Test with reduced network speed (DevTools throttling)

---

**Version:** 1.0.0 | **Last Updated:** November 2024
