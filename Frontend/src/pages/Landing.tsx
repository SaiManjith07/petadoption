import React, { useEffect, useState, useRef } from 'react';
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
  FileText,
  ShieldCheck,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  PawPrint,
  HandHeart,
  Building2,
  Award,
  CheckCircle2,
  Quote,
  Star,
  AlertCircle,
  LifeBuoy,
  Activity,
  Zap,
  Globe,
  TrendingUp,
  Eye,
  Target,
  Lock,
  Leaf,
  Stethoscope,
  Phone,
  Map,
  Clock,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Bell,
  Download,
  BookOpen,
  MessageCircle,
  UserPlus,
  BedDouble,
  ClipboardCheck,
  Droplet,
  Radio,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

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
      <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{Math.min(count, end).toLocaleString()}</div>
      <div className="text-xs sm:text-sm text-white/90 mt-1 drop-shadow-md">{label}</div>
    </div>
  );
};

// Simple number counter for stats cards
const StatCounter = ({ end }: { end: number }) => {
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    const el = document.querySelector(`[data-stat-counter="${end}"]`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span data-stat-counter={end}>{Math.min(count, end).toLocaleString()}</span>;
};

// Scroll Animation Hook
const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

// Enhanced Animated Section Wrapper with Professional Animations
const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up'
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
}) => {
  const { ref, isVisible } = useScrollAnimation(0.15);

  const getTransform = () => {
    switch (direction) {
      case 'down':
        return isVisible ? 'translate-y-0' : 'translate-y-[-30px]';
      case 'left':
        return isVisible ? 'translate-x-0' : 'translate-x-[-30px]';
      case 'right':
        return isVisible ? 'translate-x-0' : 'translate-x-[30px]';
      case 'scale':
        return isVisible ? 'scale-100' : 'scale-95';
      case 'fade':
        return '';
      default:
        return isVisible ? 'translate-y-0' : 'translate-y-[30px]';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 ' + getTransform()
          : 'opacity-0 ' + (direction === 'scale' ? 'scale-95' : direction === 'fade' ? '' : getTransform())
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Enhanced Floating Animation Component
const FloatingIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <div
      className="animate-float"
      style={{
        animation: `float 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Professional Fade In Animation
const FadeInOnScroll = ({ 
  children, 
  delay = 0,
  className = ''
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Stagger Animation for Lists
const StaggerAnimation = ({ 
  children, 
  index,
  className = ''
}: { 
  children: React.ReactNode; 
  index: number;
  className?: string;
}) => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-95'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
};

// Different types of pets with high-quality images and professional content
const petImages = [
  {
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1920&q=90',
    type: 'Dogs',
    text: 'Find Your Lost Dog',
    subtitle: 'Every Dog Deserves to Come Home',
    description: 'Your loyal companion is missing? Report it instantly. Our verified system connects you with rescue groups and community members who can help bring your dog home safely.',
    color: 'from-orange-500 to-amber-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=90',
    type: 'Horses',
    text: 'Protect Your Noble Horse',
    subtitle: 'Majestic Companions Need Protection',
    description: 'Horses are valuable partners. When they go missing, time matters. Our platform connects you with experienced equine rescuers and verified networks to locate your horse quickly.',
    color: 'from-amber-700 to-orange-800'
  },
  {
    url: 'https://m.media-amazon.com/images/I/61pDPJE7lpL._AC_UF1000,1000_QL80_.jpg',
    type: 'Goats',
    text: 'Rescue Your Lost Goat',
    subtitle: 'Valuable Farm Animals Need Care',
    description: 'Goats provide milk, meat, and companionship. When they wander off, report immediately. Our community alerts help farmers and owners quickly locate and reunite with their goats.',
    color: 'from-green-600 to-emerald-700'
  },
  {
    url: 'https://media.istockphoto.com/id/1933216911/photo/flock-of-sheep.jpg?s=612x612&w=0&k=20&c=TOjq_Or2i_5V4M5f8nUoE8bPWTF8Q3EqPu1Pt-K286E=',
    type: 'Sheep',
    text: 'Find Your Lost Sheep',
    subtitle: 'Essential Livestock Protection',
    description: 'Sheep are important for wool, meat, and milk. When they go missing from the flock, our platform helps shepherds and farmers quickly locate and reunite with their sheep through verified reports.',
    color: 'from-gray-500 to-slate-600'
  },
  {
    url: 'https://media.istockphoto.com/id/872646276/photo/chicken-sunset.jpg?s=612x612&w=0&k=20&c=6AS1g192dw9C8YzQbBGeCXOS49N2MITIoWzYgEKCxC8=',
    type: 'Hens',
    text: 'Protect Your Lost Hen',
    subtitle: 'Poultry Protection Matters',
    description: 'Hens provide eggs and meat for families. When they go missing, report it quickly. Our platform helps poultry farmers and backyard keepers locate and reunite with their hens through community alerts.',
    color: 'from-red-500 to-orange-600'
  },
  {
    url: 'https://www.kalmbachfeeds.com/cdn/shop/articles/two-white-ducks-in-grass_869f448b-964b-4e63-96a9-b3642c2723a6.jpg?v=1748450573',
    type: 'Ducks',
    text: 'Rescue Your Lost Duck',
    subtitle: 'Waterfowl Need Our Help',
    description: 'Ducks bring joy to farms and ponds. When they wander off, our platform helps owners quickly locate and reunite with their ducks through specialized tracking and verified community alerts.',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1598113972215-96c018fb1a0b?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtZWx8ZW58MHx8MHx8fDA%3D',
    type: 'Camels',
    text: 'Safeguard Your Lost Camel',
    subtitle: 'Vital for Livelihood and Transport',
    description: 'Camels are essential for transportation and livelihood. These resilient animals deserve protection. Our platform helps owners report and find lost camels through verified tracking and community support.',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    url: 'https://cdn.britannica.com/63/145563-050-5E0EC254/water-buffalo.jpg',
    type: 'Buffalo',
    text: 'Protect Your Lost Buffalo',
    subtitle: 'Strong Farm Partners',
    description: 'Buffalo provide milk, meat, and labor for families. When they go missing, our platform helps farmers quickly locate and reunite with their buffalo through detailed reporting and verified community support.',
    color: 'from-slate-600 to-gray-700'
  },
  {
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdVSuk6gSE4ZdeLmEnU38MXZMBvdfrzZdKhQ&s',
    type: 'Donkeys',
    text: 'Rescue Your Lost Donkey',
    subtitle: 'Hardworking and Loyal Companions',
    description: 'Donkeys are hardworking partners that provide transportation and labor. When they go missing, our platform helps owners quickly locate and reunite with their donkeys through verified community networks.',
    color: 'from-stone-600 to-neutral-700'
  },
  {
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=90',
    type: 'Cats',
    text: 'Find Your Lost Cat',
    subtitle: 'Beloved Feline Companions',
    description: 'Cats are cherished family members. When they wander off, every moment counts. Our platform helps cat owners quickly locate and reunite with their beloved pets through verified community alerts and specialized tracking.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    url: 'https://lafeber.com/vet/wp-content/uploads/european-rabbit.jpg',
    type: 'Rabbits',
    text: 'Rescue Your Lost Rabbit',
    subtitle: 'Gentle and Beloved Pets',
    description: 'Rabbits are gentle companions that bring joy to families. When they go missing, our platform helps owners quickly locate and reunite with their rabbits through verified community networks and specialized alerts.',
    color: 'from-pink-400 to-rose-500'
  }
];

// HERO
const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % petImages.length);
        setIsTransitioning(false);
      }, 500); // Half of transition duration for smooth crossfade
    }, 6000); // Change image every 6 seconds (longer for better UX)
    return () => clearInterval(interval);
  }, []);

  const currentPet = petImages[currentImageIndex];

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center"
      aria-label="Hero section"
    >
      {/* Background Image Carousel with Smooth Crossfade */}
      <div className="absolute inset-0 z-0">
        {petImages.map((pet, index) => {
          const isActive = index === currentImageIndex;
          const isNext = index === (currentImageIndex + 1) % petImages.length;
          
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${
                isActive 
                  ? 'opacity-100 scale-100 z-10' 
                  : isNext && isTransitioning
                  ? 'opacity-30 scale-105 z-5'
                  : 'opacity-0 scale-100 z-0'
              }`}
            >
              <img
                src={pet.url}
                alt={`${pet.type} - ${pet.text}`}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
              {/* Professional gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pet.color} opacity-45`} />
              {/* Enhanced dark overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
            </div>
          );
        })}
      </div>

      {/* Content Overlay with Professional Typography */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading with professional typography and animation */}
          <h1 
            key={`heading-${currentImageIndex}`}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-2xl mb-6 sm:mb-8 transition-all duration-700 ease-in-out px-4 animate-fade-in-up"
            style={{ 
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
              letterSpacing: '-0.02em',
              animation: 'fadeInUp 0.8s ease-out 0.1s both'
            }}
          >
            {currentPet.text}
          </h1>
          
          {/* Dynamic Subtitle that matches each animal */}
          <h2 
            key={`subtitle-${currentImageIndex}`}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-snug drop-shadow-xl mb-4 sm:mb-6 px-4 tracking-tight animate-fade-in-up transition-all duration-700 ease-in-out"
            style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
          >
            {currentPet.subtitle}
          </h2>
          
          {/* Professional Tagline */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md mb-4 sm:mb-6 px-4 font-medium">
            Rescue. Reunite. Protect — A Trusted Platform for Every Animal.
          </p>
          
          {/* Dynamic Description with better readability and animation */}
          <p 
            key={`desc-${currentImageIndex}`}
            className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto drop-shadow-lg mb-10 sm:mb-12 md:mb-16 transition-all duration-700 ease-in-out px-4 font-light animate-fade-in-up"
            style={{ 
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              animation: 'fadeInUp 0.8s ease-out 0.4s both'
            }}
          >
            {currentPet.description}
          </p>

          {/* Professional Action Buttons with Animation */}
          <div className="mt-8 sm:mt-10 md:mt-12 flex flex-row gap-4 sm:gap-5 justify-center items-center px-4 flex-wrap animate-fade-in-up" 
               style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}
               role="group" aria-label="Primary actions">
            <Button
              size="lg"
              className="flex-1 sm:flex-initial text-white text-base sm:text-lg font-semibold px-8 sm:px-10 py-6 sm:py-7 group transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg whitespace-nowrap rounded-2xl border-0 animate-zoom-in"
              style={{ backgroundColor: '#2E7D32', '--tw-ring-color': '#2E7D32' } as React.CSSProperties}
              data-analytics="cta_report_missing"
              aria-label="Report Missing Animal"
              onClick={() => isAuthenticated ? navigate('/pets/new/lost') : navigate('/auth/login')}
            >
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2.5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
              Report Missing Animal
            </Button>

            <Button
              size="lg"
              className="flex-1 sm:flex-initial bg-white hover:bg-gray-50 text-base sm:text-lg font-semibold px-8 sm:px-10 py-6 sm:py-7 group transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md border border-gray-200 whitespace-nowrap rounded-2xl animate-zoom-in"
              style={{ animationDelay: '0.1s', color: '#2E7D32' } as React.CSSProperties}
              data-analytics="cta_report_found"
              aria-label="Report Found Animal"
              onClick={() => isAuthenticated ? navigate('/pets/new/found') : navigate('/auth/login')}
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2.5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" style={{ color: '#2E7D32', fill: '#2E7D32' }} />
              Report Found Animal
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="flex-1 sm:flex-initial text-white hover:bg-white/10 text-base sm:text-lg font-semibold px-8 sm:px-10 py-6 sm:py-7 group transition-all duration-300 hover:scale-105 border border-white/60 backdrop-blur-md whitespace-nowrap rounded-2xl animate-zoom-in"
              style={{ animationDelay: '0.2s' }}
              data-analytics="cta_adopt"
              aria-label="Browse animals for adoption"
              onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')}
            >
              <Home className="h-5 w-5 sm:h-6 sm:w-6 mr-2.5 text-white group-hover:scale-110 transition-transform" />
              Adopt
            </Button>
          </div>

          {/* Professional Image Indicators */}
          <div className="mt-10 sm:mt-12 md:mt-16">
            <div className="flex justify-center gap-2.5">
              {petImages.map((pet, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentImageIndex(index);
                      setIsTransitioning(false);
                    }, 300);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    index === currentImageIndex
                      ? 'w-10 bg-white shadow-xl scale-110'
                      : 'w-2.5 bg-white/40 hover:bg-white/60 hover:w-3.5'
                  }`}
                  aria-label={`View ${pet.type} image`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Professional Features Section - Hidden on Mobile */}
        <div className="hidden md:grid mt-20 lg:mt-24 grid-cols-3 gap-10 lg:gap-16 max-w-6xl mx-auto px-4">
          {/* Report Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-6">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-3" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
                <div className="relative">
                  <FileText className="h-10 w-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle className="h-5 w-5 text-white fill-white drop-shadow-md" />
              </div>
                </div>
              </div>
              {/* Animated Glow Effect */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-green-400/0 via-green-400/30 to-green-400/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 drop-shadow-xl tracking-tight">Easy Reporting</h3>
            <p className="text-white/95 text-base lg:text-lg leading-relaxed max-w-[300px] mx-auto drop-shadow-lg font-light">
              Submit detailed reports with photos and location information. Our simple form makes it easy to report lost or found animals quickly.
            </p>
          </div>

          {/* Reunite Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-6">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-[-3deg]" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
                <div className="relative">
                  <Heart className="h-10 w-10 text-white fill-white drop-shadow-lg animate-pulse" strokeWidth={2.5} />
                  <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-300 animate-ping" />
              </div>
              </div>
              {/* Animated Glow Effect */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-pink-400/0 via-pink-400/30 to-pink-400/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 drop-shadow-xl tracking-tight">Smart Matching</h3>
            <p className="text-white/95 text-base lg:text-lg leading-relaxed max-w-[300px] mx-auto drop-shadow-lg font-light">
              Our intelligent matching system connects lost and found reports automatically, helping reunite pets with their families faster.
            </p>
          </div>

          {/* Verification Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-6">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-3" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
                <div className="relative">
                  <ShieldCheck className="h-10 w-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
              </div>
                </div>
              </div>
              {/* Animated Glow Effect */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 drop-shadow-xl tracking-tight">NGO Verified</h3>
            <p className="text-white/95 text-base lg:text-lg leading-relaxed max-w-[300px] mx-auto drop-shadow-lg font-light">
              All reports are verified by trusted NGO partners to ensure accuracy and prevent fraud, giving you confidence in every listing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ABOUT
const AboutSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: ShieldCheck,
      text: 'All reports are checked by trusted animal rescue groups to keep everyone safe',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: PawPrint,
      text: 'We help with all animals - pets, farm animals, and working animals',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: HandHeart,
      text: 'Safe and supervised handovers to protect both animals and families',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  const ngos = [
    { name: 'Animal Rescue Foundation', icon: Building2 },
    { name: 'Pet Welfare Society', icon: Heart },
    { name: 'Wildlife Protection NGO', icon: Shield },
  ];

  return (
    <section id="about" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-green-50/20 to-white relative overflow-hidden" aria-label="About">
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-green-200 rounded-full opacity-8 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-emerald-200 rounded-full opacity-8 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
          {/* Left Side - Content */}
          <AnimatedSection delay={0}>
            <div className="space-y-8">
            {/* Professional Header with Icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-6" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
                <div className="relative">
                  <Award className="h-10 w-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                  <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight" style={{ color: '#2B2B2B' }}>What We Do</h2>
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-3 py-1">
                    Trusted
                  </Badge>
                </div>
                <div className="h-1.5 w-24 mt-3 rounded-full" style={{ background: 'linear-gradient(to right, #4CAF50, #2E7D32)' }} />
              </div>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed font-light">
              We help you find lost pets and report found animals. Our platform works with trusted animal rescue groups 
              to make sure all reports are real and safe. Whether you lost a dog, cat, or farm animal, we help bring them home faster.
            </p>
            
            <Separator className="my-8" />
            
            {/* Professional Features List with Icons */}
            <div className="space-y-5 mt-10">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className={`border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${feature.bgColor}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <div className={`flex-shrink-0 h-14 w-14 rounded-xl bg-white flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg`}>
                        <div className="relative">
                          <feature.icon className={`h-7 w-7 ${feature.color} transition-colors`} strokeWidth={2.5} />
                          {index === 0 && (
                            <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600 fill-green-600" />
                          )}
                        </div>
                  </div>
                  <p className="text-lg text-gray-700 font-medium flex-1 pt-1 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-10">
              <Button 
                size="lg"
                className="text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-10 py-7 text-lg font-semibold rounded-xl hover:opacity-90"
                style={{ backgroundColor: '#2E7D32' } as React.CSSProperties}
                onClick={() => isAuthenticated ? navigate('/about') : navigate('/auth/login')}
              >
                <ShieldCheck className="mr-2.5 h-6 w-6" />
                Learn more about NGO verification
              </Button>
            </div>
            </div>
          </AnimatedSection>

          {/* Right Side - NGO Trust Card */}
          <AnimatedSection delay={200}>
            <div className="relative">
            {/* Decorative Background Elements */}
            <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: '#4CAF50' }} />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: '#4CAF50' }} />
            
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-200">
              {/* Header */}
              <div className="p-6" style={{ background: 'linear-gradient(to right, #4CAF50, #2E7D32)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6">
                    <div className="relative">
                      <Building2 className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                      <CheckCircle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-white fill-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Trusted by NGOs</h3>
                    <p className="text-green-100 text-sm mt-1">Verified Partners</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 text-base leading-relaxed mb-6">
                Our partner animal rescue groups check every report to make sure it's real. When you see a verified badge, 
                you know the information is safe and trustworthy.
                </p>

                <Separator className="my-6" />

                {/* NGO Badges */}
                <div className="space-y-4">
                  {ngos.map((ngo, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300 group shadow-sm"
                    >
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 group-hover:shadow-lg" style={{ background: 'linear-gradient(to bottom right, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))' }}>
                        <div className="relative">
                          <ngo.icon className="h-7 w-7 transition-colors" style={{ color: '#4CAF50' }} strokeWidth={2.5} />
                          {index === 0 && (
                            <CheckCircle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-green-600 fill-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{ngo.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: '#4CAF50', color: '#2E7D32', backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                            <CheckCircle2 className="h-3 w-3 mr-1" style={{ color: '#4CAF50' }} />
                            Verified Partner
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-600">50+</p>
                      <p className="text-xs text-gray-600 mt-1">NGO Partners</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-600">98%</p>
                      <p className="text-xs text-gray-600 mt-1">Success Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

// HOW IT WORKS
const HowItWorksSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const steps = [
    { 
      icon: FileText, 
      title: 'Report Missing Animal', 
      description: 'Tell us about your lost pet with photos and details. Our community and rescue groups will help search immediately.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: Heart, 
      title: 'Report Found Animal', 
      description: 'Found a lost animal? Share photos and location so we can help find their family.',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-100',
      iconColor: 'text-pink-600'
    },
    { 
      icon: ShieldCheck, 
      title: 'Verification & Matching', 
      description: 'Our rescue group partners check all reports and match lost pets with found animals automatically.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: Users, 
      title: 'Reunite or Adopt', 
      description: 'If the owner is found, we help them reunite safely. If no owner is found, the animal can be adopted by a loving family.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-gray-50/30 to-white" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Simple Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            A simple, NGO-backed process to reunify animals with their families
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line - Desktop Only - Moved Down */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200 rounded-full" />
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Card key={i} className="relative flex flex-col items-center text-center group border-2 border-gray-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-white">
                <CardContent className="p-6 w-full flex flex-col items-center">
                {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg border-4 border-white">
                  {i + 1}
                    </div>
                </div>
                
                  {/* Icon Container - Centered */}
                  <div className={`w-full flex justify-center my-8`}>
                    <div className={`h-20 w-20 rounded-2xl ${step.bgColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md`}>
                      <step.icon className={`h-10 w-10 ${step.iconColor}`} strokeWidth={2.5} />
                    </div>
                  </div>
                
                  {/* Arrow Connector - Desktop Only - Moved Down */}
                {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-24 left-full w-full -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-green-400 mx-auto group-hover:text-green-600 transition-colors" />
                  </div>
                )}
                
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {step.title}
                </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// TRUST & SAFETY
const TrustSection = () => {
  const safetyFeatures = [
    {
      icon: ShieldCheck,
      title: 'NGO Verification',
      description: 'Every report is checked by trained rescue group staff to make sure the information is real and safe.',
      color: 'from-[#4CAF50] to-[#2E7D32]',
    },
    {
      icon: HandHeart,
      title: 'Safe Handover',
      description: 'Safe and supervised handovers protect both animals and families when pets are reunited.',
      color: 'from-[#FF8A42] to-[#FF6B1A]',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your personal information is kept safe with strong security and privacy protection.',
      color: 'from-[#4CAF50] to-[#2E7D32]',
    },
  ];

  return (
    <section id="trust" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-[#FFF3D6]/20 to-white relative overflow-hidden" aria-label="Trust and safety">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#4CAF50]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FF8A42]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Professional Header */}
        <div className="text-center mb-16">
          <p className="text-xl sm:text-2xl text-[#2B2B2B]/80 max-w-3xl mx-auto font-light leading-relaxed">
            All reports are checked by our trusted rescue group partners. When you see a verified badge, you know the information is safe and real.
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {safetyFeatures.map((feature, index) => (
            <StaggerAnimation key={index} index={index}>
              <Card 
                className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-[#4CAF50] hover:-translate-y-2 rounded-2xl shadow-md bg-white"
              >
              <CardHeader className="pb-4">
                <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-xl mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <feature.icon className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#2B2B2B]/70 text-base leading-relaxed font-light">
                {feature.description}
              </p>
              </CardContent>
            </Card>
            </StaggerAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};


// HEALTHCARE & VACCINATION
const HealthcareSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  
  const vaccinationInfo = [
    {
      icon: ShieldCheck,
      title: 'Why Vaccinations Matter',
      description: 'Vaccinations protect your pets from dangerous diseases like rabies, distemper, and parvovirus. They keep your pet healthy and safe.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      icon: Stethoscope,
      title: 'Regular Health Checkups',
      description: 'Take your pet to the vet regularly for checkups. This helps catch health problems early and keeps your pet healthy.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      icon: Heart,
      title: 'Prevent Diseases',
      description: 'Vaccinations prevent serious diseases that can make your pet very sick or even cause death. It\'s the best way to protect them.',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-50',
    },
  ];


  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden" aria-label="Healthcare and vaccination">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-200 rounded-full opacity-8 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-green-200 rounded-full opacity-8 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6 gap-4">
            <Stethoscope className="h-10 w-10 text-blue-600" />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">Pet Healthcare & Vaccination</h2>
            <Stethoscope className="h-10 w-10 text-blue-600" />
          </div>
          <p className="mt-6 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Keeping your pets healthy is important. Learn about vaccinations and regular health care to protect your animals.
          </p>
        </div>

        {/* Why Vaccinations Matter with Animation */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          {vaccinationInfo.map((info, index) => (
            <StaggerAnimation key={index} index={index}>
              <Card 
                className="group hover:shadow-2xl transition-all duration-500 border-blue-100 hover:border-blue-200 hover:-translate-y-2"
              >
              <CardHeader className="pb-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <info.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">{info.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-base leading-relaxed font-light">
                  {info.description}
                </p>
              </CardContent>
            </Card>
            </StaggerAnimation>
          ))}
        </div>

        {/* Important Notes */}
        <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">Important Health Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Before Vaccination:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span>Make sure your pet is healthy before getting vaccinated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span>Tell your vet about any past health problems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span>Keep a record of all vaccinations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">After Vaccination:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span>Watch your pet for any unusual behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span>Keep your pet calm for 24 hours after vaccination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span>Contact your vet if you notice any problems</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-gray-700 text-base leading-relaxed">
                <strong className="text-gray-900">Remember:</strong> Always talk to your veterinarian about the best vaccination schedule for your pet. 
                Different animals and different areas may need different vaccines. Your vet knows what's best for your pet's health.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-10 py-7 text-lg font-semibold rounded-xl"
            onClick={() => navigate('/safety')}
          >
            <Stethoscope className="mr-2.5 h-6 w-6" />
            Learn More About Pet Safety
          </Button>
        </div>
      </div>
    </section>
  );
};

// ADOPTION AWARENESS
const AdoptionSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const adoptionImages = [
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80',
    'https://images.unsplash.com/photo-1605568427561-40dd23c3e5d8?w=1200&q=80',
    'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&q=80',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1200&q=80',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % adoptionImages.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [adoptionImages.length]);
  
  const adoptionFeatures = [
    {
      icon: CheckCircle2,
      text: 'Only animals whose owners are not found can be adopted after the waiting period',
      color: 'text-green-600'
    },
    {
      icon: Users,
      text: 'People who want to adopt are checked to make sure they can provide a good home',
      color: 'text-green-600'
    },
    {
      icon: Heart,
      text: 'Medical care and support are provided to help adopted animals stay healthy',
      color: 'text-pink-600'
    }
  ];

  return (
    <section id="adoption" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-gray-50 via-white to-green-50/30" aria-label="Adoption awareness">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Adoption Awareness</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-rose-600 mt-2 rounded-full" />
              </div>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
              Animals are only available for adoption if their owner is not found after checking. 
              Every person who wants to adopt is checked to make sure they will provide a safe and loving home.
            </p>
            
            {/* Features List with Icons */}
            <div className="space-y-4 mt-8">
              {adoptionFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-pink-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <p className="text-base text-gray-700 font-medium flex-1 pt-2">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold"
                onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')}
              >
                <Heart className="mr-2 h-5 w-5 fill-white" />
                Browse Adoption Gallery
              </Button>
            </div>
          </div>

          {/* Right Side - Rotating Images */}
          <div className="relative">
            {/* Decorative Background Elements */}
            <div className="absolute -top-4 -right-4 h-32 w-32 bg-pink-200 rounded-full opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 bg-rose-200 rounded-full opacity-20 blur-2xl" />
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              {/* Image Carousel */}
              <div className="relative w-full h-[500px]">
                {adoptionImages.map((image, index) => {
                  const isActive = index === currentImageIndex;
                  const isNext = index === (currentImageIndex + 1) % adoptionImages.length;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        isActive 
                          ? 'opacity-100 z-10' 
                          : isNext && isTransitioning
                          ? 'opacity-30 z-5'
                          : 'opacity-0 z-0'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Adoption story ${index + 1}`}
                        className="w-full h-full object-cover" 
                        loading={index === 0 ? 'eager' : 'lazy'} 
                      />
                    </div>
                  );
                })}
                
              {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
              
              {/* Badge on Image */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 border-2 border-pink-200 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Ready for Adoption</p>
                      <p className="text-xs text-gray-600">Loving homes needed</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {adoptionImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentImageIndex(index);
                        setIsTransitioning(false);
                      }, 300);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
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
    { 
      quote: 'Found my Golden Retriever in just two days thanks to this platform. The verification process was smooth and the community support was incredible.', 
      author: 'Raj Kumar', 
      role: 'Pet Owner',
      location: 'Mumbai, India',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
      rating: 5
    },
    { 
      quote: 'As a rescuer, this platform makes it so easy to connect found animals with their families. The NGO verification gives everyone confidence.', 
      author: 'Maria Santos', 
      role: 'Animal Rescuer',
      location: 'Delhi, India',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
      rating: 5
    },
    { 
      quote: 'Adopted my best friend Bella here. Safe, verified, and the team was incredibly supportive throughout the entire process.', 
      author: 'James Lee', 
      role: 'Adoptive Owner',
      location: 'Bangalore, India',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
      rating: 5
    },
  ];

  return (
    <section id="testimonials" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-gray-50 to-white" aria-label="Success stories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center mb-4">
            <Heart className="h-10 w-10 text-green-600 mr-3 fill-green-600" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Success Stories</h2>
            <Heart className="h-10 w-10 text-green-600 ml-3 fill-green-600" />
          </div>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            See how our community is changing animal lives and bringing families together
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:gap-10 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-green-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Quote className="h-6 w-6 text-white fill-white" />
              </div>

              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4 mt-2">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-gray-700 text-base leading-relaxed mb-6 relative z-10">
                "{t.quote}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="relative">
                  <img 
                    src={t.image} 
                    alt={t.author} 
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 border-2 border-green-200 shadow-md group-hover:scale-110 transition-transform" 
                    loading="lazy" 
                  />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">{t.author}</p>
                  <p className="text-green-600 text-sm font-medium">{t.role}</p>
                  <p className="text-gray-500 text-xs mt-1">{t.location}</p>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-green-200 opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border-2 border-green-100">
            <Sparkles className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold text-gray-700">
              Join thousands of happy pet owners and rescuers
            </p>
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>
    </section>
  );
};

// SAVE ANIMALS SECTION
const SaveAnimalsSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation(0.2);

  const saveFeatures = [
    {
      icon: LifeBuoy,
      title: 'Emergency Response',
      description: 'Report animals in trouble anytime, day or night. We respond quickly because every minute matters when saving a life.',
      color: 'from-red-500 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
      iconColor: 'text-red-600',
      delay: 0
    },
    {
      icon: Phone,
      title: 'Hotline Support',
      description: 'Call our hotline anytime for help. Our trained volunteers are ready to help you save an animal in need.',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-50',
      iconColor: 'text-orange-600',
      delay: 100
    },
    {
      icon: Map,
      title: 'Location Tracking',
      description: 'Share the exact location where you found the animal. This helps rescuers find and save them faster.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      delay: 200
    },
    {
      icon: Clock,
      title: 'Rapid Response',
      description: 'We respond within 30 minutes on average. Our team of volunteers acts quickly when animals need help.',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      iconColor: 'text-purple-600',
      delay: 300
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16 sm:py-20 bg-gradient-to-b from-white via-red-50/30 to-white relative overflow-hidden" 
      aria-label="Save animals"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection delay={0}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <FloatingIcon delay={0}>
                <LifeBuoy className="h-10 w-10 text-red-600 mr-3" />
              </FloatingIcon>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Save Animals</h2>
              <FloatingIcon delay={0.5}>
                <LifeBuoy className="h-10 w-10 text-red-600 ml-3" />
              </FloatingIcon>
            </div>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Every animal deserves a chance to live. Our emergency system helps save animals quickly when you report them.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {saveFeatures.map((feature, index) => (
            <AnimatedSection key={index} delay={feature.delay}>
              <div className="group relative bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-red-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden">
                {/* Animated Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Animated Icon Container with Glow Effect */}
                <div className={`relative mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  {/* Pulsing Glow */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl animate-pulse`} />
                  {/* Icon Background Ring */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/30 transition-all duration-500" />
                  <feature.icon className={`h-10 w-10 ${feature.iconColor} relative z-10 group-hover:scale-125 transition-transform duration-300`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                  {feature.description}
                </p>
                
                {/* Bottom Corner Decorative Element */}
                <div className={`absolute bottom-4 right-4 h-3 w-3 rounded-full bg-gradient-to-br ${feature.color} opacity-20 group-hover:opacity-80 group-hover:scale-200 transition-all duration-300`} />
                {/* Top Left Small Dot */}
                <div className={`absolute top-6 left-6 h-1.5 w-1.5 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-50 transition-all duration-300`} />
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={400}>
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold group"
              onClick={() => isAuthenticated ? navigate('/pets/new/found') : navigate('/auth/login')}
            >
              <LifeBuoy className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Report Animal in Distress
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// RESCUE ANIMALS SECTION
const RescueAnimalsSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation(0.2);

  const rescueStats = [
    { number: 5000, label: 'Animals Rescued', icon: Heart, color: 'from-pink-500 to-rose-600' },
    { number: 200, label: 'Active Rescuers', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { number: 150, label: 'Partner Shelters', icon: Building2, color: 'from-green-500 to-emerald-600' },
    { number: 95, label: 'Success Rate %', icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <section 
      ref={ref}
      className="py-16 sm:py-20 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden" 
      aria-label="Rescue animals"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-80 h-80 bg-blue-200 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-indigo-200 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection delay={0}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <FloatingIcon delay={0}>
                <HandHeart className="h-10 w-10 text-blue-600 mr-3" />
              </FloatingIcon>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Rescue Animals</h2>
              <FloatingIcon delay={0.5}>
                <HandHeart className="h-10 w-10 text-blue-600 ml-3" />
              </FloatingIcon>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Verified Stats
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Real-Time Data
              </Badge>
            </div>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team of rescuers who work hard to save animals from danger and give them a second chance at life.
            </p>
          </div>
        </AnimatedSection>

        {/* Stats Grid */}
        <AnimatedSection delay={100}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {rescueStats.map((stat, index) => (
              <div 
                key={index}
                className="group relative bg-gradient-to-br from-white via-white to-blue-50/30 rounded-3xl p-6 border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center overflow-hidden"
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Corner Accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`} />
                
                {/* Icon Container with Enhanced Design */}
                <div className={`relative inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br ${stat.color} mb-4 shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500 group-hover:scale-115 group-hover:rotate-12`}>
                  {/* Icon Glow Ring */}
                  <div className={`absolute inset-0 rounded-3xl border-2 border-white/30 group-hover:border-white/60 transition-all duration-300`} />
                  {/* Inner Glow */}
                  <div className={`absolute inset-2 rounded-2xl bg-white/20 group-hover:bg-white/30 transition-all duration-300`} />
                  <stat.icon className="h-8 w-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                {/* Number with Gradient Text Effect */}
                <div className="text-4xl font-extrabold mb-2 bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                  <StatCounter end={stat.number} />
                  {stat.label === 'Success Rate %' && '%'}
                </div>
                <div className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">{stat.label}</div>
                
                {/* Bottom Decorative Line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold group"
              onClick={() => isAuthenticated ? navigate('/pets/found') : navigate('/auth/login')}
            >
              <HandHeart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Join Rescue Network
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// PROTECT ANIMALS SECTION
const ProtectAnimalsSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation(0.2);

  const protectionFeatures = [
    {
      icon: Shield,
      title: 'Legal Protection',
      description: 'Advocacy for stronger animal protection laws and enforcement. We work with lawmakers to ensure animals are legally protected.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Lock,
      title: 'Safe Reporting',
      description: 'Anonymous reporting system protects whistleblowers while ensuring animal abuse cases are properly investigated.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Awareness Campaigns',
      description: 'Educational programs and awareness campaigns to prevent animal cruelty and promote responsible pet ownership.',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'International collaboration with animal protection organizations to create a safer world for all animals.',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-50',
      iconColor: 'text-teal-600'
    }
  ];

  const protectionActions = [
    {
      icon: FileText,
      title: 'Report Abuse',
      action: 'Report suspected animal abuse or neglect',
      color: 'from-red-500 to-rose-600'
    },
    {
      icon: Users,
      title: 'Volunteer',
      action: 'Join our volunteer network',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Heart,
      title: 'Donate',
      action: 'Support our protection efforts',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Leaf,
      title: 'Educate',
      action: 'Learn about animal welfare',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16 sm:py-20 bg-gradient-to-b from-white via-green-50/30 to-white relative overflow-hidden" 
      aria-label="Protect animals"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection delay={0}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <FloatingIcon delay={0}>
                <Shield className="h-10 w-10 text-green-600 mr-3" />
              </FloatingIcon>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Protect Animals</h2>
              <FloatingIcon delay={0.5}>
                <Shield className="h-10 w-10 text-green-600 ml-3" />
              </FloatingIcon>
            </div>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Together, we can make a world where all animals are safe and treated with kindness. Join us in protecting animals.
            </p>
          </div>
        </AnimatedSection>

        {/* Protection Features */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {protectionFeatures.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-green-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <div className={`relative mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
                  <feature.icon className={`h-10 w-10 ${feature.iconColor} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                <div className={`absolute top-4 right-4 h-2 w-2 rounded-full bg-gradient-to-br ${feature.color} opacity-30 group-hover:opacity-60 group-hover:scale-150 transition-all duration-300`} />
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Call to Action Cards */}
        <AnimatedSection delay={400}>
          <div className="mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">Take Action Today</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {protectionActions.map((action, index) => (
                <div 
                  key={index}
                  className="group relative bg-gradient-to-br from-white via-green-50/50 to-white rounded-3xl p-6 border-2 border-green-100 hover:border-green-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer overflow-hidden"
                  onClick={() => isAuthenticated ? navigate('/safety') : navigate('/auth/login')}
                >
                  {/* Animated Background Pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Diagonal Accent Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Icon Container with Unique Design */}
                  <div className={`relative inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-br ${action.color} mb-4 shadow-2xl group-hover:shadow-green-500/50 transition-all duration-500 group-hover:scale-115 group-hover:-rotate-6`}>
                    {/* Outer Ring */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Inner Highlight */}
                    <div className="absolute inset-1 rounded-2xl bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
                    <action.icon className="h-8 w-8 text-white relative z-10 group-hover:scale-125 transition-transform duration-300" />
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors relative z-10">
                    {action.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 relative z-10">{action.action}</p>
                  
                  {/* Enhanced CTA with Background */}
                  <div className="relative z-10 flex items-center justify-between mt-4 p-2 rounded-lg bg-green-50/50 group-hover:bg-green-100/50 transition-colors">
                    <span className="text-green-600 font-semibold text-sm group-hover:text-green-700">Learn More</span>
                    <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
                  </div>
                  
                  {/* Bottom Right Corner Accent */}
                  <div className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl ${action.color} opacity-0 group-hover:opacity-10 rounded-tl-full transition-opacity duration-500`} />
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// STATISTICS SECTION
const StatisticsSection = () => {
  const stats = [
    {
      number: 12500,
      label: 'Active Users',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      description: 'Pet lovers using our platform'
    },
    {
      number: 8500,
      label: 'Animals Reunited',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      description: 'Successfully reunited with families'
    },
    {
      number: 200,
      label: 'Partner NGOs',
      icon: Building2,
      color: 'from-green-500 to-emerald-600',
      description: 'Trusted rescue organizations'
    },
    {
      number: 98,
      label: 'Success Rate',
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-600',
      description: 'Of verified reports'
    },
  ];

  return (
    <section id="statistics" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-[#FFF3D6]/30 to-white relative overflow-hidden" aria-label="Statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4 gap-3">
            <BarChart3 className="h-8 w-8 text-[#4CAF50]" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2B2B2B] tracking-tight">Our Impact</h2>
            <BarChart3 className="h-8 w-8 text-[#4CAF50]" />
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Real numbers showing our commitment to helping animals
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <AnimatedSection key={index} delay={index * 100} direction="scale">
              <Card className="text-center border-green-100 hover:border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="pt-6">
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
                    <StatCounter end={stat.number} />
                    {stat.label === 'Success Rate' && '%'}
                  </div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.description}</div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// FEATURES HIGHLIGHT SECTION
const FeaturesHighlightSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Advanced search filters help you find lost pets quickly by location, type, and date.',
      color: 'from-blue-500 to-indigo-600',
      action: 'Search Pets',
      route: '/pets/lost'
    },
    {
      icon: MapPin,
      title: 'Location Tracking',
      description: 'GPS-enabled reporting with real-time location updates for faster reunification.',
      color: 'from-green-500 to-emerald-600',
      action: 'Report Found',
      route: '/pets/new/found'
    },
    {
      icon: ShieldCheck,
      title: 'Verified Reports',
      description: 'All reports are verified by trusted NGO partners to ensure accuracy and safety.',
      color: 'from-purple-500 to-violet-600',
      action: 'View Reports',
      route: '/pets/found'
    },
    {
      icon: Heart,
      title: 'Community Support',
      description: 'Join thousands of pet lovers working together to help animals in need.',
      color: 'from-pink-500 to-rose-600',
      action: 'Join Community',
      route: '/home'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Report lost or found animals anytime, day or night. We\'re always here to help.',
      color: 'from-orange-500 to-amber-600',
      action: 'Report Now',
      route: '/pets/new/lost'
    },
    {
      icon: Users,
      title: 'Expert Network',
      description: 'Connect with experienced rescuers and veterinarians in your area.',
      color: 'from-teal-500 to-cyan-600',
      action: 'Browse Adoptions',
      route: '/pets/adopt'
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white" aria-label="Features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Why Choose Us
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Everything you need to find lost pets and help animals in need
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <StaggerAnimation key={index} index={index}>
              <Card 
                className="group hover:shadow-xl transition-all duration-300 border-gray-100 hover:border-green-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => isAuthenticated ? navigate(feature.route) : navigate('/auth/login')}
              >
                <CardHeader>
                  <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed font-light mb-4">
                    {feature.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-green-50 group-hover:border-green-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      isAuthenticated ? navigate(feature.route) : navigate('/auth/login');
                    }}
                  >
                    {feature.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </StaggerAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

// PARTNERS/LOGO SHOWCASE
const PartnersSection = () => {
  const partners = [
    { 
      name: 'Animal Welfare Trust', 
      icon: PawPrint,
      color: 'from-green-500 to-emerald-600',
      description: 'Dedicated to animal protection and welfare'
    },
    { 
      name: 'Rescue Foundation', 
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      description: 'Saving lives through rescue operations'
    },
    { 
      name: 'Pet Care Alliance', 
      icon: Stethoscope,
      color: 'from-blue-500 to-indigo-600',
      description: 'Comprehensive pet healthcare services'
    },
    { 
      name: 'Community Animal Network', 
      icon: Globe,
      color: 'from-purple-500 to-violet-600',
      description: 'Connecting communities for animal welfare'
    },
    { 
      name: 'Wildlife Protection Society', 
      icon: ShieldCheck,
      color: 'from-teal-500 to-cyan-600',
      description: 'Protecting wildlife and habitats'
    },
    { 
      name: 'Animal Rescue Network', 
      icon: Users,
      color: 'from-orange-500 to-amber-600',
      description: 'Network of dedicated rescuers'
    },
  ];

  return (
    <section id="partners" className="py-20 sm:py-24 lg:py-28 bg-gray-50 border-t border-gray-200" aria-label="Partners">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Trusted By</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Partner Organizations</h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">We work with leading animal welfare organizations to ensure the best care and protection for all animals.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 lg:gap-10">
          {partners.map((partner, index) => (
            <AnimatedSection key={index} delay={index * 100} direction="fade">
              <Card className="flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 border-gray-200 hover:border-[#4CAF50] bg-white transition-all duration-300 hover:shadow-lg group shadow-sm h-full">
                <div className={`h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br ${partner.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <partner.icon className="h-8 w-8 md:h-10 md:w-10 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-xs md:text-sm font-bold text-gray-900 text-center mb-2 group-hover:text-[#4CAF50] transition-colors">{partner.name}</h3>
                <p className="text-xs text-gray-600 text-center leading-tight">{partner.description}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ SECTION
const FAQSection = () => {
  const faqs = [
    {
      question: 'How do I report a lost animal?',
      answer: 'Simply click the "Report Missing Animal" button on our homepage, fill in the details including photos, location, and description. Our system will immediately share your report with rescue groups and the community. You can also use our mobile-friendly form for quick reporting on the go.'
    },
    {
      question: 'Is the platform free to use?',
      answer: 'Yes, our platform is completely free for all users. Reporting lost or found animals, searching, and connecting with rescuers is free of charge. We believe in making pet reunification accessible to everyone, regardless of financial circumstances.'
    },
    {
      question: 'How are reports verified?',
      answer: 'All reports are reviewed by our trusted NGO partner organizations. They check the information, photos, and details to ensure accuracy and prevent fraud. Verified reports receive a special badge, giving you confidence that the information is legitimate and trustworthy.'
    },
    {
      question: 'What happens after I report a found animal?',
      answer: 'Your report is verified by NGO partners, then matched with lost animal reports using our intelligent matching system. If a match is found, we help connect you with the owner for safe reunification. If no match is found, the animal may become available for adoption after a waiting period.'
    },
    {
      question: 'Can I adopt animals through this platform?',
      answer: 'Yes, animals that remain unclaimed after the verification and waiting period become available for adoption. All adopters are screened to ensure responsible placement. We work with our NGO partners to ensure animals go to loving, responsible homes.'
    },
    {
      question: 'How quickly will I get help?',
      answer: 'Our average response time is under 30 minutes. Reports are immediately shared with rescue groups and community members in your area. Our real-time notification system ensures that relevant parties are alerted instantly when a match is found.'
    },
    {
      question: 'What types of animals can I report?',
      answer: 'You can report any type of animal - pets (dogs, cats, rabbits), farm animals (horses, goats, sheep, buffalo), poultry (hens, ducks), and working animals (camels, donkeys). Our platform is designed to help reunite all animals with their owners.'
    },
    {
      question: 'How does the location tracking work?',
      answer: 'When you report a lost or found animal, you can provide the location details. Our system uses this information to match reports in the same area and send alerts to nearby rescuers and community members. You can also enable location-based notifications for real-time updates.'
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white" aria-label="FAQ">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4 gap-3">
            <div className="relative">
              <HelpCircle className="h-10 w-10 text-green-600" strokeWidth={2.5} />
              <Zap className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
          </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="relative">
              <HelpCircle className="h-10 w-10 text-green-600" strokeWidth={2.5} />
              <Zap className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Common Questions
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Quick Answers
            </Badge>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about using our platform to reunite lost pets
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-6">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 50}>
              <AccordionItem 
                value={`item-${index}`}
                className="border-2 border-gray-200 rounded-lg px-6 bg-white hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-base sm:text-lg">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6 pt-0 pl-11">
                  <p className="font-light">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            </AnimatedSection>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Mail className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Still have questions?</h3>
              </div>
              <p className="text-gray-600 mb-4 font-light">
                Can't find the answer you're looking for? Please contact our support team.
              </p>
              <Button 
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                asChild
              >
                <Link to="/contact">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// NEWSLETTER SECTION
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      toast({
        title: 'Thank you for subscribing!',
        description: 'You will receive updates about lost and found animals in your area.',
      });
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50" aria-label="Newsletter">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="border-2 border-green-200 bg-white shadow-xl">
          <CardContent className="p-8 sm:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-6 shadow-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Stay Updated
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-light">
                Get notified about lost and found animals in your area. Join our community to help reunite pets with their families.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1 rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
                <Button 
                  type="submit"
                  className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 rounded-lg"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Subscribe
                    </>
                  )}
                </Button>
              </form>
              
              <p className="text-sm text-gray-500 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
                  </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// RESOURCES & HELP SECTION
const ResourcesSection = () => {
  const resources = [
    {
      icon: BookOpen,
      title: 'Pet Care Guide',
      description: 'Learn how to care for lost or found animals while waiting for reunification',
      link: '/resources/care-guide',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Download,
      title: 'Mobile App',
      description: 'Download our mobile app for faster reporting and real-time notifications',
      link: '/download',
      color: 'from-purple-500 to-violet-600',
    },
    {
      icon: MessageCircle,
      title: 'Community Forum',
      description: 'Join discussions, share tips, and connect with other pet owners',
      link: '/forum',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: FileText,
      title: 'Blog & Articles',
      description: 'Read success stories, tips, and updates from our community',
      link: '/blog',
      color: 'from-orange-500 to-amber-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white" aria-label="Resources">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Resources & Help
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            Everything you need to help animals and stay informed
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource, index) => (
            <Card key={index} className="group border-2 border-gray-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br ${resource.color} mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <resource.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 font-light mb-4">
                  {resource.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full group-hover:bg-green-50 group-hover:border-green-300"
                  asChild
                >
                  <Link to={resource.link}>
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                  </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// EMERGENCY CONTACT SECTION
const EmergencyContactSection = () => {
  const emergencyContacts = [
    {
      icon: Phone,
      title: 'Emergency Hotline',
      contact: '+1 (555) 123-4567',
      description: '24/7 emergency support for urgent animal rescue situations',
      color: 'from-red-500 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
    },
    {
      icon: Mail,
      title: 'Email Support',
      contact: 'support@petreunite.com',
      description: 'Get help via email within 24 hours',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      contact: 'Available 9 AM - 9 PM',
      description: 'Chat with our support team in real-time',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white" aria-label="Emergency contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 mb-4 shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Need Immediate Help?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            Contact our support team for urgent assistance with lost or found animals
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {emergencyContacts.map((contact, index) => (
            <Card key={index} className="border-2 border-gray-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${contact.color} mb-4 shadow-md`}>
                  <contact.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-lg font-semibold text-gray-700 mb-2">{contact.contact}</p>
                <p className="text-sm text-gray-600 font-light">{contact.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// NGO COLLABORATION FEATURES - Feature Strip Component
const FeatureStrip = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: HandHeart,
      title: 'Volunteer Integration',
      desc: 'Join as rescuer, feeder, transporter.',
      details: [
        'Sign up in 30 sec.',
        'Get assigned missions by NGOs.',
        'Track your rescues & badges.'
      ],
      cta: 'Sign up as Volunteer',
      color: 'from-blue-500 to-indigo-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/become-volunteer');
        } else {
          navigate('/auth/register');
        }
      }
    },
    {
      icon: Building2,
      title: 'Shelter Capacity',
      desc: 'Live bed availability from partner shelters.',
      details: [
        'Real-time capacity updates.',
        'Find nearest available shelter.',
        'Partner with verified NGOs.'
      ],
      cta: 'See shelters near me',
      color: 'from-green-500 to-emerald-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/shelter-capacity');
        } else {
          navigate('/auth/login');
        }
      }
    },
    {
      icon: Home,
      title: 'Home-Check Tracker',
      desc: 'Pre & post-adoption visits logged by NGOs.',
      details: [
        'Pre-adoption home verification.',
        'Post-adoption follow-ups.',
        'NGO-verified visit reports.'
      ],
      cta: 'View home-check status',
      color: 'from-purple-500 to-violet-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/home-check-tracker');
        } else {
          navigate('/auth/login');
        }
      }
    },
    {
      icon: Droplet,
      title: 'Feeding Points',
      desc: 'Community water/feeding spots on the map.',
      details: [
        'Find nearby feeding points.',
        'Add new community spots.',
        'Track water bowl locations.'
      ],
      cta: 'Add a water point',
      color: 'from-orange-500 to-amber-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/feeding-points');
        } else {
          navigate('/auth/login');
        }
      }
    },
    {
      icon: Bell,
      title: 'Neighborhood Alerts',
      desc: 'Pincode alerts for local lost/found pets.',
      details: [
        'Get alerts for your pincode.',
        'SMS/push notifications.',
        'Local volunteer network alerts.'
      ],
      cta: 'Subscribe to local alerts',
      color: 'from-teal-500 to-cyan-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/neighborhood-alerts');
        } else {
          navigate('/auth/login');
        }
      }
    },
    {
      icon: ShieldCheck,
      title: 'NGO Verification',
      desc: 'Reports reviewed and approved by partner NGOs.',
      details: [
        'All reports verified by NGOs.',
        'Trusted partner network.',
        'Transparent verification process.'
      ],
      cta: 'Learn more',
      color: 'from-rose-500 to-pink-600',
      ctaAction: () => {
        if (isAuthenticated) {
          navigate('/ngo-verification');
        } else {
          navigate('/auth/login');
        }
      }
    },
  ];

  return (
    <section id="ngo-features" className="py-16 sm:py-20 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20 mb-4 px-4 py-1.5">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            NGO Collaboration
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2B2B2B] tracking-tight mb-4">
            Community Features
          </h2>
          <p className="text-lg sm:text-xl text-[#2B2B2B]/70 max-w-2xl mx-auto font-light">
            Join our network of volunteers, shelters, and community members working together for animal welfare
          </p>
        </div>
        
        {/* Desktop: Horizontal Grid */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                expandedCard === index ? 'border-[#4CAF50] shadow-lg' : 'border-gray-100 hover:border-[#4CAF50]/50'
              }`}
              onClick={() => setExpandedCard(expandedCard === index ? null : index)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform ${
                    expandedCard === index ? 'scale-110' : ''
                  }`}>
                    <feature.icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-600 leading-tight mb-3">{feature.desc}</p>
                  
                  {expandedCard === index && (
                    <div className="w-full mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                      <ul className="text-xs text-gray-700 space-y-1.5 mb-3 text-left">
                        {feature.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#4CAF50] mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        size="sm"
                        className="w-full text-xs bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          feature.ctaAction();
                        }}
                        data-analytics={`feature_${feature.title.toLowerCase().replace(/\s+/g, '_')}`}
                      >
                        {isAuthenticated ? feature.cta : 'Login to Access'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
          ))}
        </div>

        {/* Mobile: Horizontal Scroller */}
        <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4" ref={scrollContainerRef}>
          <div className="flex gap-6 min-w-max">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`min-w-[280px] cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  expandedCard === index ? 'border-[#4CAF50] shadow-lg' : 'border-gray-100 hover:border-[#4CAF50]/50'
                }`}
                onClick={() => setExpandedCard(expandedCard === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform ${
                      expandedCard === index ? 'scale-110' : ''
                    }`}>
                      <feature.icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-600 leading-tight mb-3">{feature.desc}</p>
                    
                    {expandedCard === index && (
                      <div className="w-full mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                        <ul className="text-xs text-gray-700 space-y-1.5 mb-3 text-left">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#4CAF50] mt-0.5 flex-shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          className="w-full text-xs bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            feature.ctaAction();
                          }}
                          data-analytics={`feature_${feature.title.toLowerCase().replace(/\s+/g, '_')}`}
                        >
                          {isAuthenticated ? feature.cta : 'Login to Access'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Shelter Capacity Widget
const ShelterWidget = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [shelters] = useState([
    { name: 'Green Valley Animal Shelter', distance: '2.5 km', beds: 12, capacity: 20 },
    { name: 'Hope Rescue Center', distance: '5.1 km', beds: 8, capacity: 15 },
    { name: 'Paw Care Foundation', distance: '7.8 km', beds: 5, capacity: 10 },
  ]);

  return (
    <Card className="group border-2 border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <BedDouble className="h-10 w-10 mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
          <CardTitle className="text-lg font-bold text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">
            Nearby Shelter Capacity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#2B2B2B]/70 leading-relaxed">
          View real-time bed availability from partner shelters in your area. Find the nearest shelter with available space for rescued animals.
        </p>
        
        {/* Sample Preview */}
        <div className="space-y-2">
          {shelters.slice(0, 2).map((shelter, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-[#FFF3D6]/30 rounded-lg">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#2B2B2B]">{shelter.name}</p>
                <p className="text-xs text-[#2B2B2B]/60">{shelter.distance} away</p>
              </div>
              <Badge className={`text-xs ${shelter.beds > 5 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {shelter.beds}/{shelter.capacity}
              </Badge>
            </div>
          ))}
        </div>
        
        <Button
          className="w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
          onClick={() => isAuthenticated ? navigate('/shelter-capacity') : navigate('/auth/login')}
          data-analytics="shelter_view"
        >
          {isAuthenticated ? 'View Full Dashboard' : 'Login to View All Shelters'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Become a Volunteer Information Card
const VolunteerInfo = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Card className="group border-2 border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <UserPlus className="h-10 w-10 mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
          <CardTitle className="text-lg font-bold text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">
            Become a Volunteer
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#2B2B2B]/70 leading-relaxed">
          Join as rescuer, feeder, or transporter. Register on our platform to get verified by NGO partners and start helping animals in need.
        </p>

        {/* Brief Role List */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-[#4CAF50]/30 text-[#2B2B2B]">
            <Heart className="h-3 w-3 mr-1 text-[#4CAF50]" />
            Rescuer
          </Badge>
          <Badge variant="outline" className="text-xs border-[#4CAF50]/30 text-[#2B2B2B]">
            <Users className="h-3 w-3 mr-1 text-[#4CAF50]" />
            Feeder
          </Badge>
          <Badge variant="outline" className="text-xs border-[#4CAF50]/30 text-[#2B2B2B]">
            <MapPin className="h-3 w-3 mr-1 text-[#4CAF50]" />
            Transporter
          </Badge>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
          onClick={() => isAuthenticated ? navigate('/become-volunteer') : navigate('/auth/register')}
          data-analytics="volunteer_register"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {isAuthenticated ? 'Apply Now' : 'Register Now'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Feeding Points Map Teaser
const FeedingMapTeaser = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Card className="group border-2 border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <Droplet className="h-10 w-10 mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
          <CardTitle className="text-lg font-bold text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">
            Feeding Points Map
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#2B2B2B]/70 leading-relaxed">
          Discover community-maintained water and feeding stations for stray animals. View locations, add new points, and help maintain existing ones.
        </p>
        
        {/* Map Preview */}
        <div className="h-32 bg-gradient-to-br from-[#FFF3D6] to-[#FFF3D6]/50 rounded-lg flex items-center justify-center relative overflow-hidden border border-[#4CAF50]/20">
          <MapPin className="h-6 w-6 text-[#4CAF50] absolute top-3 left-3" />
          <MapPin className="h-6 w-6 text-[#4CAF50] absolute top-6 right-6" />
          <MapPin className="h-6 w-6 text-[#4CAF50] absolute bottom-4 left-1/2" />
          <p className="text-xs text-[#2B2B2B]/60 font-medium">Interactive map available after login</p>
        </div>
        
        <Button
          className="w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
          onClick={() => isAuthenticated ? navigate('/feeding-points') : navigate('/auth/login')}
          data-analytics="feedpoint_view"
        >
          <Map className="h-4 w-4 mr-2" />
          {isAuthenticated ? 'View Full Map' : 'Login to Access Map'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Home-Check Tracker Teaser
const HomeCheckTracker = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const workflowSteps = [
    { step: 'Requested', status: 'completed' },
    { step: 'Scheduled', status: 'completed' },
    { step: 'Completed', status: 'pending' },
    { step: 'Follow-up (30d)', status: 'upcoming' },
  ];

  return (
    <Card className="group border-2 border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <ClipboardCheck className="h-10 w-10 mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
          <CardTitle className="text-lg font-bold text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">
            Adoption Home-Check Tracker
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#2B2B2B]/70 leading-relaxed">
          Track pre and post-adoption home visits conducted by NGO partners. Ensures safe placements and follow-up care for adopted animals.
        </p>
        
        {/* Workflow Preview */}
        <div className="space-y-2">
          {workflowSteps.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                item.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {item.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#2B2B2B]">{item.step}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button
          className="w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
          onClick={() => isAuthenticated ? navigate('/home-check-tracker') : navigate('/auth/login')}
          data-analytics="homecheck_view"
        >
          <ClipboardCheck className="h-4 w-4 mr-2" />
          {isAuthenticated ? 'View Your Checks' : 'Login to Track'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Neighborhood Watch Alerts
const NeighborhoodAlerts = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Card className="group border-2 border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <Radio className="h-10 w-10 mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
          <CardTitle className="text-lg font-bold text-[#2B2B2B] group-hover:text-[#4CAF50] transition-colors">
            Neighborhood Watch Alerts
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#2B2B2B]/70 leading-relaxed">
          Get instant notifications about lost or found animals in your pincode area. Receive SMS/push alerts and help reunite pets faster.
        </p>
        
        {/* Features List */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#4CAF50] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#2B2B2B]/70">Pincode-based alerts</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#4CAF50] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#2B2B2B]/70">SMS & push notifications</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#4CAF50] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#2B2B2B]/70">Local volunteer network</p>
          </div>
        </div>
        
        <Button
          className="w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
          onClick={() => isAuthenticated ? navigate('/neighborhood-alerts') : navigate('/auth/login')}
          data-analytics="alerts_subscribe"
        >
          <Bell className="h-4 w-4 mr-2" />
          {isAuthenticated ? 'Manage Alerts' : 'Login to Subscribe'}
        </Button>
      </CardContent>
    </Card>
  );
};


// CTA BAND
const CTABand = () => {
  const svgPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";
  
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-r from-[#4CAF50] via-[#2E7D32] to-[#4CAF50] text-white relative overflow-hidden">
      {/* Professional Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10 animate-pulse"
          style={{ backgroundImage: `url("${svgPattern}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32]/20 via-transparent to-[#2E7D32]/20" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">Seen a lost animal? Help reunite a family today.</h3>
            <p className="text-white/90 text-lg sm:text-xl font-light">Your report could bring an animal home in hours, not days.</p>
          </div>
          <Button size="lg" className="bg-white text-[#2E7D32] hover:bg-[#FFF3D6] font-semibold whitespace-nowrap group transition-all duration-300 hover:scale-105 shadow-2xl px-8 py-6 text-lg rounded-xl" asChild data-analytics="cta_report_now">
            <Link to="/auth/login">
              Report Now <ArrowRight className="ml-2.5 h-5 w-5 inline group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};


export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:bg-[#4CAF50] focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none">Skip to main content</a>
      <main id="main-content" className="min-h-screen" style={{ backgroundColor: '#F7F7F7', fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* 1. HERO SECTION - First Impression */}
        <div id="hero">
        <HeroSection isAuthenticated={isAuthenticated} />
        </div>
        
        <Separator className="opacity-20" />
        
        {/* 2. WHAT WE DO - About Section */}
        <AboutSection isAuthenticated={isAuthenticated} />
        
        <Separator className="opacity-20" />
        
        {/* 3. NGO FEATURES - Platform Capabilities */}
        <FeatureStrip isAuthenticated={isAuthenticated} />
        
        {/* NGO Collaboration Widgets */}
        <section id="ngo-widgets" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-white via-[#F0F9F0] to-white relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#2E7D32]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Enhanced Widgets Header */}
            <div className="text-center mb-16">
              <Badge variant="secondary" className="bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 mb-4 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Community Resources
              </Badge>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2B2B2B] mb-4 tracking-tight">
                Interactive Tools & Resources
              </h3>
              <p className="text-lg sm:text-xl text-[#2B2B2B]/70 max-w-3xl mx-auto font-light leading-relaxed">
                Access real-time information and join our community initiatives. Empower yourself with tools to make a difference.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <AnimatedSection delay={0} direction="fade">
                <ShelterWidget />
              </AnimatedSection>
              <AnimatedSection delay={100} direction="fade">
                <VolunteerInfo />
              </AnimatedSection>
              <AnimatedSection delay={200} direction="fade">
                <FeedingMapTeaser />
              </AnimatedSection>
              <AnimatedSection delay={300} direction="fade">
                <HomeCheckTracker />
              </AnimatedSection>
              <AnimatedSection delay={400} direction="fade">
                <NeighborhoodAlerts />
              </AnimatedSection>
            </div>
          </div>
        </section>
        
        <Separator className="opacity-20" />
        
        {/* 4. HOW IT WORKS - Process Flow */}
        <HowItWorksSection isAuthenticated={isAuthenticated} />
        
        <Separator className="opacity-20" />
        
        {/* 5. ADOPTION - Adoption Process */}
        <AdoptionSection isAuthenticated={isAuthenticated} />
        
        <Separator className="opacity-20" />
        
        {/* 6. STATISTICS - Impact Metrics */}
        <StatisticsSection />
        
        <Separator className="opacity-20" />
        
        {/* 7. TESTIMONIALS - Social Proof */}
        <TestimonialsSection />
        
        <Separator className="opacity-20" />
        
        {/* 8. PARTNERS - Trust Building */}
        <PartnersSection />
        
        <Separator className="opacity-20" />
        
        {/* 9. FAQ - Common Questions */}
        <FAQSection />
        
        <Separator className="opacity-20" />
        
        {/* 10. FINAL CTA - Call to Action */}
        <CTABand />
      </main>
    </>
  );
}
