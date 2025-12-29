import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, MapPin, Phone, Mail, Globe, TrendingUp, Users, AlertCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { shelterAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function ShelterCapacity() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    loadShelters();
  }, []);

  const loadShelters = async () => {
    try {
      setLoading(true);
      const data = await shelterAPI.getAll();
      setShelters(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load shelters',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredShelters = shelters.filter(shelter => {
    const matchesSearch = searchTerm === '' ||
      shelter.shelter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shelter.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === '' || shelter.location?.city === filterCity;
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(shelters.map(s => s.location?.city).filter(Boolean)));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center">
              <BedDouble className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Login to View All Shelters</CardTitle>
            <CardDescription className="text-base mt-2">
              View real-time bed availability from partner shelters in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1a7a75] text-white"
              onClick={() => navigate('/auth/login')}
            >
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center shadow-lg">
              <BedDouble className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Nearby Shelter Capacity</h1>
              <p className="text-gray-600 mt-1">View real-time bed availability from partner shelters in your area</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search shelters by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading shelters...</p>
          </div>
        ) : filteredShelters.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Shelters Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredShelters.map((shelter) => {
              const occupancyPercentage = shelter.total_beds > 0
                ? Math.round((shelter.occupied_beds / shelter.total_beds) * 100)
                : 0;
              const distance = Math.random() * 10 + 1; // Mock distance

              return (
                <Card key={shelter._id || shelter.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl font-bold text-gray-900">{shelter.shelter_name}</CardTitle>
                      <Badge
                        className={shelter.available_beds > 5 ? 'bg-green-100 text-green-700' :
                          shelter.available_beds > 0 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'}
                      >
                        {shelter.available_beds} Available
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{shelter.location?.address}, {shelter.location?.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{distance.toFixed(1)} km away</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Capacity Display */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Capacity</span>
                        <span className="text-sm text-gray-600">
                          {shelter.occupied_beds}/{shelter.total_beds} beds
                        </span>
                      </div>
                      <Progress
                        value={occupancyPercentage}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{occupancyPercentage}% occupied</span>
                        <span>{shelter.available_beds} beds free</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {shelter.contact_info && (
                      <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                        {shelter.contact_info.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{shelter.contact_info.phone}</span>
                          </div>
                        )}
                        {shelter.contact_info.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{shelter.contact_info.email}</span>
                          </div>
                        )}
                        {shelter.contact_info.website && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="h-4 w-4" />
                            <a href={shelter.contact_info.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full border-green-200 hover:bg-green-50 hover:border-green-300"
                      onClick={() => {
                        if (shelter.location?.coordinates) {
                          window.open(`https://www.google.com/maps?q=${shelter.location.coordinates.lat},${shelter.location.coordinates.lng}`, '_blank');
                        }
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

