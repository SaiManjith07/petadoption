import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI, chatAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function FoundPets() {
  const [pets, setPets] = useState([]);
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
      const data = await petsAPI.getAll({ status: 'Listed Found' });
      setPets(data.items);
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
      const { roomId } = await chatAPI.createRoom(pet.id, 'current-user-id');
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Found Pets</h1>
            <p className="mt-2 text-muted-foreground">
              Browse pets that have been found and are waiting to be reunited with their families
            </p>
          </div>
          <Button asChild>
            <a href="/pets/new/found">
              <PlusCircle className="mr-2 h-5 w-5" />
              Report Found Pet
            </a>
          </Button>
        </div>

        {/* Gallery */}
        <PetGallery
          pets={pets}
          loading={loading}
          onActionClick={handleClaimPet}
          actionLabel="This is my pet!"
        />
      </div>
    </div>
  );
}
