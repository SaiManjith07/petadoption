import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Heart, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI } from '@/services/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [myPets, setMyPets] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user (in production, this would be server-side)
      const userPets = items.filter((p: any) => p.submitted_by.id === user?.id);
      setMyPets(userPets);
      
      setStats({
        total: userPets.length,
        pending: userPets.filter((p: any) => p.status.includes('Pending')).length,
        active: userPets.filter((p: any) => 
          p.status === 'Listed Found' || p.status === 'Listed Lost'
        ).length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: PlusCircle,
      href: '/pets/new/found',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: Search,
      href: '/pets/new/lost',
      color: 'bg-warning/10 text-warning',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion',
      icon: Heart,
      href: '/pets/adopt',
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-muted-foreground">
            Here's what's happening with your pet reports
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently listed</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className="transition-all hover:shadow-md hover:border-primary/20">
                  <CardHeader>
                    <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Recent Reports</h2>
            <Button variant="outline" asChild>
              <Link to="/profile">View All</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : myPets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by reporting a found or lost pet
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link to="/pets/new/found">Report Found</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/pets/new/lost">Report Lost</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPets.slice(0, 5).map((pet: any) => (
                <Card key={pet.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={pet.photos[0]}
                      alt={pet.breed}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{pet.breed}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {pet.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{pet.location}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pet.date_submitted), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/pets/${pet.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
