import { useState } from 'react';
import { PetCard } from './PetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, PawPrint } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Pet {
  id: string;
  status: string;
  species: string;
  breed: string;
  color: string;
  photos: string[];
  location: string;
  date_found_or_lost: string;
  submitted_by: {
    name: string;
  };
}

interface PetGalleryProps {
  pets: Pet[];
  loading?: boolean;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
  showFilters?: boolean;
}

export const PetGallery = ({
  pets,
  loading = false,
  onActionClick,
  actionLabel,
  showFilters = true,
}: PetGalleryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;

    return matchesSearch && matchesSpecies;
  });

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block text-sm font-medium">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by breed, location, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <Label htmlFor="species" className="mb-2 block text-sm font-medium">
                Species
              </Label>
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger id="species">
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Cow">Cow</SelectItem>
                  <SelectItem value="Camel">Camel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="sm:hidden"
            >
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredPets.length} {filteredPets.length === 1 ? 'pet' : 'pets'} found
          </p>
        </div>

        {filteredPets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <PawPrint className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No pets found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onActionClick={onActionClick}
                actionLabel={actionLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
