import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Plus, Eye, Edit, Trash2, Calendar, Activity, Heart, Syringe } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { petsApi, adminApi } from '@/api';
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

interface MedicalRecord {
  id?: number;
  pet_id: number;
  pet?: any;
  health_status: string;
  weight?: number;
  temperature?: number;
  vaccination_status: string;
  last_vaccination_date?: string;
  next_vaccination_due?: string;
  vaccination_notes?: string;
  medical_history?: string;
  current_medications?: string;
  allergies?: string;
  chronic_conditions?: string;
  veterinarian_name?: string;
  veterinarian_contact?: string;
  clinic_name?: string;
  is_spayed_neutered: boolean;
  spay_neuter_date?: string;
  notes?: string;
  last_checkup_date?: string;
  next_checkup_due?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminMedicalRecords() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [petFilter, setPetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    health_status: 'Healthy',
    vaccination_status: 'Unknown',
    is_spayed_neutered: false,
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
      const [recordsData, petsData] = await Promise.all([
        petsApi.medicalRecords.getAll(),
        adminApi.getAllPets(),
      ]);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setPets(Array.isArray(petsData) ? petsData : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load medical records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      health_status: 'Healthy',
      vaccination_status: 'Unknown',
      is_spayed_neutered: false,
    });
    setEditingRecord(null);
    setShowAddDialog(true);
  };

  const handleEdit = (record: MedicalRecord) => {
    setFormData(record);
    setEditingRecord(record);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medical record?')) {
      return;
    }

    try {
      await petsApi.medicalRecords.delete(id);
      toast({
        title: 'Success',
        description: 'Medical record deleted successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete medical record',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.pet_id) {
      toast({
        title: 'Error',
        description: 'Please select a pet',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingRecord?.id) {
        await petsApi.medicalRecords.update(editingRecord.id, formData);
        toast({
          title: 'Success',
          description: 'Medical record updated successfully',
        });
        setShowEditDialog(false);
      } else {
        await petsApi.medicalRecords.create(formData);
        toast({
          title: 'Success',
          description: 'Medical record created successfully',
        });
        setShowAddDialog(false);
      }
      setEditingRecord(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save medical record',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      health_status: 'Healthy',
      vaccination_status: 'Unknown',
      is_spayed_neutered: false,
    });
    setEditingRecord(null);
  };

  const filteredRecords = records.filter((record) => {
    const pet = pets.find((p) => p.id === record.pet_id || p._id === record.pet_id);
    const petName = pet?.name || record.pet?.name || '';
    
    const matchesSearch = !searchTerm ||
      petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.health_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vaccination_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.veterinarian_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPet = petFilter === 'all' || record.pet_id.toString() === petFilter;
    const matchesStatus = statusFilter === 'all' || record.health_status === statusFilter;
    
    return matchesSearch && matchesPet && matchesStatus;
  });

  const MedicalRecordForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6 mt-4">
      <div>
        <Label htmlFor="pet_id">Select Pet *</Label>
        <select
          id="pet_id"
          value={formData.pet_id || ''}
          onChange={(e) => setFormData({ ...formData, pet_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isEdit}
        >
          <option value="">Select a pet...</option>
          {pets.map((pet) => (
            <option key={pet.id || pet._id} value={pet.id || pet._id}>
              {pet.name || 'Unnamed'} - {pet.breed || 'Unknown'} ({pet.adoption_status || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="health_status">Health Status *</Label>
          <select
            id="health_status"
            value={formData.health_status || 'Healthy'}
            onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="Healthy">Healthy</option>
            <option value="Under Treatment">Under Treatment</option>
            <option value="Recovering">Recovering</option>
            <option value="Chronic Condition">Chronic Condition</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <Label htmlFor="vaccination_status">Vaccination Status *</Label>
          <select
            id="vaccination_status"
            value={formData.vaccination_status || 'Unknown'}
            onChange={(e) => setFormData({ ...formData, vaccination_status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="Up to Date">Up to Date</option>
            <option value="Partially Vaccinated">Partially Vaccinated</option>
            <option value="Not Vaccinated">Not Vaccinated</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={formData.weight || ''}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
            placeholder="e.g., 5.5"
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temperature (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            value={formData.temperature || ''}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || undefined })}
            placeholder="e.g., 38.5"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_spayed_neutered"
            checked={formData.is_spayed_neutered || false}
            onChange={(e) => setFormData({ ...formData, is_spayed_neutered: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="is_spayed_neutered" className="cursor-pointer">
            Spayed/Neutered
          </Label>
        </div>
      </div>

      {formData.is_spayed_neutered && (
        <div>
          <Label htmlFor="spay_neuter_date">Spay/Neuter Date</Label>
          <Input
            id="spay_neuter_date"
            type="date"
            value={formData.spay_neuter_date || ''}
            onChange={(e) => setFormData({ ...formData, spay_neuter_date: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="last_vaccination_date">Last Vaccination Date</Label>
          <Input
            id="last_vaccination_date"
            type="date"
            value={formData.last_vaccination_date || ''}
            onChange={(e) => setFormData({ ...formData, last_vaccination_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="next_vaccination_due">Next Vaccination Due</Label>
          <Input
            id="next_vaccination_due"
            type="date"
            value={formData.next_vaccination_due || ''}
            onChange={(e) => setFormData({ ...formData, next_vaccination_due: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="vaccination_notes">Vaccination Notes</Label>
        <Textarea
          id="vaccination_notes"
          value={formData.vaccination_notes || ''}
          onChange={(e) => setFormData({ ...formData, vaccination_notes: e.target.value })}
          placeholder="Details about vaccinations..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="medical_history">Medical History</Label>
        <Textarea
          id="medical_history"
          value={formData.medical_history || ''}
          onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
          placeholder="Previous medical conditions and treatments..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="current_medications">Current Medications</Label>
        <Textarea
          id="current_medications"
          value={formData.current_medications || ''}
          onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
          placeholder="Current medications and dosages..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            value={formData.allergies || ''}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="Known allergies..."
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
          <Textarea
            id="chronic_conditions"
            value={formData.chronic_conditions || ''}
            onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
            placeholder="Chronic health conditions..."
            rows={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="veterinarian_name">Veterinarian Name</Label>
          <Input
            id="veterinarian_name"
            value={formData.veterinarian_name || ''}
            onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
            placeholder="Dr. Name"
          />
        </div>
        <div>
          <Label htmlFor="veterinarian_contact">Veterinarian Contact</Label>
          <Input
            id="veterinarian_contact"
            value={formData.veterinarian_contact || ''}
            onChange={(e) => setFormData({ ...formData, veterinarian_contact: e.target.value })}
            placeholder="Phone or email"
          />
        </div>
        <div>
          <Label htmlFor="clinic_name">Clinic Name</Label>
          <Input
            id="clinic_name"
            value={formData.clinic_name || ''}
            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
            placeholder="Clinic/Vet Hospital"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="last_checkup_date">Last Checkup Date</Label>
          <Input
            id="last_checkup_date"
            type="date"
            value={formData.last_checkup_date || ''}
            onChange={(e) => setFormData({ ...formData, last_checkup_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="next_checkup_due">Next Checkup Due</Label>
          <Input
            id="next_checkup_due"
            type="date"
            value={formData.next_checkup_due || ''}
            onChange={(e) => setFormData({ ...formData, next_checkup_due: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional medical notes..."
          rows={3}
        />
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
          className="bg-[#4CAF50] hover:bg-[#2E7D32]"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
        </Button>
      </div>
    </div>
  );

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Stethoscope className="h-16 w-16 mx-auto text-[#4CAF50] animate-pulse" />
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Medical Records...</p>
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
          onRefresh={loadData}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Stethoscope className="h-8 w-8 text-[#4CAF50]" />
                  Medical Records Management
                </h1>
                <p className="text-gray-600 mt-1">Register and manage medical information for pets</p>
              </div>
              <Button
                onClick={handleAddNew}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Record
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
                        placeholder="Search by pet name, health status, or veterinarian..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={petFilter}
                      onChange={(e) => setPetFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Pets</option>
                      {pets.map((pet) => (
                        <option key={pet.id || pet._id} value={pet.id || pet._id}>
                          {pet.name || 'Unnamed'}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="Healthy">Healthy</option>
                      <option value="Under Treatment">Under Treatment</option>
                      <option value="Recovering">Recovering</option>
                      <option value="Chronic Condition">Chronic Condition</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Records Table */}
            {filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Stethoscope className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Records</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || petFilter !== 'all' || statusFilter !== 'all'
                      ? 'No medical records match your search'
                      : 'No medical records have been registered yet.'}
                  </p>
                  <Button onClick={handleAddNew} className="bg-[#4CAF50] hover:bg-[#2E7D32]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Medical Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records ({filteredRecords.length})</CardTitle>
                  <CardDescription>
                    All registered medical records for pets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pet Name</TableHead>
                          <TableHead>Health Status</TableHead>
                          <TableHead>Vaccination</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Veterinarian</TableHead>
                          <TableHead>Last Checkup</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record) => {
                          const pet = pets.find((p) => p.id === record.pet_id || p._id === record.pet_id);
                          const petName = pet?.name || record.pet?.name || 'Unknown';
                          
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <p className="font-semibold">{petName}</p>
                                  {pet && (
                                    <p className="text-xs text-gray-500">{pet.breed || 'Unknown breed'}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    record.health_status === 'Healthy' ? 'default' :
                                    record.health_status === 'Critical' ? 'destructive' : 'secondary'
                                  }
                                  className={
                                    record.health_status === 'Healthy' ? 'bg-green-100 text-green-700' :
                                    record.health_status === 'Critical' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }
                                >
                                  {record.health_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Syringe className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{record.vaccination_status}</span>
                                </div>
                                {record.next_vaccination_due && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Due: {format(new Date(record.next_vaccination_due), 'MMM dd, yyyy')}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.weight ? `${record.weight} kg` : 'N/A'}
                                {record.temperature && (
                                  <p className="text-xs text-gray-500">{record.temperature}°C</p>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.veterinarian_name ? (
                                  <div>
                                    <p className="text-sm">{record.veterinarian_name}</p>
                                    {record.clinic_name && (
                                      <p className="text-xs text-gray-500">{record.clinic_name}</p>
                                    )}
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {record.last_checkup_date ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm">
                                      {format(new Date(record.last_checkup_date), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                                {record.next_checkup_due && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Next: {format(new Date(record.next_checkup_due), 'MMM dd')}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.created_at ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm">
                                      {format(new Date(record.created_at), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/pets/${record.pet_id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => record.id && handleDelete(record.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Add Medical Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#4CAF50]" />
              Add Medical Record
            </DialogTitle>
            <DialogDescription>
              Register medical information for a pet
            </DialogDescription>
          </DialogHeader>
          <MedicalRecordForm isEdit={false} />
        </DialogContent>
      </Dialog>

      {/* Edit Medical Record Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#4CAF50]" />
              Edit Medical Record
            </DialogTitle>
            <DialogDescription>
              Update medical information for this pet
            </DialogDescription>
          </DialogHeader>
          <MedicalRecordForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

