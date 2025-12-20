import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Heart,
  Shield,
  Users,
  FileText,
  MapPin,
  Calendar,
  Stethoscope,
  CheckCircle2,
  Building2,
  Activity,
  Home,
  ClipboardList,
  AlertCircle,
  HandHeart,
  MessageCircle,
  GraduationCap,
  Truck,
  ShieldCheck,
  Eye,
} from 'lucide-react';

// ==================== TYPES & INTERFACES ====================

export interface PetImage {
  url: string;
  type: string;
  text: string;
  subtitle: string;
  description: string;
  color: string;
}

export interface AdoptionStory {
  id: number;
  title: string;
  petName: string;
  ownerName: string;
  image: string;
  summary: string;
  fullStory: string;
}

export interface VaccinationCamp {
  id: number;
  location: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  date: string;
  start_time: string;
  end_time: string;
  time?: string;
  ngo: string;
  ngo_contact?: string;
  ngo_email?: string;
  description?: string;
  registration_link?: string;
  max_capacity: number;
  current_registrations: number;
  is_active: boolean;
  is_upcoming?: boolean;
  available_slots?: number;
  is_full?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: number;
  icon: ReactNode;
  title: string;
  description: string;
  link: string;
  requiresAuth?: boolean;
  authMessage?: string;
}

export interface CommunityFeature {
  id: number;
  icon: ReactNode;
  title: string;
  description: string;
  link: string;
  requiresAuth?: boolean;
  authMessage?: string;
}

export interface WhatWeDoFeature {
  icon: ReactNode;
  title: string;
  description: string;
  stats?: string;
  statLabel?: string;
  benefits?: string[];
  color?: string;
  bgColor?: string;
  detailedInfo?: {
    features: string[];
    process: string[];
    benefits: string[];
  };
}

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
}

interface LandingContextType {
  // Pet Images
  petImages: PetImage[];
  getHeroImages: () => Array<{ image: string; title: string; subtitle: string; color?: string }>;
  
  // Static Content
  adoptionStories: AdoptionStory[];
  tools: Tool[];
  communityFeatures: CommunityFeature[];
  whatWeDoFeatures: WhatWeDoFeature[];
  howItWorksSteps: HowItWorksStep[];
  
  // Health Info
  healthInfo: Array<{ icon: ReactNode; title: string; description: string }>;
}

const LandingContext = createContext<LandingContextType | undefined>(undefined);

export const useLandingData = () => {
  const context = useContext(LandingContext);
  if (!context) {
    throw new Error('useLandingData must be used within LandingDataProvider');
  }
  return context;
};

export const LandingDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Pet Images - All 11 types
  const [petImages] = useState<PetImage[]>([
    {
      url: 'https://thumbs.dreamstime.com/b/golden-retriever-dog-21668976.jpg',
      type: 'Dogs',
      text: 'Find Your Lost Dog',
      subtitle: 'Every Dog Deserves to Come Home',
      description: 'Your loyal companion is missing? Report it instantly. Our verified system connects you with rescue groups and community members who can help bring your dog home safely.',
      color: 'from-orange-500 to-amber-600',
    },
    {
      url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=90',
      type: 'Horses',
      text: 'Protect Your Noble Horse',
      subtitle: 'Majestic Companions Need Protection',
      description: 'Horses are valuable partners. When they go missing, time matters. Our platform connects you with experienced equine rescuers and verified networks to locate your horse quickly.',
      color: 'from-amber-700 to-orange-800',
    },
    {
      url: 'https://media.istockphoto.com/id/146776721/photo/goats.jpg?s=612x612&w=0&k=20&c=z0GrAzkkLYJMAWQGy0Dsc-3y0ZfDWsxxvEu8FMKwy9c=',
      type: 'Goats',
      text: 'Rescue Your Lost Goat',
      subtitle: 'Valuable Farm Animals Need Care',
      description: 'Goats provide milk, meat, and companionship. When they wander off, report immediately. Our community alerts help farmers and owners quickly locate and reunite with their goats.',
      color: 'from-green-600 to-emerald-700',
    },
    {
      url: 'https://media.istockphoto.com/id/1933216911/photo/flock-of-sheep.jpg?s=612x612&w=0&k=20&c=TOjq_Or2i_5V4M5f8nUoE8bPWTF8Q3EqPu1Pt-K286E=',
      type: 'Sheep',
      text: 'Find Your Lost Sheep',
      subtitle: 'Essential Livestock Protection',
      description: 'Sheep are important for wool, meat, and milk. When they go missing from the flock, our platform helps shepherds and farmers quickly locate and reunite with their sheep through verified reports.',
      color: 'from-gray-500 to-slate-600',
    },
    {
      url: 'https://media.istockphoto.com/id/872646276/photo/chicken-sunset.jpg?s=612x612&w=0&k=20&c=6AS1g192dw9C8YzQbBGeCXOS49N2MITIoWzYgEKCxC8=',
      type: 'Hens',
      text: 'Protect Your Lost Hen',
      subtitle: 'Poultry Protection Matters',
      description: 'Hens provide eggs and meat for families. When they go missing, report it quickly. Our platform helps poultry farmers and backyard keepers locate and reunite with their hens through community alerts.',
      color: 'from-red-500 to-orange-600',
    },
    {
      url: 'https://www.kalmbachfeeds.com/cdn/shop/articles/two-white-ducks-in-grass_869f448b-964b-4e63-96a9-b3642c2723a6.jpg?v=1748450573',
      type: 'Ducks',
      text: 'Rescue Your Lost Duck',
      subtitle: 'Waterfowl Need Our Help',
      description: 'Ducks bring joy to farms and ponds. When they wander off, our platform helps owners quickly locate and reunite with their ducks through specialized tracking and verified community alerts.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      url: 'https://images.unsplash.com/photo-1598113972215-96c018fb1a0b?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtZWx8ZW58MHx8MHx8fDA%3D',
      type: 'Camels',
      text: 'Safeguard Your Lost Camel',
      subtitle: 'Vital for Livelihood and Transport',
      description: 'Camels are essential for transportation and livelihood. These resilient animals deserve protection. Our platform helps owners report and find lost camels through verified tracking and community support.',
      color: 'from-amber-500 to-yellow-600',
    },
    {
      url: 'https://cdn.britannica.com/63/145563-050-5E0EC254/water-buffalo.jpg',
      type: 'Buffalo',
      text: 'Protect Your Lost Buffalo',
      subtitle: 'Strong Farm Partners',
      description: 'Buffalo provide milk, meat, and labor for families. When they go missing, our platform helps farmers quickly locate and reunite with their buffalo through detailed reporting and verified community support.',
      color: 'from-slate-600 to-gray-700',
    },
    {
      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdVSuk6gSE4ZdeLmEnU38MXZMBvdfrzZdKhQ&s',
      type: 'Donkeys',
      text: 'Rescue Your Lost Donkey',
      subtitle: 'Hardworking and Loyal Companions',
      description: 'Donkeys are hardworking partners that provide transportation and labor. When they go missing, our platform helps owners quickly locate and reunite with their donkeys through verified community networks.',
      color: 'from-stone-600 to-neutral-700',
    },
    {
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=90',
      type: 'Cats',
      text: 'Find Your Lost Cat',
      subtitle: 'Beloved Feline Companions',
      description: 'Cats are cherished family members. When they wander off, every moment counts. Our platform helps cat owners quickly locate and reunite with their beloved pets through verified community alerts and specialized tracking.',
      color: 'from-purple-500 to-pink-600',
    },
    {
      url: 'https://lafeber.com/vet/wp-content/uploads/european-rabbit.jpg',
      type: 'Rabbits',
      text: 'Rescue Your Lost Rabbit',
      subtitle: 'Gentle and Beloved Pets',
      description: 'Rabbits are gentle companions that bring joy to families. When they go missing, our platform helps owners quickly locate and reunite with their rabbits through verified community networks and specialized alerts.',
      color: 'from-pink-400 to-rose-500',
    },
  ]);

  const getHeroImages = () => {
    // Return all pet images for hero (showing all animals)
    return petImages.map((pet) => ({
      image: pet.url,
      title: pet.text,
      subtitle: pet.subtitle,
      color: pet.color,
    }));
  };

  // Adoption Stories
  const [adoptionStories] = useState<AdoptionStory[]>([
    {
      id: 1,
      title: "Max's Journey Home",
      petName: 'Max',
      ownerName: 'Sarah & John',
      image: '/images/stories/max.jpg',
      summary: 'Max was found wandering alone and is now living happily with his new family.',
      fullStory: 'Max was discovered by a volunteer in a local park, malnourished and scared. After being taken to a shelter, he was nursed back to health. Sarah and John saw Max\'s photo online and immediately fell in love. Today, Max enjoys long walks, playing fetch, and cuddling on the couch with his forever family.',
    },
    {
      id: 2,
      title: 'Luna Finds Her Forever Home',
      petName: 'Luna',
      ownerName: 'Emily',
      image: '/images/stories/luna.jpg',
      summary: 'A shy cat who found confidence and love in her new home.',
      fullStory: 'Luna was rescued from a hoarding situation where she had lived in fear for years. She was extremely timid and would hide from everyone. Emily, a patient and loving pet owner, worked with Luna for months, building trust through gentle interactions. Now, Luna is a confident, playful cat who loves to curl up on Emily\'s lap.',
    },
    {
      id: 3,
      title: 'Buddy\'s Second Chance',
      petName: 'Buddy',
      ownerName: 'The Martinez Family',
      image: '/images/stories/buddy.jpg',
      summary: 'An older dog who proved that age is just a number when it comes to finding love.',
      fullStory: 'Buddy, a 7-year-old mixed breed, had been in the shelter for over a year. Many potential adopters passed him by, preferring younger dogs. The Martinez family, however, saw Buddy\'s gentle nature and decided to give him a home. Buddy has brought so much joy to their lives, and they couldn\'t imagine life without him.',
    },
  ]);

  // Tools
  const [tools] = useState<Tool[]>([
    {
      id: 1,
      icon: <FileText className="w-8 h-8" />,
      title: 'Lost Pet Form',
      description: 'Quick missing pet reporting tool',
      link: '/pets/report-lost',
      requiresAuth: true,
      authMessage: 'Sign in to report a lost pet and help reunite them with their family.',
    },
    {
      id: 2,
      icon: <ClipboardList className="w-8 h-8" />,
      title: 'Adoption Checklist',
      description: 'Prepare for adoption',
      link: '#',
      requiresAuth: false,
    },
    {
      id: 3,
      icon: <MapPin className="w-8 h-8" />,
      title: 'Nearby Clinics',
      description: 'Find local veterinary support',
      link: '#',
      requiresAuth: false,
    },
    {
      id: 4,
      icon: <Calendar className="w-8 h-8" />,
      title: 'Vaccine Schedule',
      description: 'View vaccination timelines',
      link: '#',
      requiresAuth: false,
    },
  ]);

  // Community Features
  const [communityFeatures] = useState<CommunityFeature[]>([
    {
      id: 1,
      icon: <Building2 className="w-8 h-8" />,
      title: 'Shelters',
      description: 'Connect with verified animal shelters in your area',
      link: '/shelter-capacity',
      requiresAuth: true,
      authMessage: 'Sign in to view and connect with verified animal shelters near you.',
    },
    {
      id: 2,
      icon: <Activity className="w-8 h-8" />,
      title: 'Feeding',
      description: 'Join community feeding programs for stray animals',
      link: '/feeding-points',
      requiresAuth: true,
      authMessage: 'Sign in to join community feeding programs and help feed stray animals.',
    },
    {
      id: 3,
      icon: <Home className="w-8 h-8" />,
      title: 'Home Checks',
      description: 'Schedule home visits for adoption verification',
      link: '/home-check-tracker',
      requiresAuth: true,
      authMessage: 'Sign in to schedule home visits for adoption verification (Admin only).',
    },
    {
      id: 4,
      icon: <Users className="w-8 h-8" />,
      title: 'Volunteer Network',
      description: 'Join a community of dedicated volunteers making a difference',
      link: '/volunteers',
      requiresAuth: true,
      authMessage: 'Sign in to join our volunteer network and help pets in need.',
    },
    {
      id: 5,
      icon: <AlertCircle className="w-8 h-8" />,
      title: 'Emergency Rescue',
      description: 'Report and respond to pet emergencies in real-time',
      link: '/emergency-rescue',
      requiresAuth: true,
      authMessage: 'Sign in to access emergency rescue services and help pets in crisis.',
    },
    {
      id: 6,
      icon: <HandHeart className="w-8 h-8" />,
      title: 'Pet Fostering',
      description: 'Provide temporary homes for pets awaiting adoption',
      link: '/fostering',
      requiresAuth: true,
      authMessage: 'Sign in to become a foster parent and give pets a safe temporary home.',
    },
    {
      id: 7,
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Community Forum',
      description: 'Connect, share experiences, and get advice from pet owners',
      link: '/forum',
      requiresAuth: true,
      authMessage: 'Sign in to join our community forum and connect with other pet lovers.',
    },
    {
      id: 8,
      icon: <GraduationCap className="w-8 h-8" />,
      title: 'Pet Care Education',
      description: 'Learn essential pet care tips and best practices',
      link: '/education',
      requiresAuth: false,
    },
    {
      id: 9,
      icon: <Truck className="w-8 h-8" />,
      title: 'Pet Transportation',
      description: 'Coordinate safe transport for rescued and adopted pets',
      link: '/transportation',
      requiresAuth: true,
      authMessage: 'Sign in to access pet transportation services and help pets reach their new homes.',
    },
  ]);

  // What We Do Features - Service-focused descriptions with detailed info
  const [whatWeDoFeatures] = useState<WhatWeDoFeature[]>([
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Report Lost/Found',
      description: 'Quick reporting system that instantly alerts our community. Notify nearby rescuers and shelters to help reunite pets with families.',
      detailedInfo: {
        features: [
          'Quick reporting form with photo upload and GPS location',
          'Automatic alerts to verified rescuers within 5km radius',
          'Real-time tracking and status updates'
        ],
        process: [
          'Fill out the lost/found pet form with photos and location',
          'Our system instantly notifies nearby rescuers and shelters',
          'Community members can report sightings through the platform',
          'Get notified when your pet is found or when someone reports a match'
        ],
        benefits: [
          'Fast response time with instant community alerts',
          'GPS integration for accurate location tracking',
          'Verified network ensures safe reunification process'
        ]
      }
    },
    {
      icon: <Heart className="w-10 h-10" />,
      title: 'Support Care',
      description: 'Support pet welfare through volunteering, sponsoring, or donations. Track your impact and see how your support makes a difference.',
      detailedInfo: {
        features: [
          'Multiple support options: volunteering, sponsoring, or donating',
          'Track your contributions and see direct impact',
          'Community recognition for active supporters'
        ],
        process: [
          'Choose how you want to help: volunteer, sponsor, or donate',
          'Select specific programs or pets you want to support',
          'Track your contributions through our dashboard',
          'Receive updates on how your support is making a difference'
        ],
        benefits: [
          'Flexible support options to match your availability',
          'Transparent tracking of where your contributions go',
          'Join a community of dedicated pet welfare supporters'
        ]
      }
    },
    {
      icon: <Stethoscope className="w-10 h-10" />,
      title: 'Health Resources',
      description: 'Free vaccination camps and health information. Find nearby veterinary services, access vaccination schedules, and get expert guidance.',
      detailedInfo: {
        features: [
          'Free vaccination camps organized monthly in different locations',
          'Veterinary clinic finder with real-time availability',
          'Personalized vaccination schedules based on pet age and breed'
        ],
        process: [
          'Find upcoming vaccination camps in your area',
          'Register your pet for free vaccinations',
          'Access vaccination schedules and health reminders',
          'Connect with veterinarians for expert advice'
        ],
        benefits: [
          'Free essential vaccinations for all pets',
          'Expert guidance from verified veterinarians',
          'Emergency support and first-aid resources'
        ]
      }
    },
    {
      icon: <Home className="w-10 h-10" />,
      title: 'Adoption Services',
      description: 'Safe and verified adoptions through partner NGOs. Includes home verification, background checks, and ongoing support for successful adoptions.',
      detailedInfo: {
        features: [
          'Verified adoption process with NGO partner oversight',
          'Home visit verification by trained volunteers',
          'Post-adoption support and guidance'
        ],
        process: [
          'Browse verified pet listings and find your match',
          'Submit adoption application through our platform',
          'Home visit verification to ensure suitable environment',
          'Complete adoption process with ongoing support'
        ],
        benefits: [
          'Safe and verified adoption process',
          'Complete pet history and health records',
          'Ongoing support for successful pet-owner relationships'
        ]
      }
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Community Network',
      description: 'Connect with pet lovers, experts, and local organizations. Access expert advice, join meetups, and share resources with the community.',
      detailedInfo: {
        features: [
          'Connect with experienced pet owners and veterinarians',
          'Join local community meetups and events',
          'Share resources, tips, and best practices'
        ],
        process: [
          'Create your profile and join the community network',
          'Connect with other pet owners and experts',
          'Participate in local meetups and events',
          'Share and access valuable resources and tips'
        ],
        benefits: [
          'Access to expert advice and guidance',
          'Build connections with like-minded pet lovers',
          'Learn from experienced community members'
        ]
      }
    },
  ]);

  // How It Works Steps
  const [howItWorksSteps] = useState<HowItWorksStep[]>([
    {
      number: '1',
      title: 'Found/Lost',
      description: 'Report a found or lost pet',
    },
    {
      number: '2',
      title: 'Register',
      description: 'Register your report with details',
    },
    {
      number: '3',
      title: 'Admin',
      description: 'Admin verifies and processes',
    },
    {
      number: '4',
      title: 'Show in Website',
      description: 'Pet appears on website',
    },
    {
      number: '5',
      title: 'Shifted to Nearby Shelter',
      description: 'Transferred to nearby shelter',
    },
  ]);

  // Health Info
  const [healthInfo] = useState([
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Free Vaccination Camps',
      description: 'Regularly organized camps providing essential vaccinations for pets at no cost',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Pet First-Aid Basics',
      description: 'Learn essential first-aid techniques to help your pet in emergencies',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Microchipping Services',
      description: 'Permanent identification for your pet to ensure they can always find their way home',
    },
  ]);

  return (
    <LandingContext.Provider
      value={{
        petImages,
        getHeroImages,
        adoptionStories,
        tools,
        communityFeatures,
        whatWeDoFeatures,
        howItWorksSteps,
        healthInfo,
      }}
    >
      {children}
    </LandingContext.Provider>
  );
};

