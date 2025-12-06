import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Plus, X, CheckCircle, Search, Menu, Edit, Trash2, UtensilsCrossed, Clock } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { feedingPointAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function AdminFeedingPoints() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [feedingPoints, setFeedingPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPoint, setEditingPoint] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newPoint, setNewPoint] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    type: 'both',
    description: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadFeedingPoints();
  }, [isAdmin, navigate]);

  const loadFeedingPoints = async () => {
    try {
      setLoading(true);
      // Admin should see all feeding points, not just active ones
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/feeding-points/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load feeding points');
      }
      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      setFeedingPoints(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load feeding points',
        variant: 'destructive',
      });
      setFeedingPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = async () => {
    if (!newPoint.name || !newPoint.address || !newPoint.city || !newPoint.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Address, City, Pincode)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const pointData = {
        name: newPoint.name,
        location: {
          address: newPoint.address,
          city: newPoint.city,
          state: newPoint.state,
          pincode: newPoint.pincode,
          latitude: newPoint.latitude ? parseFloat(newPoint.latitude) : null,
          longitude: newPoint.longitude ? parseFloat(newPoint.longitude) : null,
        },
        type: newPoint.type,
        description: newPoint.description || `Type: ${newPoint.type}`,
        contact_phone: newPoint.contact_phone || '',
        contact_email: newPoint.contact_email || '',
      };

      await feedingPointAPI.create(pointData);
      toast({
        title: 'Success',
        description: 'Feeding point created successfully',
      });
      setShowAddDialog(false);
      resetForm();
      loadFeedingPoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create feeding point',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPoint = (point: any) => {
    setEditingPoint(point);
    setNewPoint({
      name: point.name || '',
      address: point.address || point.location?.address || '',
      city: point.city || point.location?.city || '',
      state: point.state || point.location?.state || '',
      pincode: point.pincode || point.location?.pincode || '',
      latitude: point.latitude || point.location?.coordinates?.lat || '',
      longitude: point.longitude || point.location?.coordinates?.lng || '',
      type: point.type || 'both',
      description: point.description || '',
      contact_phone: point.contact_phone || '',
      contact_email: point.contact_email || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdatePoint = async () => {
    if (!editingPoint || !newPoint.name || !newPoint.address || !newPoint.city || !newPoint.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const accessToken = localStorage.getItem('accessToken');
      const pointId = editingPoint.id || editingPoint._id;

      const pointData = {
        name: newPoint.name,
        address: newPoint.address,
        city: newPoint.city,
        state: newPoint.state,
        pincode: newPoint.pincode,
        latitude: newPoint.latitude ? parseFloat(newPoint.latitude) : null,
        longitude: newPoint.longitude ? parseFloat(newPoint.longitude) : null,
        type: newPoint.type,
        description: newPoint.description || `Type: ${newPoint.type}`,
        contact_phone: newPoint.contact_phone || '',
        contact_email: newPoint.contact_email || '',
      };

      const response = await fetch(`${API_URL}/feeding-points/${pointId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pointData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update feeding point' }));
        throw new Error(error.message || 'Failed to update feeding point');
      }

      toast({
        title: 'Success',
        description: 'Feeding point updated successfully',
      });
      setShowEditDialog(false);
      setEditingPoint(null);
      resetForm();
      loadFeedingPoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update feeding point',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePoint = async (pointId: string | number) => {
    if (!confirm('Are you sure you want to delete this feeding point?')) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/feeding-points/${pointId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete feeding point');
      }

      toast({
        title: 'Success',
        description: 'Feeding point deleted successfully',
      });
      loadFeedingPoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete feeding point',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewPoint({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      latitude: '',
      longitude: '',
      type: 'both',
      description: '',
      contact_phone: '',
      contact_email: '',
    });
  };

  const handleApproveFeedingPoint = async (pointId: string | number) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/feeding-points/${pointId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve feeding point');
      }

      toast({
        title: 'Success',
        description: 'Feeding point approved successfully',
      });
      loadFeedingPoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve feeding point',
        variant: 'destructive',
      });
    }
  };

  const handleRejectFeedingPoint = async (pointId: string | number) => {
    if (!confirm('Are you sure you want to reject this feeding point? It will be deleted.')) {
      return;
    }

    try {
      await handleDeletePoint(pointId);
      toast({
        title: 'Success',
        description: 'Feeding point rejected and deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject feeding point',
        variant: 'destructive',
      });
    }
  };

  const filteredPoints = feedingPoints.filter((point: any) => {
    const matchesSearch = !searchTerm ||
      point.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && point.is_active) ||
      (statusFilter === 'inactive' && !point.is_active) ||
      (statusFilter === 'pending' && !point.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-[#4CAF50] animate-pulse" />
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Feeding Points...</p>
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
          onRefresh={loadFeedingPoints}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed className="h-8 w-8 text-[#4CAF50]" />
                  Feeding Points Management
                </h1>
                <p className="text-gray-600 mt-1">Manage feeding points for animals</p>
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feeding Point
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
                      <option value="pending">Pending Approval</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feeding Points List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPoints.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feeding Points</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No feeding points match your search' 
                      : 'No feeding points found. Click "Add Feeding Point" to create one.'}
                  </p>
                </div>
              ) : (
                filteredPoints.map((point: any) => (
                  <Card key={point.id || point._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-[#E8F8EE] flex items-center justify-center">
                            <UtensilsCrossed className="h-6 w-6 text-[#4CAF50]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{point.name}</CardTitle>
                            <CardDescription>
                              {point.location?.city || point.city || 'N/A'}, {point.location?.state || point.state || ''}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={point.is_active ? 'default' : 'destructive'}
                          className={
                            point.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {point.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
                        <p className="text-sm text-gray-600">
                          {point.location?.address || point.address || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {point.location?.pincode || point.pincode || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Type</p>
                        <Badge variant="outline">{point.type || 'both'}</Badge>
                      </div>
                      {point.contact_phone && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Contact</p>
                          <p className="text-sm text-gray-600">{point.contact_phone}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {!point.is_active && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApproveFeedingPoint(point.id || point._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectFeedingPoint(point.id || point._id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {point.is_active && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPoint(point)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePoint(point.id || point._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Feeding Point Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Feeding Point</DialogTitle>
            <DialogDescription>
              Create a new feeding point location for animals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                  placeholder="Feeding Point Name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={newPoint.type}
                  onChange={(e) => setNewPoint({ ...newPoint, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="both">Both (Food & Water)</option>
                  <option value="food">Food Only</option>
                  <option value="water">Water Only</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={newPoint.address}
                onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newPoint.city}
                  onChange={(e) => setNewPoint({ ...newPoint, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newPoint.state}
                  onChange={(e) => setNewPoint({ ...newPoint, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={newPoint.pincode}
                  onChange={(e) => setNewPoint({ ...newPoint, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={newPoint.latitude}
                  onChange={(e) => setNewPoint({ ...newPoint, latitude: e.target.value })}
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={newPoint.longitude}
                  onChange={(e) => setNewPoint({ ...newPoint, longitude: e.target.value })}
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={newPoint.contact_phone}
                  onChange={(e) => setNewPoint({ ...newPoint, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newPoint.contact_email}
                  onChange={(e) => setNewPoint({ ...newPoint, contact_email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newPoint.description}
                onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                placeholder="Additional details about this feeding point"
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
                onClick={handleAddPoint}
                disabled={submitting}
                className="bg-[#4CAF50] hover:bg-[#2E7D32]"
              >
                {submitting ? 'Creating...' : 'Create Feeding Point'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Feeding Point Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feeding Point</DialogTitle>
            <DialogDescription>
              Update feeding point information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                  placeholder="Feeding Point Name"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  value={newPoint.type}
                  onChange={(e) => setNewPoint({ ...newPoint, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="both">Both (Food & Water)</option>
                  <option value="food">Food Only</option>
                  <option value="water">Water Only</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={newPoint.address}
                onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  value={newPoint.city}
                  onChange={(e) => setNewPoint({ ...newPoint, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={newPoint.state}
                  onChange={(e) => setNewPoint({ ...newPoint, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="edit-pincode">Pincode *</Label>
                <Input
                  id="edit-pincode"
                  value={newPoint.pincode}
                  onChange={(e) => setNewPoint({ ...newPoint, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude (Optional)</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={newPoint.latitude}
                  onChange={(e) => setNewPoint({ ...newPoint, latitude: e.target.value })}
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude (Optional)</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={newPoint.longitude}
                  onChange={(e) => setNewPoint({ ...newPoint, longitude: e.target.value })}
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contact_phone">Contact Phone</Label>
                <Input
                  id="edit-contact_phone"
                  value={newPoint.contact_phone}
                  onChange={(e) => setNewPoint({ ...newPoint, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit-contact_email">Contact Email</Label>
                <Input
                  id="edit-contact_email"
                  type="email"
                  value={newPoint.contact_email}
                  onChange={(e) => setNewPoint({ ...newPoint, contact_email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newPoint.description}
                onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                placeholder="Additional details about this feeding point"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingPoint(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePoint}
                disabled={submitting}
                className="bg-[#4CAF50] hover:bg-[#2E7D32]"
              >
                {submitting ? 'Updating...' : 'Update Feeding Point'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

