import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Search, Activity, Eye, Calendar, CheckCircle, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import { MedicalDetailsDialog } from '@/components/admin/MedicalDetailsDialog';

export default function AdminAllPets() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pets, setPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState<{ id: number; name?: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAllPets();
  }, [isAdmin, navigate]);

  const loadAllPets = async () => {
    try {
      setPetsLoading(true);
      const petsData = await adminApi.getAllPets();
      const normalizedPets = Array.isArray(petsData) ? petsData.map((p: any) => ({
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
      setPetsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-64">
        {/* Top Navigation */}
        <AdminTopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          onRefresh={loadAllPets}
        />

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
                        View and manage all pets in the database (Lost, Found, Adopted)
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
                        <option value="all">All Types</option>
                        <option value="found">Found</option>
                        <option value="lost">Lost</option>
                        <option value="adoption">Adoption</option>
                      </select>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Status</option>
                        <option value="Pending Verification">Pending</option>
                        <option value="Listed Found">Listed Found</option>
                        <option value="Listed Lost">Listed Lost</option>
                        <option value="Matched">Matched</option>
                        <option value="Reunited">Reunited</option>
                        <option value="Available for Adoption">Available for Adoption</option>
                        <option value="Adopted">Adopted</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAllPets}
                        disabled={petsLoading}
                        className="gap-2"
                      >
                        {petsLoading ? (
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
                    if (petsLoading) {
                      return (
                        <div className="text-center py-12">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                          <p className="mt-4 text-gray-600">Loading all pets...</p>
                        </div>
                      );
                    }

                    const filtered = pets.filter((p: any) => {
                      const reportType = p.adoption_status === 'Found' ? 'found' : 
                                        p.adoption_status === 'Lost' ? 'lost' : null;
                      
                      const matchesSearch = !searchTerm || 
                        p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.adoption_status?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesType = typeFilter === 'all' || reportType === typeFilter || p.report_type === typeFilter || p.type === typeFilter;
                      const matchesStatus = statusFilter === 'all' || p.adoption_status === statusFilter || p.status === statusFilter;
                      return matchesSearch && matchesType && matchesStatus;
                    });

                    return (
                      <>
                        <div className="mb-4 text-sm text-gray-600">
                          {pets.length > 0 ? (
                            <>Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{pets.length}</span> pets</>
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
                                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                                        {p.name || 'Unnamed Pet'}
                                      </h3>
                                      <div className="space-y-2 mb-4">
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
                                        className="flex-1 bg-[#4CAF50] hover:bg-[#2E7D32] text-white"
                                        onClick={() => {
                                          navigate(`/pets/${petId}`);
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View More
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                          setSelectedPetForMedical({ id: petId, name: p.name });
                                          setShowMedicalDialog(true);
                                        }}
                                      >
                                        <Stethoscope className="h-4 w-4 mr-2" />
                                        Medical
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

      {/* Medical Details Dialog */}
      {selectedPetForMedical && (
        <MedicalDetailsDialog
          open={showMedicalDialog}
          onOpenChange={setShowMedicalDialog}
          petId={selectedPetForMedical.id}
          petName={selectedPetForMedical.name}
        />
      )}
    </div>
  );
}

