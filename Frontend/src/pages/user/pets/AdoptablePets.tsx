import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, ShieldCheck, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsApi } from '@/api/petsApi';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Pet } from '@/models';

export default function AdoptablePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsApi.getAll({ status: 'Available for Adoption' });
      setPets(data.results || []);
    } catch (error) {
      toast({
        title: 'Error loading pets',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (pet: any) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to apply for adoption',
      });
      navigate('/auth/login');
      return;
    }
    navigate(`/pets/${pet.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 -m-6 lg:-m-8 overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Section */}
        <div className="relative rounded-2xl mt-6 mb-6 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6dXwu7oRIOScfYy05R6s8_7DIdVY_ILWRyw&s"
              alt="Adoptable pets background"
              className="w-full h-full object-cover blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2BB6AF]/50 via-[#239a94]/50 to-[#1a7a75]/50"></div>
          </div>
          <div className="relative px-8 py-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/home')} 
              className="mb-4 text-gray-900 hover:text-black hover:bg-white/50 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            {/* Title and Icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className="h-14 w-14 rounded-xl bg-white/80 backdrop-blur-md flex items-center justify-center border-2 border-[#2BB6AF] shadow-lg flex-shrink-0">
                <Heart className="h-7 w-7 text-gray-900" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 drop-shadow-lg">
                  Pets Available for Adoption
                </h1>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-700 flex-shrink-0" />
                  <p className="text-base sm:text-lg text-gray-900">
                    Give these wonderful pets a loving forever home
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                <ShieldCheck className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold">NGO Verified</span>
              </div>
              <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                <PawPrint className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold">Forever Homes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                <span className="text-xl font-bold">{pets.length}</span>
                <span className="text-sm">Available Pets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="py-6">
          {/* Info Card */}
          <div className="mb-6 rounded-xl border-2 border-[#2BB6AF]/30 bg-gradient-to-br from-[#E0F7F5] to-[#B2E5E0] p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center flex-shrink-0">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to adopt?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  All applications are reviewed by our team. We may request ID, references, and a home check to ensure 
                  the best match for each pet. These animals are looking for their forever families.
                </p>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <PetGallery
            pets={pets}
            loading={loading}
            onActionClick={handleApply}
            actionLabel="Apply to Adopt"
            theme="green"
          />
        </div>
      </div>
    </div>
  );
}
