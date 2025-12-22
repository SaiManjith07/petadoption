import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, Heart, ShieldCheck, Users, CheckCircle2, ArrowRight, User, Phone, MapPin, Home, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/authApi';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(passwordRegex, 'Password must include uppercase, lowercase, number and special character'),
    confirmPassword: z.string(),
    pincode: z.string().min(4, 'Enter a valid postal code').max(10, 'Postal code too long'),
    age: z.number({ invalid_type_error: 'Age is required' }).int().min(13, 'You must be 13 or older to register').max(120, 'Please enter a valid age'),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
    phone: z.string().min(7, 'Enter a valid phone number'),
    countryCode: z.string().default('+91'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    landmark: z.string().optional(),
    role: z.enum(['user', 'rescuer']).default('user'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [countryCode, setCountryCode] = useState('+91');
  const [pwdStrength, setPwdStrength] = useState<'weak'|'medium'|'strong'|null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user',
      countryCode: '+91',
    },
  });

  // Auto-focus first field on load
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      // Normalize phone to E.164-ish format
      let phone = data.phone.trim();
      if (!phone.startsWith('+')) {
        const digits = phone.replace(/\D/g, '');
        phone = `${data.countryCode}${digits}`;
      }

      const payload = {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
        pincode: data.pincode,
        age: data.age,
        gender: data.gender,
        phone,
        country_code: data.countryCode,
        address: data.address,
        landmark: data.landmark || '',
      };

      await registerUser(payload);
      toast({
        title: 'Account created!',
        description: 'Welcome to PetReunite. Let\'s help pets together.',
      });
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === 'admin') navigate('/admin');
        else navigate('/home');
      } else {
        navigate('/home');
      }
    } catch (error) {
      // Try to parse field errors from message
      const msg = (error as Error).message || '';
      try {
        const parsed = JSON.parse(msg);
        if (parsed && typeof parsed === 'object') {
          // expected { field: [messages] }
          Object.entries(parsed).forEach(([field, errs]) => {
            // map to form errors where possible
            // set simple toast for now
            toast({ title: 'Registration failed', description: `${field}: ${Array.isArray(errs) ? errs.join('; ') : errs}`, variant: 'destructive' });
          });
        } else {
          toast({ title: 'Registration failed', description: msg || 'Please try again', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Registration failed', description: msg || 'Please try again or contact support.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced availability checks for email and phone
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedPassword = watch('password');

  useEffect(() => {
    if (!watchedEmail || watchedEmail.length < 3) {
      setEmailAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await authApi.checkEmail(watchedEmail);
        setEmailAvailable(!data.exists);
      } catch (e) {
        setEmailAvailable(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [watchedEmail]);

  useEffect(() => {
    if (!watchedPhone || watchedPhone.length < 6) {
      setPhoneAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const normalized = watchedPhone.startsWith('+') ? watchedPhone : `${countryCode}${watchedPhone.replace(/\D/g, '')}`;
        const data = await authApi.checkPhone(normalized);
        setPhoneAvailable(!data.exists);
      } catch (e) {
        setPhoneAvailable(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [watchedPhone, countryCode]);

  // Password strength
  useEffect(() => {
    const pwd = watchedPassword || '';
    if (!pwd) return setPwdStrength(null);
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPwdStrength(score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak');
  }, [watchedPassword]);

  // Scroll to first error field
  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  }, [errors]);

  return (
    <div className="fixed top-0 left-0 w-full h-screen flex overflow-hidden bg-white">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .form-section::-webkit-scrollbar {
          width: 8px;
        }
        .form-section::-webkit-scrollbar-track {
          background-color: #F1F3F5;
        }
        .form-section::-webkit-scrollbar-thumb {
          background-color: #CED4DA;
          border-radius: 4px;
        }
        .form-section::-webkit-scrollbar-thumb:hover {
          background-color: #ADB5BD;
        }
      `}</style>

      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-[48%] text-white px-12 py-6 flex flex-col justify-between relative overflow-hidden rounded-r-[6rem] h-screen sticky top-0 shadow-2xl shadow-green-500/60">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://img.freepik.com/premium-photo/heartwarming-scene-various-pets-including-dog-cat-ferret-rabbit-bird-fish-rodent-posing-around-charming-border-collie_1224371-5179.jpg?semt=ais_se_enriched&w=740&q=80"
            alt="Pet illustration background"
            className="w-full h-full object-contain blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF]/50 via-[#239a94]/50 to-[#1a7a75]/50"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center flex-1">
          {/* Decorative Paw Prints with Animation */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
          <div 
            className="absolute text-white opacity-15 paw-print-float"
            style={{ 
              top: '15%', 
              left: '10%', 
              transform: 'rotate(15deg)', 
              width: '50px', 
              height: '50px',
              animationDelay: '0s'
            }}
          >
            <svg width="50" height="50" viewBox="0 0 24 24" fill="white" opacity="0.15">
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM8 14c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </div>
          <div 
            className="absolute text-white opacity-12 paw-print-float"
            style={{ 
              top: '35%', 
              right: '12%', 
              transform: 'rotate(-25deg)', 
              width: '45px', 
              height: '45px',
              animationDelay: '0.5s'
            }}
          >
            <svg width="45" height="45" viewBox="0 0 24 24" fill="white" opacity="0.12">
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM8 14c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </div>
          <div 
            className="absolute text-white opacity-18 paw-print-float"
            style={{ 
              bottom: '25%', 
              left: '8%', 
              transform: 'rotate(40deg)', 
              width: '55px', 
              height: '55px',
              animationDelay: '1s'
            }}
          >
            <svg width="55" height="55" viewBox="0 0 24 24" fill="white" opacity="0.18">
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM8 14c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </div>
          <div 
            className="absolute text-white opacity-10 paw-print-float"
            style={{ 
              top: '60%', 
              right: '15%', 
              transform: 'rotate(-15deg)', 
              width: '40px', 
              height: '40px',
              animationDelay: '1.5s'
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white" opacity="0.1">
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM8 14c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </div>
          
        </div>
          {/* PetReunite Branding */}
          <div className="mb-6">
            <Logo 
              size="xl" 
              showText={true} 
              showTagline={true}
              linkTo="/"
              variant="white"
              className="group"
            />
          </div>

          {/* Concise Content */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-3 leading-tight text-[#2BB6AF] drop-shadow-lg">Start Your Journey!</h2>
            <p className="text-white text-lg leading-relaxed mb-4 drop-shadow-md">
              Become part of a caring community dedicated to helping pets find their way home. Your registration is the first step towards making a real difference.
            </p>
            
            {/* Key Features - Concise */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Connect with pet lovers and animal welfare organizations</p>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Get verified access to report and track lost pets</p>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Open doors to adoption opportunities and volunteer programs</p>
              </div>
              <div className="flex items-center gap-3">
                <PawPrint className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Real-time notifications for pet matches and updates</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Secure platform with verified user profiles</p>
              </div>
            </div>
          </div>

          {/* Login Prompt */}
          <div className="mt-auto pt-4">
            <p className="text-white mb-4 text-base drop-shadow-md">Already have an account? Sign in to continue.</p>
            <Button
              asChild
              variant="outline"
              className="bg-white text-[#2BB6AF] hover:bg-white/95 border-2 border-white font-semibold px-8 py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all w-fit"
            >
              <Link to="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section (Scrollable) */}
      <div className="flex-1 lg:w-[55%] xl:w-[60%] h-screen overflow-y-auto overflow-x-hidden bg-[#F8FAFB] p-4 sm:p-6 md:p-10 lg:p-[40px_50px] xl:p-[60px_80px] form-section">
        <div className="w-full max-w-[600px] mx-auto">
          {/* Mobile Welcome Section */}
          <div className="lg:hidden mb-6 sm:mb-8 text-white p-6 sm:p-8 rounded-xl sm:rounded-[2rem] relative overflow-hidden border-2 border-[#2BB6AF] shadow-xl shadow-[#2BB6AF]/30">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="https://img.freepik.com/premium-photo/heartwarming-scene-various-pets-including-dog-cat-ferret-rabbit-bird-fish-rodent-posing-around-charming-border-collie_1224371-5179.jpg?semt=ais_se_enriched&w=740&q=80"
                alt="Pet illustration background"
                className="w-full h-full object-contain blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF]/50 via-[#239a94]/50 to-[#1a7a75]/50"></div>
            </div>
            <div className="relative z-10">
              <Logo 
                size="lg" 
                showText={true} 
                showTagline={true}
                linkTo="/"
                variant="white"
                className="mb-6 group"
              />
              <h2 className="text-2xl font-bold mb-3 text-[#2BB6AF] drop-shadow-lg">Start Your Journey!</h2>
              <p className="text-white mb-4 text-sm drop-shadow-md">
                Become part of a caring community dedicated to helping pets find their way home. Your registration is the first step.
              </p>
              <p className="text-white mb-4 text-sm drop-shadow-md">Already have an account? Sign in to continue.</p>
              <Button
                asChild
                variant="outline"
                className="bg-white text-[#2BB6AF] hover:bg-white/95 border-2 border-white font-semibold px-6 py-3 rounded-xl"
              >
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E8ECEF]">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600 text-sm sm:text-base">Join our community and start helping pets today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Field 1: Full Name */}
              <div className="mb-5">
                <Label htmlFor="name" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                  <Input
                    id="name"
                    ref={nameInputRef}
                    placeholder="John Doe"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    aria-label="Full name"
                    className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                      errors.name 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Field 2: Email Address */}
              <div className="mb-5">
                <Label htmlFor="email" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-label="Email address"
                    className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                      errors.email 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : emailAvailable === true
                        ? 'border-[#2BB6AF] bg-[#F0FFF4]'
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {errors.email && (
                    <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
                  )}
                  {emailAvailable === true && (
                    <p className="text-[13px] text-[#2BB6AF] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Email available
                    </p>
                  )}
                  {emailAvailable === false && (
                    <p className="text-[13px] text-red-600 font-medium">✗ Email already registered</p>
                  )}
                </div>
              </div>

              {/* Field 3 & 4: Phone and Pincode (Inline) */}
              <div className="flex flex-col md:flex-row gap-4 mb-5">
                {/* Phone */}
                <div className="flex-[1.2] space-y-2">
                  <Label htmlFor="phone" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Phone *
                  </Label>
                  <div className="flex gap-2">
                    <select 
                      value={countryCode} 
                      onChange={(e) => { setCountryCode(e.target.value); setValue('countryCode', e.target.value); }} 
                      className="w-[120px] flex-shrink-0 px-3 py-[14px] border-2 border-[#E8ECEF] rounded-[10px] focus:border-[#2BB6AF] focus:ring-2 focus:ring-[#2BB6AF]/20 focus:outline-none bg-[#F8FAFB] focus:bg-white text-[15px] transition-all duration-300"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                      <Input 
                        id="phone" 
                        placeholder="1234567890" 
                        {...register('phone')} 
                        aria-invalid={!!errors.phone}
                        aria-label="Phone number"
                        className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                          errors.phone 
                            ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                            : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {errors.phone && <p className="text-xs text-red-600 font-medium">{errors.phone.message}</p>}
                    {phoneAvailable === true && <p className="text-xs text-[#2BB6AF] font-medium">✓ Phone available</p>}
                    {phoneAvailable === false && <p className="text-xs text-red-600 font-medium">✗ Phone already registered</p>}
                  </div>
                </div>

                {/* Pincode */}
                <div className="flex-[0.8] space-y-2">
                  <Label htmlFor="pincode" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Pincode *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                    <Input 
                      id="pincode" 
                      placeholder="560001" 
                      {...register('pincode')} 
                      aria-invalid={!!errors.pincode}
                      aria-label="Pincode"
                      className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                        errors.pincode 
                          ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                          : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                      }`}
                    />
                  </div>
                  {errors.pincode && <p className="text-xs text-red-600 font-medium mt-1">{errors.pincode.message}</p>}
                </div>
              </div>

              {/* Field 5: Address */}
              <div className="mb-5">
                <Label htmlFor="address" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                  Address *
                </Label>
                <div className="relative">
                  <Home className="absolute left-4 top-4 h-5 w-5 text-[#666666] pointer-events-none" />
                  <Textarea
                    id="address"
                    placeholder="Street address, apartment, suite, etc."
                    {...register('address')}
                    aria-invalid={!!errors.address}
                    aria-label="Address"
                    rows={3}
                    className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit resize-none ${
                      errors.address 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.address.message}</p>
                )}
              </div>

              {/* Field 6: Landmark */}
              <div className="mb-5">
                <Label htmlFor="landmark" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                  Landmark
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                  <Input
                    id="landmark"
                    placeholder="Nearby landmark (e.g., Near City Park, Opposite Mall)"
                    {...register('landmark')}
                    aria-invalid={!!errors.landmark}
                    aria-label="Landmark"
                    className={`h-auto py-[14px] pl-12 pr-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                      errors.landmark 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                  />
                </div>
                {errors.landmark && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.landmark.message}</p>
                )}
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Age *
                  </Label>
                  <Input 
                    id="age" 
                    type="number" 
                    {...register('age', { valueAsNumber: true })} 
                    aria-invalid={!!errors.age}
                    aria-label="Age"
                    className={`h-auto py-[14px] px-4 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                      errors.age 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                  />
                  {errors.age && <p className="text-xs text-red-600 font-medium mt-1">{errors.age.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Gender *
                  </Label>
                  <select 
                    id="gender" 
                    {...register('gender')} 
                    className={`w-full px-4 py-[14px] text-[15px] border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                      errors.gender 
                        ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                        : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                    }`}
                    aria-invalid={!!errors.gender}
                    aria-label="Gender"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 font-medium mt-1">{errors.gender.message}</p>}
                </div>
              </div>

              {/* Field 7 & 8: Password and Confirm Password (Inline at bottom) */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Password */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="password" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                      aria-label="Password"
                      className={`h-auto py-[14px] pl-12 pr-12 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                        errors.password 
                          ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                          : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2BB6AF] transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.password.message}</p>
                  )}
                  {pwdStrength && (
                    <p className={`text-[13px] font-medium mt-1.5 ${
                      pwdStrength === 'strong' ? 'text-[#2BB6AF]' : 
                      pwdStrength === 'medium' ? 'text-[#FFA726]' : 
                      'text-[#E74C3C]'
                    }`}>
                      Password strength: <span className="capitalize">{pwdStrength}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[14px] font-semibold text-[#2C3E50] mb-2 block">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      {...register('confirmPassword')}
                      aria-invalid={!!errors.confirmPassword}
                      aria-label="Confirm password"
                      className={`h-auto py-[14px] pl-12 pr-12 text-[15px] w-full border-2 rounded-[10px] bg-[#F8FAFB] transition-all duration-300 outline-none font-inherit ${
                        errors.confirmPassword 
                          ? 'border-[#E74C3C] bg-[#FFF5F5]' 
                          : 'border-[#E8ECEF] focus:bg-white focus:border-[#2BB6AF] focus:shadow-[0_0_0_4px_rgba(43,182,175,0.1)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2BB6AF] transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Admin Registration Link */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <ShieldCheck className="inline h-4 w-4 mr-1" />
                  Want to register as an Admin?
                </p>
                <Link
                  to="/auth/register-admin"
                  className="text-sm text-[#2BB6AF] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  Register as Admin <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-4 px-6 bg-[#2BB6AF] hover:bg-[#239a94] text-white text-base font-semibold border-none rounded-xl cursor-pointer mt-8 transition-all duration-300 shadow-[0_4px_16px_rgba(43,182,175,0.3)] hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(43,182,175,0.4)] hover:shadow-[#2BB6AF]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to="/auth/login" 
                    className="text-[#2BB6AF] font-semibold no-underline hover:underline transition-all"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes pawPrintFloat {
          0% {
            transform: translateY(0) rotate(15deg);
          }
          50% {
            transform: translateY(-8px) rotate(15deg);
          }
          100% {
            transform: translateY(0) rotate(15deg);
          }
        }
        
        .paw-print-float {
          animation: pawPrintFloat 3s ease-in-out infinite;
        }
        
        @media (max-width: 1024px) {
          .green-container {
            width: 40%;
            padding: 40px 30px;
          }
        }
        
        @media (max-width: 768px) {
          .green-container {
            width: 100%;
            height: auto;
            min-height: 60vh;
            position: relative;
            padding: 40px 24px;
          }
        }
      `}</style>
    </div>
  );
}
