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
        console.log('User role:', userRole);
        if (userRole === 'admin') {
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
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Login</h2>
              <p className="text-gray-600 text-base">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    className="h-12 pl-4 pr-12 border-2 border-gray-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 rounded-lg text-base bg-gray-50 focus:bg-white transition-all"
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Button variant="link" className="px-0 text-xs text-gray-600 hover:text-[#4CAF50] h-auto py-0" asChild>
                    <Link to="/auth/forgot-password">Forgot Password?</Link>
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    className="h-12 pl-4 pr-24 border-2 border-gray-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 rounded-lg text-base bg-gray-50 focus:bg-white transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <Lock className="h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-6"
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
                  <Link to="/auth/register" className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </form>

            {/* Social Login Section */}
            <div className="mt-10">
              <p className="text-center text-sm text-gray-600 mb-5">or login with social platforms</p>
              <div className="flex justify-center gap-4">
                {/* Google */}
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-gray-200 shadow-sm hover:shadow-md"
                  aria-label="Login with Google"
                >
                  <span className="text-lg font-bold text-gray-700">G</span>
                </button>
                {/* Facebook */}
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-gray-200 shadow-sm hover:shadow-md"
                  aria-label="Login with Facebook"
                >
                  <span className="text-lg font-bold text-gray-700">f</span>
                </button>
                {/* GitHub */}
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-gray-200 shadow-sm hover:shadow-md"
                  aria-label="Login with GitHub"
                >
                  <span className="text-lg font-bold text-gray-700">G</span>
                </button>
                {/* LinkedIn */}
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-gray-200 shadow-sm hover:shadow-md"
                  aria-label="Login with LinkedIn"
                >
                  <span className="text-xs font-bold text-gray-700">in</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
