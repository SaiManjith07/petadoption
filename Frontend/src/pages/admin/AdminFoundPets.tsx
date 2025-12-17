import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X, AlertCircle, Search, ArrowLeft, Eye, Stethoscope } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import { MedicalDetailsDialog } from '@/components/admin/MedicalDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getImageUrl } from '@/services/api';

export default function AdminFoundPets() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [foundPets, setFoundPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Default to 'all' to show all including pending
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [verificationParams, setVerificationParams] = useState({
    verified_photos: false,
    verified_location: false,
    verified_contact: false,
    verified_identity: false,
  });
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState<{ id: number; name?: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadFoundPets();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterPets();
  }, [foundPets, searchTerm, statusFilter]);

  const loadFoundPets = async () => {
    try {
      setLoading(true);
      // Get all pets (without filtering) to ensure we get pending ones
      const allPetsData = await adminApi.getAllPets().catch(() => []);
      
      // Also get pending reports specifically for found pets
      const pendingPetsData = await adminApi.getPendingReports('found').catch(() => []);
      
      // Mark pending pets from getPendingReports so we can identify them
      const markedPendingPets = (pendingPetsData || []).map((p: any) => ({
        ...p,
        _isPendingFound: true, // Mark as pending found pet
      }));
      
      // Filter allPetsData to ONLY include found pets (has found_date)
      // Found pets MUST have found_date set - this is the primary indicator
      const foundPetsFromAll = (allPetsData || []).filter((p: any) => {
        // Check for found_date in various possible field names
        const hasFoundDate = p.found_date || p.foundDate || p.foundDate || 
                           (p.found_date !== null && p.found_date !== undefined);
        
        
        // Include if it has found_date (primary indicator of found pet)
        if (hasFoundDate) {
          // Include all pets with found_date, regardless of status
          return true;
        }
        
        // Also include if explicitly marked as Found status
        if (p.adoption_status === 'Found') {
          return true;
        }
        
        return false;
      });
      
      // Combine: use pending reports as primary source, then add other found pets
      // Remove duplicates by ID
      const petMap = new Map();
      
      // First, add pending found pets (most important)
      markedPendingPets.forEach((p: any) => {
        const id = p.id || p._id;
        if (id) {
          petMap.set(id, p);
        }
      });
      
      // Then, add other found pets (avoid duplicates)
      foundPetsFromAll.forEach((p: any) => {
        const id = p.id || p._id;
        if (id && !petMap.has(id)) {
          petMap.set(id, p);
        }
      });
      
      const combinedPets = Array.from(petMap.values());
      
      // Normalize the data
      const normalizedPets = combinedPets.map((p: any) => ({
        ...p,
        _id: p.id || p._id,
        createdAt: p.created_at || p.createdAt,
      }));
      
      // Remove duplicates based on ID
      const uniquePets = normalizedPets.filter((pet: any, index: number, self: any[]) =>
        index === self.findIndex((p: any) => (p.id || p._id) === (pet.id || pet._id))
      );
      
      // Final filter: Include ALL pets that have found_date OR are marked as Found
      // This is simpler and more inclusive
      const foundPetsList = uniquePets.filter((pet: any) => {
        // Check if it has found_date (primary indicator)
        const hasFoundDate = pet.found_date || pet.foundDate || 
                           (pet.found_date !== null && pet.found_date !== undefined);
        
        if (hasFoundDate) return true;
        
        // Check if it's explicitly marked as Found
        if (pet.adoption_status === 'Found') return true;
        
        // If it's marked as pending found from getPendingReports, include it
        if (pet._isPendingFound) return true;
        
        return false;
      });
      
      setFoundPets(foundPetsList);
    } catch (error: any) {
      console.error('Error loading found pets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load found pets',
        variant: 'destructive',
      });
      setFoundPets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPets = () => {
    let filtered = [...foundPets];

    if (searchTerm) {
      filtered = filtered.filter(pet =>
        pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.distinguishing_marks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pet => {
        const petStatus = pet.status || pet.adoption_status || '';
        const isPending = !pet.is_verified || 
                         petStatus.toLowerCase().includes('pending') ||
                         petStatus === 'Pending Verification' ||
                         petStatus === 'Pending';
        const isListed = petStatus === 'Listed Found' || 
                        petStatus === 'Found' ||
                        (pet.is_verified && !isPending);
        
        if (statusFilter === 'Pending Verification' || statusFilter === 'Pending') {
          return isPending;
        } else if (statusFilter === 'Listed Found') {
          return isListed && !isPending;
        }
        return petStatus === statusFilter || pet.adoption_status === statusFilter;
      });
    }

    setFilteredPets(filtered);
  };

  const stats = {
    total: foundPets.length,
    pending: foundPets.filter((p: any) => {
      const petStatus = p.status || p.adoption_status || '';
      const isPending = !p.is_verified || 
                       petStatus.toLowerCase().includes('pending') ||
                       petStatus === 'Pending Verification' ||
                       petStatus === 'Pending' ||
                       p._isPendingFound;
      return isPending;
    }).length,
    verified: foundPets.filter((p: any) => {
      const petStatus = p.status || p.adoption_status || '';
      return (petStatus === 'Listed Found' || petStatus === 'Found' || 
              (p.is_verified && petStatus !== 'Pending' && petStatus !== 'Pending Verification'));
    }).length,
    rejected: foundPets.filter((p: any) => {
      const petStatus = p.status || p.adoption_status || '';
      return petStatus === 'Rejected';
    }).length,
  };

  const handleAccept = (petId: string) => {
    setAcceptingId(petId);
    setShowAcceptModal(true);
  };

  const submitAcceptance = async () => {
    if (!acceptingId) return;

    const verifiedCount = Object.values(verificationParams).filter(Boolean).length;
    if (verifiedCount < 2) {
      toast({
        title: 'Error',
        description: 'Please verify at least 2 parameters before accepting',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.acceptReport(acceptingId, acceptNotes, verificationParams);
      setFoundPets(foundPets.filter(p => p._id !== acceptingId));
      setShowAcceptModal(false);
      setAcceptingId(null);
      setAcceptNotes('');
      setVerificationParams({
        verified_photos: false,
        verified_location: false,
        verified_contact: false,
        verified_identity: false,
      });
      toast({
        title: 'Success',
        description: 'Found pet report accepted and listed',
      });
      loadFoundPets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept report',
        variant: 'destructive',
      });
    }
  };

  const handleReject = (petId: string) => {
    setRejectingId(petId);
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.rejectReport(rejectingId, rejectReason);
      setFoundPets(foundPets.filter(p => p._id !== rejectingId));
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      toast({
        title: 'Success',
        description: 'Found pet report rejected',
      });
      loadFoundPets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject report',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading Found Pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-64">
        <AdminTopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          onRefresh={loadFoundPets}
        />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                  <Shield className="h-8 w-8 text-[#2BB6AF]" />
                  Found Pets Management
                </h1>
                <p className="text-gray-600 mt-1">Verify and manage found pet reports</p>
              </div>
              <Badge variant="default" className="text-base px-3 py-1 bg-[#2BB6AF]">
                {filteredPets.length} Found Pet{filteredPets.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Found Pets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.verified}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                </CardContent>
              </Card>
            </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by species, breed, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'Pending Verification' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Pending Verification')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'Listed Found' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Listed Found')}
                >
                  Listed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Found Pets List */}
        <div className="space-y-4">
          {filteredPets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No found pets found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPets.map((pet: any) => (
              <Card key={pet._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Pet Images */}
                    {(pet.images && pet.images.length > 0) || pet.image ? (
                      <div className="flex gap-2">
                        {pet.images && pet.images.length > 0 ? (
                          pet.images.slice(0, 3).map((img: any, idx: number) => {
                            const imageUrl = img.image_url || img.image || img.url;
                            const photoUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : getImageUrl(imageUrl)) : 'https://via.placeholder.com/128';
                            return (
                              <img
                                key={idx}
                                src={photoUrl}
                                alt={`Pet ${idx + 1}`}
                                className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                              />
                            );
                          })
                        ) : pet.image ? (
                          <img
                            src={pet.image_url || getImageUrl(pet.image) || 'https://via.placeholder.com/128'}
                            alt="Pet"
                            className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    {/* Pet Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                              {pet.species || 'Pet'}
                            </Badge>
                            <Badge variant={
                              (pet.status === 'Pending Verification' || pet.adoption_status === 'Pending') ? 'destructive' : 
                              (pet.is_verified ? 'default' : 'outline')
                            }>
                              {pet.status || pet.adoption_status || 'Pending'}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold">
                            {pet.name || `${pet.species || 'Pet'} - ${pet.breed || 'Mixed Breed'}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {pet.breed && <><strong>Breed:</strong> {pet.breed}</>}
                            {pet.color && <><br /><strong>Color:</strong> {pet.color}</>}
                            {pet.color_primary && <><br /><strong>Color:</strong> {pet.color_primary} {pet.color_secondary && `& ${pet.color_secondary}`}</>}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Distinguishing Marks:</strong>
                          <p className="text-muted-foreground">{pet.distinguishing_marks}</p>
                        </div>
                        <div>
                          <strong>Location Found:</strong>
                          <p className="text-muted-foreground">
                            {pet.location || pet.last_seen_or_found_location_text || 'N/A'}
                          </p>
                          {(pet.pincode || pet.last_seen_or_found_pincode) && (
                            <p className="text-muted-foreground">Pincode: {pet.pincode || pet.last_seen_or_found_pincode}</p>
                          )}
                        </div>
                        <div>
                          <strong>Date Found:</strong>
                          <p className="text-muted-foreground">
                            {pet.last_seen_or_found_date 
                              ? format(new Date(pet.last_seen_or_found_date), 'MMM dd, yyyy')
                              : (pet.created_at || pet.createdAt || pet.date_submitted)
                              ? format(new Date(pet.created_at || pet.createdAt || pet.date_submitted), 'MMM dd, yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong>Reported by:</strong>
                          <p className="text-muted-foreground">
                            {pet.posted_by?.name || pet.submitted_by?.name || 'Unknown'} 
                            ({pet.posted_by?.email || pet.submitted_by?.email || 'N/A'})
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => navigate(`/pets/${pet._id || pet.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setSelectedPetForMedical({ id: pet._id || pet.id, name: pet.name });
                            setShowMedicalDialog(true);
                          }}
                        >
                          <Stethoscope className="h-4 w-4" />
                          Medical
                        </Button>
                        {(pet.status === 'Pending Verification' || pet.adoption_status === 'Pending' || !pet.is_verified) && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => handleAccept(pet._id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept & Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => handleReject(pet._id)}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Accept Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Accept & Verify Found Pet Report</CardTitle>
                <CardDescription>
                  Verify at least 2 parameters before accepting (photos, location, contact, identity)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Verification Parameters</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_photos"
                        checked={verificationParams.verified_photos}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_photos: !!checked })
                        }
                      />
                      <Label htmlFor="verified_photos" className="cursor-pointer">
                        Photos Verified (Pet photos are clear and match description)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_location"
                        checked={verificationParams.verified_location}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_location: !!checked })
                        }
                      />
                      <Label htmlFor="verified_location" className="cursor-pointer">
                        Location Verified (Location details are accurate)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_contact"
                        checked={verificationParams.verified_contact}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_contact: !!checked })
                        }
                      />
                      <Label htmlFor="verified_contact" className="cursor-pointer">
                        Contact Verified (Reporter contact information is valid)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_identity"
                        checked={verificationParams.verified_identity}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_identity: !!checked })
                        }
                      />
                      <Label htmlFor="verified_identity" className="cursor-pointer">
                        Identity Verified (Reporter identity is confirmed)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accept_notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="accept_notes"
                    value={acceptNotes}
                    onChange={(e) => setAcceptNotes(e.target.value)}
                    placeholder="Add any additional verification notes..."
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAcceptModal(false);
                      setAcceptNotes('');
                      setVerificationParams({
                        verified_photos: false,
                        verified_location: false,
                        verified_contact: false,
                        verified_identity: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitAcceptance} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reject Found Pet Report</CardTitle>
                <CardDescription>Provide a reason for rejection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rejection Reason *</Label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this report is being rejected..."
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={submitRejection}>
                    Reject Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
            </div>
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

