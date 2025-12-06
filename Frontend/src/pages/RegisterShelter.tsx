import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, Ruler, Users, Phone, Mail, FileText, Upload, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { shelterApi } from '@/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function RegisterShelter() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    shelter_name: '',
    location: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: '',
        lng: '',
      },
    },
    area_sqft: '',
    capacity: '',
    facilities: [] as string[],
    contact_info: {
      phone: '',
      email: '',
      alternate_phone: '',
    },
    accepts_feeding_data: false,
  });

  const [facilityInput, setFacilityInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myShelter, setMyShelter] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    loadMyShelter();
  }, [isAuthenticated, navigate]);

  const loadMyShelter = async () => {
    try {
      const data = await shelterApi.getMyShelter();
      if (data) {
        setMyShelter(data);
        setFormData({
          shelter_name: data.name || '',
          location: {
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            coordinates: {
              lat: data.latitude || '',
              lng: data.longitude || '',
            },
          },
          area_sqft: data.area_sqft || '',
          capacity: data.total_capacity || '',
          facilities: data.facilities || [],
          contact_info: {
            phone: data.phone || '',
            email: data.email || '',
            alternate_phone: '',
          },
          accepts_feeding_data: data.accepts_feeding || false,
        });
      }
    } catch (error) {
      console.error('Error loading shelter:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const shelterData = {
        name: formData.shelter_name,
        address: formData.location.address,
        city: formData.location.city,
        state: formData.location.state,
        pincode: formData.location.pincode,
        latitude: parseFloat(formData.location.coordinates.lat) || null,
        longitude: parseFloat(formData.location.coordinates.lng) || null,
        area_sqft: parseInt(formData.area_sqft) || 0,
        total_capacity: parseInt(formData.capacity) || 0,
        phone: formData.contact_info.phone,
        email: formData.contact_info.email,
        facilities: formData.facilities,
        accepts_feeding: formData.accepts_feeding_data,
      };

      if (myShelter) {
        // Update existing shelter
        await shelterApi.updateShelter(myShelter.id || myShelter._id, shelterData);
      } else {
        // Register new shelter
        await shelterApi.registerShelter(shelterData);
      }

      toast({
        title: 'Success',
        description: myShelter 
          ? 'Shelter updated successfully.' 
          : 'Shelter registration submitted. Waiting for admin approval.',
      });

      loadMyShelter();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to register shelter',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addFacility = () => {
    if (facilityInput.trim()) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facilityInput.trim()],
      });
      setFacilityInput('');
    }
  };

  const removeFacility = (index: number) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter((_, i) => i !== index),
    });
  };

  if (myShelter && myShelter.status === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">Shelter Approved!</CardTitle>
                  <CardDescription>Your shelter registration has been approved by admin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Shelter Name</p>
                  <p className="text-lg font-semibold">{myShelter.shelter_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-lg">{myShelter.location?.address}, {myShelter.location?.city}, {myShelter.location?.state}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Area</p>
                    <p className="text-lg font-semibold">{myShelter.area_sqft} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Capacity</p>
                    <p className="text-lg font-semibold">{myShelter.capacity} animals</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (myShelter && myShelter.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Shelter Registration Pending</CardTitle>
              <CardDescription>Your shelter registration is under review by admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Shelter Name</p>
                  <p className="text-lg font-semibold">{myShelter.shelter_name}</p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending Approval
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Shelter</h1>
          <p className="text-gray-600">Provide shelter for lost pets. Admin will verify your shelter capacity and area.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-[#4CAF50]" />
              <CardTitle>Shelter Information</CardTitle>
            </div>
            <CardDescription>Fill in all required details for shelter registration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shelter Name */}
              <div className="space-y-2">
                <Label htmlFor="shelter_name">Shelter Name *</Label>
                <Input
                  id="shelter_name"
                  value={formData.shelter_name}
                  onChange={(e) => setFormData({ ...formData, shelter_name: e.target.value })}
                  placeholder="Enter shelter name"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label>Location *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.location.address}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value }
                      })}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.location.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value }
                      })}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.location.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, pincode: e.target.value }
                      })}
                      placeholder="Pincode"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Area and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq ft) *</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="area_sqft"
                      type="number"
                      value={formData.area_sqft}
                      onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      placeholder="Area in square feet"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Admin will verify this area</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Number of animals) *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="How many animals can you accommodate"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Admin will verify this capacity</p>
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-2">
                <Label>Facilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="Add facility (e.g., Medical care, Fenced area)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFacility();
                      }
                    }}
                  />
                  <Button type="button" onClick={addFacility} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.facilities.map((facility, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {facility}
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <Label>Contact Information *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.contact_info.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact_info: { ...formData.contact_info, phone: e.target.value }
                        })}
                        placeholder="Phone number"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.contact_info.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact_info: { ...formData.contact_info, email: e.target.value }
                        })}
                        placeholder="Email address"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Accept Feeding Data */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="accepts_feeding_data"
                  checked={formData.accepts_feeding_data}
                  onChange={(e) => setFormData({ ...formData, accepts_feeding_data: e.target.checked })}
                  className="h-4 w-4 text-[#4CAF50] border-gray-300 rounded focus:ring-[#4CAF50]"
                />
                <Label htmlFor="accepts_feeding_data" className="cursor-pointer">
                  Accept feeding data from users (Users can log feeding activities at your shelter)
                </Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2E7D32]"
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/home')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

