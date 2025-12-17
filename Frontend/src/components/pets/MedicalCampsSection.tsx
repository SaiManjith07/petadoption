import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Stethoscope, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { healthApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { VaccinationCamp } from '@/api/healthApi';

interface MedicalCampsSectionProps {
  location?: string;
  pincode?: string;
}

export function MedicalCampsSection({ location, pincode }: MedicalCampsSectionProps) {
  const { toast } = useToast();
  const [camps, setCamps] = useState<VaccinationCamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCamps();
  }, [location, pincode]);

  const loadCamps = async () => {
    try {
      setLoading(true);
      const params: any = { upcoming: true };
      if (pincode) {
        params.pincode = pincode;
      }
      if (location) {
        params.location = location;
      }
      
      const campsData = await healthApi.getCamps(params);
      let campsArray: VaccinationCamp[] = [];
      if (Array.isArray(campsData)) {
        campsArray = campsData;
      } else if (campsData?.results && Array.isArray(campsData.results)) {
        campsArray = campsData.results;
      } else if (campsData?.data && Array.isArray(campsData.data)) {
        campsArray = campsData.data;
      } else if (campsData?.items && Array.isArray(campsData.items)) {
        campsArray = campsData.items;
      }
      setCamps(campsArray.slice(0, 5)); // Show only first 5 camps
    } catch (error) {
      console.error('Error loading medical camps:', error);
      setCamps([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#2BB6AF]" />
            Medical Camps
          </CardTitle>
          <CardDescription>Upcoming vaccination and health camps in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2BB6AF] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading camps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (camps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#2BB6AF]" />
            Medical Camps
          </CardTitle>
          <CardDescription>Upcoming vaccination and health camps in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No upcoming medical camps in your area</p>
            <p className="text-xs text-gray-400 mt-1">Check back later for new camps</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-[#2BB6AF]" />
          Medical Camps
        </CardTitle>
        <CardDescription>Upcoming vaccination and health camps in your area</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {camps.map((camp) => (
            <div
              key={camp.id}
              className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-[#2BB6AF]/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-base text-gray-900">{camp.location}</h3>
                    <Badge className="bg-[#2BB6AF] text-white text-xs">
                      {new Date(camp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {camp.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-[#2BB6AF]" />
                        <span className="text-xs">{camp.address}</span>
                      </div>
                    )}
                    {camp.ngo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Stethoscope className="h-3.5 w-3.5 text-[#2BB6AF]" />
                        <span className="text-xs">{camp.ngo}</span>
                      </div>
                    )}
                    {camp.time && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-[#2BB6AF]" />
                        <span className="text-xs">{camp.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {camp.available_slots !== undefined && camp.available_slots > 0 && (
                <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-700">
                    {camp.available_slots} slots available
                  </p>
                </div>
              )}
              {camp.registration_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white text-xs"
                  onClick={() => {
                    window.open(camp.registration_link, '_blank');
                  }}
                >
                  Register Now
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[#2BB6AF] hover:text-[#2BB6AF] hover:bg-[#2BB6AF]/10"
            onClick={() => {
              window.location.href = '/health-vaccination';
            }}
          >
            View All Medical Camps
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

