import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Heart, FileText, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI } from '@/services/api';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function UserHome() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myPets, setMyPets] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    active: 0,
    resolved: 0 
  });
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user
      const userPets = items.filter((p: any) => p.submitted_by?.id === user?.id);
      setMyPets(userPets);
      
      setStats({
        total: userPets.length,
        pending: userPets.filter((p: any) => p.status?.includes('Pending')).length,
        active: userPets.filter((p: any) => 
          p.status === 'Listed Found' || p.status === 'Listed Lost'
        ).length,
        resolved: userPets.filter((p: any) => p.status === 'Resolved').length,
      });
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
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: Search,
      href: '/pets/new/lost',
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion',
      icon: Heart,
      href: '/pets/adopt',
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Here's what's happening with your pet reports
              </p>
            </div>
            <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-10 grid gap-4 md:grid-cols-4">
          {/* Total Reports */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
            </CardContent>
          </Card>

          {/* Pending Review */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting admin approval</p>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently listed</p>
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className={`h-full border-2 ${action.borderColor} cursor-pointer transition-all hover:shadow-lg hover:border-primary`}>
                  <CardHeader>
                    <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-lg ${action.color}`}>
                      <action.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-sm">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Recent Reports</h2>
              <p className="text-sm text-muted-foreground mt-1">Track and manage your pet submissions</p>
            </div>
            {myPets.length > 5 && (
              <Button variant="outline" asChild>
                <Link to="/profile">
                  View All ({myPets.length})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {myPets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start helping pets and their families by reporting found or lost pets in your area
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link to="/pets/new/found">
                      <Heart className="mr-2 h-5 w-5" />
                      Report Found Pet
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg">
                    <Link to="/pets/new/lost">
                      <Search className="mr-2 h-5 w-5" />
                      Report Lost Pet
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myPets.slice(0, 5).map((pet: any) => (
                <Card key={pet.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Pet Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={pet.photos?.[0] || 'https://via.placeholder.com/80'}
                          alt={pet.breed}
                          className="h-20 w-20 rounded-lg object-cover border border-border"
                        />
                      </div>

                      {/* Pet Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{pet.breed}</h3>
                          <Badge 
                            variant={
                              pet.status === 'Listed Found' ? 'default' :
                              pet.status === 'Listed Lost' ? 'secondary' :
                              pet.status?.includes('Pending') ? 'outline' : 'outline'
                            }
                            className="text-xs"
                          >
                            {pet.status || 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          📍 {pet.location || 'Location not specified'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {format(new Date(pet.date_submitted || new Date()), 'MMM d, yyyy')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/pets/${pet.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* View All Button at Bottom */}
              {myPets.length > 5 && (
                <div className="pt-4 text-center">
                  <Button variant="outline" size="lg" asChild>
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

        {/* Help Section */}
        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">💡 Need Help?</h3>
          <p className="text-muted-foreground mb-4">
            Check out our safety guidelines and policies to ensure your pet reports are effective
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/safety">Safety Guidelines</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/policy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
