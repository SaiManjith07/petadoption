import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PawPrint, Eye, EyeOff, Lock, Mail, Heart, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with email:', data.email);
      const userData = await login(data.email, data.password);
      console.log('Login successful, user data:', userData);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        const userRole = userData?.role || 'user';
        const isStaff = userData?.is_staff || false;
        console.log('User role:', userRole, 'is_staff:', isStaff);
        if (userRole === 'admin' || userRole === 'sub_admin' || isStaff) {
          console.log('Navigating to admin panel');
          navigate('/admin');
        } else {
          console.log('Navigating to home');
          navigate('/home');
        }
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error?.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-white">
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-[#4CAF50] via-[#45A049] to-[#2E7D32] text-white p-12 flex flex-col justify-between relative overflow-hidden rounded-r-[6rem] h-[90vh] my-auto">
        <div className="relative z-10 flex flex-col justify-center flex-1">
          {/* PetReunite Branding */}
          <div className="mb-12">
            <Link to="/" className="flex items-center gap-4 mb-6 group cursor-pointer">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl group-hover:bg-white/30 group-hover:scale-105 transition-all duration-300">
                <PawPrint className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white mb-1 group-hover:opacity-90 transition-opacity">PetReunite</h1>
                <p className="text-white/90 text-sm">Helping pets find home</p>
              </div>
            </Link>
          </div>

          {/* Concise Content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Welcome Back!</h2>
            <p className="text-white/95 text-lg leading-relaxed mb-6">
              Login to continue helping pets find their way home through our trusted platform.
            </p>
            
            {/* Key Features - Concise */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                <p className="text-white/90 text-sm">Report lost & found pets with verified NGO support</p>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-white flex-shrink-0" />
                <p className="text-white/90 text-sm">Join community volunteers and shelters</p>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-white flex-shrink-0" />
                <p className="text-white/90 text-sm">Adopt rescued animals through verified network</p>
              </div>
            </div>
          </div>

          {/* Register Prompt */}
          <div className="mt-auto pt-8">
            <p className="text-white/95 mb-4 text-base">Don't have an account? Register to get started.</p>
            <Button
              asChild
              variant="outline"
              className="bg-white text-[#4CAF50] hover:bg-white/95 border-2 border-white font-semibold px-8 py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all w-fit"
            >
              <Link to="/auth/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[52%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-lg">
          {/* Mobile Welcome Section */}
          <div className="lg:hidden mb-8 bg-gradient-to-br from-[#4CAF50] via-[#45A049] to-[#2E7D32] text-white p-8 rounded-[2rem] relative overflow-hidden">
            <div className="relative z-10">
              <Link to="/" className="flex items-center gap-3 mb-6 group cursor-pointer">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg group-hover:bg-white/30 group-hover:scale-105 transition-all duration-300">
                  <PawPrint className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white mb-1 group-hover:opacity-90 transition-opacity">PetReunite</h1>
                  <p className="text-white/90 text-xs">Helping pets find home</p>
                </div>
              </Link>
              <h2 className="text-2xl font-bold mb-3">Welcome Back!</h2>
              <p className="text-white/95 mb-4 text-sm">
                Login to continue helping pets find their way home.
              </p>
              <p className="text-white/95 mb-4 text-sm">Don't have an account? Register to get started.</p>
              <Button
                asChild
                variant="outline"
                className="bg-white text-[#4CAF50] hover:bg-white/95 border-2 border-white font-semibold px-6 py-3 rounded-xl"
              >
                <Link to="/auth/register">Create Account</Link>
              </Button>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="w-full max-w-[450px] mx-auto bg-white p-6 md:p-[40px] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Login</h2>
              <p className="text-gray-600 text-base">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email/Username Field */}
              <div className="mb-5">
                <Label htmlFor="email" className="text-[14px] font-semibold text-[#333333] mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-label="Email address"
                    className="h-auto py-3 px-4 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#4CAF50] focus:outline-none focus:shadow-[0_0_0_3px_rgba(76,175,80,0.1)]"
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none transition-colors duration-200 hover:text-[#4CAF50]" aria-hidden="true" />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="text-[14px] font-semibold text-[#333333] block">
                    Password
                  </Label>
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-[13px] text-[#4CAF50] font-medium no-underline hover:underline transition-all"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-label="Password"
                    className="h-auto py-3 px-4 pr-24 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#4CAF50] focus:outline-none focus:shadow-[0_0_0_3px_rgba(76,175,80,0.1)]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#666666] hover:text-[#4CAF50] transition-colors duration-200 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <Lock className="h-5 w-5 text-[#666666] pointer-events-none" aria-hidden="true" />
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-[#4CAF50] text-white text-base font-semibold py-[14px] px-6 rounded-lg border-none cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#45a049] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] active:bg-[#3d8b40] active:translate-y-0 disabled:bg-[#cccccc] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/auth/register" 
                    className="text-[#4CAF50] font-semibold no-underline hover:underline transition-all"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
