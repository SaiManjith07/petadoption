import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Search,
  Home,
  CheckCircle,
  MapPin,
  ChevronLeft,
  Mail,
  Facebook,
  Twitter,
  Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import Collapsible, CollapsibleContent, CollapsibleTrigger removed (no longer used)
import { useAuth } from '@/lib/auth';

// Small animated counter that respects prefers-reduced-motion
const AnimatedCounter = ({ end, label }: { end: number; label: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(end);
      return;
    }
    const increment = Math.max(1, Math.ceil(end / 50));
    const interval = setInterval(() => {
      setCount((prev) => (prev < end ? prev + increment : end));
    }, 40);
    return () => clearInterval(interval);
  }, [isVisible, end]);

  useEffect(() => {
    const el = document.querySelector('[data-counter]');
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="text-center" data-counter>
      <div className="text-3xl sm:text-4xl font-bold text-orange-600">{Math.min(count, end).toLocaleString()}</div>
      <div className="text-xs sm:text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
};

// HERO
const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50 pt-16 pb-12 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-24"
      aria-label="Hero section"
    >
      <div className="absolute top-0 right-0 -mr-48 -mt-48 h-96 w-96 bg-orange-200 rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-48 -mb-48 h-96 w-96 bg-blue-200 rounded-full opacity-15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Rescue. Reunite. Protect — A Trusted Platform for Every Animal.
            </h1>
            <h2 className="mt-4 text-lg sm:text-xl text-gray-700 font-semibold">
              Report missing animals, register found animals, and help reunite them safely. Verified
              and moderated by a trusted NGO to ensure accurate reporting and responsible care.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
              Whether it’s a pet dog, cat, farm animal, or a wild bird, our portal enables fast
              reporting, NGO verification, and a safe, guided reunification process — with
              adoption options for unclaimed animals.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 flex-wrap" role="group" aria-label="Primary actions">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white group transition-transform hover:scale-105 hover:shadow-lg"
                data-analytics="cta_report_missing"
                aria-label="Report Missing Animal"
                onClick={() => isAuthenticated ? navigate('/pets/new/lost') : navigate('/auth/login')}
              >
                <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Report Missing Animal
              </Button>

              <Button
                size="lg"
                className="bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 group transition-transform hover:scale-105 hover:shadow-md"
                data-analytics="cta_report_found"
                aria-label="Report Found Animal"
                onClick={() => isAuthenticated ? navigate('/pets/new/found') : navigate('/auth/login')}
              >
                <Heart className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                Report Found Animal
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="group transition-transform hover:scale-105"
                data-analytics="cta_adopt"
                aria-label="Browse animals for adoption"
                onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')}
              >
                <Home className="h-5 w-5 text-orange-600" />
                Adopt
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-xl overflow-hidden shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=1200&q=80"
                alt="Happy reunited pet with family"
                className="w-full h-96 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
          <AnimatedCounter end={12400} label="Reports submitted" />
          <AnimatedCounter end={9800} label="Animals reunited" />
          <AnimatedCounter end={320} label="Verified NGO partners" />
        </div>
      </div>
    </section>
  );
};

// ABOUT
const AboutSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  return (
  <section className="py-12 sm:py-16 bg-white" aria-label="About">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What we do</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            We provide a secure, NGO-moderated platform for reporting lost and found animals across
            species — from dogs and cats to farm animals and birds. Our verification process reduces
            fraud and helps reunify animals with their families quickly.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• NGO-verified reports to reduce false claims and improve trust</li>
            <li>• Support for all animal types including farm and working animals</li>
            <li>• Clear handover protocols to protect both animals and claimants</li>
          </ul>
          <div className="mt-6">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => isAuthenticated ? navigate('/about') : navigate('/auth/login')}
            >
              Learn more about NGO verification
            </Button>
          </div>
        </div>
        <div>
          <div className="rounded-lg overflow-hidden shadow bg-gray-50 p-6">
            <h3 className="font-semibold text-lg">Trusted by NGOs</h3>
            <p className="text-sm text-gray-600 mt-2">
              Our partners review each report and manage verification and reunification. We surface
              partner badges to help you identify verified listings.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 items-center">
              <div className="h-12 bg-white rounded flex items-center justify-center border">
                <span className="text-xs font-semibold">NGO 1</span>
              </div>
              <div className="h-12 bg-white rounded flex items-center justify-center border">
                <span className="text-xs font-semibold">NGO 2</span>
              </div>
              <div className="h-12 bg-white rounded flex items-center justify-center border">
                <span className="text-xs font-semibold">NGO 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

// HOW IT WORKS
const HowItWorksSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const steps = [
    { icon: Search, title: 'Report Missing Animal', description: 'Log details and photos so the community and NGO can start a search quickly.' },
    { icon: Heart, title: 'Report Found Animal', description: 'Register found animals with photos and location so owners can be matched.' },
    { icon: CheckCircle, title: 'NGO Verification & Matching', description: 'Trained NGO staff verify reports and use smart matching to connect cases.' },
    { icon: Home, title: 'Reunify or Adopt', description: 'If claimed, NGO supervises handover; if unclaimed, animals are listed for adoption.' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-lg text-gray-600">A clear, NGO-backed process to reunify animals</p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-md">
                <step.icon className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// TRUST & SAFETY
const TrustSection = () => (
  <section className="py-12 sm:py-16 bg-white" aria-label="Trust and safety">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Trust & Safety</h2>
          <p className="mt-4 text-gray-600">
            All reports are reviewed by our NGO partners. Verified listings show a partner badge and
            a verification date so you can trust the information before acting.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold">NGO Verification</p>
                  <p className="text-xs text-gray-600">Verified reports reduce fraud and improve outcomes.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Safe Handover</p>
                  <p className="text-xs text-gray-600">Clear protocols protect animals and claimants.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Verified partner badge</CardTitle>
              <CardDescription>Click a listing to see verification details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded bg-gray-100 flex items-center justify-center">NGO Badge Preview</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>
);


// ADOPTION AWARENESS
const AdoptionSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  return (
  <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50" aria-label="Adoption awareness">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Adoption Awareness</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Animals are only listed for adoption when they remain unclaimed after NGO verification.
            Every adoption request is screened to ensure responsible placement and lifetime welfare.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Only unclaimed animals are eligible for adoption after the verification period.</li>
            <li>• Prospective adopters undergo screening and reference checks.</li>
            <li>• Medical care and follow-up support are provided where needed.</li>
          </ul>
          <div className="mt-6">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')}
            >
              Browse Adoption Gallery
            </Button>
          </div>
        </div>
        <div>
          <div className="rounded-lg overflow-hidden shadow bg-white">
            <img src="https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=1200&q=80" alt="Happy adopted animals in a new home" className="w-full h-64 object-cover" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

// TESTIMONIALS
const TestimonialsSection = () => {
  const testimonials = [
    { quote: 'Found my Golden Retriever in just two days thanks to this platform.', author: 'Raj Kumar', role: 'Pet Owner', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj' },
    { quote: 'As a rescuer, this platform makes it so easy to connect found animals with their families.', author: 'Maria Santos', role: 'Animal Rescuer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria' },
    { quote: 'Adopted my best friend Bella here. Safe, verified, and the team was incredibly supportive.', author: 'James Lee', role: 'Adoptive Owner', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50" aria-label="Success stories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Success Stories</h2>
          <p className="mt-4 text-gray-600">See how our community is changing animal lives</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <p className="text-gray-700 italic mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.image} alt={t.author} className="h-12 w-12 rounded-full bg-gray-200" loading="lazy" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA BAND
const CTABand = () => (
  <section className="py-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Seen a lost animal? Help reunite a family today.</h3>
          <p className="mt-2 text-orange-100 text-sm">Your report could bring an animal home in hours, not days.</p>
        </div>
        <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold whitespace-nowrap" asChild data-analytics="cta_report_now">
          <Link to="/auth/login">Report Now</Link>
        </Button>
      </div>
    </div>
  </section>
);

// FOOTER
const FooterSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 2500);
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-4 mb-12">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-orange-500" /> PawsUnite</h3>
            <p className="text-sm leading-relaxed">Helping animals find their way home and discover loving families.</p>
            <div className="flex gap-4 mt-6">
              <a href="#" aria-label="Facebook" className="hover:text-orange-500 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-orange-500 transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="hover:text-orange-500 transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => isAuthenticated ? navigate('/pets/found') : navigate('/auth/login')} className="hover:text-orange-500 transition-colors">Found Animals</button></li>
              <li><button onClick={() => isAuthenticated ? navigate('/pets/lost') : navigate('/auth/login')} className="hover:text-orange-500 transition-colors">Lost Animals</button></li>
              <li><button onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')} className="hover:text-orange-500 transition-colors">Adoptions</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => navigate('/policy')} className="hover:text-orange-500 transition-colors">Adoption Policy</button></li>
              <li><button onClick={() => navigate('/safety')} className="hover:text-orange-500 transition-colors">Safety Guidelines</button></li>
              <li><a href="mailto:support@pawsunite.com" className="hover:text-orange-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Get updates on reunited animals and adoptions</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input type="email" placeholder="your@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm" aria-label="Newsletter email" />
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 px-3 flex-shrink-0" data-analytics="newsletter_subscribe"><Mail className="h-4 w-4" /></Button>
            </form>
            {subscribed && <p className="text-xs text-green-400 mt-2">Thanks for subscribing!</p>}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; 2024 PawsUnite. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
            <Link to="/policy" className="hover:text-orange-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none">Skip to main content</a>
      <main id="main-content" className="min-h-screen bg-white">
        <HeroSection isAuthenticated={isAuthenticated} />
        <AboutSection isAuthenticated={isAuthenticated} />
        <HowItWorksSection isAuthenticated={isAuthenticated} />
        <TrustSection />
        <AdoptionSection isAuthenticated={isAuthenticated} />
        <TestimonialsSection />
        <CTABand />
      </main>
      <FooterSection isAuthenticated={isAuthenticated} />
    </>
  );
}
