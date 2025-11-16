import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    role: z.enum(['user', 'rescuer'], {
      required_error: 'Please select a role',
    }),
    agree_terms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
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

  const role = watch('role');

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
        agree_terms: data.agree_terms,
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PawPrint className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join our community and start helping pets today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              <div className="flex items-center justify-between">
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
                {emailAvailable === true && <p className="text-sm text-green-600">Email available</p>}
                {emailAvailable === false && <p className="text-sm text-destructive">Email already registered</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              {pwdStrength && (
                <p className={`text-sm ${pwdStrength === 'strong' ? 'text-green-600' : pwdStrength === 'medium' ? 'text-yellow-600' : 'text-destructive'}`}>Password strength: {pwdStrength}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={(e) => { setCountryCode(e.target.value); setValue('countryCode', e.target.value); }} className="px-3 py-2 border rounded">
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <Input id="phone" placeholder="1234567890" {...register('phone')} aria-invalid={!!errors.phone} />
                </div>
                <div className="flex items-center justify-between">
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  {phoneAvailable === true && <p className="text-sm text-green-600">Phone available</p>}
                  {phoneAvailable === false && <p className="text-sm text-destructive">Phone already registered</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" placeholder="560001" {...register('pincode')} aria-invalid={!!errors.pincode} />
                {errors.pincode && <p className="text-sm text-destructive">{errors.pincode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" {...register('age', { valueAsNumber: true })} aria-invalid={!!errors.age} />
                {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" {...register('gender')} className="w-full px-3 py-2 border rounded" aria-invalid={!!errors.gender}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input type="checkbox" id="agree_terms" {...register('agree_terms')} />
              <Label htmlFor="agree_terms" className="text-sm">I agree to the Terms of Service and Privacy Policy</Label>
            </div>

            <div className="space-y-3">
              <Label>I am a</Label>
              <RadioGroup value={role} onValueChange={(value) => setValue('role', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="font-normal cursor-pointer">
                    Pet Owner - Looking for lost pets or wanting to adopt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rescuer" id="rescuer" />
                  <Label htmlFor="rescuer" className="font-normal cursor-pointer">
                    Rescuer - I found a pet and want to help
                  </Label>
                </div>
              </RadioGroup>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
