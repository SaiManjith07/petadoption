import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Heart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI, getImageUrl } from '@/services/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect admin users to admin panel
    if (isAdmin) {
      navigate('/admin');
      return;
    }
    loadDashboardData();
  }, [isAdmin, navigate, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user - only lost and found pets
      // Handle both object and string formats for submitted_by
      const userPets = items.filter((p: any) => {
        const submittedById = typeof p.submitted_by === 'object' 
          ? (p.submitted_by._id || p.submitted_by.id)
          : p.submitted_by;
        const userId = user?._id || user?.id;
        const isMyPet = submittedById && userId && String(submittedById) === String(userId);
        // Only show lost and found pets (not adoption)
        const isLostOrFound = p.report_type === 'lost' || p.report_type === 'found' || 
                             p.status?.includes('Lost') || p.status?.includes('Found');
        return isMyPet && isLostOrFound;
      });
      // Sort by date_submitted (most recent first)
      userPets.sort((a: any, b: any) => {
        const dateA = new Date(a.date_submitted || a.createdAt || 0).getTime();
        const dateB = new Date(b.date_submitted || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      // Normalize IDs - ensure all pets have an id field
      const normalizedPets = userPets.map((pet: any) => {
        if (!pet.id && pet._id) {
          pet.id = pet._id;
        }
        return pet;
      });
      setMyPets(normalizedPets);
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
    <div className="min-h-screen bg-background -m-6 lg:-m-8 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-muted-foreground">
            Here's what's happening with your pet reports
          </p>
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

        {/* My Pets Section - Only show if user has posted lost/found pets */}
        {myPets.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Pets</h2>
              <Button variant="outline" asChild>
                <Link to="/profile">View All</Link>
              </Button>
            </div>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  You have {myPets.length} {myPets.length === 1 ? 'pet report' : 'pet reports'} (Lost/Found)
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myPets.slice(0, 6).map((pet: any) => {
                    const photoPath = Array.isArray(pet.photos) && pet.photos.length > 0
                      ? (typeof pet.photos[0] === 'string' 
                          ? pet.photos[0] 
                          : pet.photos[0]?.url || pet.photos[0]?.file_url || pet.photos[0])
                      : null;
                    // If it's a data URL, use it directly; otherwise convert
                    const photoUrl = photoPath?.startsWith('data:') 
                      ? photoPath 
                      : (getImageUrl(photoPath) || 'https://via.placeholder.com/80');
                    return (
                      <Card key={pet.id || pet._id} className="overflow-hidden">
                        <div className="flex items-center gap-3 p-3">
                          <img
                            src={photoUrl}
                            alt={pet.breed || 'Pet'}
                            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{pet.breed || 'Pet'}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {pet.report_type === 'found' ? 'Found' : pet.report_type === 'lost' ? 'Lost' : pet.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {pet.location || pet.last_seen_or_found_location_text || 'Location not specified'}
                            </p>
                            {(pet.id || pet._id) ? (
                              <Button variant="outline" size="sm" asChild className="w-full">
                                <Link to={`/pets/${pet.id || pet._id}`}>
                                  View
                                </Link>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="w-full">
                                ID Missing
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Reports */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Recent Reports</h2>
            {myPets.length > 0 && (
              <Button variant="outline" asChild>
                <Link to="/profile">View All</Link>
              </Button>
            )}
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
              {myPets.slice(0, 5).map((pet: any) => {
                const petId = pet.id || pet._id;
                const photoPath = Array.isArray(pet.photos) && pet.photos.length > 0
                  ? (typeof pet.photos[0] === 'string' 
                      ? pet.photos[0] 
                      : pet.photos[0]?.url || pet.photos[0]?.file_url || pet.photos[0])
                  : null;
                // If it's a data URL, use it directly; otherwise convert
                const photoUrl = photoPath?.startsWith('data:') 
                  ? photoPath 
                  : (getImageUrl(photoPath) || 'https://via.placeholder.com/80');
                
                if (!petId) {
                  console.warn('Pet missing ID:', pet);
                }
                
                return (
                <Card key={petId || `pet-${Math.random()}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={photoUrl}
                      alt={pet.breed || 'Pet'}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{pet.breed || 'Pet'}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {pet.report_type === 'found' ? 'Found' : pet.report_type === 'lost' ? 'Lost' : pet.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {pet.location || pet.last_seen_or_found_location_text || 'Location not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pet.date_submitted || pet.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {petId ? (
                        <>
                          <Button variant="default" size="sm" asChild className="bg-orange-600 hover:bg-orange-700">
                            <Link to={`/pets/${petId}`}>
                              My Pet
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/pets/${petId}`}>View</Link>
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          ID Missing
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
