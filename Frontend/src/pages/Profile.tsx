import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, FileText, Phone, MapPin, Calendar, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { petsAPI, usersAPI, getImageUrl } from '@/services/api';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  const loadMyPets = useCallback(async () => {
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
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMyPets();
      // Initialize personal info from user data
      setPersonalInfo({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        zipCode: user?.zipCode || '',
        bio: user?.bio || '',
      });
    }
  }, [user, loadMyPets]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = user?._id || user?.id;
      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID not found',
          variant: 'destructive',
        });
        return;
      }

      await usersAPI.updateUser(userId, personalInfo);
      
      // Update local storage with new user data
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              // Update personalInfo state with fresh data
              setPersonalInfo({
                name: data.user?.name || '',
                email: data.user?.email || '',
                phone: data.user?.phone || '',
                address: data.user?.address || '',
                city: data.user?.city || '',
                state: data.user?.state || '',
                zipCode: data.user?.zipCode || '',
                bio: data.user?.bio || '',
              });
            }
          }
        } catch (e) {
          console.error('Error refreshing user:', e);
        }
      }
      
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Personal information updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update personal information',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    setPersonalInfo({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await petsAPI.delete(id);
        setMyPets(myPets.filter((p: any) => (p.id || p._id) !== id));
        // Reload pets to ensure data is fresh
        loadMyPets();
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
          {/* Profile Info & Personal Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl font-bold mb-4 shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <CardTitle className="text-xl">{user?.name}</CardTitle>
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

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={personalInfo.address}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={personalInfo.city}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={personalInfo.state}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={personalInfo.zipCode}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, zipCode: e.target.value })}
                        placeholder="Zip code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={personalInfo.bio}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        {saving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p className="text-sm font-medium">{personalInfo.email || 'Not provided'}</p>
                        </div>
                      </div>
                      {personalInfo.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                            <p className="text-sm font-medium">{personalInfo.phone}</p>
                          </div>
                        </div>
                      )}
                      {(personalInfo.address || personalInfo.city || personalInfo.state) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">Address</p>
                            <p className="text-sm font-medium">
                              {[personalInfo.address, personalInfo.city, personalInfo.state, personalInfo.zipCode]
                                .filter(Boolean)
                                .join(', ') || 'Not provided'}
                            </p>
                          </div>
                        </div>
                      )}
                      {personalInfo.bio && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">Bio</p>
                            <p className="text-sm font-medium">{personalInfo.bio}</p>
                          </div>
                        </div>
                      )}
                      {!personalInfo.phone && !personalInfo.address && !personalInfo.bio && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Click Edit to add your personal information
                        </p>
                      )}
                    </div>
                  </>
                )}
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
                    {myPets.map((pet: any) => {
                      const petId = pet.id || pet._id;
                      const photoPath = Array.isArray(pet.photos) && pet.photos.length > 0
                        ? (typeof pet.photos[0] === 'string' 
                            ? pet.photos[0] 
                            : pet.photos[0]?.url || pet.photos[0]?.file_url || pet.photos[0])
                        : null;
                      // If it's a data URL, use it directly; otherwise convert
                      const photoUrl = photoPath?.startsWith('data:') 
                        ? photoPath 
                        : (getImageUrl(photoPath) || 'https://via.placeholder.com/300');
                      return (
                      <Card key={petId} className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-32 sm:h-32 h-48 overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={photoUrl}
                              alt={pet.breed || 'Pet'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300';
                              }}
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-semibold">{pet.breed || 'Unknown Breed'}</h4>
                                <p className="text-sm text-muted-foreground">{pet.species || 'Unknown Species'}</p>
                              </div>
                              <Badge variant="secondary">{pet.status || 'Unknown'}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{pet.location || 'Location not specified'}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Submitted {format(new Date(pet.date_submitted || pet.createdAt || new Date()), 'MMM d, yyyy')}
                            </p>
                            <div className="flex gap-2 mt-auto">
                              {petId ? (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    asChild 
                                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                                  >
                                    <Link to={`/pets/${petId}`}>My Pet</Link>
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/pets/${petId}`}>View</Link>
                                  </Button>
                                </>
                              ) : (
                                <Button variant="outline" size="sm" disabled className="flex-1">
                                  ID Missing
                                </Button>
                              )}
                              {pet.status && pet.status.includes('Pending') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(petId)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                      );
                    })}
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
