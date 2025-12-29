import { useEffect, useState } from 'react';
import { Clock, Calendar, Stethoscope, CheckCircle2, MapPin, Phone, Syringe, Heart, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { healthApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { VaccinationCamp } from '@/api/healthApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function HealthVaccination() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [vaccinationCamps, setVaccinationCamps] = useState<VaccinationCamp[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Dialog State
  const [selectedCamp, setSelectedCamp] = useState<VaccinationCamp | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    pet_name: '',
    pet_type: '',
    pet_age: '',
    contact_phone: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVaccinationCamps();
  }, []);

  const loadVaccinationCamps = async () => {
    try {
      setLoading(true);
      const camps = await healthApi.getCamps({});
      let campsArray: VaccinationCamp[] = [];
      if (Array.isArray(camps)) {
        campsArray = camps;
      } else if ((camps as any)?.results && Array.isArray((camps as any).results)) {
        campsArray = (camps as any).results;
      } else if ((camps as any)?.data && Array.isArray((camps as any).data)) {
        campsArray = (camps as any).data;
      } else if ((camps as any)?.items && Array.isArray((camps as any).items)) {
        campsArray = (camps as any).items;
      }
      setVaccinationCamps(campsArray);
    } catch (error) {
      console.error('Error loading vaccination camps:', error);
      setVaccinationCamps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (camp: VaccinationCamp) => {
    setSelectedCamp(camp);
    setRegisterForm({
      pet_name: '',
      pet_type: '',
      pet_age: '',
      contact_phone: user?.phone || '',
      notes: ''
    });
    setShowRegisterDialog(true);
  };

  const handleRegisterSubmit = async () => {
    if (!selectedCamp) return;
    if (!registerForm.pet_name || !registerForm.contact_phone || !registerForm.pet_type) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in required fields (Pet Name, Type, and Phone).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await healthApi.registerForCamp({
        camp: selectedCamp.id,
        pet_name: registerForm.pet_name,
        pet_type: registerForm.pet_type,
        pet_age: registerForm.pet_age,
        contact_phone: registerForm.contact_phone,
        notes: registerForm.notes,
      });

      toast({
        title: 'Registration Successful',
        description: `You have successfully registered for the camp.`,
      });
      setShowRegisterDialog(false);
      loadVaccinationCamps();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not register for the camp.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-[#2BB6AF] border-t-transparent animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading health services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Modern Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-[#2BB6AF]/10 text-[#2BB6AF] hover:bg-[#2BB6AF]/20 border-none mb-4 px-4 py-1.5 text-sm font-medium rounded-full">
              Pet Health & Wellness
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
              Keep Your Furry Friends <span className="text-[#2BB6AF]">Healthy & Happy</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Access free vaccination camps, health checkups, and emergency care resources.
              We partner with top veterinarians to ensure the best care for your pets.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-[#2BB6AF] hover:bg-[#258d88] text-white px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all">
                Find Nearby Camps
              </Button>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 h-12 px-8 rounded-full">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
          {[
            {
              icon: Syringe,
              title: "Vaccination Camps",
              desc: "Regular events for free or subsidized pet vaccinations.",
              color: "text-blue-500",
              bg: "bg-blue-50"
            },
            {
              icon: Heart,
              title: "Health Checkups",
              desc: "Comprehensive health screenings by certified vets.",
              color: "text-red-500",
              bg: "bg-red-50"
            },
            {
              icon: ShieldCheck,
              title: "Emergency Care",
              desc: "24/7 support and guidance for medical emergencies.",
              color: "text-green-500",
              bg: "bg-green-50"
            }
          ].map((service, idx) => (
            <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-2xl ${service.bg} flex items-center justify-center mb-4`}>
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content: Upcoming Camps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Vaccination Camps</h2>
              <p className="text-gray-600 mt-1">Register your pet for upcoming health events</p>
            </div>
            <Button variant="ghost" className="text-[#2BB6AF] hover:text-[#258d88] hover:bg-[#2BB6AF]/10">
              View All Events <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {vaccinationCamps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vaccinationCamps.map((camp) => (
                <Card key={camp.id} className="group border-gray-200 hover:border-[#2BB6AF]/50 hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white rounded-2xl">
                  {/* Card Header Illustration/Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Stethoscope className="h-16 w-16 text-gray-300/50 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm text-center min-w-[60px]">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {new Date(camp.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xl font-bold text-[#2BB6AF]">
                        {new Date(camp.date).getDate()}
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      {camp.available_slots === 0 ? (
                        <Badge variant="destructive" className="shadow-sm">Full</Badge>
                      ) : (
                        <Badge className="bg-green-500 text-white shadow-sm">Open</Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#2BB6AF] transition-colors line-clamp-1">
                      {camp.location}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="line-clamp-2">{camp.address}, {camp.city}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span>{camp.start_time} - {camp.end_time}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Stethoscope className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span>Org: {camp.ngo}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm py-3 px-4 bg-gray-50 rounded-lg mb-4">
                      <span className="text-gray-600 font-medium">Availability</span>
                      <span className={`font-bold ${camp.available_slots && camp.available_slots > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                        {camp.available_slots ?? 'Limited'} Slots
                      </span>
                    </div>

                    <Button
                      className={`w-full py-6 text-base font-semibold shadow-md transition-all ${camp.available_slots === 0
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed'
                        : 'bg-[#2BB6AF] hover:bg-[#258d88] text-white hover:shadow-lg'
                        }`}
                      disabled={camp.available_slots === 0}
                      onClick={() => {
                        if (camp.registration_link) {
                          window.open(camp.registration_link, '_blank');
                        } else {
                          handleRegisterClick(camp);
                        }
                      }}
                    >
                      {camp.available_slots === 0 ? 'Registration Closed' : camp.registration_link ? 'Register External' : 'Register Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Camps</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We're currently planning new events. Please check back later or subscribe to our newsletter for updates.
              </p>
            </div>
          )}
        </div>

        {/* Contact/Support Footer */}
        <div className="bg-[#2BB6AF] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden mb-12">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Need Help with Your Pet's Health?</h2>
            <p className="text-blue-50 mb-8 text-lg">
              Our team of veterinary experts is here to guide you. Reach out for advice on diet, general wellness, or emergency situations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-white text-[#2BB6AF] hover:bg-blue-50 border-none h-12 px-8 rounded-full font-bold">
                <Phone className="mr-2 h-4 w-4" /> Call Helpline
              </Button>
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 h-12 px-8 rounded-full font-bold">
                <Mail className="mr-2 h-4 w-4" /> Email Us
              </Button>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 left-0 -ml-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Camp Registration</DialogTitle>
            <DialogDescription>
              Register for <span className="font-semibold text-gray-900">{selectedCamp?.location}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pet_name">Pet Name *</Label>
              <Input
                id="pet_name"
                value={registerForm.pet_name}
                onChange={(e) => setRegisterForm({ ...registerForm, pet_name: e.target.value })}
                placeholder="e.g. Bella"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pet_type">Pet Type *</Label>
                <Input
                  id="pet_type"
                  value={registerForm.pet_type}
                  onChange={(e) => setRegisterForm({ ...registerForm, pet_type: e.target.value })}
                  placeholder="e.g. Dog"
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pet_age">Age</Label>
                <Input
                  id="pet_age"
                  value={registerForm.pet_age}
                  onChange={(e) => setRegisterForm({ ...registerForm, pet_age: e.target.value })}
                  placeholder="e.g. 2 yrs"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Contact Phone *</Label>
              <Input
                id="phone"
                value={registerForm.contact_phone}
                onChange={(e) => setRegisterForm({ ...registerForm, contact_phone: e.target.value })}
                placeholder="+91..."
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Medical Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={registerForm.notes}
                onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                placeholder="Any allergies or conditions?"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRegisterSubmit}
              disabled={submitting}
              className="bg-[#2BB6AF] hover:bg-[#258d88] text-white"
            >
              {submitting ? 'Confirming...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
