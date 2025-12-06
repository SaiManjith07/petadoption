import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Filter, Grid, List, MoreVertical } from 'lucide-react';
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
import { AdminSidebarNew } from '@/components/layout/AdminSidebarNew';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebarNew isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <AdminTopNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Pets</h1>
                <p className="text-gray-600 mt-1">Manage and view all pets in the system</p>
              </div>
              <Button
                onClick={() => navigate('/pets/report-found')}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </div>
            
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-6">
              <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">All Pets</span>
            </nav>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, breed, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
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
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
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
                  className="bg-[#4CAF50] hover:bg-[#2E7D32]"
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
                        <TableHead className="w-20">Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPets.map((pet: any) => {
                        const petId = pet.id || pet._id;
                        const imageUrl = pet.images?.[0]?.image || pet.image;
                        return (
                          <TableRow key={petId} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {imageUrl ? (
                                  <img
                                    src={getImageUrl(imageUrl)}
                                    alt={pet.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <PawPrint className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{pet.name || 'Unnamed'}</TableCell>
                            <TableCell>{pet.category?.name || pet.species || 'Unknown'}</TableCell>
                            <TableCell>{pet.breed || 'Mixed'}</TableCell>
                            <TableCell>
                              {pet.age ? `${pet.age} ${pet.age_unit || 'years'}` : 'N/A'}
                              {pet.gender && ` (${pet.gender})`}
                            </TableCell>
                            <TableCell>{getStatusBadge(pet)}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {pet.location || 'N/A'}
                              {pet.pincode && ` - ${pet.pincode}`}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {pet.created_at || pet.createdAt
                                ? format(new Date(pet.created_at || pet.createdAt), 'MMM d, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPets.map((pet: any) => {
                const petId = pet.id || pet._id;
                const imageUrl = pet.images?.[0]?.image || pet.image;
                return (
                  <Card key={petId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={getImageUrl(imageUrl)}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <PawPrint className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">{getStatusBadge(pet)}</div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{pet.name || 'Unnamed'}</h3>
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/pets/${petId}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/pets/${petId}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
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
            <div className="mt-6 text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredPets.length}</span> of{' '}
              <span className="font-semibold">{pets.length}</span> pets
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

