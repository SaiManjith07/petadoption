import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Filter, Grid, List, MoreVertical, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { adminApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';

export default function AllPets() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/home');
      return;
    }
    loadPets();
  }, [isAdmin, navigate]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllPets();
      const normalizedPets = Array.isArray(data) ? data.map((p: any) => ({
        ...p,
        _id: p.id || p._id,
        createdAt: p.created_at || p.createdAt,
      })) : [];
      setPets(normalizedPets);
    } catch (error: any) {
      console.error('Error loading pets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load pets',
        variant: 'destructive',
      });
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter((pet: any) => {
    const matchesSearch =
      !searchQuery ||
      pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies =
      speciesFilter === 'all' ||
      pet.breed?.toLowerCase().includes(speciesFilter.toLowerCase()) ||
      pet.species?.toLowerCase() === speciesFilter.toLowerCase();
    
    const matchesStatus =
      statusFilter === 'all' ||
      pet.adoption_status === statusFilter ||
      (statusFilter === 'verified' && pet.is_verified) ||
      (statusFilter === 'pending' && !pet.is_verified);

    return matchesSearch && matchesSpecies && matchesStatus;
  });

  const getStatusBadge = (pet: any) => {
    const status = pet.adoption_status || 'Unknown';
    const isVerified = pet.is_verified;

    if (status === 'Found') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Found</Badge>;
    }
    if (status === 'Lost') {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Lost</Badge>;
    }
    if (status === 'Available for Adoption') {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Adoptable</Badge>;
    }
    if (status === 'Adopted') {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Adopted</Badge>;
    }
    if (!isVerified) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 w-full">
        {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Pets</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and view all pets in the system</p>
              </div>
              <Button
                onClick={() => navigate('/pets/report-found')}
                className="bg-[#2BB6AF] hover:bg-[#239a94] text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </div>
            
            {/* Breadcrumb */}
            <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">All Pets</span>
            </nav>
          </div>

          {/* Search and Filters */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, breed, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="px-2 sm:px-3 py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] flex-1 sm:flex-none min-w-[120px]"
                  >
                    <option value="all">All Species</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 sm:px-3 py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] flex-1 sm:flex-none min-w-[120px]"
                  >
                    <option value="all">All Status</option>
                    <option value="Found">Found</option>
                    <option value="Lost">Lost</option>
                    <option value="Available for Adoption">Adoptable</option>
                    <option value="Adopted">Adopted</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-none border-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none border-0"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pets Display */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4CAF50] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading pets...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PawPrint className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pets Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || speciesFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No pets in the system yet.'}
                </p>
                <Button
                  onClick={() => navigate('/pets/report-found')}
                  className="bg-[#2BB6AF] hover:bg-[#239a94]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Pet
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-16 sm:w-20">Photo</TableHead>
                        <TableHead className="min-w-[100px]">Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Species</TableHead>
                        <TableHead className="hidden md:table-cell">Breed</TableHead>
                        <TableHead className="hidden lg:table-cell">Age</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Location</TableHead>
                        <TableHead className="hidden lg:table-cell">Reported</TableHead>
                        <TableHead className="text-right w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPets.map((pet: any) => {
                        const petId = pet.id || pet._id;
                        const imageUrl = pet.images?.[0]?.image || pet.image || pet.cloudinary_url;
                        return (
                          <TableRow key={petId} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl.startsWith('http') ? imageUrl : getImageUrl(imageUrl)}
                                    alt={pet.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm sm:text-base">
                              <div className="flex flex-col">
                                <span>{pet.name || 'Unnamed'}</span>
                                <span className="text-xs text-gray-500 sm:hidden">
                                  {pet.category?.name || pet.species || 'Unknown'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{pet.category?.name || pet.species || 'Unknown'}</TableCell>
                            <TableCell className="hidden md:table-cell">{pet.breed || 'Mixed'}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              {pet.age ? `${pet.age} ${pet.age_unit || 'years'}` : 'N/A'}
                              {pet.gender && ` (${pet.gender})`}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(pet)}
                                <span className="text-xs text-gray-500 lg:hidden xl:hidden">
                                  {pet.location ? (pet.location.length > 15 ? pet.location.substring(0, 15) + '...' : pet.location) : 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                              {pet.location || 'N/A'}
                              {pet.pincode && ` - ${pet.pincode}`}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                              {pet.created_at || pet.createdAt
                                ? format(new Date(pet.created_at || pet.createdAt), 'MMM d, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/pets/${petId}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/pets/${petId}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this pet?')) {
                                        // Handle delete
                                      }
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPets.map((pet: any) => {
                const petId = pet.id || pet._id;
                const imageUrl = pet.images?.[0]?.image || pet.image;
                return (
                  <Card key={petId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 sm:h-48 bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl.startsWith('http') ? imageUrl : getImageUrl(imageUrl)}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <PawPrint className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">{getStatusBadge(pet)}</div>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-1">{pet.name || 'Unnamed'}</h3>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        <p>
                          <span className="font-medium">Category:</span> {pet.category?.name || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Breed:</span> {pet.breed || 'Mixed'}
                        </p>
                        <p>
                          <span className="font-medium">Age:</span>{' '}
                          {pet.age ? `${pet.age} ${pet.age_unit || 'years'}` : 'N/A'}
                          {pet.gender && ` • ${pet.gender}`}
                        </p>
                        <p>
                          <span className="font-medium">Size:</span> {pet.size || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Location:</span> {pet.location || 'N/A'}
                          {pet.pincode && ` (${pet.pincode})`}
                        </p>
                        {pet.last_seen && (
                          <p>
                            <span className="font-medium">Last Seen:</span>{' '}
                            {format(new Date(pet.last_seen), 'MMM d, yyyy')}
                          </p>
                        )}
                        {pet.posted_by && (
                          <p>
                            <span className="font-medium">Posted by:</span> {pet.posted_by.name || pet.posted_by.email || 'Unknown'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs sm:text-sm"
                          onClick={() => navigate(`/pets/${petId}`)}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs sm:text-sm"
                          onClick={() => navigate(`/pets/${petId}/edit`)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredPets.length > 0 && (
            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredPets.length}</span> of{' '}
              <span className="font-semibold">{pets.length}</span> pets
            </div>
          )}
      </div>
    </AdminLayout>
  );
}

