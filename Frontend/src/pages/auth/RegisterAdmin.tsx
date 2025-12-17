import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Mail, Phone, MapPin, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/lib/auth';
import emailjs from '@emailjs/browser';
import PINVerification from '@/components/auth/PINVerification';

const adminRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  country_code: z.string().default('+91'),
  pincode: z.string().min(4, 'Enter a valid postal code').max(10, 'Postal code too long'),
  region: z.string().min(2, 'Region is required'),
  organization: z.string().optional(),
});

type AdminRegistrationForm = z.infer<typeof adminRegistrationSchema>;

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [registrationData, setRegistrationData] = useState<AdminRegistrationForm | null>(null);
  const [pin, setPin] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AdminRegistrationForm>({
    resolver: zodResolver(adminRegistrationSchema),
    defaultValues: {
      country_code: '+91',
    },
  });

  const countryCode = watch('country_code');

  const sendPINEmail = async (email: string, pin: string, name: string) => {
    try {
      // EmailJS Configuration
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_k7r1vbr';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_8zf5bx7';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'ENM5xx8dlxw083Dvf';

      // Initialize EmailJS
      emailjs.init(publicKey);

      // Template parameters - matching the EmailJS template variables
      // Send both 'pin' and 'verification_code' to support different template variable names
      const templateParams = {
        to_email: email,
        to_name: name || 'Admin',
        pin: pin, // For {{pin}} in template
        verification_code: pin, // For {{verification_code}} in template (backward compatibility)
        from_name: 'PetReunite Admin Team',
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
      };

      const response = await emailjs.send(serviceId, templateId, templateParams);

      toast({
        title: 'Email Sent Successfully!',
        description: `Verification PIN has been sent to ${email}. Please check your inbox.`,
      });
    } catch (error: any) {
      console.error('EmailJS Error Details:', error);
      console.error('Error text:', error?.text);
      console.error('Error status:', error?.status);
      
      // Show detailed error in development
      const errorMessage = error?.text || error?.message || 'Unknown error';
      
      toast({
        title: 'Email Sending Failed',
        description: `Could not send email. Your PIN is: ${pin}. Please use this PIN to verify. Error: ${errorMessage}`,
        variant: 'destructive',
      });
      
      // Also show PIN in console for debugging
      console.warn('PIN for manual entry:', pin);
    }
  };

  const onSubmit = async (data: AdminRegistrationForm) => {
    try {
      setIsLoading(true);

      // Request admin registration (backend generates PIN)
      const response = await authApi.requestAdminRegistration({
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        country_code: data.country_code,
        pincode: data.pincode,
        region: data.region,
        organization: data.organization,
      });

      setPin(response.pin);
      setRegistrationData(data);

      // Send PIN via EmailJS
      await sendPINEmail(data.email, response.pin, data.name);

      // Show success message
      toast({
        title: 'PIN Sent!',
        description: 'Please check your email for the verification PIN. You will now be redirected to enter it.',
      });

      // Small delay to show toast, then move to verification step
      setTimeout(() => {
        setStep('verify');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to request admin registration';
      const isNotEligible = error.response?.data?.eligible === false || error.response?.status === 403;
      
      toast({
        title: isNotEligible ? 'Not Eligible' : 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePINVerified = async () => {
    // Refresh user data from the backend to update auth context
    try {
      await refreshUser();
      toast({
        title: 'Welcome!',
        description: 'You have been successfully logged in as admin.',
      });
      // Navigate to admin dashboard
      navigate('/admin');
    } catch (error) {
      // If refresh fails, still redirect (tokens are already stored)
      window.location.href = '/admin';
    }
  };

  if (step === 'verify' && registrationData) {
    return (
      <PINVerification
        email={registrationData.email}
        onVerified={handlePINVerified}
        onBack={() => setStep('form')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FA] to-[#E8F5E9] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2BB6AF] to-[#25A39C] text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Register as Admin</h1>
              <p className="text-white/90">Join our admin team and help manage the platform</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Full Name *
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                className="h-12"
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  className="h-12 pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Phone Number *
              </Label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setValue('country_code', e.target.value);
                  }}
                  className="px-3 py-2.5 h-12 border-2 border-gray-200 rounded-lg focus:border-[#2BB6AF] focus:outline-none"
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    placeholder="1234567890"
                    {...register('phone')}
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-semibold">
                Pincode *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="pincode"
                  placeholder="560001"
                  {...register('pincode')}
                  className="h-12 pl-10"
                />
              </div>
              {errors.pincode && (
                <p className="text-xs text-red-600">{errors.pincode.message}</p>
              )}
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-semibold">
                Region / Area *
              </Label>
              <Input
                id="region"
                placeholder="e.g., North Bangalore, South Delhi"
                {...register('region')}
                className="h-12"
              />
              {errors.region && (
                <p className="text-xs text-red-600">{errors.region.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Specify the region you'll be managing as a sub-admin
              </p>
            </div>

            {/* Organization (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-sm font-semibold">
                Organization (Optional)
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="organization"
                  placeholder="Organization name"
                  {...register('organization')}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Your email will be verified for eligibility</li>
                    <li>If eligible, a 6-digit verification PIN will be sent to your email</li>
                    <li>Enter the PIN to verify your identity</li>
                    <li>Set your password to complete registration</li>
                    <li>You'll be redirected to the admin panel</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#2BB6AF] to-[#25A39C] hover:from-[#25A39C] hover:to-[#1E8E87] text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                <>
                  Request Admin Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Back to Register */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Want to register as a regular user?{' '}
                <a href="/auth/register" className="text-[#2BB6AF] hover:underline font-medium">
                  Go to User Registration
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

