import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, Heart, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/Logo';
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
      const userData = await login(data.email, data.password);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        const userRole = userData?.role || 'user';
        const isStaff = userData?.is_staff || false;
        if (userRole === 'admin' || userRole === 'sub_admin' || isStaff) {
          navigate('/admin');
        } else {
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
      <div className="hidden lg:flex lg:w-[48%] text-white p-12 flex flex-col justify-between relative overflow-hidden rounded-r-[6rem] h-[90vh] my-auto shadow-2xl shadow-[#2BB6AF]/60">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://img.freepik.com/premium-photo/heartwarming-scene-various-pets-including-dog-cat-ferret-rabbit-bird-fish-rodent-posing-around-charming-border-collie_1224371-5179.jpg?semt=ais_se_enriched&w=740&q=80"
            alt="Pet illustration background"
            className="w-full h-full object-contain blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF]/80 via-[#239a94]/80 to-[#1a7a75]/80"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center flex-1">
          {/* PetReunite Branding */}
          <div className="mb-8">
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight text-white drop-shadow-lg">Welcome</h2>
            <p className="text-white text-lg leading-relaxed mb-6 drop-shadow-lg font-medium">
              Login to continue helping pets find their way home through our trusted platform.
            </p>
            
            {/* Key Features - Concise */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0 drop-shadow-lg" />
                <p className="text-white text-sm drop-shadow-lg font-medium">Report lost & found pets with verified NGO support</p>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-white flex-shrink-0 drop-shadow-lg" />
                <p className="text-white text-sm drop-shadow-lg font-medium">Join community volunteers and shelters</p>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-white flex-shrink-0 drop-shadow-lg" />
                <p className="text-white text-sm drop-shadow-lg font-medium">Adopt rescued animals through verified network</p>
              </div>
            </div>
          </div>

          {/* Register Prompt */}
          <div className="mt-auto pt-8">
            <p className="text-white mb-4 text-base drop-shadow-md font-medium">Don't have an account?</p>
            <Link 
              to="/auth/register"
              className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              Register now
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[52%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-lg">
          {/* Mobile Welcome Section */}
          <div className="lg:hidden mb-8 text-white p-8 rounded-[2rem] relative overflow-hidden border-2 border-[#2BB6AF] shadow-xl shadow-[#2BB6AF]/30">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="https://img.freepik.com/premium-photo/heartwarming-scene-various-pets-including-dog-cat-ferret-rabbit-bird-fish-rodent-posing-around-charming-border-collie_1224371-5179.jpg?semt=ais_se_enriched&w=740&q=80"
                alt="Pet illustration background"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF]/80 via-[#239a94]/80 to-[#1a7a75]/80"></div>
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
              <h2 className="text-2xl font-bold mb-3 text-white drop-shadow-lg">Welcome</h2>
              <p className="text-white mb-4 text-sm drop-shadow-lg font-medium">
                Login to continue helping pets find their way home.
              </p>
              <p className="text-white/90 mb-2 text-xs drop-shadow-md">Don't have an account?</p>
              <Link 
                to="/auth/register"
                className="text-white/90 text-xs underline hover:text-white transition-colors"
              >
                Register here
              </Link>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="w-full max-w-[450px] mx-auto bg-white p-6 md:p-[40px] rounded-xl shadow-2xl shadow-[#2BB6AF]/40 border border-gray-100">
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
                    className="h-auto py-3 px-4 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#2BB6AF] focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,182,175,0.1)]"
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none transition-colors duration-200 hover:text-[#2BB6AF]" aria-hidden="true" />
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
                    className="text-[13px] text-[#2BB6AF] font-medium no-underline hover:underline transition-all"
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
                    className="h-auto py-3 px-4 pr-24 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#2BB6AF] focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,182,175,0.1)]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#666666] hover:text-[#2BB6AF] transition-colors duration-200 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                className="w-full bg-[#2BB6AF] text-white text-base font-semibold py-[14px] px-6 rounded-lg border-none cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#239a94] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] active:bg-[#1a7a75] active:translate-y-0 disabled:bg-[#cccccc] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] mt-6"
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
                    className="text-[#2BB6AF] font-semibold no-underline hover:underline transition-all"
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
