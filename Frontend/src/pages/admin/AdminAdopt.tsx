import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X, AlertCircle, Search, Home, ArrowLeft, Menu } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';
import { format } from 'date-fns';

export default function AdminAdopt() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [verificationParams, setVerificationParams] = useState({
    verified_adopter_identity: false,
    verified_home_check: false,
    verified_references: false,
    verified_financial_stability: false,
  });
  const [acceptNotes, setAcceptNotes] = useState('');
  const [adopterId, setAdopterId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAdoptionRequests();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterRequests();
  }, [adoptionRequests, searchTerm, statusFilter]);

  const loadAdoptionRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      // Try to get pending adoption requests first
      let requests: any[] = [];
      try {
        const pendingRequests = await adminApi.getPendingAdoptionRequests();
        requests = Array.isArray(pendingRequests)
          ? pendingRequests
          : pendingRequests?.data || pendingRequests?.results || [];
      } catch (pendingError: any) {
        console.warn('Pending adoption requests endpoint failed, trying alternative:', pendingError);
      }

      // If no requests found, try getting all pets and filter for adoption status
      if (requests.length === 0) {
        try {
          const allPets = await adminApi.getAllPets();
          const petsArray = Array.isArray(allPets) ? allPets : allPets?.data || allPets?.results || [];

          // Filter for adoption-related pets
          requests = petsArray.filter((p: any) => {
            const status = p.status || p.adoption_status || '';
            return status === 'Pending Adoption' ||
              status === 'Available for Adoption' ||
              status === 'Adopted' ||
              status.toLowerCase().includes('adoption') ||
              status.toLowerCase().includes('adopt');
          });
        } catch (allPetsError: any) {
          console.error('Error loading all pets for adoption:', allPetsError);
        }
      }

      console.log('Adoption requests loaded:', requests.length);
      if (requests.length > 0) {
        console.log('Sample request (full object):', JSON.stringify(requests[0], null, 2));
        console.log('Sample request keys:', Object.keys(requests[0]));
      }

      setAdoptionRequests(requests);
    } catch (error: any) {
      console.error('Error loading adoption requests:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || error?.message || 'Could not load adoption requests',
        variant: 'destructive',
      });
      setAdoptionRequests([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const filterRequests = () => {
    let filtered = [...adoptionRequests];

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.distinguishing_marks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const stats = {
    total: adoptionRequests.length,
    pending: adoptionRequests.filter((r: any) => {
      const status = r.status || r.adoption_status || '';
      return status === 'Pending Adoption';
    }).length,
    available: adoptionRequests.filter((r: any) => {
      const status = r.status || r.adoption_status || '';
      return status === 'Available for Adoption';
    }).length,
    adopted: adoptionRequests.filter((r: any) => {
      const status = r.status || r.adoption_status || '';
      return status === 'Adopted';
    }).length,
  };

  const handleAccept = (requestId: string) => {
    setAcceptingId(requestId);
    setShowAcceptModal(true);
  };

  const submitAcceptance = async () => {
    if (!acceptingId) return;

    const verifiedCount = Object.values(verificationParams).filter(Boolean).length;
    if (verifiedCount < 3) {
      toast({
        title: 'Error',
        description: 'Please verify at least 3 parameters before accepting (identity, home check, references, financial stability)',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.acceptAdoptionRequest(acceptingId, acceptNotes, verificationParams, adopterId || undefined);
      setShowAcceptModal(false);
      setAcceptingId(null);
      setAcceptNotes('');
      setAdopterId('');
      setVerificationParams({
        verified_adopter_identity: false,
        verified_home_check: false,
        verified_references: false,
        verified_financial_stability: false,
      });
      toast({
        title: 'Success',
        description: 'Adoption request approved successfully',
      });
      // Reload data to get updated status
      await loadAdoptionRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Failed to accept adoption request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <PageHeaderSkeleton />
          <TableSkeleton rows={6} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <AdminLayout onRefresh={() => loadAdoptionRequests(false)} isRefreshing={isRefreshing}>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900">
              <Home className="h-6 w-6 sm:h-8 sm:w-8 text-[#2BB6AF]" />
              Adoption Requests
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Verify and approve adoption requests</p>
          </div>
          <Badge variant="default" className="text-sm sm:text-base px-3 py-1 bg-[#2BB6AF] self-start sm:self-center">
            {filteredRequests.length} Adoption Request{filteredRequests.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
              <Home className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Adoption</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.available}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Adopted</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.adopted}</div>
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
                  variant={statusFilter === 'Pending Adoption' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Pending Adoption')}
                  className="flex-1 sm:flex-none"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'Available for Adoption' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Available for Adoption')}
                  className="flex-1 sm:flex-none"
                >
                  Available
                </Button>
                <Button
                  variant={statusFilter === 'Adopted' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Adopted')}
                  className="flex-1 sm:flex-none"
                >
                  Adopted
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adoption Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No adoption requests found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request: any) => (
              <Card key={request.id || request._id || Math.random().toString()} className="shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[#2BB6AF]">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Pet Images */}
                    {(request.photos || request.images || request.photo_urls || request.image_urls) &&
                      (request.photos?.length > 0 || request.images?.length > 0 || request.photo_urls?.length > 0 || request.image_urls?.length > 0) && (
                        <div className="flex gap-2 flex-wrap flex-shrink-0">
                          {(request.photos || request.images || request.photo_urls || request.image_urls || []).slice(0, 3).map((photo: any, idx: number) => {
                            const photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.image_url || photo.photo_url);
                            return photoUrl ? (
                              <img
                                key={idx}
                                src={photoUrl}
                                alt={`Pet ${idx + 1}`}
                                className="h-32 w-32 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : null;
                          })}
                        </div>
                      )}

                    {/* Pet Details */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">ADOPTION</Badge>
                            <Badge variant={(request.status || request.adoption_status) === 'Pending Adoption' ? 'destructive' : 'default'}>
                              {request.status || request.adoption_status || 'Unknown'}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold">
                            {(() => {
                              const species = request.species ||
                                request.pet_type ||
                                request.type ||
                                request.animal_type ||
                                request.category ||
                                request.name?.split(' ')[0] ||
                                'Unknown';
                              const breed = request.breed ||
                                request.breed_name ||
                                request.breed_type ||
                                request.name?.split(' ').slice(1).join(' ') ||
                                'Mixed Breed';
                              return `${species} - ${breed}`;
                            })()}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            <strong>Color:</strong> {
                              request.color_primary ||
                              request.color ||
                              request.primary_color ||
                              request.color_name ||
                              request.body_color ||
                              (request.description && request.description.match(/color[:\s]+([^,\n]+)/i)?.[1]?.trim()) ||
                              'N/A'
                            } {request.color_secondary && `& ${request.color_secondary}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Description:</strong>
                          <p className="text-muted-foreground">
                            {request.distinguishing_marks ||
                              request.description ||
                              request.notes ||
                              request.details ||
                              request.physical_description ||
                              request.appearance ||
                              request.characteristics ||
                              'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong>Location:</strong>
                          <p className="text-muted-foreground">
                            {request.last_seen_or_found_location_text ||
                              request.location ||
                              request.location_text ||
                              request.address ||
                              request.found_location ||
                              request.last_seen_location ||
                              request.city ||
                              request.area ||
                              request.pincode ||
                              'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong>Requested by:</strong>
                          <p className="text-muted-foreground">
                            {(() => {
                              const requesterName = request.submitted_by?.name ||
                                request.owner?.name ||
                                request.user?.name ||
                                request.created_by?.name ||
                                request.requester?.name ||
                                request.adopter?.name ||
                                request.requested_by?.name ||
                                request.contact_name ||
                                'N/A';
                              const requesterEmail = request.submitted_by?.email ||
                                request.owner?.email ||
                                request.user?.email ||
                                request.created_by?.email ||
                                request.requester?.email ||
                                request.adopter?.email ||
                                request.requested_by?.email ||
                                request.contact_email ||
                                request.email;
                              return requesterEmail && requesterEmail !== 'N/A'
                                ? `${requesterName} (${requesterEmail})`
                                : requesterName;
                            })()}
                          </p>
                        </div>
                        <div>
                          <strong>Contact Preference:</strong>
                          <p className="text-muted-foreground">
                            {request.contact_preference ||
                              request.preferred_contact ||
                              request.contact_method ||
                              request.contact_way ||
                              request.communication_preference ||
                              (request.phone ? 'Phone' : null) ||
                              (request.email ? 'Email' : null) ||
                              'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {((request.status || request.adoption_status) === 'Pending Adoption' ||
                        (request.status || request.adoption_status) === 'Pending') && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => handleAccept(request._id || request.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept & Verify Adoption
                            </Button>
                          </div>
                        )}
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
                <CardTitle>Accept & Verify Adoption Request</CardTitle>
                <CardDescription>
                  Verify at least 3 parameters before accepting (identity, home check, references, financial stability)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Verification Parameters</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_adopter_identity"
                        checked={verificationParams.verified_adopter_identity}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_adopter_identity: !!checked })
                        }
                      />
                      <Label htmlFor="verified_adopter_identity" className="cursor-pointer">
                        Adopter Identity Verified
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_home_check"
                        checked={verificationParams.verified_home_check}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_home_check: !!checked })
                        }
                      />
                      <Label htmlFor="verified_home_check" className="cursor-pointer">
                        Home Check Completed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_references"
                        checked={verificationParams.verified_references}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_references: !!checked })
                        }
                      />
                      <Label htmlFor="verified_references" className="cursor-pointer">
                        References Verified
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_financial_stability"
                        checked={verificationParams.verified_financial_stability}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_financial_stability: !!checked })
                        }
                      />
                      <Label htmlFor="verified_financial_stability" className="cursor-pointer">
                        Financial Stability Confirmed
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adopter_id">Adopter User ID (Optional)</Label>
                  <Input
                    id="adopter_id"
                    value={adopterId}
                    onChange={(e) => setAdopterId(e.target.value)}
                    placeholder="Enter adopter's user ID"
                  />
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
                      setAdopterId('');
                      setVerificationParams({
                        verified_adopter_identity: false,
                        verified_home_check: false,
                        verified_references: false,
                        verified_financial_stability: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitAcceptance} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Verify Adoption
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

