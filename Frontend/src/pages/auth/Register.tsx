import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

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
    landmark: z.string().min(3, 'Landmark must be at least 3 characters'),
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
        role: data.role,
        pincode: data.pincode,
        age: data.age,
        gender: data.gender,
        phone,
        address: data.address,
        landmark: data.landmark,
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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/check-email?email=${encodeURIComponent(watchedEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setEmailAvailable(!data.exists);
        } else {
          setEmailAvailable(null);
        }
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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/check-phone?phone=${encodeURIComponent(normalized)}`);
        if (res.ok) {
          const data = await res.json();
          setPhoneAvailable(!data.exists);
        } else {
          setPhoneAvailable(null);
        }
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-green-100">
        <CardHeader className="space-y-4 text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <Link to="/" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group hover:bg-white/30 hover:scale-110 transition-all duration-300 cursor-pointer">
            <PawPrint className="h-8 w-8 text-white" />
          </Link>
          <CardTitle className="text-2xl text-white">Create Account</CardTitle>
          <CardDescription className="text-green-100">
            Join our community and start helping pets today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-semibold">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                aria-invalid={!!errors.name}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              {errors.name && (
                <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <div className="flex items-center justify-between">
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
                {emailAvailable === true && <p className="text-sm text-green-600 font-medium">✓ Email available</p>}
                {emailAvailable === false && <p className="text-sm text-destructive font-medium">✗ Email already registered</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                {errors.password && (
                  <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                )}
                {pwdStrength && (
                  <p className={`text-sm font-medium ${pwdStrength === 'strong' ? 'text-green-600' : pwdStrength === 'medium' ? 'text-yellow-600' : 'text-destructive'}`}>
                    Password strength: <span className="capitalize">{pwdStrength}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  aria-invalid={!!errors.confirmPassword}
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone</Label>
                <div className="flex gap-2">
                  <select 
                    value={countryCode} 
                    onChange={(e) => { setCountryCode(e.target.value); setValue('countryCode', e.target.value); }} 
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <Input 
                    id="phone" 
                    placeholder="1234567890" 
                    {...register('phone')} 
                    aria-invalid={!!errors.phone}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  {errors.phone && <p className="text-sm text-destructive font-medium">{errors.phone.message}</p>}
                  {phoneAvailable === true && <p className="text-sm text-green-600 font-medium">✓ Phone available</p>}
                  {phoneAvailable === false && <p className="text-sm text-destructive font-medium">✗ Phone already registered</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-gray-700 font-semibold">Pincode</Label>
                <Input 
                  id="pincode" 
                  placeholder="560001" 
                  {...register('pincode')} 
                  aria-invalid={!!errors.pincode}
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                {errors.pincode && <p className="text-sm text-destructive font-medium">{errors.pincode.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 font-semibold">Address</Label>
              <Input
                id="address"
                placeholder="Street address, apartment, suite, etc."
                {...register('address')}
                aria-invalid={!!errors.address}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              {errors.address && (
                <p className="text-sm text-destructive font-medium">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="landmark" className="text-gray-700 font-semibold">Landmark</Label>
              <Input
                id="landmark"
                placeholder="Nearby landmark (e.g., Near City Park, Opposite Mall)"
                {...register('landmark')}
                aria-invalid={!!errors.landmark}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              {errors.landmark && (
                <p className="text-sm text-destructive font-medium">{errors.landmark.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-gray-700 font-semibold">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  {...register('age', { valueAsNumber: true })} 
                  aria-invalid={!!errors.age}
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                {errors.age && <p className="text-sm text-destructive font-medium">{errors.age.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-gray-700 font-semibold">Gender</Label>
                <select 
                  id="gender" 
                  {...register('gender')} 
                  className="w-full px-3 py-2.5 h-11 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500 focus:outline-none bg-white" 
                  aria-invalid={!!errors.gender}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-sm text-destructive font-medium">{errors.gender.message}</p>}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
