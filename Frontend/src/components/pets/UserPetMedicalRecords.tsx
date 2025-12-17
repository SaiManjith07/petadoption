import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Stethoscope, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { petsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MedicalRecord {
  id?: number;
  pet_id?: number;
  health_status?: string;
  weight?: number;
  temperature?: number;
  vaccination_status?: string;
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
  is_spayed_neutered?: boolean;
  spay_neuter_date?: string;
  notes?: string;
  last_checkup_date?: string;
  next_checkup_due?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserPetMedicalRecordsProps {
  petId: number;
  petName?: string;
}

export function UserPetMedicalRecords({ petId, petName }: UserPetMedicalRecordsProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    health_status: 'Healthy',
    vaccination_status: 'Unknown',
    is_spayed_neutered: false,
  });

  useEffect(() => {
    loadRecords();
  }, [petId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await petsApi.medicalRecords.getByPetId(petId);
      const recordsArray = Array.isArray(data) ? data : (data?.data || []);
      setRecords(recordsArray);
    } catch (error: any) {
      console.error('Error loading medical records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record?: MedicalRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        ...record,
        last_vaccination_date: record.last_vaccination_date?.split('T')[0],
        next_vaccination_due: record.next_vaccination_due?.split('T')[0],
        spay_neuter_date: record.spay_neuter_date?.split('T')[0],
        last_checkup_date: record.last_checkup_date?.split('T')[0],
        next_checkup_due: record.next_checkup_due?.split('T')[0],
      });
    } else {
      setEditingRecord(null);
      setFormData({
        pet_id: petId,
        health_status: 'Healthy',
        vaccination_status: 'Unknown',
        is_spayed_neutered: false,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRecord(null);
    setFormData({
      health_status: 'Healthy',
      vaccination_status: 'Unknown',
      is_spayed_neutered: false,
    });
  };

  const handleSave = async () => {
    try {
      if (editingRecord?.id) {
        await petsApi.medicalRecords.update(editingRecord.id, formData);
        toast({
          title: 'Success',
          description: 'Medical record updated successfully',
        });
      } else {
        await petsApi.medicalRecords.create({
          ...formData,
          pet_id: petId,
        });
        toast({
          title: 'Success',
          description: 'Medical record created successfully',
        });
      }
      handleCloseDialog();
      loadRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save medical record',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medical record?')) return;
    
    try {
      await petsApi.medicalRecords.delete(id);
      toast({
        title: 'Success',
        description: 'Medical record deleted successfully',
      });
      loadRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete medical record',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#2BB6AF]" />
            Medical Records
          </CardTitle>
          <CardDescription>Manage medical information for {petName || 'your pet'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2BB6AF] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading records...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#2BB6AF]" />
                Medical Records
              </CardTitle>
              <CardDescription>Manage medical information for {petName || 'your pet'}</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No medical records yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first medical record to track your pet's health</p>
              <Button
                onClick={() => handleOpenDialog()}
                size="sm"
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add First Record
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#2BB6AF]/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            record.health_status === 'Healthy'
                              ? 'default'
                              : record.health_status === 'Under Treatment'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {record.health_status || 'Unknown'}
                        </Badge>
                        <Badge variant="outline">
                          {record.vaccination_status || 'Unknown'}
                        </Badge>
                        {record.created_at && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(record.created_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-700 mb-2">{record.notes}</p>
                      )}
                      {record.veterinarian_name && (
                        <p className="text-xs text-gray-600">
                          Vet: {record.veterinarian_name}
                          {record.clinic_name && ` - ${record.clinic_name}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => record.id && handleDelete(record.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Medical Record Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Medical Record' : 'Add Medical Record'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'Update medical information for your pet'
                : 'Add medical information for your pet'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="health_status">Health Status *</Label>
                <Select
                  value={formData.health_status || 'Healthy'}
                  onValueChange={(value) => setFormData({ ...formData, health_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Under Treatment">Under Treatment</SelectItem>
                    <SelectItem value="Recovering">Recovering</SelectItem>
                    <SelectItem value="Chronic Condition">Chronic Condition</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vaccination_status">Vaccination Status *</Label>
                <Select
                  value={formData.vaccination_status || 'Unknown'}
                  onValueChange={(value) => setFormData({ ...formData, vaccination_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Up to Date">Up to Date</SelectItem>
                    <SelectItem value="Partially Vaccinated">Partially Vaccinated</SelectItem>
                    <SelectItem value="Not Vaccinated">Not Vaccinated</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature || ''}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_vaccination_date">Last Vaccination Date</Label>
                <Input
                  id="last_vaccination_date"
                  type="date"
                  value={formData.last_vaccination_date || ''}
                  onChange={(e) => setFormData({ ...formData, last_vaccination_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_vaccination_due">Next Vaccination Due</Label>
                <Input
                  id="next_vaccination_due"
                  type="date"
                  value={formData.next_vaccination_due || ''}
                  onChange={(e) => setFormData({ ...formData, next_vaccination_due: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccination_notes">Vaccination Notes</Label>
              <Textarea
                id="vaccination_notes"
                rows={3}
                value={formData.vaccination_notes || ''}
                onChange={(e) => setFormData({ ...formData, vaccination_notes: e.target.value })}
                placeholder="Details about vaccinations..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                rows={3}
                value={formData.medical_history || ''}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="Previous medical conditions and treatments..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_medications">Current Medications</Label>
              <Textarea
                id="current_medications"
                rows={2}
                value={formData.current_medications || ''}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                placeholder="Current medications and dosages..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={formData.allergies || ''}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Known allergies..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
                <Input
                  id="chronic_conditions"
                  value={formData.chronic_conditions || ''}
                  onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                  placeholder="Chronic health conditions..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veterinarian_name">Veterinarian Name</Label>
                <Input
                  id="veterinarian_name"
                  value={formData.veterinarian_name || ''}
                  onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
                  placeholder="Dr. Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veterinarian_contact">Veterinarian Contact</Label>
                <Input
                  id="veterinarian_contact"
                  value={formData.veterinarian_contact || ''}
                  onChange={(e) => setFormData({ ...formData, veterinarian_contact: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                value={formData.clinic_name || ''}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="Clinic or hospital name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_checkup_date">Last Checkup Date</Label>
                <Input
                  id="last_checkup_date"
                  type="date"
                  value={formData.last_checkup_date || ''}
                  onChange={(e) => setFormData({ ...formData, last_checkup_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_checkup_due">Next Checkup Due</Label>
                <Input
                  id="next_checkup_due"
                  type="date"
                  value={formData.next_checkup_due || ''}
                  onChange={(e) => setFormData({ ...formData, next_checkup_due: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_spayed_neutered"
                checked={formData.is_spayed_neutered || false}
                onChange={(e) => setFormData({ ...formData, is_spayed_neutered: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_spayed_neutered" className="cursor-pointer">
                Spayed/Neutered
              </Label>
            </div>

            {formData.is_spayed_neutered && (
              <div className="space-y-2">
                <Label htmlFor="spay_neuter_date">Spay/Neuter Date</Label>
                <Input
                  id="spay_neuter_date"
                  type="date"
                  value={formData.spay_neuter_date || ''}
                  onChange={(e) => setFormData({ ...formData, spay_neuter_date: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional medical notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingRecord ? 'Update' : 'Save'} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

