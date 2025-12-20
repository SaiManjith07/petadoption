import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Plus, X, CheckCircle, Search, Menu, Edit, Trash2, MapPin } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { shelterApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config/api';

export default function AdminShelterLocations() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingShelter, setApprovingShelter] = useState<any>(null);
  const [editingShelter, setEditingShelter] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationParams, setVerificationParams] = useState({
    verified_location: false,
    verified_capacity: false,
    verified_facilities: false,
    verified_contact: false,
    verified_identity: false,
    verified_documents: false,
  });
  const [approvalNotes, setApprovalNotes] = useState('');
  const [newShelter, setNewShelter] = useState({
    shelter_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    capacity: '',
    area_sqft: '',
    accepts_feeding_data: false,
    facilities: [] as string[],
    contact_phone: '',
    contact_email: '',
    description: '',
  });
  const [facilityInput, setFacilityInput] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadShelters();
  }, [isAdmin, navigate]);

  const loadShelters = async () => {
    try {
      setLoading(true);
      const data = await shelterApi.getAllShelters();
      setShelters(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load shelters',
        variant: 'destructive',
      });
      setShelters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShelter = async () => {
    if (!newShelter.shelter_name || !newShelter.address || !newShelter.city || !newShelter.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Address, City, Pincode)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const API_URL = API_BASE_URL;
      const accessToken = localStorage.getItem('accessToken');

      const shelterData = {
        shelter_name: newShelter.shelter_name,
        location: {
          address: newShelter.address,
          city: newShelter.city,
          state: newShelter.state,
          pincode: newShelter.pincode,
          latitude: newShelter.latitude ? parseFloat(newShelter.latitude) : null,
          longitude: newShelter.longitude ? parseFloat(newShelter.longitude) : null,
        },
        capacity: newShelter.capacity ? parseInt(newShelter.capacity) : null,
        total_capacity: newShelter.capacity ? parseInt(newShelter.capacity) : null,
        area_sqft: newShelter.area_sqft ? parseInt(newShelter.area_sqft) : null,
        accepts_feeding_data: newShelter.accepts_feeding_data,
        facilities: newShelter.facilities,
        contact_info: {
          phone: newShelter.contact_phone || '',
          email: newShelter.contact_email || '',
        },
        description: newShelter.description || '',
      };

      const response = await fetch(`${API_URL}/users/admin/shelters/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shelterData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create shelter' }));
        throw new Error(error.message || 'Failed to create shelter');
      }

      toast({
        title: 'Success',
        description: 'Shelter location created successfully',
      });
      setShowAddDialog(false);
      resetForm();
      loadShelters();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shelter',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditShelter = (shelter: any) => {
    setEditingShelter(shelter);
    setNewShelter({
      shelter_name: shelter.shelter_name || '',
      address: shelter.location?.address || shelter.address || '',
      city: shelter.location?.city || shelter.city || '',
      state: shelter.location?.state || shelter.state || '',
      pincode: shelter.location?.pincode || shelter.pincode || '',
      latitude: shelter.location?.latitude || shelter.latitude || '',
      longitude: shelter.location?.longitude || shelter.longitude || '',
      capacity: shelter.capacity || shelter.total_capacity || '',
      area_sqft: shelter.area_sqft || '',
      accepts_feeding_data: shelter.accepts_feeding_data || false,
      facilities: Array.isArray(shelter.facilities) ? shelter.facilities : [],
      contact_phone: shelter.contact_info?.phone || shelter.contact_phone || '',
      contact_email: shelter.contact_info?.email || shelter.contact_email || '',
      description: shelter.description || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateShelter = async () => {
    if (!editingShelter || !newShelter.shelter_name || !newShelter.address || !newShelter.city || !newShelter.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const shelterId = editingShelter.id || editingShelter._id;
      await shelterApi.updateShelter(shelterId, {
        shelter_name: newShelter.shelter_name,
        location: {
          address: newShelter.address,
          city: newShelter.city,
          state: newShelter.state,
          pincode: newShelter.pincode,
          latitude: newShelter.latitude ? parseFloat(newShelter.latitude) : null,
          longitude: newShelter.longitude ? parseFloat(newShelter.longitude) : null,
        },
        capacity: newShelter.capacity ? parseInt(newShelter.capacity) : null,
        area_sqft: newShelter.area_sqft ? parseInt(newShelter.area_sqft) : null,
        accepts_feeding_data: newShelter.accepts_feeding_data,
        facilities: newShelter.facilities,
        contact_info: {
          phone: newShelter.contact_phone || '',
          email: newShelter.contact_email || '',
        },
        description: newShelter.description || '',
      });

      toast({
        title: 'Success',
        description: 'Shelter location updated successfully',
      });
      setShowEditDialog(false);
      setEditingShelter(null);
      resetForm();
      loadShelters();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shelter',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveShelter = (shelter: any) => {
    setApprovingShelter(shelter);
    setVerificationParams({
      verified_location: false,
      verified_capacity: false,
      verified_facilities: false,
      verified_contact: false,
      verified_identity: false,
      verified_documents: false,
    });
    setApprovalNotes('');
    setShowApproveDialog(true);
  };

  const submitApproval = async () => {
    if (!approvingShelter) return;

    // Check if at least 2 parameters are verified
    const verifiedCount = Object.values(verificationParams).filter(Boolean).length;
    if (verifiedCount < 2) {
      toast({
        title: 'Error',
        description: 'Please verify at least 2 parameters before approving',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const API_URL = API_BASE_URL;
      const accessToken = localStorage.getItem('accessToken');
      const shelterId = approvingShelter.id || approvingShelter._id;

      // The endpoint is: /api/shelter-registrations/admin/shelters/<id>/verify/
      // because users.urls is included under 'shelter-registrations/'
      const response = await fetch(`${API_URL}/shelter-registrations/admin/shelters/${shelterId}/verify/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: true,
          notes: approvalNotes,
          verification_params: verificationParams,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to approve shelter' }));
        const errorMessage = errorData.message || errorData.error || 'Failed to approve shelter';
        console.error('Approval error:', errorData);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Shelter location approved successfully',
      });
      setShowApproveDialog(false);
      setApprovingShelter(null);
      setApprovalNotes('');
      setVerificationParams({
        verified_location: false,
        verified_capacity: false,
        verified_facilities: false,
        verified_contact: false,
        verified_identity: false,
        verified_documents: false,
      });
      loadShelters();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve shelter',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShelter = async (shelterId: string | number) => {
    if (!confirm('Are you sure you want to delete this shelter location?')) {
      return;
    }

    try {
      const API_URL = API_BASE_URL;
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/shelter-registrations/${shelterId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete shelter');
      }

      toast({
        title: 'Success',
        description: 'Shelter location deleted successfully',
      });
      loadShelters();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete shelter',
        variant: 'destructive',
      });
    }
  };

  const addFacility = () => {
    if (facilityInput.trim() && !newShelter.facilities.includes(facilityInput.trim())) {
      setNewShelter({
        ...newShelter,
        facilities: [...newShelter.facilities, facilityInput.trim()],
      });
      setFacilityInput('');
    }
  };

  const removeFacility = (facility: string) => {
    setNewShelter({
      ...newShelter,
      facilities: newShelter.facilities.filter((f) => f !== facility),
    });
  };

  const resetForm = () => {
    setNewShelter({
      shelter_name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      latitude: '',
      longitude: '',
      capacity: '',
      area_sqft: '',
      accepts_feeding_data: false,
      facilities: [],
      contact_phone: '',
      contact_email: '',
      description: '',
    });
    setFacilityInput('');
  };

  const filteredShelters = shelters.filter((shelter: any) => {
    const matchesSearch = !searchTerm ||
      (shelter.shelter_name || shelter.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shelter.location?.city || shelter.city)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shelter.location?.address || shelter.address)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shelter.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Determine status: pending if not verified, approved if verified
    const shelterStatus = shelter.status || (shelter.is_verified ? 'approved' : 'pending');
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'approved' && shelterStatus === 'approved') ||
      (statusFilter === 'pending' && shelterStatus === 'pending') ||
      (statusFilter === 'rejected' && shelterStatus === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-[#4CAF50] animate-pulse" />
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Shelter Locations...</p>
        </div>
      </div>
    );
  }

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
        <AdminTopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          onRefresh={loadShelters}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-8 w-8 text-[#4CAF50]" />
                  Shelter Locations Management
                </h1>
                <p className="text-gray-600 mt-1">Manage shelter locations for animals</p>
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[#2BB6AF] hover:bg-[#239a94] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Shelter Location
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, address, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shelters List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShelters.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shelter Locations</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No shelters match your search' 
                      : 'No shelter locations found. Click "Add Shelter Location" to create one.'}
                  </p>
                </div>
              ) : (
                filteredShelters.map((shelter: any) => (
                  <Card 
                    key={shelter.id || shelter._id} 
                    className={`hover:shadow-md transition-shadow ${
                      (shelter.status === 'pending' || !shelter.is_verified) 
                        ? 'border-yellow-300 border-2 bg-yellow-50/30' 
                        : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{shelter.shelter_name}</CardTitle>
                            <CardDescription>
                              {shelter.location?.city || shelter.city || 'N/A'}, {shelter.location?.state || shelter.state || ''}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            (shelter.status === 'pending' || !shelter.is_verified) ? 'default' :
                            (shelter.status === 'approved' || shelter.is_verified) ? 'default' :
                            'destructive'
                          }
                          className={
                            (shelter.status === 'pending' || !shelter.is_verified) ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            (shelter.status === 'approved' || shelter.is_verified) ? 'bg-[#E8F8EE] text-[#2BB6AF] border-[#2BB6AF]/30' :
                            'bg-red-100 text-red-700 border-red-300'
                          }
                        >
                          {shelter.status || (shelter.is_verified ? 'Approved' : 'Pending')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
                        <p className="text-sm text-gray-600">
                          {shelter.location?.address || shelter.address || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shelter.location?.pincode || shelter.pincode || ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Capacity</p>
                          <p className="text-sm text-gray-600">
                            {shelter.capacity || shelter.total_capacity || 'N/A'} animals
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Area</p>
                          <p className="text-sm text-gray-600">
                            {shelter.area_sqft || 'N/A'} sq ft
                          </p>
                        </div>
                      </div>
                      {shelter.facilities && shelter.facilities.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Facilities</p>
                          <div className="flex flex-wrap gap-1">
                            {shelter.facilities.slice(0, 3).map((facility: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {facility}
                              </Badge>
                            ))}
                            {shelter.facilities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{shelter.facilities.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {(shelter.status === 'pending' || !shelter.is_verified) && (
                          <Button
                            size="sm"
                            className="bg-[#2BB6AF] hover:bg-[#239a94] flex-1"
                            onClick={() => handleApproveShelter(shelter)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShelter(shelter)}
                          className={shelter.status === 'pending' ? 'flex-1' : 'flex-1'}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteShelter(shelter.id || shelter._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Shelter Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Shelter Location</DialogTitle>
            <DialogDescription>
              Create a new shelter location for animals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shelter-name">Shelter Name *</Label>
              <Input
                id="shelter-name"
                value={newShelter.shelter_name}
                onChange={(e) => setNewShelter({ ...newShelter, shelter_name: e.target.value })}
                placeholder="Shelter Name"
              />
            </div>
            <div>
              <Label htmlFor="shelter-address">Address *</Label>
              <Input
                id="shelter-address"
                value={newShelter.address}
                onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="shelter-city">City *</Label>
                <Input
                  id="shelter-city"
                  value={newShelter.city}
                  onChange={(e) => setNewShelter({ ...newShelter, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="shelter-state">State</Label>
                <Input
                  id="shelter-state"
                  value={newShelter.state}
                  onChange={(e) => setNewShelter({ ...newShelter, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="shelter-pincode">Pincode *</Label>
                <Input
                  id="shelter-pincode"
                  value={newShelter.pincode}
                  onChange={(e) => setNewShelter({ ...newShelter, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shelter-latitude">Latitude (Optional)</Label>
                <Input
                  id="shelter-latitude"
                  type="number"
                  step="any"
                  value={newShelter.latitude}
                  onChange={(e) => setNewShelter({ ...newShelter, latitude: e.target.value })}
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <Label htmlFor="shelter-longitude">Longitude (Optional)</Label>
                <Input
                  id="shelter-longitude"
                  type="number"
                  step="any"
                  value={newShelter.longitude}
                  onChange={(e) => setNewShelter({ ...newShelter, longitude: e.target.value })}
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shelter-capacity">Capacity (Optional)</Label>
                <Input
                  id="shelter-capacity"
                  type="number"
                  value={newShelter.capacity}
                  onChange={(e) => setNewShelter({ ...newShelter, capacity: e.target.value })}
                  placeholder="Number of animals"
                />
              </div>
              <div>
                <Label htmlFor="shelter-area">Area (sq ft) (Optional)</Label>
                <Input
                  id="shelter-area"
                  type="number"
                  value={newShelter.area_sqft}
                  onChange={(e) => setNewShelter({ ...newShelter, area_sqft: e.target.value })}
                  placeholder="Area in square feet"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shelter-phone">Contact Phone</Label>
                <Input
                  id="shelter-phone"
                  value={newShelter.contact_phone}
                  onChange={(e) => setNewShelter({ ...newShelter, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="shelter-email">Contact Email</Label>
                <Input
                  id="shelter-email"
                  type="email"
                  value={newShelter.contact_email}
                  onChange={(e) => setNewShelter({ ...newShelter, contact_email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shelter-facilities">Facilities</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="shelter-facilities"
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                  placeholder="Add facility (press Enter)"
                />
                <Button type="button" onClick={addFacility} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newShelter.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newShelter.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      {facility}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFacility(facility)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="accepts-feeding"
                checked={newShelter.accepts_feeding_data}
                onChange={(e) => setNewShelter({ ...newShelter, accepts_feeding_data: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="accepts-feeding" className="cursor-pointer">
                Accepts Feeding Data
              </Label>
            </div>
            <div>
              <Label htmlFor="shelter-description">Description</Label>
              <Textarea
                id="shelter-description"
                value={newShelter.description}
                onChange={(e) => setNewShelter({ ...newShelter, description: e.target.value })}
                placeholder="Additional details about this shelter"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddShelter}
                disabled={submitting}
                className="bg-[#2BB6AF] hover:bg-[#239a94]"
              >
                {submitting ? 'Creating...' : 'Create Shelter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shelter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shelter Location</DialogTitle>
            <DialogDescription>
              Update shelter location information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-shelter-name">Shelter Name *</Label>
              <Input
                id="edit-shelter-name"
                value={newShelter.shelter_name}
                onChange={(e) => setNewShelter({ ...newShelter, shelter_name: e.target.value })}
                placeholder="Shelter Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-shelter-address">Address *</Label>
              <Input
                id="edit-shelter-address"
                value={newShelter.address}
                onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-shelter-city">City *</Label>
                <Input
                  id="edit-shelter-city"
                  value={newShelter.city}
                  onChange={(e) => setNewShelter({ ...newShelter, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="edit-shelter-state">State</Label>
                <Input
                  id="edit-shelter-state"
                  value={newShelter.state}
                  onChange={(e) => setNewShelter({ ...newShelter, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="edit-shelter-pincode">Pincode *</Label>
                <Input
                  id="edit-shelter-pincode"
                  value={newShelter.pincode}
                  onChange={(e) => setNewShelter({ ...newShelter, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-shelter-latitude">Latitude (Optional)</Label>
                <Input
                  id="edit-shelter-latitude"
                  type="number"
                  step="any"
                  value={newShelter.latitude}
                  onChange={(e) => setNewShelter({ ...newShelter, latitude: e.target.value })}
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <Label htmlFor="edit-shelter-longitude">Longitude (Optional)</Label>
                <Input
                  id="edit-shelter-longitude"
                  type="number"
                  step="any"
                  value={newShelter.longitude}
                  onChange={(e) => setNewShelter({ ...newShelter, longitude: e.target.value })}
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-shelter-capacity">Capacity (Optional)</Label>
                <Input
                  id="edit-shelter-capacity"
                  type="number"
                  value={newShelter.capacity}
                  onChange={(e) => setNewShelter({ ...newShelter, capacity: e.target.value })}
                  placeholder="Number of animals"
                />
              </div>
              <div>
                <Label htmlFor="edit-shelter-area">Area (sq ft) (Optional)</Label>
                <Input
                  id="edit-shelter-area"
                  type="number"
                  value={newShelter.area_sqft}
                  onChange={(e) => setNewShelter({ ...newShelter, area_sqft: e.target.value })}
                  placeholder="Area in square feet"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-shelter-phone">Contact Phone</Label>
                <Input
                  id="edit-shelter-phone"
                  value={newShelter.contact_phone}
                  onChange={(e) => setNewShelter({ ...newShelter, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit-shelter-email">Contact Email</Label>
                <Input
                  id="edit-shelter-email"
                  type="email"
                  value={newShelter.contact_email}
                  onChange={(e) => setNewShelter({ ...newShelter, contact_email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-shelter-facilities">Facilities</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="edit-shelter-facilities"
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                  placeholder="Add facility (press Enter)"
                />
                <Button type="button" onClick={addFacility} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newShelter.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newShelter.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      {facility}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFacility(facility)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-accepts-feeding"
                checked={newShelter.accepts_feeding_data}
                onChange={(e) => setNewShelter({ ...newShelter, accepts_feeding_data: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-accepts-feeding" className="cursor-pointer">
                Accepts Feeding Data
              </Label>
            </div>
            <div>
              <Label htmlFor="edit-shelter-description">Description</Label>
              <Textarea
                id="edit-shelter-description"
                value={newShelter.description}
                onChange={(e) => setNewShelter({ ...newShelter, description: e.target.value })}
                placeholder="Additional details about this shelter"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingShelter(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateShelter}
                disabled={submitting}
                className="bg-[#2BB6AF] hover:bg-[#239a94]"
              >
                {submitting ? 'Updating...' : 'Update Shelter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Shelter Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve & Verify Shelter Location</DialogTitle>
            <DialogDescription>
              Verify at least 2 parameters before approving this shelter location
            </DialogDescription>
          </DialogHeader>
          {approvingShelter && (
            <div className="space-y-6 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Shelter Details</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {approvingShelter.shelter_name || 'N/A'}</p>
                  <p><span className="font-medium">Location:</span> {approvingShelter.location?.city || approvingShelter.city || 'N/A'}, {approvingShelter.location?.state || approvingShelter.state || ''}</p>
                  <p><span className="font-medium">Address:</span> {approvingShelter.location?.address || approvingShelter.address || 'N/A'}</p>
                  <p><span className="font-medium">Capacity:</span> {approvingShelter.capacity || approvingShelter.total_capacity || 'N/A'} animals</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Verification Parameters</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified_location"
                      checked={verificationParams.verified_location}
                      onCheckedChange={(checked) =>
                        setVerificationParams({ ...verificationParams, verified_location: !!checked })
                      }
                    />
                    <Label htmlFor="verified_location" className="cursor-pointer">
                      Location Verified (Address, city, and coordinates are accurate)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified_capacity"
                      checked={verificationParams.verified_capacity}
                      onCheckedChange={(checked) =>
                        setVerificationParams({ ...verificationParams, verified_capacity: !!checked })
                      }
                    />
                    <Label htmlFor="verified_capacity" className="cursor-pointer">
                      Capacity Verified (Capacity and area information is accurate)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified_facilities"
                      checked={verificationParams.verified_facilities}
                      onCheckedChange={(checked) =>
                        setVerificationParams({ ...verificationParams, verified_facilities: !!checked })
                      }
                    />
                    <Label htmlFor="verified_facilities" className="cursor-pointer">
                      Facilities Verified (Facilities and amenities are as described)
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
                      Contact Verified (Contact information is valid and reachable)
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
                      Identity Verified (Shelter owner identity is confirmed)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified_documents"
                      checked={verificationParams.verified_documents}
                      onCheckedChange={(checked) =>
                        setVerificationParams({ ...verificationParams, verified_documents: !!checked })
                      }
                    />
                    <Label htmlFor="verified_documents" className="cursor-pointer">
                      Documents Verified (Required documents and licenses are verified)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any additional notes about this approval..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveDialog(false);
                    setApprovingShelter(null);
                    setApprovalNotes('');
                    setVerificationParams({
                      verified_location: false,
                      verified_capacity: false,
                      verified_facilities: false,
                      verified_contact: false,
                      verified_identity: false,
                      verified_documents: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitApproval}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Verify
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

