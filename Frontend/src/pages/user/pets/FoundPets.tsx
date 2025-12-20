import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Heart, Sparkles, ShieldCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsApi } from '@/api';
import { chatApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function FoundPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [claimMessage, setClaimMessage] = useState('');
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
        created_at: p.created_at || p.createdAt, // Preserve created_at for PetCard
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

    // Open dialog to collect claim message
    setSelectedPet(pet);
    setShowClaimDialog(true);
  };

  const handleSubmitClaimRequest = async () => {
    if (!claimMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please provide details about why you think this is your pet',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPet) return;

    try {
      const petId = selectedPet.id || selectedPet._id;
      const requesterId = user?.id || user?._id;
      
      if (!petId) {
        toast({
          title: 'Error',
          description: 'Pet ID is missing',
          variant: 'destructive',
      });
        return;
      }
      
      if (!requesterId) {
        toast({
          title: 'Error',
          description: 'User ID is missing. Please log in again.',
          variant: 'destructive',
        });
        return;
      }
      
      await chatApi.requestChat(
        petId,
        requesterId,
        'claim',
        claimMessage
      );
      toast({
        title: 'Chat request sent!',
        description: 'Your request has been sent to admin for approval. Once approved, it will be forwarded to the pet owner.',
      });
      setShowClaimDialog(false);
      setClaimMessage('');
      setSelectedPet(null);
    } catch (error: any) {
      console.error('Chat request error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Request data sent:', {
        petId: selectedPet.id || selectedPet._id,
        requesterId: user?.id || user?._id,
        type: 'claim',
        message: claimMessage
      });
      
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Could not send chat request';
      
      // Show detailed error if available
      const debugInfo = error?.response?.data?.debug_info;
      const fullMessage = debugInfo 
        ? `${errorMessage}\n\nDebug: Pet ID: ${debugInfo.pet_id}, Target ID: ${debugInfo.target_id}`
        : errorMessage;
      
      toast({
        title: 'Error',
        description: fullMessage,
        variant: 'destructive',
      });
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
              alt="Found pets background"
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
                  Found Pets
                </h1>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-700 flex-shrink-0" />
                  <p className="text-base sm:text-lg text-gray-900">
                    Browse pets that have been found and are waiting to be reunited with their families
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
              </div>
              
              <Button 
                className="bg-white text-[#2BB6AF] hover:bg-[#E0F7F5] shadow-lg hover:shadow-[#2BB6AF]/20 border-2 border-white/50 font-semibold px-5 py-2.5 text-sm whitespace-nowrap"
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
            actionLabel="Claim Pet"
            theme="green"
            currentUserId={user?.id}
            showViewButton={true}
          />
        </div>
      </div>

      {/* Claim Pet Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Chat - Claim This Pet</DialogTitle>
            <DialogDescription>
              Provide details about why you believe this is your pet. Your request will be sent to admin for approval first, then forwarded to the pet owner/finder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claim-message">Your Message *</Label>
              <Textarea
                id="claim-message"
                rows={6}
                placeholder="Describe unique features, markings, behavior, or any proof that this is your pet..."
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowClaimDialog(false);
              setClaimMessage('');
              setSelectedPet(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClaimRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
