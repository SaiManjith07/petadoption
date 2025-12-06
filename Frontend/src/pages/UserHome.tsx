import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Search as SearchIcon, PawPrint, ArrowRight, MapPin, Calendar, MessageCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      
      setAvailablePets(verifiedPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (pet: any) => {
    const status = pet.report_type || pet.status || pet.adoption_status || '';
    if (status.toLowerCase().includes('found')) {
      return (
        <div className="absolute top-4 right-4 px-4 py-2 rounded-[20px] text-[13px] font-semibold backdrop-blur-[10px] bg-[rgba(76,175,80,0.9)] text-white">
          Found
        </div>
      );
    } else if (status.toLowerCase().includes('lost')) {
      return (
        <div className="absolute top-4 right-4 px-4 py-2 rounded-[20px] text-[13px] font-semibold backdrop-blur-[10px] bg-[rgba(255,152,0,0.9)] text-white">
          Lost
        </div>
      );
    } else if (status.toLowerCase().includes('adopt') || status.toLowerCase().includes('available')) {
      return (
        <div className="absolute top-4 right-4 px-4 py-2 rounded-[20px] text-[13px] font-semibold backdrop-blur-[10px] bg-[rgba(76,175,80,0.9)] text-white">
          Adoptable
        </div>
      );
    }
    return null;
  };

  const getPetImage = (pet: any) => {
    if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
      const photo = pet.photos[0];
      const photoPath = typeof photo === 'string' 
        ? photo 
        : photo?.url || photo?.file_url || photo?.image_url || photo;
      return getImageUrl(photoPath) || 'https://via.placeholder.com/400x300?text=No+Image';
    }
    return pet.image_url || pet.image || 'https://via.placeholder.com/400x300?text=No+Image';
  };

  const getPetName = (pet: any) => {
    let name = pet.name || '';
    // Remove "Lost" or "Found" prefix if present
    if (name.toLowerCase().startsWith('lost ')) {
      name = name.substring(5);
    } else if (name.toLowerCase().startsWith('found ')) {
      name = name.substring(6);
    }
    return name || 'Unnamed Pet';
  };

  const getPetType = (pet: any) => {
    const category = pet.category?.name || pet.species || pet.category || 'Unknown';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const getTimeAgo = (date: string | Date) => {
    if (!date) return 'Recently posted';
    try {
      const postDate = new Date(date);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Posted today';
      if (diffInDays === 1) return 'Posted 1 day ago';
      if (diffInDays < 7) return `Posted ${diffInDays} days ago`;
      return format(postDate, 'MMM d, yyyy');
    } catch {
      return 'Recently posted';
    }
  };

  const filteredPets = availablePets.filter((pet: any) => {
    // Filter by status (All Pets, Found, Lost)
    if (activeFilter === 'found') {
      const status = pet.report_type || pet.status || pet.adoption_status || '';
      if (!status.toLowerCase().includes('found')) return false;
    } else if (activeFilter === 'lost') {
      const status = pet.report_type || pet.status || pet.adoption_status || '';
      if (!status.toLowerCase().includes('lost')) return false;
    }
    // activeFilter === 'all' passes through

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const petName = getPetName(pet).toLowerCase();
      const petType = getPetType(pet).toLowerCase();
      const petBreed = (pet.breed || '').toLowerCase();
      const petLocation = (pet.location || pet.address || '').toLowerCase();
      const petDescription = (pet.description || '').toLowerCase();
      const petColor = (pet.color || pet.color_primary || pet.primary_color || '').toLowerCase();
      
      const matchesSearch = 
        petName.includes(query) ||
        petType.includes(query) ||
        petBreed.includes(query) ||
        petLocation.includes(query) ||
        petDescription.includes(query) ||
        petColor.includes(query);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome Section */}
      <div className="bg-white py-10 md:py-[60px] px-6 md:px-10 lg:px-[80px] text-center">
        <h1 className="text-3xl md:text-[42px] font-bold text-[#2C3E50] mb-3">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-base md:text-lg text-[#7F8C8D] font-normal">
          Help pets find their way home.
        </p>

        {/* Simple Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            onClick={() => navigate('/pets/report-found')}
            className="bg-[#4CAF50] text-white text-base font-semibold py-[14px] px-8 rounded-xl border-none cursor-pointer transition-all duration-300 hover:bg-[#45a049] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)]"
          >
            <Heart className="mr-2 h-5 w-5" />
            Report Found Pet
          </Button>
          <Button
            onClick={() => navigate('/pets/report-lost')}
            className="bg-[#FF9800] text-white text-base font-semibold py-[14px] px-8 rounded-xl border-none cursor-pointer transition-all duration-300 hover:bg-[#F57C00] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(255,152,0,0.4)]"
          >
            <SearchIcon className="mr-2 h-5 w-5" />
            Report Lost Pet
          </Button>
        </div>
      </div>

      {/* Pets Near You Section */}
      <div className="bg-[#F8FAFB] py-[60px] px-[80px]">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-[32px] font-bold text-[#2C3E50] mb-2">
              Pets Available / Found Near You
            </h2>
            <p className="text-base text-[#7F8C8D] mb-8">
              Recently added pets from the community
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7F8C8D] pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, breed, location, color, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-6 text-base rounded-[16px] border-2 border-[#E8ECEF] focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 bg-white shadow-sm transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-[#7F8C8D]" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-[#7F8C8D] mt-2 text-center">
                {filteredPets.length} {filteredPets.length === 1 ? 'pet' : 'pets'} found for "{searchQuery}"
              </p>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-6 md:mb-8">
            {[
              { label: 'All Pets', value: 'all' },
              { label: 'Found', value: 'found' },
              { label: 'Lost', value: 'lost' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-[24px] border-2 text-xs md:text-sm font-medium transition-all duration-300 cursor-pointer ${
                  activeFilter === tab.value
                    ? 'bg-[#4CAF50] text-white border-[#4CAF50] shadow-md'
                    : 'bg-white text-[#5F6368] border-[#E8ECEF] hover:border-[#4CAF50] hover:bg-[#F0FFF4]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block h-12 w-12 border-4 border-gray-200 border-t-[#4CAF50] rounded-full animate-spin"></div>
              <p className="mt-4 text-[#7F8C8D]">Loading pets...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-2">No pets found nearby</h3>
              <p className="text-[#7F8C8D] mb-6">Check back later or adjust your search filters</p>
              <Button
                onClick={() => navigate('/pets/report-found')}
                className="bg-[#4CAF50] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#45a049]"
              >
                Report a Pet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPets.map((pet) => {
                const petId = pet.id || pet._id;
                const petImage = getPetImage(pet);
                const petName = getPetName(pet);
                const petType = getPetType(pet);
                const petBreed = pet.breed || 'Mixed Breed';
                const petLocation = pet.location || pet.address || 'Location not provided';
                const postDate = pet.created_at || pet.date_submitted || pet.createdAt;

                return (
                  <Card
                    key={petId}
                    className="relative rounded-[20px] overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
                  >
                    {/* Image Section */}
                    <div className="relative h-[320px] w-full bg-[#F5F5F5] overflow-hidden">
                      <img
                        src={petImage}
                        alt={petName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      {getStatusBadge(pet)}
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-5 bg-white">
                      {/* Pet Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <PawPrint className="h-5 w-5 text-[#4CAF50]" />
                        <span className="text-base font-semibold text-[#2C3E50] capitalize">
                          {petType}
                        </span>
                      </div>

                      {/* Pet Name */}
                      <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
                        {petName}
                      </h3>

                      {/* Pet Breed */}
                      <p className="text-sm text-[#7F8C8D] mb-3">
                        {petBreed}
                      </p>

                      {/* Location Info */}
                      <div className="flex items-center gap-1.5 text-sm text-[#5F6368] mb-2">
                        <MapPin className="h-4 w-4 text-[#FF9800]" />
                        <span className="font-medium line-clamp-1">{petLocation}</span>
                      </div>

                      {/* Date Info */}
                      <div className="flex items-center gap-1.5 text-[13px] text-[#95A5A6] mt-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{getTimeAgo(postDate)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-[#E8ECEF]">
                        <Button
                          asChild
                          className="flex-1 bg-[#4CAF50] text-white text-sm font-semibold py-2.5 px-5 rounded-[10px] border-none cursor-pointer transition-all duration-300 hover:bg-[#45a049]"
                        >
                          <Link to={`/pets/${petId}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="px-4 py-2.5 bg-[#F8FAFB] text-[#4CAF50] text-sm font-semibold rounded-[10px] border-2 border-[#E8ECEF] cursor-pointer transition-all duration-300 hover:bg-[#E8F5E9] hover:border-[#4CAF50]"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
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
