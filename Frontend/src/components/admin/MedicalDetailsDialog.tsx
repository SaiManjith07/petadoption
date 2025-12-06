import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { petsApi } from '@/api';
import { Calendar, Plus, Trash2, Edit, FileText, Activity, Heart, Syringe, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecord {
  id?: number;
  pet_id: number;
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

interface MedicalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: number;
  petName?: string;
}

export function MedicalDetailsDialog({ open, onOpenChange, petId, petName }: MedicalDetailsDialogProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    pet_id: petId,
    health_status: 'Healthy',
    vaccination_status: 'Unknown',
    is_spayed_neutered: false,
  });

  useEffect(() => {
    if (open && petId) {
      loadMedicalRecords();
    }
  }, [open, petId]);

  const loadMedicalRecords = async () => {
    try {
      setLoading(true);
      const data = await petsApi.medicalRecords.getByPetId(petId);
      setRecords(Array.isArray(data) ? data : []);
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
      pet_id: petId,
      health_status: 'Healthy',
      vaccination_status: 'Unknown',
      is_spayed_neutered: false,
    });
    setEditingRecord(null);
    setShowAddForm(true);
  };

  const handleEdit = (record: MedicalRecord) => {
    setFormData(record);
    setEditingRecord(record);
    setShowAddForm(true);
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
      loadMedicalRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete medical record',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (editingRecord?.id) {
        await petsApi.medicalRecords.update(editingRecord.id, formData);
        toast({
          title: 'Success',
          description: 'Medical record updated successfully',
        });
      } else {
        await petsApi.medicalRecords.create(formData);
        toast({
          title: 'Success',
          description: 'Medical record created successfully',
        });
      }
      setShowAddForm(false);
      setEditingRecord(null);
      setFormData({
        pet_id: petId,
        health_status: 'Healthy',
        vaccination_status: 'Unknown',
        is_spayed_neutered: false,
      });
      loadMedicalRecords();
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
      pet_id: petId,
      health_status: 'Healthy',
      vaccination_status: 'Unknown',
      is_spayed_neutered: false,
    });
    setEditingRecord(null);
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-[#4CAF50]" />
            Medical Details {petName && `- ${petName}`}
          </DialogTitle>
          <DialogDescription>
            Manage medical records and health information for this pet
          </DialogDescription>
        </DialogHeader>

        {showAddForm ? (
          <div className="space-y-6 mt-4">
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
              <Button variant="outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#4CAF50] hover:bg-[#2E7D32]"
              >
                {submitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Create Record'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {records.length} medical record{records.length !== 1 ? 's' : ''} registered
              </p>
              <Button onClick={handleAddNew} className="bg-[#4CAF50] hover:bg-[#2E7D32]">
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Record
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading medical records...</p>
              </div>
            ) : records.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Stethoscope className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Records</h3>
                  <p className="text-gray-600 mb-4">No medical records have been registered for this pet yet.</p>
                  <Button onClick={handleAddNew} className="bg-[#4CAF50] hover:bg-[#2E7D32]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Medical Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[#4CAF50]" />
                            Medical Record
                          </CardTitle>
                          {record.created_at && (
                            <p className="text-sm text-gray-500 mt-1">
                              Created: {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={record.health_status === 'Healthy' ? 'default' : 'destructive'}
                            className={
                              record.health_status === 'Healthy' ? 'bg-green-100 text-green-700' :
                              record.health_status === 'Critical' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {record.health_status}
                          </Badge>
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
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {record.weight && (
                          <div>
                            <Label className="text-xs text-gray-500">Weight</Label>
                            <p className="font-semibold">{record.weight} kg</p>
                          </div>
                        )}
                        {record.temperature && (
                          <div>
                            <Label className="text-xs text-gray-500">Temperature</Label>
                            <p className="font-semibold">{record.temperature}°C</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-gray-500">Vaccination</Label>
                          <p className="font-semibold">{record.vaccination_status}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Spayed/Neutered</Label>
                          <p className="font-semibold">{record.is_spayed_neutered ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {record.vaccination_notes && (
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Syringe className="h-4 w-4" />
                            Vaccination Notes
                          </Label>
                          <p className="text-sm text-gray-700 mt-1">{record.vaccination_notes}</p>
                        </div>
                      )}

                      {record.medical_history && (
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Medical History
                          </Label>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{record.medical_history}</p>
                        </div>
                      )}

                      {record.current_medications && (
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Current Medications
                          </Label>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{record.current_medications}</p>
                        </div>
                      )}

                      {(record.allergies || record.chronic_conditions) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {record.allergies && (
                            <div>
                              <Label className="text-sm font-semibold">Allergies</Label>
                              <p className="text-sm text-gray-700 mt-1">{record.allergies}</p>
                            </div>
                          )}
                          {record.chronic_conditions && (
                            <div>
                              <Label className="text-sm font-semibold">Chronic Conditions</Label>
                              <p className="text-sm text-gray-700 mt-1">{record.chronic_conditions}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {(record.veterinarian_name || record.clinic_name) && (
                        <div>
                          <Label className="text-sm font-semibold">Veterinary Information</Label>
                          <p className="text-sm text-gray-700 mt-1">
                            {record.veterinarian_name && `Dr. ${record.veterinarian_name}`}
                            {record.clinic_name && ` - ${record.clinic_name}`}
                            {record.veterinarian_contact && ` (${record.veterinarian_contact})`}
                          </p>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <Label className="text-sm font-semibold">Additional Notes</Label>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{record.notes}</p>
                        </div>
                      )}

                      {(record.last_vaccination_date || record.next_vaccination_due || record.last_checkup_date || record.next_checkup_due) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                          {record.last_vaccination_date && (
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last Vaccination
                              </Label>
                              <p className="text-sm font-semibold">
                                {format(new Date(record.last_vaccination_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                          {record.next_vaccination_due && (
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next Vaccination
                              </Label>
                              <p className="text-sm font-semibold">
                                {format(new Date(record.next_vaccination_due), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                          {record.last_checkup_date && (
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last Checkup
                              </Label>
                              <p className="text-sm font-semibold">
                                {format(new Date(record.last_checkup_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                          {record.next_checkup_due && (
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next Checkup
                              </Label>
                              <p className="text-sm font-semibold">
                                {format(new Date(record.next_checkup_due), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

