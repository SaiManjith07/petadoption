import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X, AlertCircle, Search, Home, ArrowLeft, Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const loadAdoptionRequests = async () => {
    try {
      setLoading(true);
      const requests = await adminApi.getPendingAdoptionRequests();
      setAdoptionRequests(requests);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load adoption requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      setAdoptionRequests(adoptionRequests.filter(r => r._id !== acceptingId));
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
      loadAdoptionRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept adoption request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading Adoption Requests...</p>
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
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                  <Home className="h-8 w-8 text-[#4CAF50]" />
                  Adoption Requests Management
                </h1>
                <p className="text-gray-600 mt-1">Verify and approve adoption requests</p>
              </div>
              <Badge variant="default" className="text-base px-3 py-1 bg-[#4CAF50]">
                {filteredRequests.length} Adoption Request{filteredRequests.length !== 1 ? 's' : ''}
              </Badge>
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
                  variant={statusFilter === 'Pending Adoption' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Pending Adoption')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'Available for Adoption' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Available for Adoption')}
                >
                  Available
                </Button>
                <Button
                  variant={statusFilter === 'Adopted' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Adopted')}
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
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No adoption requests found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request: any) => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Pet Images */}
                    {request.photos && request.photos.length > 0 && (
                      <div className="flex gap-2">
                        {request.photos.slice(0, 3).map((photo: any, idx: number) => (
                          <img
                            key={idx}
                            src={photo.url}
                            alt={`Pet ${idx + 1}`}
                            className="h-32 w-32 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* Pet Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">ADOPTION</Badge>
                            <Badge variant={request.status === 'Pending Adoption' ? 'destructive' : 'default'}>
                              {request.status}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold">
                            {request.species} - {request.breed || 'Mixed Breed'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            <strong>Color:</strong> {request.color_primary} {request.color_secondary && `& ${request.color_secondary}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Description:</strong>
                          <p className="text-muted-foreground">{request.distinguishing_marks}</p>
                        </div>
                        <div>
                          <strong>Location:</strong>
                          <p className="text-muted-foreground">{request.last_seen_or_found_location_text || 'N/A'}</p>
                        </div>
                        <div>
                          <strong>Requested by:</strong>
                          <p className="text-muted-foreground">
                            {request.submitted_by?.name} ({request.submitted_by?.email})
                          </p>
                        </div>
                        <div>
                          <strong>Contact Preference:</strong>
                          <p className="text-muted-foreground">{request.contact_preference || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === 'Pending Adoption' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 gap-1"
                            onClick={() => handleAccept(request._id)}
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
          </div>
        </main>
      </div>
    </div>
  );
}

