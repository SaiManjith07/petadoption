import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { petsAPI } from '@/services/api';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPets();
  }, []);

  const loadMyPets = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter by current user
      const userPets = items.filter((p: any) => p.submitted_by.id === user?.id);
      setMyPets(userPets);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await petsAPI.delete(id);
        setMyPets(myPets.filter((p: any) => p.id !== id));
      } catch (error) {
        console.error('Error deleting pet:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">My Profile</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold mb-4">
                  {user?.name?.charAt(0)}
                </div>
                <CardTitle>{user?.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role</span>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Reports</span>
                  <span className="text-sm font-semibold">{myPets.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Submissions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Submissions</CardTitle>
                    <CardDescription>All your pet reports and their current status</CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : myPets.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by reporting a found or lost pet
                    </p>
                    <Button asChild>
                      <Link to="/pets/new/found">Report a Pet</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPets.map((pet: any) => (
                      <Card key={pet.id} className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-32 sm:h-32 h-48 overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={pet.photos[0]}
                              alt={pet.breed}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-semibold">{pet.breed}</h4>
                                <p className="text-sm text-muted-foreground">{pet.species}</p>
                              </div>
                              <Badge variant="secondary">{pet.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{pet.location}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Submitted {format(new Date(pet.date_submitted), 'MMM d, yyyy')}
                            </p>
                            <div className="flex gap-2 mt-auto">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/pets/${pet.id}`}>View</Link>
                              </Button>
                              {pet.status.includes('Pending') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(pet.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
