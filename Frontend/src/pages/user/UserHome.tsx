import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Search as SearchIcon, PawPrint, Search, Activity, Eye, Calendar, CheckCircle, MapPin, AlertCircle, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { petsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/services/api';
import { format } from 'date-fns';

export default function UserHome() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [availablePets, setAvailablePets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPets();
    }
  }, [isAuthenticated, user]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const petsResponse = await petsApi.getAll({ 
        page: 1,
      });
      
      const pets = petsResponse.results || petsResponse.data || petsResponse.items || [];
      
      const verifiedPets = pets
        .filter((p: any) => p.is_verified !== false);
      
      const normalizedPets = Array.isArray(verifiedPets) ? verifiedPets.map((p: any) => ({
        ...p,
        _id: p.id || p._id,
        createdAt: p.created_at || p.createdAt,
      })) : [];
      
      setAvailablePets(normalizedPets);
    } catch (error: any) {
      console.error('Error loading pets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pets',
        variant: 'destructive',
      });
      setAvailablePets([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to get clean pet name (remove Found/Lost prefix)
  const getCleanPetName = (pet: any) => {
    let name = pet.name || '';
    // Remove "Lost" or "Found" prefix if present
    if (name.toLowerCase().startsWith('lost ')) {
      name = name.substring(5);
    } else if (name.toLowerCase().startsWith('found ')) {
      name = name.substring(6);
    }
    return name || 'Unnamed Pet';
  };

  // Function to get pet type/species
  const getPetType = (pet: any) => {
    // Check multiple possible fields for pet type in order of preference
    let category: any = null;
    
    // First, try category.name (most common structure)
    if (pet.category) {
      if (typeof pet.category === 'object' && pet.category !== null) {
        category = pet.category.name || pet.category.type || pet.category;
      } else if (typeof pet.category === 'string') {
        category = pet.category;
      }
    }
    
    // Fallback to other fields - including name field (as it stores pet type in database)
    if (!category || category === 'null' || category === 'undefined') {
      category = pet.species || 
                 pet.name ||  // Name field stores pet type in database
                 pet.pet_type || 
                 pet.type ||
                 pet.animal_type ||
                 null;
    }
    
    // Convert to string and clean
    if (!category) {
      return 'Unknown';
    }
    
    category = String(category).trim();
    
    // Return Unknown if empty or invalid
    if (!category || category === 'null' || category === 'undefined' || category === '') {
      return 'Unknown';
    }
    
    // Remove "Lost" or "Found" prefix if present
    if (category.toLowerCase().startsWith('lost ')) {
      category = category.substring(5).trim();
    } else if (category.toLowerCase().startsWith('found ')) {
      category = category.substring(6).trim();
    }
    
    // Capitalize first letter and lowercase rest
    if (category && category.length > 0) {
      return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    }
    
    return 'Unknown';
  };


  const quickActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: MapPin,
      href: '/pets/report-found',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: AlertCircle,
      href: '/pets/report-lost',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion',
      icon: Home,
      href: '/pets/adoptable',
      color: 'bg-pink-100 text-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image */}
      <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl">
        <img
          src="https://media.istockphoto.com/id/1417882544/photo/large-group-of-cats-and-dogs-looking-at-the-camera-on-blue-background.jpg?s=612x612&w=0&k=20&c=kGKANSIFdNfhBJMipyuaKU4BcVE1oELWev9lF2ickE0="
          alt="Cats and dogs"
          className="w-full h-full object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50 flex items-center justify-center">
          <div className="w-full px-6 md:px-10 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                Here's what's happening with your pet reports
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-white py-8 md:py-12 px-6 md:px-10 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer h-full">
                    <CardHeader>
                      <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6" />
            </div>
                      <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                      <CardDescription className="text-gray-600">{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
            </div>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-6 lg:p-8 space-y-6 lg:space-y-8">
          <section id="pets" className="scroll-mt-8">
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">All Pets</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">
                    View all pets in the database (Lost, Found, Adopted)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by breed, species, location, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Animals</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                    <option value="goat">Goat</option>
                    <option value="sheep">Sheep</option>
                    <option value="horse">Horse</option>
                    <option value="donkey">Donkey</option>
                    <option value="camel">Camel</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="hen">Hen</option>
                    <option value="duck">Duck</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Found">Found</option>
                    <option value="Lost">Lost</option>
                    <option value="Available for Adoption">Available for Adoption</option>
                    <option value="Adopted">Adopted</option>
                    <option value="Reunited">Reunited</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPets}
                    disabled={loading}
                    className="gap-2"
                  >
          {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
              <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Clear
              </Button>
            </div>
              </div>

              {(() => {
                if (loading) {
                  return (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                      <p className="mt-4 text-gray-600">Loading all pets...</p>
                    </div>
                  );
                }

                const filtered = availablePets.filter((p: any) => {
                  // Get animal type for filtering
                  const animalType = getPetType(p).toLowerCase();
                  
                  const matchesSearch = !searchTerm || 
                    p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.adoption_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    animalType.includes(searchTerm.toLowerCase());
                  
                  // Match animal type filter
                  const matchesType = typeFilter === 'all' || animalType === typeFilter.toLowerCase();
                  
                  // Match status filter
                  const petStatus = p.adoption_status || p.status || '';
                  const matchesStatus = statusFilter === 'all' || petStatus === statusFilter;
                  
                  return matchesSearch && matchesType && matchesStatus;
                });

                return (
                  <>
                    <div className="mb-4 text-sm text-gray-600">
                      {availablePets.length > 0 ? (
                        <>Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{availablePets.length}</span> pets</>
                      ) : (
                        <>No pets found. Click "Refresh" to load all pets.</>
                      )}
                    </div>
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <PawPrint className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                            ? 'No pets match your search' 
                            : 'No pets found'}
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Click "Refresh" to load all pets.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((p: any) => {
                          const petId = p.id || p._id;
                          const createdDate = p.created_at || p.createdAt || p.date_submitted;
                          const petImage = p.image || p.images?.[0]?.image || p.images?.[0]?.image_url || p.image_url;
                          const imageUrl = petImage ? (petImage.startsWith('http') ? petImage : getImageUrl(petImage)) : 'https://via.placeholder.com/300x200?text=No+Image';
                          
                          return (
                            <Card key={petId} className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden flex flex-col">
                              {/* Pet Image */}
                              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                                <img
                                  src={imageUrl}
                                  alt={p.name || 'Pet'}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3">
                                  <Badge variant={
                                    p.adoption_status === 'Found' ? 'default' :
                                    p.adoption_status === 'Lost' ? 'secondary' : 
                                    p.adoption_status === 'Pending' ? 'outline' : 'outline'
                                  } className="shadow-lg">
                                    {p.adoption_status === 'Found' ? 'Found' :
                                     p.adoption_status === 'Lost' ? 'Lost' :
                                     p.adoption_status === 'Pending' ? 'Pending' :
                                     p.adoption_status === 'Available for Adoption' ? 'Adoption' :
                                     p.adoption_status === 'Adopted' ? 'Adopted' :
                                     p.adoption_status || 'N/A'}
                                  </Badge>
                                </div>
                                {p.is_verified && (
                                  <div className="absolute top-3 left-3">
                                    <Badge variant="default" className="bg-green-500 shadow-lg">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  </div>
                                )}
                      </div>

                              {/* Card Content */}
                              <CardContent className="p-5 flex-1 flex flex-col">
                                <div className="flex-1">
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <PawPrint className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium">Type:</span>
                                      <span className="capitalize">{getPetType(p)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <PawPrint className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium">Breed:</span>
                                      <span>{p.breed || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Search className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium">Location:</span>
                                      <span className="line-clamp-1">{p.location || 'N/A'}</span>
                                    </div>
                                    {createdDate && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Reported:</span>
                                        <span>{format(new Date(createdDate), 'MMM dd, yyyy')}</span>
                                      </div>
                                    )}
                                  </div>
                      </div>

                      {/* Action Buttons */}
                                <div className="flex gap-2 mt-auto">
                        <Button
                                    variant="default"
                                    className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94] text-white"
                                    onClick={() => {
                                      navigate(`/pets/${petId}`);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </section>
        </div>
      </main>
    </div>
  );
}
