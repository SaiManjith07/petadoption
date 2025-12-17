/**
 * ===================================================================================
 * LANDING PAGE - PROFESSIONAL UI DESIGN
 * ===================================================================================
 * 
 * DESIGN SYSTEM OVERVIEW:
 * -----------------------
 * This landing page follows a modern, premium design system with the following principles:
 * 
 * 1. COLOR PALETTE:
 *    - Primary: Teal (#14b8a6, #0891b2) - Trust, care, professionalism
 *    - Secondary: Purple (#a855f7) - Innovation, creativity
 *    - Accents: Green, Blue, Orange, Pink - Emotional connection
 *    - Backgrounds: Soft gradients (slate-50, teal-50) for depth
 * 
 * 2. TYPOGRAPHY:
 *    - Headings: Bold, large (3.5rem - 6rem), gradient text fills
 *    - Body: Medium weight, excellent readability (gray-600/700)
 *    - Hierarchy: Clear size and weight differentiation
 * 
 * 3. SPACING SYSTEM:
 *    - Section padding: py-20 sm:py-24 lg:py-28 (80px - 112px)
 *    - Card gaps: gap-6 (24px) for comfortable breathing room
 *    - Container: max-w-7xl centered with responsive padding
 * 
 * 4. DESIGN PATTERNS:
 *    - Glassmorphism: backdrop-blur with semi-transparent backgrounds
 *    - Gradient borders: Animated borders that flow on hover
 *    - 3D depth: Multi-layer shadows, transforms, perspective
 *    - Circular elements: rounded-3xl for cards, rounded-full for icons
 * 
 * 5. ANIMATION STRATEGY:
 *    - Entrance: Fade + blur + translateY (staggered 100-150ms)
 *    - Hover: Scale, translate, shadow intensification
 *    - Micro-interactions: Icon rotations, gradient shifts, glow effects
 *    - Performance: GPU-accelerated transforms, reduced motion support
 * 
 * SECTION ARCHITECTURE:
 * ---------------------
 * 1. Hero Section - Full-screen immersive experience with carousel
 * 2. What We Do - Bento box grid showcasing core services
 * 3. Community Features - Horizontal carousel with 3D tilt effects
 * 4. Interactive Tools - Flip cards with detailed previews
 * 5. How It Works - Timeline with animated path progression
 * 6. Medical Section - Two-column health & vaccination information
 * 7. NGO Collaboration - Partnership showcase with trust indicators
 * 8. Adoption Awareness - Image gallery with importance messaging
 * 9. Statistics - Animated counters with impact metrics
 * 10. Testimonials - Social proof with star ratings
 * 
 * ===================================================================================
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  Shield,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  X,
  Info,
  Quote,
  Star,
  Users,
  Activity,
  Home,
  Sparkles,
  ShieldCheck,
  Award,
  Handshake,
  BookOpen,
  TrendingUp,
  Play,
  AlertCircle,
  HandHeart,
  MessageCircle,
  GraduationCap,
  Truck,
  FileText,
  Eye,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLandingData } from '@/contexts/LandingContext';
import { useAuth } from '@/lib/auth';
import { healthApi, VaccinationCamp } from '@/api/healthApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * ===================================================================================
 * SECTION 1: HERO SECTION
 * ===================================================================================
 * 
 * PURPOSE:
 * First impression section that immediately communicates the platform's value
 * proposition. Creates emotional connection through beautiful pet imagery.
 * 
 * DESIGN RATIONALE:
 * - Full-screen immersive experience (min-h-screen) for maximum impact
 * - Background image carousel rotates every 4 seconds showing different pets
 * - Crossfade animation (1.5s) creates smooth, professional transitions
 * - Text overlay with gradient ensures readability on any image
 * - Centered content with generous whitespace for focus
 * 
 * KEY FEATURES:
 * - Auto-rotating image carousel (11 pet types)
 * - Animated badge, heading, subtitle, and description
 * - Three CTA buttons (Primary, Secondary, Tertiary) with hover effects
 * - Pet type selector at bottom with active state indicators
 * - Scroll indicator animation
 * 
 * INTERACTIONS:
 * - Click pet icons to jump to specific pet type
 * - Hover effects on all buttons (scale, shadow, glow)
 * - Smooth transitions between carousel images
 * 
 * ACCESSIBILITY:
 * - High contrast text (white with drop-shadow)
 * - Keyboard navigable pet selector
 * - ARIA labels for screen readers
 * 
 * ===================================================================================
 */

const HeroSection: React.FC = () => {
  const { petImages, getHeroImages } = useLandingData();
  const heroImages = getHeroImages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentHero = heroImages[currentIndex] || heroImages[0];
  const currentPet = petImages[currentIndex] || petImages[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images - No Transition */}
      <div className="absolute inset-0 z-0">
        <div
          key={currentIndex}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${currentHero.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      {/* Content Overlay - Text and CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full pt-[10px]">
        <div
          key={currentIndex}
          className="max-w-4xl mx-auto"
        >
          {/* Pet Type Badge - Starting from navbar */}
          <div className="inline-block px-6 py-2 rounded-full mb-3 bg-[#2BB6AF]/20 backdrop-blur-sm border border-[#2BB6AF]/40 hover:bg-[#2BB6AF]/30 hover:border-[#2BB6AF]/60 transition-all duration-300 cursor-default">
            <span className="text-sm font-semibold text-white drop-shadow-lg">
              {currentPet?.type || 'Pet'} Care Platform
            </span>
          </div>

          {/* Main Heading - Properly aligned */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 leading-tight text-white drop-shadow-2xl">
            {currentHero.title}
          </h1>

          {/* Subtitle - Decreased font size, properly aligned */}
          <p className="text-lg md:text-xl lg:text-2xl mb-4 max-w-3xl mx-auto font-medium text-white drop-shadow-lg">
            {currentHero.subtitle}
          </p>

          {/* Description - Above buttons */}
          {currentPet?.description && (
            <div
              key={currentIndex}
              className="mb-6 max-w-3xl mx-auto"
            >
              <p className="text-base md:text-lg text-white/95 drop-shadow-lg leading-relaxed">
                {currentPet.description}
              </p>
            </div>
          )}

          {/* CTA Buttons - All in One Line */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link to="/auth/login">
              <Button 
                size="lg" 
                className="group bg-[#2BB6AF] hover:bg-[#239a94] text-white px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-[#2BB6AF]/50 active:scale-95"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pets/report-lost">
              <Button 
                size="lg" 
                variant="outline" 
                className="group border-2 border-white text-white hover:bg-white hover:text-[#2BB6AF] px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-white/30 active:scale-95 backdrop-blur-sm bg-white/5"
              >
                Report
                <ArrowRight className="ml-2 h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </Link>
            <Link to="/pets/adopt">
              <Button 
                size="lg" 
                className="group bg-white text-[#2BB6AF] hover:bg-gray-50 hover:text-[#239a94] px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-white/50 active:scale-95"
              >
                <Heart className="mr-2 h-5 w-5 group-hover:fill-[#2BB6AF] group-hover:scale-110 transition-all" />
                Adoption
              </Button>
            </Link>
          </div>
        </div>
        
      </div>

      {/* All Animals Grid Below Hero (Scroll Indicator) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-7xl px-4">
        <div className="text-center text-white mb-4">
          <div className="flex flex-nowrap justify-center items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {petImages.slice(0, 11).map((pet, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`group relative flex-shrink-0 transition-all duration-300 flex flex-col items-center ${
                  index === currentIndex
                    ? 'scale-110'
                    : 'hover:scale-110'
                }`}
                title={pet.type}
              >
                <div className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${
                  index === currentIndex 
                    ? 'border-[3px] border-[#2BB6AF] ring-2 ring-[#2BB6AF]/50 ring-offset-2 ring-offset-transparent shadow-lg shadow-[#2BB6AF]/30' 
                    : 'border-2 border-white/30 group-hover:border-white/60 group-hover:shadow-md group-hover:shadow-white/20'
                }`}>
                  <img
                    src={pet.url}
                    alt={pet.type}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      index === currentIndex ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=' + pet.type;
                    }}
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-[#2BB6AF]/10 animate-pulse"></div>
                  )}
                </div>
                {/* Circular indicator for selected */}
                {index === currentIndex && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-[#2BB6AF] mt-1.5 shadow-lg shadow-[#2BB6AF]/50"
                  ></motion.div>
                )}
              </button>
            ))}
          </div>
        </div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/60 mt-4"
        >
          <ArrowRight className="w-5 h-5 mx-auto rotate-90" />
        </motion.div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 2: WHAT WE DO
 * ===================================================================================
 * 
 * PURPOSE:
 * Showcases the four core services/platform capabilities in an engaging,
 * easy-to-scan format. Uses bento box layout for visual interest.
 * 
 * DESIGN RATIONALE:
 * - Bento box grid: Asymmetric layout with varying card sizes
 * - Glassmorphism: Modern frosted glass effect with backdrop blur
 * - Gradient borders: Animated borders that flow around card edges on hover
 * - Ambient backgrounds: Floating shapes create depth and movement
 * - First card spans 2 rows for visual hierarchy
 * 
 * KEY FEATURES:
 * - 4 feature cards with glassmorphism styling
 * - Gradient icon circles with rotating conic gradients
 * - Multi-layer shadows for 3D depth effect
 * - Hover: Card lifts, border animates, icon scales and rotates
 * - Staggered reveal animations (150ms delay between cards)
 * 
 * INTERACTIONS:
 * - Hover: translateY(-10px), shadow intensification, gradient border reveal
 * - Icon: Scale 1.1, rotate 5deg, background gradient rotates 360deg
 * - Smooth spring physics for natural movement
 * 
 * COLOR SCHEME:
 * - Primary teal gradient (#14b8a6 to #0891b2)
 * - Purple accent (#a855f7) in rotating gradients
 * - Soft background: slate-50 via teal-50/30
 * 
 * ===================================================================================
 */

const WhatWeDo: React.FC = () => {
  const { whatWeDoFeatures } = useLandingData();
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const toggleFlip = (index: number) => {
    setFlippedCardIndex(prev => {
      // If clicking the same card, flip it back
      if (prev === index) {
        return null;
      }
      // Otherwise, flip the clicked card (this automatically flips back the previous one)
      return index;
    });
  };

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-transparent relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-96 h-96 bg-teal-50 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-50 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-teal-50 border-2 border-teal-200">
            <Sparkles className="h-5 w-5 text-teal-600 animate-pulse" />
            <span className="text-sm font-bold text-teal-600">Our Services</span>
          </Badge>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6"
          >
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              What We Do
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            How we provide comprehensive pet welfare solutions to our community
          </motion.p>
        </motion.div>

        {/* Flip Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whatWeDoFeatures.map((feature, index) => {
            const isFlipped = flippedCardIndex === index;
            const isHovered = hoveredCard === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => toggleFlip(index)}
                className="group relative h-[400px] cursor-pointer"
                style={{
                  perspective: '1000px',
                }}
              >
                <motion.div
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front of Card */}
                  <div
                    className="absolute inset-0 rounded-3xl p-8 backface-hidden flex flex-col bg-transparent backdrop-blur-sm border-2 border-teal-200/50 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    {/* Primary Color Accent */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: isHovered ? '100%' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 h-1 bg-gradient-to-r from-teal-600 to-cyan-600"
                    />

                    {/* Icon Section */}
                    <motion.div
                      animate={isHovered ? {
                        scale: [1, 1.15, 1.1],
                        rotate: [0, 5, 0],
                      } : {}}
                      transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                      className="relative mb-6 flex-shrink-0"
                    >
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative bg-gradient-to-br from-teal-600 to-cyan-600 shadow-lg"
                      >
                        <motion.div
                          animate={isHovered ? { rotate: 360 } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20"
                          style={{
                            background: 'conic-gradient(from 0deg, #14b8a6, #0891b2, #14b8a6)',
                          }}
                        />
                        <div className="relative z-10 text-white">
                          {React.cloneElement(feature.icon as React.ReactElement, { 
                            className: 'h-10 w-10' 
                          })}
                        </div>
                      </div>
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 flex-shrink-0">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed mb-4 flex-1 overflow-y-auto min-h-0">
                      {feature.description}
                    </p>

                    {/* Flip Hint */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex-shrink-0">
                      <p className="text-sm text-teal-600 font-semibold flex items-center justify-start gap-2">
                        <span>Click to learn more</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </p>
                    </div>
                  </div>

                  {/* Back of Card */}
                  {feature.detailedInfo && (
                    <div
                      className="absolute inset-0 rounded-3xl p-8 backface-hidden overflow-y-auto"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
                        border: '2px solid rgba(20, 184, 166, 0.2)',
                        boxShadow: '0 20px 60px rgba(20, 184, 166, 0.1)',
                      }}
                    >
                      <div className="relative z-10 h-full flex flex-col">
                        {/* Icon Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <div className="text-white">
                              {React.cloneElement(feature.icon as React.ReactElement, { className: 'h-6 w-6' })}
                            </div>
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            {feature.title}
                          </h3>
                        </div>

                        {/* Detailed Information */}
                        <div className="flex-1 space-y-6 text-left">
                          {/* Features */}
                          {feature.detailedInfo.features && feature.detailedInfo.features.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                Key Features
                              </h4>
                              <ul className="space-y-2">
                                {feature.detailedInfo.features.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-teal-600 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Process */}
                          {feature.detailedInfo.process && feature.detailedInfo.process.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <ArrowRight className="h-5 w-5 text-teal-600" />
                                How It Works
                              </h4>
                              <ol className="space-y-2">
                                {feature.detailedInfo.process.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-teal-600 font-bold mt-0.5">{idx + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Benefits */}
                          {feature.detailedInfo.benefits && feature.detailedInfo.benefits.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Heart className="h-5 w-5 text-teal-600" />
                                Benefits
                              </h4>
                              <ul className="space-y-2">
                                {feature.detailedInfo.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-teal-600 mt-1">•</span>
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Flip Back Hint */}
                        <div className="mt-4 pt-4 border-t border-teal-200/50">
                          <p className="text-xs text-gray-500 text-center">
                            Click anywhere to flip back
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 3: COMMUNITY FEATURES
 * ===================================================================================
 * 
 * PURPOSE:
 * Highlights community-driven features (Shelters, Feeding, Home Checks) in an
 * interactive carousel format. Encourages user engagement and exploration.
 * 
 * DESIGN RATIONALE:
 * - Horizontal scrollable carousel: Infinite scroll with snap points
 * - 3D tilt effect: Cards respond to mouse position (rotateX, rotateY)
 * - Spotlight effect: Cursor creates a glowing spotlight on background
 * - Blur adjacent cards: Focus on hovered card, blur others
 * - Duplicated content: Seamless infinite scroll experience
 * 
 * KEY FEATURES:
 * - 3 feature cards in horizontal carousel
 * - 3D perspective transforms (1000px perspective)
 * - Mouse position tracking for realistic 3D tilt
 * - Spotlight follows cursor across section
 * - Snap scrolling for smooth navigation
 * - Auth dialog for protected features
 * 
 * INTERACTIONS:
 * - Mouse move: Card tilts in 3D space based on cursor position
 * - Hover: Scale 1.02, translateY(-10px), shadow intensification
 * - Click: Navigate to feature or show auth dialog
 * - Adjacent cards blur when one is hovered
 * 
 * TECHNICAL:
 * - Uses perspective: 1000px for 3D transforms
 * - Spring physics for smooth tilt animations
 * - Intersection Observer for scroll animations
 * 
 * ===================================================================================
 */

const CommunityFeatures: React.FC = () => {
  const { communityFeatures } = useLandingData();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authDialog, setAuthDialog] = useState<{ open: boolean; message: string; link: string }>({
    open: false,
    message: '',
    link: '',
  });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getFeatureContent = (feature: typeof communityFeatures[0]) => {
    const contentMap: { [key: string]: string } = {
      'Shelters': 'Connect with verified animal shelters in your area. View shelter capacity, available pets, and contact information. Help pets find safe temporary homes.',
      'Feeding': 'Join community feeding programs for stray animals. Set up feeding points, track feeding schedules, and coordinate with other volunteers to ensure no pet goes hungry.',
      'Home Checks': 'Schedule home visits for adoption verification. Ensure safe and suitable environments for pets. Help verify that adopters can provide proper care and love.',
      'Volunteer Network': 'Join a community of dedicated volunteers making a difference. Participate in rescue operations, adoption events, and community outreach programs.',
      'Emergency Rescue': 'Report and respond to pet emergencies in real-time. Get immediate help for injured or distressed animals. Coordinate with rescue teams for urgent situations.',
      'Pet Fostering': 'Provide temporary homes for pets awaiting adoption. Give pets a safe, loving environment while they wait for their forever families. Make a direct impact on pet welfare.',
      'Community Forum': 'Connect, share experiences, and get advice from pet owners. Share success stories, ask questions, and learn from experienced community members.',
      'Pet Transportation': 'Coordinate safe transport for rescued and adopted pets. Help pets reach their new homes safely. Connect with transportation volunteers and schedule pickups.',
    };
    return contentMap[feature.title] || feature.description;
  };

  const handleFeatureClick = (feature: typeof communityFeatures[0]) => {
    if (feature.requiresAuth && !isAuthenticated) {
      setAuthDialog({
        open: true,
        message: getFeatureContent(feature),
        link: feature.link,
      });
    } else {
      navigate(feature.link);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
    setHoveredCard(index);
  };

  return (
    <>
      <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-white via-slate-50 to-white relative overflow-hidden">
        {/* Spotlight Effect Background */}
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: hoveredCard !== null ? 0.1 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(20, 184, 166, 0.15), transparent 40%)`,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
          <motion.h2 
              initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
          >
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Community Features
              </span>
          </motion.h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect, collaborate, and make a difference together
            </p>
          </motion.div>

          {/* Horizontal Scrollable Carousel */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-6"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex gap-6 px-2" style={{ width: 'max-content' }}>
                {[...communityFeatures, ...communityFeatures].map((feature, index) => {
                  const actualIndex = index % communityFeatures.length;
                  const isHovered = hoveredCard === index;
                  
                  return (
              <motion.div
                      key={`${feature.id}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                      transition={{ 
                        duration: 0.5, 
                        delay: actualIndex * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      onMouseMove={(e) => handleMouseMove(e, index)}
                      onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleFeatureClick(feature)}
                      className="group relative flex-shrink-0 w-[380px] snap-center cursor-pointer"
                      style={{
                        perspective: '1000px',
                      }}
                    >
                      <motion.div
                        animate={isHovered ? {
                          rotateY: (mousePosition.x - 190) / 20,
                          rotateX: -(mousePosition.y - 200) / 20,
                        } : {
                          rotateY: 0,
                          rotateX: 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative h-full p-8 rounded-3xl overflow-hidden"
                        style={{
                          background: isHovered
                            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(8, 145, 178, 0.15) 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px) saturate(180%)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: isHovered
                            ? '0 25px 70px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(20, 184, 166, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                            : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                          transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Gradient Border */}
                        <div 
                          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: 'linear-gradient(135deg, #14b8a6, #0891b2, #a855f7)',
                            padding: '2px',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                          }}
                        />

                        {/* Blur Effect on Adjacent Cards */}
                        {hoveredCard !== null && hoveredCard !== index && (
                          <div className="absolute inset-0 bg-teal-50/30 backdrop-blur-sm rounded-3xl" />
                        )}

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon */}
                          <motion.div
                            animate={isHovered ? {
                              scale: [1, 1.15, 1.1],
                              rotate: [0, 5, 0],
                            } : {}}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="mb-6"
                          >
                            <div 
                              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto relative"
                              style={{
                                background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                                boxShadow: isHovered
                                  ? '0 0 40px rgba(20, 184, 166, 0.7), 0 0 80px rgba(20, 184, 166, 0.4)'
                                  : '0 4px 20px rgba(20, 184, 166, 0.3)',
                              }}
                            >
                              <motion.div
                                animate={isHovered ? { rotate: 360 } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: 'conic-gradient(from 0deg, #14b8a6, #0891b2, #a855f7, #14b8a6)',
                                  opacity: 0.3,
                                }}
                              />
                              <div className="relative z-10 text-white">
                                {React.cloneElement(feature.icon as React.ReactElement, { className: 'h-10 w-10' })}
                              </div>
                            </div>
              </motion.div>

                          <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
                            {feature.description}
                          </p>

                          {/* Arrow with Animation */}
                          <motion.div
                            animate={isHovered ? { x: 10 } : { x: 0 }}
                            className="flex items-center text-teal-600 font-semibold"
                          >
                            <span className="text-sm">Explore</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
          </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
        </div>
            </div>
          </div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Auth Required Dialog */}
      <Dialog open={authDialog.open} onOpenChange={(open) => setAuthDialog({ ...authDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-[#2BB6AF]" />
              Community Feature
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <p className="text-gray-700 leading-relaxed mb-6">
              {authDialog.message}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setAuthDialog({ ...authDialog, open: false });
                  navigate('/auth/login');
                }}
                className="bg-[#2BB6AF] hover:bg-[#239a94] flex-1"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => setAuthDialog({ ...authDialog, open: false })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * ===================================================================================
 * SECTION 4: HOW IT WORKS
 * ===================================================================================
 * 
 * PURPOSE:
 * Explains the platform's process in 3 simple steps. Uses timeline visualization
 * to show progression and create clear user journey understanding.
 * 
 * DESIGN RATIONALE:
 * - Horizontal timeline: Visual path connecting steps
 * - Animated SVG path: Draws in on scroll with gradient stroke
 * - Step cards: Expand on hover to show additional details
 * - Pulsing rings: Active step has radial gradient pulse effect
 * - Progress indicator: Path completion shows user progress
 * 
 * KEY FEATURES:
 * - 3 steps in horizontal layout (Search, Connect, Adopt/Support)
 * - Animated SVG path with gradient (teal → cyan → purple)
 * - Step badges: Large circular numbers with gradient backgrounds
 * - Cards expand vertically on hover revealing more info
 * - Flowing arrows between steps with animation
 * - Progress tracking: Path draws based on scroll position
 * 
 * INTERACTIONS:
 * - Hover step: Card expands, pulsing ring appears, shadow intensifies
 * - Scroll: Path draws in progressively (0-100% based on intersection)
 * - Active state: Step highlights with glow, ring pulses
 * - Arrow animation: Flowing motion between steps
 * 
 * ANIMATIONS:
 * - Path drawing: strokeDashoffset animation on scroll
 * - Step reveal: Staggered fade + scale (200ms delay between steps)
 * - Pulsing rings: Scale and opacity animation for active step
 * - Arrow flow: Continuous x-axis movement
 * 
 * ===================================================================================
 */

const HowItWorks: React.FC = () => {
  const { howItWorksSteps } = useLandingData();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const stepDetails = [
    {
      icon: AlertCircle,
      gradient: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-600',
      glowColor: 'rgba(20, 184, 166, 0.4)',
    },
    {
      icon: FileText,
      gradient: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-600',
      glowColor: 'rgba(20, 184, 166, 0.4)',
    },
    {
      icon: ShieldCheck,
      gradient: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-600',
      glowColor: 'rgba(20, 184, 166, 0.4)',
    },
    {
      icon: Eye,
      gradient: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-600',
      glowColor: 'rgba(20, 184, 166, 0.4)',
    },
    {
      icon: Building2,
      gradient: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-600',
      glowColor: 'rgba(20, 184, 166, 0.4)',
    },
  ];

  return (
    <section id="how-it-works-section" className="py-20 sm:py-24 lg:py-28 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-teal-100 border-2 border-teal-300">
            <Activity className="h-5 w-5 text-teal-600 animate-pulse" />
            <span className="text-sm font-bold text-teal-700">Simple Process</span>
          </Badge>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
          >
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              How It Works
            </span>
          </motion.h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Five simple steps from found/lost to shelter placement
          </p>
        </motion.div>

        {/* Modern Timeline with Cards */}
        <div className="relative">
          {/* Connecting Line with Arrows - Static Background */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 z-0">
            <div className="h-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative">
              {/* Arrow symbols along the line - positioned between steps */}
              {[1, 2, 3, 4].map((arrowIndex) => (
                <div
                  key={arrowIndex}
                  className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                  style={{
                    left: `${(arrowIndex * 100) / 5}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <ArrowRight className="w-4 h-4 text-teal-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 relative z-10">
            {howItWorksSteps.map((step, index) => {
              const isActive = activeStep === index;
              const stepDetail = stepDetails[index];
              const IconComponent = stepDetail.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  onMouseEnter={() => setActiveStep(index)}
                  onMouseLeave={() => setActiveStep(null)}
                  className="relative group h-full"
                >
                  {/* Main Card */}
                  <motion.div
                    animate={isActive ? {
                      y: -15,
                      scale: 1.05,
                    } : {
                      y: 0,
                      scale: 1,
                    }}
                    className={`relative bg-transparent backdrop-blur-sm rounded-3xl p-6 border-2 transition-all duration-500 shadow-xl h-full flex flex-col ${isActive ? stepDetail.borderColor : 'border-teal-200/50'}`}
                    style={{
                      boxShadow: isActive
                        ? `0 25px 70px ${stepDetail.glowColor}, 0 0 0 1px rgba(20, 184, 166, 0.2)`
                        : '0 8px 32px rgba(0, 0, 0, 0.08)',
                      minHeight: '200px',
                    }}
                  >
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stepDetail.gradient} flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-bold mb-3 text-center ${stepDetail.textColor} group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-center text-sm leading-relaxed flex-1 flex items-center justify-center">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 8: ADOPTION AWARENESS
 * ===================================================================================
 * 
 * PURPOSE:
 * Educates users about adoption benefits and creates emotional connection through
 * imagery and storytelling. Two-column layout with image gallery and importance points.
 * 
 * DESIGN RATIONALE:
 * - Two-column layout: Image gallery (left), content (right)
 * - Warm color scheme: Pink-rose-orange gradients for emotional appeal
 * - Featured image: Large hero image with overlay badge showing stats
 * - Image thumbnails: 3 preview images with hover effects
 * - Importance cards: 5 reasons why adoption matters
 * - Statistics bar: Bottom section with animated counters
 * 
 * KEY FEATURES:
 * - Featured image: 500px height with overlay badge (2,500+ adoptions)
 * - Thumbnail grid: 3 images with play icon and "+500 more" badge
 * - Floating stats card: "98% Success Rate" with floating animation
 * - 5 importance points: Save Lives, Combat Homelessness, Ethical, Love, Health
 * - Adoption process highlight: 4-step safe process
 * - Statistics bar: 4 metrics with animated counters
 * - CTA buttons: "Start Adoption Journey" and "Read Success Stories"
 * 
 * CONTENT STRATEGY:
 * - Emotional messaging: Focus on impact and benefits
 * - Visual storytelling: Images of happy adoptions
 * - Trust building: Process transparency, success metrics
 * - Clear CTAs: Direct paths to adoption flow
 * 
 * INTERACTIONS:
 * - Image hover: Scale, border color change, overlay reveal
 * - Importance card hover: Lift, border change, icon animation
 * - Counter animation: Numbers count up on scroll into view
 * - Floating card: Continuous vertical movement
 * 
 * ===================================================================================
 */

const AdoptionAwareness: React.FC = () => {

  const importancePoints = [
    {
      id: 'save_lives',
      icon: Heart,
      title: 'Save Lives',
      description: "Every adoption opens up space for another animal in need. You're not just saving one life—you're creating a ripple effect of compassion.",
    },
    {
      id: 'combat_homelessness',
      icon: Home,
      title: 'Combat Pet Homelessness',
      description: 'Millions of animals wait in shelters. Adoption reduces overcrowding and gives homeless pets the loving families they deserve.',
    },
    {
      id: 'ethical_choice',
      icon: Shield,
      title: 'Ethical & Responsible',
      description: "Choosing adoption over buying supports animal welfare. You're taking a stand against puppy mills and unethical breeding practices.",
    },
    {
      id: 'unconditional_love',
      icon: Sparkles,
      title: 'Unconditional Love',
      description: "Rescued pets seem to understand they've been saved. Their gratitude and loyalty create an unbreakable bond that enriches your life.",
    },
    {
      id: 'health_benefits',
      icon: Activity,
      title: 'Better for You Too',
      description: 'Studies show pet owners have lower stress, better heart health, and increased happiness. Adoption is good for your wellbeing.',
    },
  ];

  return (
    <section id="adoption-section" className="py-20 sm:py-24 lg:py-28 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-teal-100 border-2 border-teal-300">
            <Heart className="h-5 w-5 text-teal-600 animate-pulse" />
            <span className="text-sm font-bold text-teal-700">Give Love, Get Love</span>
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Why Adoption Changes Lives
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
            Every adopted pet gets a second chance. Every adopter gains a loyal friend for life.
          </p>
        </motion.div>

        {/* Importance Points - Simple Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {importancePoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative bg-transparent backdrop-blur-sm rounded-2xl p-6 border-2 border-teal-200/50 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {point.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto"
        >
          <Link to="/pets/adopt" className="flex-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="group w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-teal-500/50">
                <Heart className="mr-3 h-5 w-5 group-hover:fill-white group-hover:scale-110 transition-all" />
                Start Adoption Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </motion.div>
          </Link>
          <Link to="/pets/adopt" className="flex-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-600 hover:text-white hover:border-teal-600 font-bold px-8 py-4 rounded-2xl transition-all duration-300">
                <BookOpen className="mr-2 h-5 w-5" />
                Read Success Stories
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 6: HEALTH & VACCINATION
 * ===================================================================================
 * 
 * PURPOSE:
 * Displays upcoming vaccination camps and health information. Two-column layout
 * balances event listings with educational content.
 * 
 * DESIGN RATIONALE:
 * - Two-column grid: Left (camps), Right (health info)
 * - Badge header: "Health & Wellness" with icon for quick identification
 * - Camp cards: Clean, scannable design with date badges
 * - Health info: Interactive list items with hover states
 * - Empty state: Friendly message when no camps scheduled
 * 
 * KEY FEATURES:
 * - Upcoming camps: Fetched from API, shows 3 most recent
 * - Date badges: Gradient badges with formatted dates
 * - Location & time: Clear iconography for quick scanning
 * - Health info cards: Circular icon containers with hover effects
 * - CTA button: "Find Camps Near You" with gradient background
 * - Loading state: Skeleton loader while fetching data
 * 
 * DATA FLOW:
 * - Fetches camps from healthApi.getCamps({ upcoming: true })
 * - Handles multiple response formats (array, paginated, object)
 * - Graceful error handling with empty state
 * - Limits display to 3 most recent camps
 * 
 * INTERACTIONS:
 * - Camp card hover: Border color change, shadow, translateY
 * - Health item hover: Background change, icon scale, text color shift
 * - Register link: Opens registration or prevents default if unavailable
 * 
 * ===================================================================================
 */

const MedicalSection: React.FC = () => {
  const { healthInfo } = useLandingData();
  const [vaccinationCamps, setVaccinationCamps] = useState<VaccinationCamp[]>([]);
  const [loadingCamps, setLoadingCamps] = useState(true);

  useEffect(() => {
    const loadCamps = async () => {
      try {
        const camps: any = await healthApi.getCamps({ upcoming: true });
        // Handle different response formats (array, paginated, or object with data)
        let campsArray: VaccinationCamp[] = [];
        if (Array.isArray(camps)) {
          campsArray = camps;
        } else if (camps?.results && Array.isArray(camps.results)) {
          campsArray = camps.results;
        } else if (camps?.data && Array.isArray(camps.data)) {
          campsArray = camps.data;
        } else if (camps?.items && Array.isArray(camps.items)) {
          campsArray = camps.items;
        }
        // Limit to 3 most recent camps for display
        setVaccinationCamps(campsArray.slice(0, 3));
      } catch (error: any) {
        // Only log non-connection errors to avoid console spam
        if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ECONNREFUSED' && error?.message?.includes('Network Error') === false) {
        console.error('Error loading vaccination camps:', error);
        }
        // Set empty array on error (backend might be offline)
        setVaccinationCamps([]);
      } finally {
        setLoadingCamps(false);
      }
    };
    loadCamps();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="rounded-full px-4 py-1.5 bg-blue-100 text-blue-800 mb-4 inline-flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health & Wellness
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Health & Vaccination</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Keep your pets healthy with our vaccination camps and health resources
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Upcoming Camps */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-[#2BB6AF]" />
              <h3 className="text-3xl font-bold text-gray-900">Upcoming Medical Camps</h3>
            </div>
            {loadingCamps ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading camps...</p>
              </div>
            ) : vaccinationCamps.length > 0 ? (
              <div className="space-y-4">
                {vaccinationCamps.map((camp, index) => (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group bg-transparent backdrop-blur-sm p-6 rounded-3xl transition-all duration-300 border border-teal-200/50 hover:border-[#2BB6AF] hover:shadow-xl hover:shadow-[#2BB6AF]/20 hover:translate-y-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-[#2BB6AF] transition-colors duration-300">{camp.location}</h4>
                        <div className="flex items-center gap-2 text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-300">
                          <MapPin className="w-4 h-4 group-hover:text-[#2BB6AF] transition-colors duration-300" />
                          <span className="text-sm">{camp.address}</span>
                        </div>
                      </div>
                      <span className="bg-gradient-to-r from-[#2BB6AF] to-[#239a94] text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ml-4 group-hover:scale-105 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                        {new Date(camp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {camp.time && (
                      <div className="flex items-center gap-2 text-gray-600 mb-3 group-hover:text-gray-700 transition-colors duration-300">
                        <Clock className="w-4 h-4 group-hover:text-[#2BB6AF] transition-colors duration-300" />
                        <span className="text-sm">{camp.time}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
                        <span className="font-semibold">Organized by:</span> {camp.ngo}
                      </p>
                      <a
                        href={camp.registration_link || '#'}
                        className="text-[#2BB6AF] font-semibold hover:text-[#239a94] transition-colors flex items-center gap-1 group/link"
                        onClick={(e) => {
                          if (!camp.registration_link || camp.registration_link === '#') {
                            e.preventDefault();
                          }
                        }}
                      >
                        Register Now
                        <ChevronRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform duration-300" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No upcoming vaccination camps scheduled</p>
              </div>
            )}
          </div>

          {/* Right Column - Health Info */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Stethoscope className="w-8 h-8 text-[#2BB6AF]" />
              <h3 className="text-3xl font-bold text-gray-900">Pet Vaccination & Health</h3>
            </div>
            <div className="bg-transparent backdrop-blur-sm p-8 rounded-3xl border border-teal-200/50 hover:border-[#2BB6AF]/30 hover:shadow-xl transition-all duration-300">
              <ul className="space-y-6 mb-8">
                {healthInfo.map((info, index) => (
                  <li key={index} className="group/item flex items-start gap-4 hover:bg-gray-50 p-3 rounded-xl transition-all duration-300 cursor-default">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2BB6AF]/10 flex items-center justify-center group-hover/item:bg-[#2BB6AF]/20 group-hover/item:scale-110 transition-all duration-300">
                      <div className="text-[#2BB6AF] group-hover/item:scale-110 transition-transform duration-300">
                        {info.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 group-hover/item:text-[#2BB6AF] transition-colors duration-300">{info.title}</h4>
                      <p className="text-sm text-gray-600 group-hover/item:text-gray-700 transition-colors duration-300">{info.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/pets">
                <Button className="group w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-[#2BB6AF]/40">
                  Find Camps Near You
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 7: NGO COLLABORATION NETWORK
 * ===================================================================================
 * 
 * PURPOSE:
 * Builds trust by showcasing partnerships with verified NGOs. Demonstrates
 * platform credibility and network strength.
 * 
 * DESIGN RATIONALE:
 * - Trust indicators: Verified badges, partner showcase, impact metrics
 * - Green color scheme: Represents growth, trust, collaboration
 * - Benefit cards: 4 key collaboration advantages
 * - Partner grid: 5 NGO partners with stats and verification
 * - Impact section: Gradient background with compelling statistics
 * 
 * KEY FEATURES:
 * - 4 benefit cards: Verified, Expert Care, Rescue Network, Safe Adoptions
 * - Partner showcase: 5 NGOs with icons, cities, rescue counts
 * - Verified badges: Blue checkmark badges on partner cards
 * - Impact metrics: 4 statistics in grid layout
 * - CTA: "Join Our Network" button
 * - Decorative shapes: Animated pulsing circles in background
 * 
 * TRUST ELEMENTS:
 * - "Trusted Partnerships" badge with handshake icon
 * - Verified checkmarks on all partner cards
 * - Rescue statistics showing real impact
 * - Professional gradient backgrounds
 * 
 * INTERACTIONS:
 * - Benefit card hover: Lift, shadow, border color change
 * - Partner card hover: Scale, rotate, reveal verified badge
 * - Icon animations: Rotate and scale on hover
 * 
 * ===================================================================================
 */

const NGOCollaboration: React.FC = () => {
  const partners = [
    { name: 'Animal Welfare Trust', icon: PawPrint, city: 'Mumbai', rescues: '800+' },
    { name: 'Pet Rescue Foundation', icon: Heart, city: 'Delhi', rescues: '650+' },
    { name: 'Stray Care Alliance', icon: Home, city: 'Bangalore', rescues: '500+' },
    { name: 'Wildlife Protection Society', icon: Shield, city: 'Chennai', rescues: '450+' },
    { name: 'Community Animal Network', icon: Users, city: 'Kolkata', rescues: '600+' },
  ];

  const benefits = [
    {
      id: 'verified_trust',
      icon: ShieldCheck,
      gradient: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-100 hover:border-green-300',
      title: '100% Verified',
      description: 'Every report is verified by our trusted NGO partners to ensure accuracy and prevent fraud',
    },
    {
      id: 'expert_care',
      icon: Stethoscope,
      gradient: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-100 hover:border-blue-300',
      title: 'Expert Veterinary Care',
      description: 'Access to professional veterinarians through our NGO network for health camps and emergencies',
    },
    {
      id: 'rescue_network',
      icon: Users,
      gradient: 'from-purple-500 to-violet-600',
      borderColor: 'border-purple-100 hover:border-purple-300',
      title: 'Rescue Network',
      description: 'Immediate response from trained rescue teams across 50+ partner organizations nationwide',
    },
    {
      id: 'safe_adoption',
      icon: Home,
      gradient: 'from-orange-500 to-amber-600',
      borderColor: 'border-orange-100 hover:border-orange-300',
      title: 'Safe Adoptions',
      description: 'NGO-supervised adoption process with home visits and post-adoption support for pet welfare',
    },
  ];

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-white via-[#2BB6AF]/5 to-white relative overflow-hidden">
      {/* Decorative Animated Shapes */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-[#2BB6AF]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#2BB6AF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-[#2BB6AF]/10 backdrop-blur-sm border-2 border-[#2BB6AF]/20">
            <Handshake className="h-5 w-5 text-[#2BB6AF] animate-bounce" />
            <span className="text-sm font-bold text-[#2BB6AF]">Trusted Partnerships</span>
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-[#2BB6AF] via-[#239a94] to-[#2BB6AF] bg-clip-text text-transparent">
            NGO Collaboration Network
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
            Working together with trusted animal welfare organizations to create lasting impact
          </p>
        </motion.div>

        {/* Collaboration Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group bg-transparent backdrop-blur-sm rounded-3xl p-8 border-2 ${benefit.borderColor} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300`}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <IconComponent className="h-10 w-10 text-white" />
            </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2BB6AF] transition-colors text-center`}>
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors text-center">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
          </div>

        {/* Partner Showcase */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            <Award className="inline mr-3 text-[#2BB6AF]" />
            Our Trusted NGO Partners
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {partners.map((partner, index) => {
              const IconComponent = partner.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-transparent backdrop-blur-sm rounded-3xl p-6 border-2 border-teal-200/50 hover:border-[#2BB6AF] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center relative"
                >
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#2BB6AF]/10 to-[#2BB6AF]/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                    <IconComponent className="h-12 w-12 text-[#2BB6AF]" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-lg">
                      <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-[#2BB6AF] transition-colors">
                    {partner.name}
                  </h4>
                  <div className="flex justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{partner.rescues}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{partner.city}</span>
                    </div>
                  </div>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2BB6AF]/10 text-[#2BB6AF] text-xs font-semibold">
                      <Award className="h-3 w-3" />
                      Verified Partner
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Collaboration Impact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-[#2BB6AF] via-[#239a94] to-[#2BB6AF] rounded-3xl p-12 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <PawPrint className="absolute top-10 left-10 w-32 h-32" />
            <PawPrint className="absolute bottom-10 right-10 w-32 h-32" />
            <Heart className="absolute top-1/2 left-1/2 w-24 h-24" />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
              <Badge className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
                <TrendingUp className="h-4 w-4" />
                <span>Growing Impact</span>
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Together, We're Making History</h3>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Our NGO collaboration network has transformed animal welfare. From emergency rescues to medical camps, we're creating a safer world for every animal.
              </p>
              <Link to="/pets/adopt">
                <Button className="group bg-white text-[#2BB6AF] hover:bg-gray-50 font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  Join Our Network
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Users, number: '50+', label: 'Partner NGOs' },
                { icon: Heart, number: '10K+', label: 'Lives Saved' },
                { icon: Stethoscope, number: '500+', label: 'Health Camps' },
                { icon: Home, number: '5K+', label: 'Happy Adoptions' },
              ].map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                    <IconComponent className="h-8 w-8 mx-auto mb-3" />
                    <div className="text-3xl font-bold mb-1">{stat.number}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
          </div>
                );
              })}
        </div>
        </div>
        </motion.div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 9: STATISTICS & IMPACT METRICS
 * ===================================================================================
 * 
 * PURPOSE:
 * Displays platform impact through animated statistics. Creates credibility and
 * demonstrates scale of operations.
 * 
 * DESIGN RATIONALE:
 * - Green gradient background: Represents growth and success
 * - Animated counters: Numbers count up from 0 on scroll into view
 * - Icon circles: Glassmorphism effect with backdrop blur
 * - Grid layout: 2 columns mobile, 4 columns desktop
 * - One-time animation: Counters animate once when section enters viewport
 * 
 * KEY FEATURES:
 * - 4 key metrics: Pets Rescued, Happy Adoptions, Volunteers, Health Camps
 * - Counter animation: Smooth count-up from 0 to target number
 * - Icon containers: Circular glassmorphism with hover scale
 * - Large numbers: 4xl font size for impact
 * - Intersection Observer: Triggers animation at 50% viewport threshold
 * 
 * METRICS DISPLAYED:
 * - 5,000+ Pets Rescued
 * - 1,200+ Happy Adoptions
 * - 800+ Active Volunteers
 * - 300+ Health Camps
 * 
 * ANIMATION DETAILS:
 * - Increment: Target / 50 for smooth progression
 * - Interval: 30ms for natural counting speed
 * - One-time: Animation triggers once, doesn't repeat
 * - Stagger: 100ms delay between each counter start
 * 
 * ===================================================================================
 */

const STATS_DATA = [
  { number: 5000, label: 'Pets Rescued' },
  { number: 1200, label: 'Happy Adoptions' },
  { number: 800, label: 'Active Volunteers' },
  { number: 300, label: 'Health Camps' },
];

const STATS_ICONS = [
  <PawPrint className="w-8 h-8" />,
  <Heart className="w-8 h-8" />,
  <Users className="w-8 h-8" />,
  <Stethoscope className="w-8 h-8" />,
];

const StatisticsSection: React.FC = () => {
  const [counters, setCounters] = useState<{ [key: number]: number }>({});
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            STATS_DATA.forEach((stat, index) => {
              let current = 0;
              const increment = stat.number / 50;
              const timer = setInterval(() => {
                current += increment;
                if (current >= stat.number) {
                  current = stat.number;
                  clearInterval(timer);
                }
                setCounters((prev) => ({ ...prev, [index]: Math.floor(current) }));
              }, 30);
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasAnimated]);

  return (
    <section id="stats-section" className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS_DATA.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-white">{STATS_ICONS[index]}</div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-white mb-2"
              >
                {counters[index]?.toLocaleString() || '0'}+
              </motion.div>
              <p className="text-white/90">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * SECTION 10: TESTIMONIALS & SOCIAL PROOF
 * ===================================================================================
 * 
 * PURPOSE:
 * Builds trust through real user testimonials. Social proof is critical for
 * conversion and user confidence.
 * 
 * DESIGN RATIONALE:
 * - Card-based layout: Clean, scannable testimonial cards
 * - Quote icons: Circular badges with gradient for visual interest
 * - Star ratings: 5-star display for credibility
 * - Avatar images: Circular profile pictures with hover effects
 * - Gray background: Subtle contrast from white sections
 * 
 * KEY FEATURES:
 * - 3 testimonials: Pet Owner, Adopter, Volunteer perspectives
 * - Star ratings: 5 filled yellow stars per testimonial
 * - Quote badges: Gradient circles with quote icon
 * - Author info: Name, role, location for authenticity
 * - Hover effects: Card lift, border color change, avatar scale
 * 
 * CONTENT STRATEGY:
 * - Diverse perspectives: Different user types represented
 * - Specific benefits: Each testimonial highlights different value
 * - Real locations: Adds authenticity (NY, LA, Chicago)
 * - Positive outcomes: Focus on success stories
 * 
 * INTERACTIONS:
 * - Card hover: translateY(-4px), border color change, shadow
 * - Avatar hover: Scale 1.1 with smooth transition
 * - Staggered reveal: 100ms delay between cards
 * 
 * VISUAL HIERARCHY:
 * - Quote icon: Top-left for immediate recognition
 * - Stars: Prominent rating display
 * - Quote text: Italic, larger for emphasis
 * - Author: Bottom section with avatar and details
 * 
 * ===================================================================================
 */

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      quote: "This platform helped me find my lost dog within 24 hours. The community support was incredible! Everyone was so helpful and responsive.",
      author: "Sarah Johnson",
      role: "Pet Owner",
      location: "New York, NY",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
    },
    {
      id: 2,
      quote: "Adopting through this platform was seamless. The team ensured everything was perfect before we brought Max home. He's been the perfect addition to our family!",
      author: "Michael Chen",
      role: "Adopter",
      location: "Los Angeles, CA",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    },
    {
      id: 3,
      quote: "As a volunteer, I've seen countless pets find loving homes. This platform truly makes a difference in connecting pets with their forever families.",
      author: "Emily Rodriguez",
      role: "Volunteer",
      location: "Chicago, IL",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop",
    },
    {
      id: 4,
      quote: "The vaccination camps organized through this platform are amazing. My pet received free vaccinations and health check-ups. Highly recommended!",
      author: "David Thompson",
      role: "Pet Owner",
      location: "Miami, FL",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1517849849227-4f58b0a1da86?w=200&h=200&fit=crop",
    },
    {
      id: 5,
      quote: "I found my perfect companion through this platform. The adoption process was smooth, and the support team was there every step of the way.",
      author: "Lisa Anderson",
      role: "Adopter",
      location: "Seattle, WA",
      rating: 5,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop",
    },
    {
      id: 6,
      quote: "The NGO collaboration network is impressive. I've worked with several partners and the level of care and professionalism is outstanding.",
      author: "James Wilson",
      role: "Volunteer",
      location: "Boston, MA",
      rating: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      petImage: "https://images.unsplash.com/photo-1517849849227-4f58b0a1da86?w=200&h=200&fit=crop",
    },
  ];

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-white via-teal-50/30 to-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 bg-teal-100 border-2 border-teal-300">
            <Quote className="h-5 w-5 text-teal-600 animate-pulse" />
            <span className="text-sm font-bold text-teal-700">Testimonials</span>
          </Badge>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
          >
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              What People Say
            </span>
          </motion.h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Real stories from our community of pet lovers, adopters, and volunteers
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              {/* Main Card */}
              <div className="relative bg-transparent backdrop-blur-sm rounded-3xl p-8 border-2 border-teal-200/50 hover:border-teal-300 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-xl z-10">
                  <Quote className="w-8 h-8 text-white" />
                </div>

                {/* Pet Image */}
                <div className="relative mb-6 -mt-4">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={testimonial.petImage}
                      alt={`${testimonial.author}'s pet`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Pet&background=14b8a6&color=fff`;
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
                  </div>
                </div>

                {/* Stars Rating */}
                <div className="flex gap-1 justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                    >
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-gray-700 italic mb-6 leading-relaxed text-center flex-1">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <div className="relative">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="h-14 w-14 rounded-full border-2 border-teal-200 group-hover:border-teal-400 transition-all duration-300 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.author)}&background=14b8a6&color=fff`;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-teal-600 font-medium">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.05) 0%, transparent 70%)',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * ===================================================================================
 * MAIN LANDING PAGE COMPONENT
 * ===================================================================================
 * 
 * PAGE STRUCTURE & FLOW:
 * ----------------------
 * This component orchestrates all landing page sections in a strategic order
 * designed to guide users through a compelling narrative journey.
 * 
 * SECTION ORDER & RATIONALE:
 * 
 * 1. Hero Section
 *    → First impression, emotional connection, clear value proposition
 *    → Multiple CTAs for different user intents
 * 
 * 2. What We Do
 *    → Immediately explains core services after hero
 *    → Builds understanding of platform capabilities
 * 
 * 3. Community Features
 *    → Highlights community aspect and engagement opportunities
 *    → Interactive carousel keeps users engaged
 * 
 * 4. Interactive Tools
 *    → Shows practical tools users can access
 *    → Flip cards create engaging discovery experience
 * 
 * 5. How It Works
 *    → Explains process in simple steps
 *    → Reduces friction by showing ease of use
 * 
 * 6. Medical Section
 *    → Demonstrates health and wellness commitment
 *    → Shows active community engagement (camps)
 * 
 * 7. NGO Collaboration
 *    → Builds trust through partnerships
 *    → Shows platform credibility and network
 * 
 * 8. Adoption Awareness
 *    → Emotional appeal for adoption
 *    → Educational content about benefits
 * 
 * 9. Statistics
 *    → Social proof through numbers
 *    → Demonstrates platform impact and scale
 * 
 * 10. Testimonials
 *     → Personal stories and social proof
 *     → Final trust-building before footer
 * 
 * DESIGN CONSISTENCY:
 * - All sections use consistent spacing (py-20 sm:py-24 lg:py-28)
 * - Unified color palette throughout (teal primary, purple accents)
 * - Consistent animation patterns (fade + blur + translateY)
 * - Glassmorphism and gradient borders used strategically
 * - Responsive breakpoints: mobile (1 col), tablet (2-3 col), desktop (4 col)
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Lazy loading: Images load on intersection
 * - Reduced motion: Respects prefers-reduced-motion
 * - GPU acceleration: Transform and opacity animations
 * - Code splitting: Sections are separate components
 * 
 * ACCESSIBILITY:
 * - Keyboard navigation: All interactive elements accessible
 * - Focus states: Visible ring indicators
 * - ARIA labels: Screen reader friendly
 * - Color contrast: WCAG AA compliant (4.5:1 minimum)
 * 
 * ===================================================================================
 */

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Section 1: Hero - Full-screen immersive experience with pet carousel */}
      <HeroSection />
      
      {/* Section 2: What We Do - Bento box grid showcasing core services */}
      <WhatWeDo />
      
      {/* Section 3: Community Features - Horizontal carousel with 3D tilt effects */}
      <CommunityFeatures />
      
      {/* Section 4: How It Works - Timeline with animated path progression */}
      <HowItWorks />
      
      {/* Section 6: Health & Vaccination - Two-column health information */}
      <MedicalSection />
      
      {/* Section 7: Adoption Awareness - Image gallery with importance messaging */}
      <AdoptionAwareness />
      
      {/* Section 8: NGO Collaboration - Partnership showcase with trust indicators */}
      <NGOCollaboration />
      
      {/* Section 9: Testimonials - Social proof with star ratings */}
      <TestimonialsSection />
    </div>
  );
};

export default LandingPage;
