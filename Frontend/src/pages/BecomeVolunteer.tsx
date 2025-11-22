import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, Droplet, Truck, CheckCircle2, AlertCircle, UserPlus, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { roleRequestAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BecomeVolunteer() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'rescuer' | 'feeder' | 'transporter' | null>(null);
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  
  // Resource fields for Rescuer
  const [equipment, setEquipment] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [certifications, setCertifications] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // Resource fields for Feeder
  const [feedingLocations, setFeedingLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [foodStorageCapacity, setFoodStorageCapacity] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [numberOfFeedingPoints, setNumberOfFeedingPoints] = useState('');
  
  // Resource fields for Transporter
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [vehicleInsurance, setVehicleInsurance] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');
  
  // Common resource field
  const [additionalResources, setAdditionalResources] = useState('');

  const roles = [
    {
      id: 'rescuer',
      title: 'Rescuer',
      icon: HandHeart,
      description: 'Help rescue and care for animals in need. Respond to emergency calls and provide immediate assistance.',
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      id: 'feeder',
      title: 'Feeder',
      icon: Droplet,
      description: 'Maintain community feeding points and ensure stray animals have access to food and water.',
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
    },
    {
      id: 'transporter',
      title: 'Transporter',
      icon: Truck,
      description: 'Help transport pets safely to shelters, veterinary clinics, or new homes.',
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
    },
  ];

  const addEquipment = () => {
    if (equipmentInput.trim() && !equipment.includes(equipmentInput.trim())) {
      setEquipment([...equipment, equipmentInput.trim()]);
      setEquipmentInput('');
    }
  };

  const removeEquipment = (item: string) => {
    setEquipment(equipment.filter(e => e !== item));
  };

  const addFeedingLocation = () => {
    if (locationInput.trim() && !feedingLocations.includes(locationInput.trim())) {
      setFeedingLocations([...feedingLocations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const removeFeedingLocation = (location: string) => {
    setFeedingLocations(feedingLocations.filter(l => l !== location));
  };

  const resetForm = () => {
    setSelectedRole(null);
    setReason('');
    setExperience('');
    setAvailability('');
    setEquipment([]);
    setEquipmentInput('');
    setVehicleType('');
    setCertifications('');
    setEmergencyContact('');
    setFeedingLocations([]);
    setLocationInput('');
    setFoodStorageCapacity('');
    setFeedingSchedule('');
    setNumberOfFeedingPoints('');
    setVehicleCapacity('');
    setVehicleRegistration('');
    setVehicleInsurance('');
    setServiceArea('');
    setServiceRadius('');
    setAdditionalResources('');
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Build resources object based on selected role
      const resources: any = {
        additional_resources: additionalResources || '',
      };

      if (selectedRole === 'rescuer') {
        resources.equipment = equipment;
        resources.vehicle_type = vehicleType || '';
        resources.certifications = certifications || '';
        resources.emergency_contact = emergencyContact || '';
      } else if (selectedRole === 'feeder') {
        resources.feeding_locations = feedingLocations;
        resources.food_storage_capacity = foodStorageCapacity || '';
        resources.feeding_schedule = feedingSchedule || '';
        resources.number_of_feeding_points = numberOfFeedingPoints ? parseInt(numberOfFeedingPoints) : 0;
      } else if (selectedRole === 'transporter') {
        resources.vehicle_capacity = vehicleCapacity || '';
        resources.vehicle_registration = vehicleRegistration || '';
        resources.vehicle_insurance = vehicleInsurance || '';
        resources.service_area = serviceArea || '';
        resources.service_radius = serviceRadius ? parseInt(serviceRadius) : 0;
      }

      await roleRequestAPI.create(selectedRole, reason, experience, availability, resources);
      toast({
        title: 'Success',
        description: 'Your request has been submitted. Admin will review it shortly.',
      });
      resetForm();
      loadMyRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadMyRequests = async () => {
    if (!isAuthenticated) return;
    try {
      const requests = await roleRequestAPI.getMy();
      setMyRequests(requests);
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMyRequests();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Become a Volunteer</CardTitle>
            <CardDescription className="text-base mt-2">
              Join as rescuer, feeder, or transporter. Register on our platform to get verified by NGO partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              onClick={() => navigate('/auth/login')}
            >
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Become a Volunteer</h1>
              <p className="text-gray-600 mt-1">Join as rescuer, feeder, or transporter. Get verified by NGO partners and start helping animals in need.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="apply" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apply">Apply for Role</TabsTrigger>
            <TabsTrigger value="status">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="apply" className="space-y-6">
            {/* Role Selection */}
            <div className="grid gap-6 md:grid-cols-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                const hasRequest = myRequests.some(r => r.requested_role === role.id && r.status === 'pending');
                const isApproved = myRequests.some(r => r.requested_role === role.id && r.status === 'approved');
                
                return (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 ${
                      isSelected ? 'border-green-500 shadow-lg' : 'border-gray-200'
                    } ${isApproved ? 'bg-green-50' : ''}`}
                    onClick={() => !hasRequest && !isApproved && setSelectedRole(role.id as any)}
                  >
                    <CardHeader>
                      <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold">{role.title}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isApproved && (
                        <Badge className="bg-green-100 text-green-700 mb-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      {hasRequest && (
                        <Badge className="bg-yellow-100 text-yellow-700 mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Review
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Application Form */}
            {selectedRole && !myRequests.some(r => r.requested_role === selectedRole && (r.status === 'pending' || r.status === 'approved')) && (
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle>Apply as {roles.find(r => r.id === selectedRole)?.title}</CardTitle>
                  <CardDescription>Fill out the form below. Admin will review your application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Why do you want to become a {roles.find(r => r.id === selectedRole)?.title}? *</label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us about your motivation..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Experience (Optional)</label>
                    <Textarea
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Describe any relevant experience with animals..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Availability (Optional)</label>
                    <Textarea
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="When are you available to help?"
                      rows={2}
                    />
                  </div>

                  {/* Resource Information Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Information</h3>
                    <p className="text-sm text-gray-600 mb-4">Please provide details about the resources you can offer for this role.</p>

                    {/* Rescuer Resources */}
                    {selectedRole === 'rescuer' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Equipment Available</label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={equipmentInput}
                              onChange={(e) => setEquipmentInput(e.target.value)}
                              placeholder="e.g., First aid kit, Rescue net, Gloves"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                            />
                            <Button type="button" onClick={addEquipment} variant="outline">Add</Button>
                          </div>
                          {equipment.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {equipment.map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                  {item}
                                  <button onClick={() => removeEquipment(item)} className="ml-1 hover:text-red-600">×</button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Vehicle Type (Optional)</label>
                          <Input
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            placeholder="e.g., Car, Motorcycle, Bicycle, On foot"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Certifications & Training (Optional)</label>
                          <Textarea
                            value={certifications}
                            onChange={(e) => setCertifications(e.target.value)}
                            placeholder="List any animal rescue certifications, training courses, or relevant qualifications..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Emergency Contact (Optional)</label>
                          <Input
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Name and phone number of emergency contact"
                          />
                        </div>
                      </div>
                    )}

                    {/* Feeder Resources */}
                    {selectedRole === 'feeder' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Feeding Locations</label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={locationInput}
                              onChange={(e) => setLocationInput(e.target.value)}
                              placeholder="e.g., Park near Main Street, Community Center"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeedingLocation())}
                            />
                            <Button type="button" onClick={addFeedingLocation} variant="outline">Add</Button>
                          </div>
                          {feedingLocations.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {feedingLocations.map((location, idx) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                  {location}
                                  <button onClick={() => removeFeedingLocation(location)} className="ml-1 hover:text-red-600">×</button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Food Storage Capacity (Optional)</label>
                          <Input
                            value={foodStorageCapacity}
                            onChange={(e) => setFoodStorageCapacity(e.target.value)}
                            placeholder="e.g., 50 kg, 100 lbs, Large storage room"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Feeding Schedule (Optional)</label>
                          <Textarea
                            value={feedingSchedule}
                            onChange={(e) => setFeedingSchedule(e.target.value)}
                            placeholder="e.g., Daily at 7 AM and 6 PM, Weekends only, Twice daily"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Number of Feeding Points (Optional)</label>
                          <Input
                            type="number"
                            value={numberOfFeedingPoints}
                            onChange={(e) => setNumberOfFeedingPoints(e.target.value)}
                            placeholder="e.g., 3, 5, 10"
                            min="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Transporter Resources */}
                    {selectedRole === 'transporter' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Vehicle Capacity (Optional)</label>
                          <Input
                            value={vehicleCapacity}
                            onChange={(e) => setVehicleCapacity(e.target.value)}
                            placeholder="e.g., 2 small dogs, 1 large dog, Multiple cats"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Vehicle Registration Number (Optional)</label>
                          <Input
                            value={vehicleRegistration}
                            onChange={(e) => setVehicleRegistration(e.target.value)}
                            placeholder="Vehicle registration/license plate number"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Vehicle Insurance (Optional)</label>
                          <Input
                            value={vehicleInsurance}
                            onChange={(e) => setVehicleInsurance(e.target.value)}
                            placeholder="Insurance provider and policy number"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Area (Optional)</label>
                          <Textarea
                            value={serviceArea}
                            onChange={(e) => setServiceArea(e.target.value)}
                            placeholder="e.g., City-wide, North District, Within 20 km radius"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Radius in KM (Optional)</label>
                          <Input
                            type="number"
                            value={serviceRadius}
                            onChange={(e) => setServiceRadius(e.target.value)}
                            placeholder="e.g., 10, 25, 50"
                            min="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Resources (Common) */}
                    <div className="pt-4 border-t border-gray-200">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Additional Resources or Information (Optional)</label>
                      <Textarea
                        value={additionalResources}
                        onChange={(e) => setAdditionalResources(e.target.value)}
                        placeholder="Any other resources, equipment, or information you'd like to share..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white mt-6"
                    onClick={handleSubmit}
                    disabled={submitting || !reason.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="status">
            {myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Yet</h3>
                  <p className="text-gray-600">Apply for a volunteer role to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => {
                  const role = roles.find(r => r.id === request.requested_role);
                  const Icon = role?.icon || HandHeart;
                  
                  return (
                    <Card key={request._id || request.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${role?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{role?.title || request.requested_role}</CardTitle>
                              <CardDescription>
                                Applied on {new Date(request.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            className={
                              request.status === 'approved' ? 'bg-green-100 text-green-700' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      {request.admin_notes && (
                        <CardContent>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Admin Notes:</strong> {request.admin_notes}
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

