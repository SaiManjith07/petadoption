import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Search, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

export default function LostPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsApi.getAll({ 
        status: 'Lost'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 -m-6 lg:-m-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative rounded-2xl mt-6 mb-6 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://t3.ftcdn.net/jpg/17/64/50/62/360_F_1764506239_TmV7LZ1610WHrQ6He8UGLGNJYEiSfQlY.jpg"
              alt="Lost pets background"
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
                <Search className="h-7 w-7 text-gray-900" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 drop-shadow-lg">
                  Lost Pets
                </h1>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-700 flex-shrink-0" />
                  <p className="text-base sm:text-lg text-gray-900">
                    Help find these lost pets and reunite them with their worried families
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats and Button Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                  <ShieldCheck className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-semibold">NGO Verified</span>
                </div>
                <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                  <span className="text-xl font-bold">{pets.length}</span>
                  <span className="text-sm">Active Reports</span>
                </div>
                <div className="flex items-center gap-2 text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2BB6AF]">
                  <AlertCircle className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-semibold">Urgent Search</span>
                </div>
              </div>
              
              <Button 
                className="bg-white text-[#2BB6AF] hover:bg-[#E0F7F5] shadow-lg hover:shadow-[#2BB6AF]/20 border-2 border-white/50 font-semibold px-5 py-2.5 text-sm whitespace-nowrap"
                onClick={() => navigate('/pets/new/lost')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Report Lost Pet
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="py-6">
          {/* Gallery */}
          <PetGallery pets={pets} loading={loading} theme="green" />
        </div>
      </div>
    </div>
  );
}
