import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Heart, FileText, TrendingUp, ArrowRight, ShieldCheck, Users, Star, Clock, MapPin, CheckCircle2, Image as ImageIcon, Zap, Activity, Home, Users2, PawPrint } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    // Redirect admin users to admin panel
    if (isAdmin) {
      navigate('/admin');
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user
      const userPets = items.filter((p: any) => {
        const submittedById = typeof p.submitted_by === 'object' 
          ? (p.submitted_by._id || p.submitted_by.id)
          : p.submitted_by;
        const userId = (user as any)?._id || user?.id;
        return submittedById && userId && String(submittedById) === String(userId);
      });
      // Sort by date_submitted (most recent first)
      userPets.sort((a: any, b: any) => {
        const dateA = new Date(a.date_submitted || a.createdAt || 0).getTime();
        const dateB = new Date(b.date_submitted || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setMyPets(userPets);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Could not load your pet reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: Heart,
      href: '/pets/new/found',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: Search,
      href: '/pets/new/lost',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
      image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion',
      icon: PawPrint,
      href: '/pets/adopt',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
      image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
          <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center animate-pulse">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Welcome Header with Animation */}
        <div className={`mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 h-64 w-64 bg-white rounded-full -mr-32 -mt-32 animate-pulse" />
              <div className="absolute bottom-0 left-0 h-48 w-48 bg-white rounded-full -ml-24 -mb-24 animate-pulse delay-300" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-32 w-32 bg-white/20 rounded-full -ml-16 -mb-16 blur-3xl animate-pulse delay-500" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-9 w-9 text-white animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                      Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="mt-3 text-lg sm:text-xl text-green-50 drop-shadow-md">
                      Here's what's happening with your pet reports
                    </p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-white" />
                      <span className="text-white font-semibold">{myPets.length} Reports</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span className="text-white font-semibold">Active</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 shadow-xl group-hover:rotate-6 transition-transform duration-300">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions with Enhanced Animations */}
        <div className={`mb-12 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Quick Actions</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-green-600 to-transparent rounded-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link 
                key={action.title} 
                to={action.href}
                className={`group block transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className={`h-full border-2 ${action.borderColor} ${action.hoverColor} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 bg-white overflow-hidden relative`}>
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                    <img 
                      src={action.image} 
                      alt={action.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-80`} />
                  </div>
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <action.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{action.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className={`flex items-center text-sm font-semibold ${action.iconColor} group-hover:gap-3 transition-all`}>
                      Get Started 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports with Animation */}
        <div className={`transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Recent Reports</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-16">Track and manage your pet submissions</p>
            </div>
            {myPets.length > 5 && (
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all" asChild>
                <Link to="/profile">
                  View All ({myPets.length})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {myPets.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-green-300 transition-all duration-300">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center border-2 border-green-200 animate-pulse">
                    <FileText className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No reports yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-base">
                  Start helping pets and their families by reporting found or lost pets in your area
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <Link to="/pets/new/found">
                      <Heart className="mr-2 h-5 w-5" />
                      Report Found Pet
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all hover:scale-105">
                    <Link to="/pets/new/lost">
                      <Search className="mr-2 h-5 w-5" />
                      Report Lost Pet
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPets.slice(0, 5).map((pet: any, index: number) => {
                const photoUrl = Array.isArray(pet.photos) && pet.photos.length > 0
                  ? (typeof pet.photos[0] === 'string' ? pet.photos[0] : pet.photos[0]?.url || pet.photos[0])
                  : null;
                const isFound = pet.status === 'Listed Found';
                const isLost = pet.status === 'Listed Lost';
                return (
                <Card 
                  key={pet.id || pet._id} 
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 bg-white group ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Pet Image with Better Styling */}
                      <div className="flex-shrink-0 relative group/image">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={pet.breed || 'Pet'}
                            className="h-28 w-28 rounded-xl object-cover border-2 border-gray-200 shadow-lg group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-28 w-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-200 shadow-lg flex items-center justify-center ${photoUrl ? 'hidden' : ''}`}>
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className={`absolute -top-2 -right-2 h-7 w-7 rounded-full ${isFound ? 'bg-green-500' : isLost ? 'bg-orange-500' : 'bg-gray-400'} border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          {isFound ? <CheckCircle2 className="h-4 w-4 text-white" /> : 
                           isLost ? <Search className="h-4 w-4 text-white" /> : 
                           <Clock className="h-4 w-4 text-white" />}
                        </div>
                      </div>

                      {/* Pet Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-green-600 transition-colors">{pet.breed || 'Unknown Breed'}</h3>
                          <Badge 
                            className={`text-xs font-semibold ${
                              isFound ? 'bg-green-100 text-green-700 border-green-200' :
                              isLost ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {pet.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{pet.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>Submitted {format(new Date(pet.date_submitted || new Date()), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <Button variant="outline" size="sm" className="border-2 hover:bg-green-50 hover:border-green-300 group-hover:scale-105 transition-all" asChild>
                          <Link to={`/pets/${pet.id || pet._id}`}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {/* View All Button at Bottom */}
              {myPets.length > 5 && (
                <div className="pt-6 text-center">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all" asChild>
                    <Link to="/profile">
                      View All {myPets.length} Reports
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Section with Animation */}
        <div className={`mt-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg hover:rotate-6 transition-transform">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">💡 Need Help?</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Check out our safety guidelines and policies to ensure your pet reports are effective and help reunite families faster.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-2 hover:bg-white hover:border-green-300 hover:scale-105 transition-all" asChild>
                  <Link to="/safety">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Safety Guidelines
                  </Link>
                </Button>
                <Button variant="outline" className="border-2 hover:bg-white hover:border-green-300 hover:scale-105 transition-all" asChild>
                  <Link to="/policy">
                    <FileText className="mr-2 h-4 w-4" />
                    Privacy Policy
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
