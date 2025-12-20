import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/authApi';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetUid, setResetUid] = useState<string | null>(null);

  // Check if we have token and uid in URL params (for email link)
  useEffect(() => {
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');
    if (token && uid) {
      setResetToken(token);
      setResetUid(uid);
      setStep('reset');
    }
  }, [searchParams]);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmitEmail = async (data: EmailForm) => {
    try {
      setIsLoading(true);
      const response = await authApi.forgotPassword(data.email);
      
      // In development, token might be in response
      if (response.token && response.uid) {
        setResetToken(response.token);
        setResetUid(response.uid);
        toast({
          title: 'Reset link sent!',
          description: 'Check your email for the password reset link. For development, you can use the token below.',
        });
        setEmailSent(true);
        // Auto-advance to reset step in development
        if (response.token) {
          setStep('reset');
        }
      } else {
        toast({
          title: 'Reset link sent!',
          description: 'If an account with that email exists, a password reset link has been sent to your email.',
        });
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to send reset link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordForm) => {
    if (!resetToken || !resetUid) {
      toast({
        title: 'Error',
        description: 'Reset token is missing. Please request a new password reset.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword({
        uid: resetUid,
        token: resetToken,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      
      toast({
        title: 'Password reset successful!',
        description: 'Your password has been reset. You can now login with your new password.',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to reset password. The link may have expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-white">
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-[48%] text-white p-12 flex flex-col justify-between relative overflow-hidden rounded-r-[6rem] h-[90vh] my-auto shadow-2xl shadow-green-500/60">
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
          {/* PetReunite Branding */}
          <div className="mb-12">
            <Logo 
              size="xl" 
              showText={true} 
              showTagline={true}
              linkTo="/"
              variant="white"
              className="group"
            />
          </div>

          {/* Content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight text-[#2BB6AF] drop-shadow-lg">
              {step === 'request' ? 'Forgot Password?' : 'Reset Your Password'}
            </h2>
            <p className="text-white text-lg leading-relaxed mb-6 drop-shadow-md">
              {step === 'request' 
                ? 'No worries! Enter your email address and we\'ll send you a link to reset your password.'
                : 'Enter your new password below. Make sure it\'s strong and secure.'}
            </p>
            
            {/* Key Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Secure password reset process</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#2BB6AF] flex-shrink-0 drop-shadow-md" />
                <p className="text-white text-sm drop-shadow-md">Quick and easy recovery</p>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-auto pt-8">
            <Button
              asChild
              variant="outline"
              className="bg-white text-[#2BB6AF] hover:bg-white/95 border-2 border-white font-semibold px-8 py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all w-fit"
            >
              <Link to="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2 inline" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 lg:w-[52%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-lg">
          {/* Mobile Welcome Section */}
          <div className="lg:hidden mb-8 text-white p-8 rounded-[2rem] relative overflow-hidden border-2 border-[#2BB6AF] shadow-xl shadow-[#2BB6AF]/30">
            <div className="absolute inset-0">
              <img
                src="https://img.freepik.com/premium-photo/heartwarming-scene-various-pets-including-dog-cat-ferret-rabbit-bird-fish-rodent-posing-around-charming-border-collie_1224371-5179.jpg?semt=ais_se_enriched&w=740&q=80"
                alt="Pet illustration background"
                className="w-full h-full object-contain"
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
              <h2 className="text-2xl font-bold mb-3 text-[#2BB6AF] drop-shadow-lg">
                {step === 'request' ? 'Forgot Password?' : 'Reset Password'}
              </h2>
              <Button
                asChild
                variant="outline"
                className="bg-white text-[#2BB6AF] hover:bg-white/95 border-2 border-white font-semibold px-6 py-3 rounded-xl"
              >
                <Link to="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2 inline" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-[450px] mx-auto bg-white p-6 md:p-[40px] rounded-xl shadow-2xl shadow-[#2BB6AF]/30">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {step === 'request' ? 'Forgot Password' : 'Reset Password'}
              </h2>
              <p className="text-gray-600 text-base">
                {step === 'request' 
                  ? 'Enter your email to receive a password reset link'
                  : 'Enter your new password below'}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-5">
                {/* Email Field */}
                <div className="mb-5">
                  <Label htmlFor="email" className="text-[14px] font-semibold text-[#333333] mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...registerEmail('email')}
                      aria-invalid={!!emailErrors.email}
                      className="h-auto py-3 px-4 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#2BB6AF] focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,182,175,0.1)]"
                    />
                    <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" />
                  </div>
                  {emailErrors.email && (
                    <p className="text-xs text-red-600 font-medium mt-1">{emailErrors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#2BB6AF] text-white text-base font-semibold py-[14px] px-6 rounded-lg border-none cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#239a94] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] active:bg-[#1a7a75] active:translate-y-0 disabled:bg-[#cccccc] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                {emailSent && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      If an account with that email exists, a password reset link has been sent.
                    </p>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmitReset(onSubmitReset)} className="space-y-5">
                {/* New Password Field */}
                <div className="mb-5">
                  <Label htmlFor="new_password" className="text-[14px] font-semibold text-[#333333] mb-2 block">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      {...registerReset('new_password')}
                      aria-invalid={!!resetErrors.new_password}
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
                      <Lock className="h-5 w-5 text-[#666666] pointer-events-none" />
                    </div>
                  </div>
                  {resetErrors.new_password && (
                    <p className="text-xs text-red-600 font-medium mt-1">{resetErrors.new_password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="mb-5">
                  <Label htmlFor="confirm_password" className="text-[14px] font-semibold text-[#333333] mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      {...registerReset('confirm_password')}
                      aria-invalid={!!resetErrors.confirm_password}
                      className="h-auto py-3 px-4 pr-24 text-[15px] bg-[#F5F7FA] border-2 border-transparent rounded-lg w-full transition-all duration-300 focus:bg-white focus:border-[#2BB6AF] focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,182,175,0.1)]"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-[#666666] hover:text-[#2BB6AF] transition-colors duration-200 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <Lock className="h-5 w-5 text-[#666666] pointer-events-none" />
                    </div>
                  </div>
                  {resetErrors.confirm_password && (
                    <p className="text-xs text-red-600 font-medium mt-1">{resetErrors.confirm_password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#2BB6AF] text-white text-base font-semibold py-[14px] px-6 rounded-lg border-none cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#239a94] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] active:bg-[#1a7a75] active:translate-y-0 disabled:bg-[#cccccc] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link 
                  to="/auth/login" 
                  className="text-[#2BB6AF] font-semibold no-underline hover:underline transition-all"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

