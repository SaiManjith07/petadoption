import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X, AlertCircle, Search, ArrowLeft, Eye, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState<{ id: number; name?: string } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          <PageHeaderSkeleton />
          <PetGallerySkeleton count={6} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onRefresh={loadFoundPets} isRefreshing={loading}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[#2BB6AF]" />
              Found Pets Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Verify and manage found pet reports</p>
          </div>
          <Badge variant="default" className="text-sm sm:text-base px-3 py-1 bg-[#2BB6AF] self-start sm:self-center">
            {filteredPets.length} Found Pet{filteredPets.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Found Pets</CardTitle>
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
                  variant={statusFilter === 'Listed Found' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Listed Found')}
                  className="flex-1 sm:flex-none"
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
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No found pets found</p>
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
                      if (pet.image && !imageUrls.length) {
                        const fallbackUrl = pet.image.startsWith('http') ? pet.image : getImageUrl(pet.image);
                        if (fallbackUrl) imageUrls.push(fallbackUrl);
                      }

                      // Display images if available
                      if (imageUrls.length > 0) {
                        return (
                          <div className="flex gap-2 flex-wrap flex-shrink-0">
                            {imageUrls.slice(0, 3).map((imgUrl: string, idx: number) => (
                              <div
                                key={idx}
                                className="relative group"
                                onClick={() => {
                                  setSelectedImages(imageUrls);
                                  setCurrentImageIndex(idx);
                                  setShowImageModal(true);
                                }}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Pet photo ${idx + 1}`}
                                  className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200 hover:border-[#2BB6AF] transition-all cursor-pointer shadow-md hover:shadow-lg"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=No+Image';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {idx === 0 && imageUrls.length > 1 && (
                                  <div className="absolute top-1 right-1 bg-[#2BB6AF] text-white text-xs px-2 py-1 rounded">
                                    +{imageUrls.length - 1}
                                  </div>
                                )}
                              </div>
                            ))}
                            {imageUrls.length > 3 && (
                              <div
                                className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm cursor-pointer hover:border-[#2BB6AF] transition-all"
                                onClick={() => {
                                  setSelectedImages(imageUrls);
                                  setCurrentImageIndex(0);
                                  setShowImageModal(true);
                                }}
                              >
                                +{imageUrls.length - 3} more
                              </div>
                            )}
                          </div>
                        );
                      }

                      // No images available
                      return (
                        <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm flex-shrink-0">
                          No image
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
                          <strong>Location Found:</strong>
                          <p className="text-muted-foreground truncate">
                            {pet.location || pet.last_seen_or_found_location_text || 'N/A'}
                          </p>
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

      {/* Medical Details Dialog */}
      {selectedPetForMedical && (
        <MedicalDetailsDialog
          open={showMedicalDialog}
          onOpenChange={setShowMedicalDialog}
          petId={selectedPetForMedical.id}
          petName={selectedPetForMedical.name}
        />
      )}

      {/* Image Viewer Modal */}
      {showImageModal && selectedImages.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center mb-4">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Pet photo ${currentImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                }}
              />
            </div>

            {/* Navigation */}
            {selectedImages.length > 1 && (
              <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="text-white text-sm font-medium">
                  {currentImageIndex + 1} / {selectedImages.length}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setCurrentImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}

            {/* Thumbnail Strip */}
            {selectedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                {selectedImages.map((imgUrl: string, idx: number) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`h-16 w-16 rounded object-cover cursor-pointer border-2 transition-all ${idx === currentImageIndex
                      ? 'border-[#2BB6AF] scale-110'
                      : 'border-transparent hover:border-gray-400'
                      }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

