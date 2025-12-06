import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/authApi';
import { tokenStorage } from '@/api/apiClient';

const pinVerificationSchema = z
  .object({
    pin: z.string().length(6, 'PIN must be 6 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type PINVerificationForm = z.infer<typeof pinVerificationSchema>;

interface PINVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function PINVerification({ email, onVerified, onBack }: PINVerificationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PINVerificationForm>({
    resolver: zodResolver(pinVerificationSchema),
  });

  const onSubmit = async (data: PINVerificationForm) => {
    try {
      setIsLoading(true);

      // Verify PIN and create admin account
      const response = await authApi.verifyAdminPIN({
        email: email.toLowerCase(),
        pin: data.pin,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      // Store tokens and user data using tokenStorage
      tokenStorage.setTokens({
        access: response.token,
        refresh: response.refresh,
      });
      
      // Store user data
      tokenStorage.setUser(response.user);

      toast({
        title: 'Success!',
        description: 'Admin account created successfully! Redirecting to admin dashboard...',
      });

      // Small delay to ensure state is updated, then redirect
      setTimeout(() => {
        onVerified();
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || error.message || 'Invalid PIN or email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FA] to-[#E8F5E9] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2BB6AF] to-[#25A39C] text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Verify Your Email</h1>
              <p className="text-white/90">Enter the PIN sent to {email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* PIN Input */}
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-semibold">
                6-Digit Verification PIN *
              </Label>
              <Input
                id="pin"
                type="text"
                placeholder="123456"
                maxLength={6}
                {...register('pin')}
                className="h-14 text-center text-2xl font-bold tracking-widest"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.pin && (
                <p className="text-xs text-red-600">{errors.pin.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Check your email for the verification PIN. It expires in 15 minutes.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Set Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-sm font-semibold">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirm_password')}
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Almost there!</p>
                  <p className="text-green-700">
                    Once verified, you'll be redirected to the admin panel where you can start managing the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-[#2BB6AF] to-[#25A39C] hover:from-[#25A39C] hover:to-[#1E8E87] text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

