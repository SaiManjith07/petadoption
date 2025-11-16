import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function LostPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsAPI.getAll({ status: 'Listed Lost' });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lost Pets</h1>
            <p className="mt-2 text-muted-foreground">
              Help find these lost pets and reunite them with their worried families
            </p>
          </div>
          <Button asChild>
            <a href="/pets/new/lost">
              <PlusCircle className="mr-2 h-5 w-5" />
              Report Lost Pet
            </a>
          </Button>
        </div>

        {/* Gallery */}
        <PetGallery pets={pets} loading={loading} />
      </div>
    </div>
  );
}
