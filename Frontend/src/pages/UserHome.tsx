import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, Heart, FileText, TrendingUp, ArrowRight, ShieldCheck, 
  Users, Star, Clock, MapPin, CheckCircle2, Image as ImageIcon, Zap, Activity, 
  Home, Users2, PawPrint, UserPlus, BedDouble, ClipboardCheck, Droplet, Radio, 
  AlertCircle, Building2, HandHeart, Truck, Building, Utensils, Sparkles,
  BarChart3, Target, Award, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI } from '@/services/api';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function UserHome() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myShelter, setMyShelter] = useState<any>(null);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    found: 0,
    lost: 0,
    reunited: 0,
    pending: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      navigate('/admin');
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
      checkUserStatus();
    }
  }, [isAuthenticated, user]);

  const checkUserStatus = async () => {
    try {
      const role = (user as any)?.role;
      setIsVolunteer(['rescuer', 'feeder', 'transporter'].includes(role));
      
      const shelterRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/shelter-registrations/my`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (shelterRes.ok) {
        const data = await shelterRes.json();
        setMyShelter(data.data);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      const userPets = items.filter((p: any) => {
        const submittedById = typeof p.submitted_by === 'object' 
          ? (p.submitted_by._id || p.submitted_by.id)
          : p.submitted_by;
        const userId = (user as any)?._id || user?.id;
        return submittedById && userId && String(submittedById) === String(userId);
      });
      userPets.sort((a: any, b: any) => {
        const dateA = new Date(a.date_submitted || a.createdAt || 0).getTime();
        const dateB = new Date(b.date_submitted || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setMyPets(userPets);

      // Calculate stats
      const found = userPets.filter((p: any) => p.report_type === 'found').length;
      const lost = userPets.filter((p: any) => p.report_type === 'lost').length;
      const reunited = userPets.filter((p: any) => 
        p.status === 'Reunited' || p.status === 'Matched'
      ).length;
      const pending = userPets.filter((p: any) => 
        p.status?.includes('Pending')
      ).length;

      setStats({
        total: userPets.length,
        found,
        lost,
        reunited,
        pending,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const primaryActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: Heart,
      href: '/pets/new/found',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      buttonText: 'Report Now',
      priority: 'high',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches from our database',
      icon: Search,
      href: '/pets/new/lost',
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'from-orange-50 to-amber-50',
      buttonText: 'Report Now',
      priority: 'high',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion and give them a loving home',
      icon: PawPrint,
      href: '/pets/adopt',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      buttonText: 'Browse Pets',
      priority: 'medium',
    },
  ];

  const volunteerOptions = [
    {
      title: 'Become Volunteer',
      description: 'Join as rescuer, feeder, or transporter',
      icon: UserPlus,
      href: '/become-volunteer',
      gradient: 'from-purple-500 to-violet-600',
      show: !isVolunteer,
    },
    {
      title: 'Register Shelter',
      description: 'Provide shelter for lost pets',
      icon: Building,
      href: '/register-shelter',
      gradient: 'from-teal-500 to-cyan-600',
      show: !myShelter,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center animate-pulse shadow-lg">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9F0] via-white to-[#F5FDF5]">
      {/* Hero Section - Simple and Professional */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Welcome back, <span className="text-[#4CAF50]">{user?.name}</span>!
              </h1>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl">
                Help pets find their way home. Browse adoptable pets or explore community features.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">{stats.total}</div>
                  <div className="text-sm text-white/90 font-medium">Total Reports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Actions - Highlighted */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-500 mt-1">Get started with these important actions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryActions.map((action, index) => (
              <Card 
                key={index} 
                className={`group relative overflow-hidden border border-gray-200 hover:border-[#4CAF50] transition-all duration-300 hover:shadow-xl cursor-pointer bg-white ${
                  action.priority === 'high' ? 'md:col-span-1' : ''
                }`}
              >
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <Badge className={`${action.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {action.priority === 'high' ? 'Priority' : 'Popular'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mb-2 text-gray-900">{action.title}</CardTitle>
                  <CardDescription className="text-gray-600">{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <Button
                    asChild
                    className={`w-full bg-gradient-to-r ${action.gradient} hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all`}
                  >
                    <Link to={action.href} className="flex items-center justify-center gap-2">
                      {action.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Volunteer & Shelter Options */}
        {volunteerOptions.some(opt => opt.show) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Involved</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {volunteerOptions.filter(opt => opt.show).map((option, index) => (
                <Link key={index} to={option.href}>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#4CAF50] cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                          <option.icon className="h-6 w-6 text-white" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#4CAF50] group-hover:translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="mt-4 text-lg font-semibold">{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Community Features */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: BedDouble, label: 'Shelters', href: '/shelter-capacity' },
              { icon: Utensils, label: 'Feeding', href: '/feeding-points' },
              { icon: ClipboardCheck, label: 'Home Checks', href: '/home-check-tracker' },
              { icon: Radio, label: 'Alerts', href: '/neighborhood-alerts' },
              { icon: ShieldCheck, label: 'Verification', href: '/ngo-verification' },
              { icon: Users, label: 'Profile', href: '/profile' },
            ].map((feature, index) => (
              <Link key={index} to={feature.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer text-center p-6 border-2 hover:border-[#4CAF50] group">
                  <feature.icon className="h-10 w-10 mx-auto mb-3 text-[#4CAF50] group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
                </Card>
                  </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
