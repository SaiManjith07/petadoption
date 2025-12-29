import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Plus, Edit, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { healthApi } from '@/api/healthApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VaccinationCamp {
  id?: number;
  location: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  date: string;
  start_time: string;
  end_time: string;
  ngo: string;
  ngo_contact?: string;
  ngo_email?: string;
  description?: string;
  registration_link?: string;
  max_capacity: number;
  current_registrations?: number;
  is_active: boolean;
  created_at?: string;
}

export default function AdminMedicalRecords() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [camps, setCamps] = useState<VaccinationCamp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCamp, setEditingCamp] = useState<VaccinationCamp | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<VaccinationCamp>>({
    is_active: true,
    max_capacity: 100,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Pass upcoming: false to fetch ALL camps
      const campsData = await healthApi.getCamps({ upcoming: false });
      setCamps(Array.isArray(campsData) ? campsData : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load vaccination camps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      is_active: true,
      max_capacity: 100,
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
    });
    setEditingCamp(null);
    setShowAddDialog(true);
  };

  const handleEdit = (camp: VaccinationCamp) => {
    setFormData({
      ...camp,
      // Ensure time format is HH:MM
      start_time: camp.start_time.substring(0, 5),
      end_time: camp.end_time.substring(0, 5),
    });
    setEditingCamp(camp);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this camp?')) {
      return;
    }

    try {
      await healthApi.deleteCamp(id);
      toast({
        title: 'Success',
        description: 'Camp deleted successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete camp',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.location || !formData.date || !formData.address || !formData.ngo) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingCamp?.id) {
        await healthApi.updateCamp(editingCamp.id, formData);
        toast({
          title: 'Success',
          description: 'Camp updated successfully',
        });
        setShowEditDialog(false);
      } else {
        await healthApi.createCamp(formData);
        toast({
          title: 'Success',
          description: 'Camp created successfully',
        });
        setShowAddDialog(false);
      }
      setEditingCamp(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save camp',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      is_active: true,
      max_capacity: 100,
    });
    setEditingCamp(null);
  };

  const filteredCamps = camps.filter((camp) => {
    const matchesSearch = !searchTerm ||
      camp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.ngo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const CampForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location Name *</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Community Hall, Park"
          />
        </div>
        <div>
          <Label htmlFor="ngo">Organizer (NGO) *</Label>
          <Input
            id="ngo"
            value={formData.ngo || ''}
            onChange={(e) => setFormData({ ...formData, ngo: e.target.value })}
            placeholder="e.g., Animal Welfare Society"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address of the camp"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state || ''}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="State"
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={formData.pincode || ''}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="Pincode"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time || ''}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time || ''}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ngo_contact">Contact Phone</Label>
          <Input
            id="ngo_contact"
            value={formData.ngo_contact || ''}
            onChange={(e) => setFormData({ ...formData, ngo_contact: e.target.value })}
            placeholder="Organizer Phone"
          />
        </div>
        <div>
          <Label htmlFor="ngo_email">Contact Email</Label>
          <Input
            id="ngo_email"
            type="email"
            value={formData.ngo_email || ''}
            onChange={(e) => setFormData({ ...formData, ngo_email: e.target.value })}
            placeholder="Organizer Email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_capacity">Max Capacity</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity || ''}
            onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
            placeholder="100"
          />
        </div>
        <div>
          <Label htmlFor="registration_link">Registration Link (Optional)</Label>
          <Input
            id="registration_link"
            type="url"
            value={formData.registration_link || ''}
            onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
            placeholder="External registration URL"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Details about the camp..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active || false}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active Camp (Visible to users)
        </Label>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setShowEditDialog(false);
            } else {
              setShowAddDialog(false);
            }
            resetForm();
          }}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#2BB6AF] hover:bg-[#239a94]"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Camp' : 'Create Camp'}
        </Button>
      </div>
    </div>
  );

  return (
    <AdminLayout onRefresh={loadData} isRefreshing={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-[#4CAF50]" />
              Medical Camps
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage vaccination and health checkup camps</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto bg-[#2BB6AF] hover:bg-[#239a94] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Camp
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
                    placeholder="Search by location, city or NGO..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camps Table */}
        {loading && camps.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center">
              <Stethoscope className="h-16 w-16 mx-auto text-[#4CAF50] animate-pulse" />
              <p className="mt-6 text-lg font-medium text-gray-700">Loading Camps...</p>
            </div>
          </div>
        ) : filteredCamps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camps Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'No camps match your search'
                  : 'No medical camps have been created yet.'}
              </p>
              <Button onClick={handleAddNew} className="bg-[#2BB6AF] hover:bg-[#239a94]">
                <Plus className="h-4 w-4 mr-2" />
                Add First Camp
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Medical Camps ({filteredCamps.length})</CardTitle>
              <CardDescription>
                Upcoming and past vaccination camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCamps.map((camp) => (
                      <TableRow key={camp.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{camp.location}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{camp.address}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(camp.date), 'MMM dd, yyyy')}</span>
                            <span className="text-xs text-gray-500">{camp.start_time.substring(0, 5)} - {camp.end_time.substring(0, 5)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{camp.ngo}</p>
                            {camp.ngo_contact && <p className="text-xs text-gray-500">{camp.ngo_contact}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{camp.city || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>Cap: {camp.max_capacity}</p>
                            <p>Reg: {camp.current_registrations || 0}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {camp.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(camp)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => camp.id && handleDelete(camp.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Camp Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#4CAF50]" />
              Add Medical Camp
            </DialogTitle>
            <DialogDescription>
              Create a new vaccination or health checkup camp
            </DialogDescription>
          </DialogHeader>
          <CampForm isEdit={false} />
        </DialogContent>
      </Dialog>

      {/* Edit Camp Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#4CAF50]" />
              Edit Medical Camp
            </DialogTitle>
            <DialogDescription>
              Update information for this medical camp
            </DialogDescription>
          </DialogHeader>
          <CampForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
