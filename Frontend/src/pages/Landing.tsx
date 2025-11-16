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

// Different types of pets with high-quality images and detailed information
const petImages = [
  {
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1920&q=80',
    type: 'Dogs',
    text: 'Find Your Lost Companion',
    description: 'Dogs are loyal companions who bring joy to millions of families. From Golden Retrievers to mixed breeds, we help reunite lost dogs with their worried owners through our verified reporting system.',
    color: 'from-green-600 to-emerald-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=80',
    type: 'Cats',
    text: 'Reunite with Your Feline Friend',
    description: 'Cats are independent yet loving pets. Whether indoor or outdoor, lost cats need quick reunification. Our platform helps cat owners find their missing pets through community reports and smart matching.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1920&q=80',
    type: 'Birds',
    text: 'Help Our Feathered Friends',
    description: 'From parrots to pigeons, birds often fly away from their homes. Our specialized reporting helps track lost birds by species, color, and unique markings. Every bird deserves to return home safely.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=1920&q=80',
    type: 'Cows',
    text: 'Protect Valuable Livestock',
    description: 'Cows are essential farm animals that provide milk, meat, and labor. When they go missing, it impacts farmers livelihoods. Our platform helps track and reunite lost cattle with their owners through detailed reporting.',
    color: 'from-purple-500 to-violet-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1920&q=80',
    type: 'Camels',
    text: 'Safeguard Desert Companions',
    description: 'Camels are vital for transportation and livelihood in many regions. These resilient animals deserve protection. Our platform helps owners report and find lost camels through specialized tracking and community support.',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1920&q=80',
    type: 'Rabbits',
    text: 'Protect Your Hopping Friends',
    description: 'Rabbits are gentle and social pets that can easily escape from their enclosures. When they go missing, quick action is essential. Our platform helps rabbit owners find their lost companions through detailed reporting and community alerts.',
    color: 'from-pink-500 to-fuchsia-600'
  },
  {
    url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1920&q=80',
    type: 'Small Pets',
    text: 'Every Pet Matters',
    description: 'Hamsters, guinea pigs, and other small pets are beloved family members. Despite their size, they matter just as much. Our platform ensures no pet is too small to be found and reunited.',
    color: 'from-rose-500 to-pink-600'
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
      className="relative overflow-hidden min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center py-12 sm:py-16 lg:py-20"
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
              {/* Gradient overlay that matches pet type */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pet.color} opacity-40`} />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40" />
            </div>
          );
        })}
      </div>

      {/* Content Overlay with Smooth Text Transitions */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading with smooth transition */}
          <h1 
            key={`heading-${currentImageIndex}`}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-2xl mb-4 sm:mb-6 transition-all duration-700 ease-in-out px-2"
          >
            {currentPet.text}
          </h1>
          
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white/95 drop-shadow-lg mb-3 sm:mb-4 px-2">
            Rescue. Reunite. Protect — A Trusted Platform for Every Animal.
          </h2>
          
          {/* Dynamic Description for each pet type */}
          <p 
            key={`desc-${currentImageIndex}`}
            className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md mb-6 sm:mb-8 md:mb-10 transition-all duration-700 ease-in-out px-4"
          >
            {currentPet.description}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 md:mt-10 flex flex-row gap-3 sm:gap-4 justify-center items-center px-4 flex-wrap" role="group" aria-label="Primary actions">
            <Button
              size="lg"
              className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 group transition-transform hover:scale-105 hover:shadow-2xl shadow-lg whitespace-nowrap"
              data-analytics="cta_report_missing"
              aria-label="Report Missing Animal"
              onClick={() => isAuthenticated ? navigate('/pets/new/lost') : navigate('/auth/login')}
            >
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 group-hover:scale-110 transition-transform" />
              Report Missing Animal
            </Button>

            <Button
              size="lg"
              className="flex-1 sm:flex-initial bg-white/95 hover:bg-white text-green-600 text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 group transition-transform hover:scale-105 hover:shadow-2xl shadow-lg border-2 border-white whitespace-nowrap"
              data-analytics="cta_report_found"
              aria-label="Report Found Animal"
              onClick={() => isAuthenticated ? navigate('/pets/new/found') : navigate('/auth/login')}
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600 group-hover:scale-110 transition-transform" />
              Report Found Animal
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="flex-1 sm:flex-initial text-white hover:bg-white/20 text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 group transition-transform hover:scale-105 border-2 border-white/50 backdrop-blur-sm whitespace-nowrap"
              data-analytics="cta_adopt"
              aria-label="Browse animals for adoption"
              onClick={() => isAuthenticated ? navigate('/pets/adopt') : navigate('/auth/login')}
            >
              <Home className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-white" />
              Adopt
            </Button>
          </div>

          {/* Image Indicators */}
          <div className="mt-8 sm:mt-10 md:mt-12">
            <div className="flex justify-center gap-2">
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
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentImageIndex
                      ? 'w-8 bg-green-600 shadow-lg'
                      : 'w-2 bg-white/50 hover:bg-white/75 hover:w-3'
                  }`}
                  aria-label={`View ${pet.type} image`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Features Section with Circular Icons - Hidden on Mobile */}
        <div className="hidden md:grid mt-16 lg:mt-20 grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto px-4">
          {/* Report Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-xl group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                <FileText className="h-7 w-7 text-white" />
              </div>
              {/* Decorative Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-green-200/40 group-hover:border-green-300/60 transition-all duration-300 scale-125" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-3 drop-shadow-lg">Easy Reporting</h3>
            <p className="text-white/90 text-sm lg:text-base leading-relaxed max-w-[280px] mx-auto drop-shadow-md">
              Submit detailed reports with photos and location information. Our simple form makes it easy to report lost or found animals quickly.
            </p>
          </div>

          {/* Reunite Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                <Heart className="h-7 w-7 text-white fill-white" />
              </div>
              {/* Decorative Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-green-200/40 group-hover:border-green-300/60 transition-all duration-300 scale-125" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-3 drop-shadow-lg">Smart Matching</h3>
            <p className="text-white/90 text-sm lg:text-base leading-relaxed max-w-[280px] mx-auto drop-shadow-md">
              Our intelligent matching system connects lost and found reports automatically, helping reunite pets with their families faster.
            </p>
          </div>

          {/* Verification Feature */}
          <div className="group text-center flex flex-col items-center">
            <div className="relative inline-block mb-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-xl group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              {/* Decorative Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-green-200/40 group-hover:border-green-300/60 transition-all duration-300 scale-125" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-3 drop-shadow-lg">NGO Verified</h3>
            <p className="text-white/90 text-sm lg:text-base leading-relaxed max-w-[280px] mx-auto drop-shadow-md">
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
      text: 'NGO-verified reports to reduce false claims and improve trust',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: PawPrint,
      text: 'Support for all animal types including farm and working animals',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: HandHeart,
      text: 'Clear handover protocols to protect both animals and claimants',
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
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-green-50/30 to-white" aria-label="About">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">What We Do</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-green-600 to-emerald-600 mt-2 rounded-full" />
              </div>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
              We provide a secure, NGO-moderated platform for reporting lost and found animals across
              species — from dogs and cats to farm animals and birds. Our verification process reduces
              fraud and helps reunify animals with their families quickly.
            </p>
            
            {/* Features List with Icons */}
            <div className="space-y-4 mt-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-xl ${feature.bgColor} transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
                >
                  <div className={`flex-shrink-0 h-12 w-12 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold"
                onClick={() => isAuthenticated ? navigate('/about') : navigate('/auth/login')}
              >
                <ShieldCheck className="mr-2 h-5 w-5" />
                Learn more about NGO verification
              </Button>
            </div>
          </div>

          {/* Right Side - NGO Trust Card */}
          <div className="relative">
            {/* Decorative Background Elements */}
            <div className="absolute -top-4 -right-4 h-32 w-32 bg-green-200 rounded-full opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 bg-emerald-200 rounded-full opacity-20 blur-2xl" />
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-green-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-white" />
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
                  Our partners review each report and manage verification and reunification. We surface
                  partner badges to help you identify verified listings.
                </p>

                {/* NGO Badges */}
                <div className="space-y-4">
                  {ngos.map((ngo, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-100 transition-colors">
                        <ngo.icon className="h-7 w-7 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{ngo.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-600">Verified Partner</span>
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
      description: 'Log details and photos so the community and NGO can start a search quickly.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: Heart, 
      title: 'Report Found Animal', 
      description: 'Register found animals with photos and location so owners can be matched.',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-100',
      iconColor: 'text-pink-600'
    },
    { 
      icon: ShieldCheck, 
      title: 'NGO Verification & Matching', 
      description: 'Trained NGO staff verify reports and use smart matching to connect cases.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: Users, 
      title: 'Reunify or Adopt', 
      description: 'If claimed, NGO supervises handover; if unclaimed, animals are listed for adoption.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      iconColor: 'text-green-600'
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-green-600 mr-2" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">How It Works</h2>
            <Sparkles className="h-8 w-8 text-green-600 ml-2" />
          </div>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            A clear, NGO-backed process to reunify animals with their families
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line - Desktop Only */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-green-200 via-emerald-200 via-green-200 to-emerald-200" />
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step Number Badge */}
                <div className={`absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-sm font-bold shadow-lg`}>
                  {i + 1}
                </div>
                
                {/* Icon Container with Enhanced Styling */}
                <div className={`relative mb-6 h-24 w-24 rounded-2xl bg-gradient-to-br ${step.bgColor} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2`}>
                  {/* Animated Background Glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
                  
                  {/* Icon */}
                  <step.icon className={`h-12 w-12 ${step.iconColor} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                  
                  {/* Decorative Corner Accents */}
                  <div className={`absolute top-2 right-2 h-3 w-3 rounded-full bg-gradient-to-br ${step.color} opacity-30`} />
                  <div className={`absolute bottom-2 left-2 h-2 w-2 rounded-full bg-gradient-to-br ${step.color} opacity-20`} />
                </div>
                
                {/* Arrow Connector - Desktop Only */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full">
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-gray-300" />
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
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
      description: 'Every report is reviewed and verified by trained NGO staff to ensure accuracy and prevent fraud.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600'
    },
    {
      icon: HandHeart,
      title: 'Safe Handover',
      description: 'Clear protocols and supervised handovers protect both animals and claimants during reunification.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures and privacy controls.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-gray-50 to-white" aria-label="Trust and safety">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-green-600 mr-3" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Trust & Safety</h2>
            <Shield className="h-10 w-10 text-green-600 ml-3" />
          </div>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            All reports are reviewed by our NGO partners. Verified listings show a partner badge and
            a verification date so you can trust the information before acting.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {safetyFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`group relative bg-gradient-to-br ${feature.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-8 w-8 text-white`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
              {/* Decorative Element */}
              <div className={`absolute top-4 right-4 h-2 w-2 rounded-full bg-gradient-to-br ${feature.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* Verification Badge Showcase */}
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-green-100 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Verified Partner Badge</h3>
                  <p className="text-sm text-gray-600">Trusted verification system</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Every verified listing displays a partner badge with verification date. This ensures you can trust the information and proceed with confidence.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>NGO verified</span>
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-4" />
                <span>Date stamped</span>
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-4" />
                <span>Regularly updated</span>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Badge Preview */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Verified</p>
                      <p className="text-green-100 text-sm">Animal Rescue Foundation</p>
                    </div>
                  </div>
                  <div className="bg-white/90 rounded-lg p-4 mt-4">
                    <p className="text-xs text-gray-600 mb-1">Verified on</p>
                    <p className="text-sm font-semibold text-gray-900">January 15, 2024</p>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-green-200 rounded-full opacity-20 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 bg-green-200 rounded-full opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// ADOPTION AWARENESS
const AdoptionSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  
  const adoptionFeatures = [
    {
      icon: CheckCircle2,
      text: 'Only unclaimed animals are eligible for adoption after the verification period',
      color: 'text-green-600'
    },
    {
      icon: Users,
      text: 'Prospective adopters undergo screening and reference checks',
      color: 'text-green-600'
    },
    {
      icon: Heart,
      text: 'Medical care and follow-up support are provided where needed',
      color: 'text-pink-600'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 via-white to-green-50/30" aria-label="Adoption awareness">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
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
              Animals are only listed for adoption when they remain unclaimed after NGO verification.
              Every adoption request is screened to ensure responsible placement and lifetime welfare.
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

          {/* Right Side - Image */}
          <div className="relative">
            {/* Decorative Background Elements */}
            <div className="absolute -top-4 -right-4 h-32 w-32 bg-pink-200 rounded-full opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 bg-rose-200 rounded-full opacity-20 blur-2xl" />
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&q=80" 
                alt="Happy adopted animals in a new home" 
                className="w-full h-[500px] object-cover" 
                loading="lazy" 
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Badge on Image */}
              <div className="absolute bottom-6 left-6 right-6">
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
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj',
      rating: 5
    },
    { 
      quote: 'As a rescuer, this platform makes it so easy to connect found animals with their families. The NGO verification gives everyone confidence.', 
      author: 'Maria Santos', 
      role: 'Animal Rescuer',
      location: 'Delhi, India',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      rating: 5
    },
    { 
      quote: 'Adopted my best friend Bella here. Safe, verified, and the team was incredibly supportive throughout the entire process.', 
      author: 'James Lee', 
      role: 'Adoptive Owner',
      location: 'Bangalore, India',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
      rating: 5
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-gray-50 to-white" aria-label="Success stories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
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
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className="group relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-green-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
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

// CTA BAND
const CTABand = () => (
  <section className="py-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Seen a lost animal? Help reunite a family today.</h3>
          <p className="mt-2 text-green-100 text-sm">Your report could bring an animal home in hours, not days.</p>
        </div>
        <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 font-semibold whitespace-nowrap" asChild data-analytics="cta_report_now">
          <Link to="/auth/login">Report Now</Link>
        </Button>
      </div>
    </div>
  </section>
);


export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:bg-green-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none">Skip to main content</a>
      <main id="main-content" className="min-h-screen bg-white">
        <HeroSection isAuthenticated={isAuthenticated} />
        <AboutSection isAuthenticated={isAuthenticated} />
        <HowItWorksSection isAuthenticated={isAuthenticated} />
        <TrustSection />
        <AdoptionSection isAuthenticated={isAuthenticated} />
        <TestimonialsSection />
        <CTABand />
      </main>
    </>
  );
}
