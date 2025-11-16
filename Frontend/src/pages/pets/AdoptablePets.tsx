import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// Back to Home Button
const BackToHomeButton = () => {
  const navigate = useNavigate();
  return (
    <Button variant="outline" className="mb-4" onClick={() => navigate('/')}>← Back to Home</Button>
  );
};
import { Heart } from 'lucide-react';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdoptablePets() {
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
      const data = await petsAPI.getAll({ status: 'Available for Adoption' });
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BackToHomeButton />
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pets Available for Adoption</h1>
              <p className="mt-1 text-muted-foreground">
                Give these wonderful pets a loving forever home
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Ready to adopt?</strong> All applications are 
              reviewed by our team. We may request ID, references, and a home check to ensure 
              the best match for each pet.
            </p>
          </div>
        </div>

        {/* Gallery */}
        <PetGallery
          pets={pets}
          loading={loading}
          onActionClick={handleApply}
          actionLabel="Apply to Adopt"
        />
      </div>
    </div>
  );
}
