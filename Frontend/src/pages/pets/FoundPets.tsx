import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Heart, Sparkles, ShieldCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsApi } from '@/api';
import { chatApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function FoundPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsApi.getAll({ 
        status: 'Found'
      });
      // Handle both paginated and direct array responses
      const petsData = data.results || data.data || data.items || data || [];
      // Normalize pet data
      const normalizedPets = Array.isArray(petsData) ? petsData.map((p: any) => ({
        ...p,
        id: p.id || p._id,
        _id: p.id || p._id,
        createdAt: p.created_at || p.createdAt,
      })) : [];
      setPets(normalizedPets);
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

  const handleClaimPet = async (pet: any) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to claim a pet',
      });
      navigate('/auth/login');
      return;
    }

    try {
      const room = await chatApi.createRoom({
        pet_id: pet.id || pet._id,
        participant_ids: [user?.id || user?._id || ''],
      });
      const roomId = room.id || room._id;
      toast({
        title: 'Chat room created',
        description: 'You can now communicate with the rescuer and admin',
      });
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not create chat room',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 -m-6 lg:-m-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-2xl mt-6 mb-6">
          <div className="px-8 py-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/home')} 
              className="mb-4 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            {/* Title and Icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-lg flex-shrink-0">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  Found Pets
                </h1>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-200 flex-shrink-0" />
                  <p className="text-base sm:text-lg text-green-50">
                    Browse pets that have been found and are waiting to be reunited with their families
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats and Button Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <ShieldCheck className="h-4 w-4 text-green-200" />
                  <span className="text-sm font-semibold">NGO Verified</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-xl font-bold">{pets.length}</span>
                  <span className="text-sm">Active Reports</span>
                </div>
              </div>
              
              <Button 
                className="bg-white text-green-700 hover:bg-green-50 shadow-lg hover:shadow-green-500/20 border-2 border-white/50 font-semibold px-5 py-2.5 text-sm whitespace-nowrap"
                onClick={() => navigate('/pets/new/found')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Report Found Pet
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="py-6">
          {/* Gallery */}
          <PetGallery
            pets={pets}
            loading={loading}
            onActionClick={handleClaimPet}
            actionLabel="This is my pet!"
            theme="green"
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
