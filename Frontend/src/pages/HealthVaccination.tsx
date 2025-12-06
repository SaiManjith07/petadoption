import { useEffect, useState } from 'react';
import { Clock, Calendar, Stethoscope, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { healthApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { VaccinationCamp } from '@/api/healthApi';

export default function HealthVaccination() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [vaccinationCamps, setVaccinationCamps] = useState<VaccinationCamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadVaccinationCamps();
    }
  }, [isAuthenticated, user]);

  const loadVaccinationCamps = async () => {
    try {
      setLoading(true);
      const camps = await healthApi.getCamps({ upcoming: true });
      let campsArray: VaccinationCamp[] = [];
      if (Array.isArray(camps)) {
        campsArray = camps;
      } else if (camps?.results && Array.isArray(camps.results)) {
        campsArray = camps.results;
      } else if (camps?.data && Array.isArray(camps.data)) {
        campsArray = camps.data;
      } else if (camps?.items && Array.isArray(camps.items)) {
        campsArray = camps.items;
      }
      setVaccinationCamps(campsArray);
    } catch (error) {
      console.error('Error loading vaccination camps:', error);
      setVaccinationCamps([]);
      toast({
        title: 'Error',
        description: 'Failed to load vaccination camps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center animate-pulse shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading health information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 -m-6 lg:-m-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#2BB6AF]/10 via-white to-[#4CAF50]/5 border-b border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Stethoscope className="absolute top-10 left-10 w-32 h-32 text-[#2BB6AF]" />
          <Calendar className="absolute bottom-10 right-10 w-40 h-40 text-[#2BB6AF]" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2BB6AF]/10 rounded-full mb-4 border border-[#2BB6AF]/20">
                <Stethoscope className="w-4 h-4 text-[#2BB6AF]" />
                <span className="text-sm font-semibold text-[#2BB6AF]">Health Services</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Health & Vaccination
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl mb-8 font-medium">
                Comprehensive pet health services and upcoming vaccination camps
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Health Services Card */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] flex items-center justify-center shadow-md">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Pet Health Services</CardTitle>
                  <CardDescription>Comprehensive care for your pets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-6 w-6 text-[#2BB6AF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Free Vaccination Camps</h3>
                    <p className="text-sm text-gray-600">
                      Regularly organized vaccination camps to keep your pets healthy and protected
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-6 w-6 text-[#2BB6AF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Pet First-Aid Basics</h3>
                    <p className="text-sm text-gray-600">
                      Learn essential first-aid techniques and emergency care for your pets
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-6 w-6 text-[#2BB6AF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Microchipping Services</h3>
                    <p className="text-sm text-gray-600">
                      Pet identification through microchipping to help reunite lost pets with their families
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-6 w-6 text-[#2BB6AF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Health Checkups</h3>
                    <p className="text-sm text-gray-600">
                      Regular health checkups and consultations with certified veterinarians
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Upcoming Camps Card */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] flex items-center justify-center shadow-md">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Upcoming Medical Camps</CardTitle>
                  <CardDescription>Register for upcoming vaccination camps</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {vaccinationCamps.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {vaccinationCamps.map((camp) => (
                    <div key={camp.id} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-[#2BB6AF]/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{camp.location}</h3>
                            <Badge className="bg-[#2BB6AF] text-white">
                              {new Date(camp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-[#2BB6AF]" />
                              <span>{camp.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Stethoscope className="h-4 w-4 text-[#2BB6AF]" />
                              <span>{camp.ngo}</span>
                            </div>
                            {camp.time && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-[#2BB6AF]" />
                                <span>{camp.time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {camp.available_slots !== undefined && camp.available_slots > 0 && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-semibold text-green-700">
                            {camp.available_slots} slots available
                          </p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white"
                        onClick={() => {
                          if (camp.registration_link) {
                            window.open(camp.registration_link, '_blank');
                          } else {
                            toast({
                              title: 'Registration',
                              description: `Register for ${camp.location} camp`,
                            });
                          }
                        }}
                      >
                        Register Now
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Camps</h3>
                  <p className="text-sm">Check back later for upcoming vaccination camps</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#2BB6AF]" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              For more information about pet health services, vaccination schedules, or to report a health emergency, 
              please contact your local veterinary services or reach out to our support team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white">
                Contact Support
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

