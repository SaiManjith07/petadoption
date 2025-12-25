import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X, AlertCircle, Search, ArrowLeft, Eye, Stethoscope } from 'lucide-react';
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
import { PetGallerySkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';
import { getImageUrl } from '@/services/api';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminLostPets() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lostPets, setLostPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState<{ id: number; name?: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadLostPets();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterPets();
  }, [lostPets, searchTerm, statusFilter]);

  const loadLostPets = async () => {
    try {
      setLoading(true);
      // Get all pets (without filtering) to ensure we get pending ones
      const allPetsData = await adminApi.getAllPets().catch(() => []);

      // Also get pending reports specifically for lost pets
      const pendingPetsData = await adminApi.getPendingReports('lost').catch(() => []);

      // Mark pending pets from getPendingReports so we can identify them
      const markedPendingPets = (pendingPetsData || []).map((p: any) => ({
        ...p,
        _isPendingLost: true, // Mark as pending lost pet
      }));

      // Filter allPetsData to ONLY include lost pets (no found_date)
      // Lost pets must NOT have found_date set
      const lostPetsFromAll = (allPetsData || []).filter((p: any) => {
        // Exclude pets with found_date (those are found pets)
        const hasFoundDate = p.found_date || p.foundDate;
        if (hasFoundDate) return false;

        // Include if adoption_status is Lost or Pending (without found_date)
        return p.adoption_status === 'Lost' ||
          (p.adoption_status === 'Pending' && !hasFoundDate);
      });

      // Combine: use pending reports as primary source, then add other lost pets
      // Remove duplicates by ID
      const petMap = new Map();

      // First, add pending lost pets (most important)
      markedPendingPets.forEach((p: any) => {
        const id = p.id || p._id;
        if (id) petMap.set(id, p);
      });

      // Then, add other lost pets (avoid duplicates)
      lostPetsFromAll.forEach((p: any) => {
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

      // Filter for lost pets - check multiple possible fields
      // Include both verified and pending lost pets
      // When a lost pet is reported, it's created with adoption_status='Pending'
      // So we need to include Pending pets that are likely lost pets
      const lostPetsList = uniquePets.filter((pet: any) => {
        // Check if it's explicitly marked as Lost
        if (pet.adoption_status === 'Lost') return true;

        // Check report_type or type fields
        if (pet.report_type === 'lost' || pet.type === 'lost') return true;

        // Check status field
        if (pet.status && pet.status.includes('Lost')) return true;

        // If it's marked as pending lost from getPendingReports, include it
        if (pet._isPendingLost) return true;

        // For Pending pets, check if they have last_seen but no found_date (indicating they're lost pets)
        if (pet.adoption_status === 'Pending' && pet.last_seen && !pet.found_date && !pet.foundDate) return true;

        return false;
      });

      setLostPets(lostPetsList);
    } catch (error: any) {
      console.error('Error loading lost pets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load lost pets',
        variant: 'destructive',
      });
      setLostPets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPets = () => {
    let filtered = [...lostPets];

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
        const isListed = petStatus === 'Listed Lost' ||
          petStatus === 'Lost' ||
          (pet.is_verified && !isPending);

        if (statusFilter === 'Pending Verification' || statusFilter === 'Pending') {
          return isPending;
        } else if (statusFilter === 'Listed Lost') {
          return isListed && !isPending;
        }
        return petStatus === statusFilter || pet.adoption_status === statusFilter;
      });
    }

    setFilteredPets(filtered);
  };

  const stats = {
    total: lostPets.length,
    pending: lostPets.filter((p: any) => {
      const petStatus = p.status || p.adoption_status || '';
      const isPending = !p.is_verified ||
        petStatus.toLowerCase().includes('pending') ||
        petStatus === 'Pending Verification' ||
        petStatus === 'Pending' ||
        p._isPendingLost;
      return isPending;
    }).length,
    verified: lostPets.filter((p: any) => {
      const petStatus = p.status || p.adoption_status || '';
      return (petStatus === 'Listed Lost' || petStatus === 'Lost' ||
        (p.is_verified && petStatus !== 'Pending' && petStatus !== 'Pending Verification'));
    }).length,
    rejected: lostPets.filter((p: any) => {
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
      setLostPets(lostPets.filter(p => p._id !== acceptingId));
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
        description: 'Lost pet report accepted and listed',
      });
      loadLostPets();
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
      setLostPets(lostPets.filter(p => p._id !== rejectingId));
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      toast({
        title: 'Success',
        description: 'Lost pet report rejected',
      });
      loadLostPets();
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
      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          <PageHeaderSkeleton />
          <PetGallerySkeleton count={6} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onRefresh={loadLostPets} isRefreshing={loading}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[#2BB6AF]" />
              Lost Pets Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Verify and manage lost pet reports</p>
          </div>
          <Badge variant="default" className="text-sm sm:text-base px-3 py-1 bg-[#2BB6AF] self-start sm:self-center">
            {filteredPets.length} Lost Pet{filteredPets.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Lost Pets</CardTitle>
              <Shield className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Verification</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
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
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className="flex-1 sm:flex-none"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'Pending Verification' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Pending Verification')}
                  className="flex-1 sm:flex-none"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'Listed Lost' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Listed Lost')}
                  className="flex-1 sm:flex-none"
                >
                  Listed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lost Pets List */}
        <div className="space-y-4">
          {filteredPets.length === 0 ? (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lost pets found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPets.map((pet: any) => (
              <Card key={pet._id} className="shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[#2BB6AF]">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Pet Images - Using Cloudinary URLs */}
                    {(() => {
                      // Get all available image URLs
                      const imageUrls: string[] = [];

                      // Priority 1: Use cloudinary_url (primary Cloudinary URL)
                      if (pet.cloudinary_url) {
                        imageUrls.push(pet.cloudinary_url);
                      }

                      // Priority 2: Use image_url from serializer
                      if (pet.image_url && pet.image_url !== pet.cloudinary_url) {
                        imageUrls.push(pet.image_url);
                      }

                      // Priority 3: Use photos array from serializer (includes all photos)
                      if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
                        pet.photos.forEach((photo: string) => {
                          if (photo && !imageUrls.includes(photo)) {
                            imageUrls.push(photo);
                          }
                        });
                      }

                      // Priority 4: Use images array (from PetImage model)
                      if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
                        pet.images.forEach((img: any) => {
                          const imgUrl = img.cloudinary_url || img.image_url || img.image || img.url;
                          if (imgUrl && !imageUrls.includes(imgUrl)) {
                            imageUrls.push(imgUrl);
                          }
                        });
                      }

                      // Priority 5: Fallback to single image field
                      if (pet.image && !imageUrls.includes(pet.image)) {
                        const imgUrl = pet.image.startsWith('http') ? pet.image : getImageUrl(pet.image);
                        if (imgUrl) {
                          imageUrls.push(imgUrl);
                        }
                      }

                      if (imageUrls.length === 0) {
                        return null;
                      }

                      return (
                        <div className="flex gap-2 flex-wrap flex-shrink-0">
                          {imageUrls.slice(0, 3).map((imgUrl: string, idx: number) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Pet ${idx + 1}`}
                              className="h-24 w-24 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/128?text=No+Image';
                              }}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Pet Details */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-xs px-2 py-0.5">
                              {pet.species || 'Pet'}
                            </Badge>
                            <Badge variant={
                              (pet.status === 'Pending Verification' || pet.adoption_status === 'Pending') ? 'destructive' :
                                (pet.is_verified ? 'default' : 'outline')
                            } className="text-xs px-2 py-0.5">
                              {pet.status || pet.adoption_status || 'Pending'}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold leading-tight">
                            {pet.name || `${pet.species || 'Pet'} - ${pet.breed || 'Mixed Breed'}`}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pet.breed && <><strong>Breed:</strong> {pet.breed}</>}
                            {pet.color && <><span className="mx-2">•</span><strong>Color:</strong> {pet.color}</>}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Last Seen Location:</strong>
                          <p className="text-muted-foreground truncate">
                            {pet.location || pet.last_seen_or_found_location_text || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong>Last Seen Date:</strong>
                          <p className="text-muted-foreground">
                            {pet.last_seen || pet.last_seen_or_found_date
                              ? format(new Date(pet.last_seen || pet.last_seen_or_found_date), 'MMM dd, yyyy')
                              : (pet.created_at || pet.createdAt || pet.date_submitted)
                                ? format(new Date(pet.created_at || pet.createdAt || pet.date_submitted), 'MMM dd, yyyy')
                                : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <strong>Reported by:</strong>
                          <span className="text-muted-foreground ml-1">
                            {pet.posted_by?.name || pet.submitted_by?.name || 'Unknown'}
                            <span className="opacity-70 ml-1">({pet.posted_by?.email || pet.submitted_by?.email || 'N/A'})</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                        <div className="flex gap-2">
                          {(pet.status === 'Pending Verification' || pet.adoption_status === 'Pending' || !pet.is_verified) && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700 gap-1 shadow-sm"
                                onClick={() => handleAccept(pet._id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs gap-1 shadow-sm"
                                onClick={() => handleReject(pet._id)}
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 ml-auto border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-blue-500"
                          onClick={() => navigate(`/pets/${pet._id || pet.id}`)}
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Accept Modal - Same as Found Pets */}
        {showAcceptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Accept & Verify Lost Pet Report</CardTitle>
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
                <CardTitle>Reject Lost Pet Report</CardTitle>
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

      {/* Medical Details Dialog */}
      {selectedPetForMedical && (
        <MedicalDetailsDialog
          open={showMedicalDialog}
          onOpenChange={setShowMedicalDialog}
          petId={selectedPetForMedical.id}
          petName={selectedPetForMedical.name}
        />
      )}
    </AdminLayout>
  );
}

