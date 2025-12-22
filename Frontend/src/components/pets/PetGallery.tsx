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
  id?: string;
  _id?: string;
  status?: string;
  adoption_status?: string;
  species?: string;
  category?: {
    name?: string;
  };
  breed?: string;
  color?: string;
  photos?: string[];
  images?: Array<{ image?: string; image_url?: string }>;
  image?: string;
  image_url?: string;
  location?: string;
  pincode?: string;
  date_found_or_lost?: string;
  last_seen?: string;
  submitted_by?: {
    name?: string;
    id?: string;
    _id?: string;
  };
  posted_by?: {
    name?: string;
    email?: string;
    id?: string;
    _id?: string;
  };
}

interface PetGalleryProps {
  pets: Pet[];
  loading?: boolean;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
  showFilters?: boolean;
  theme?: 'green' | 'orange' | 'blue';
  currentUserId?: string;
  showViewButton?: boolean;
}

export const PetGallery = ({
  pets,
  loading = false,
  onActionClick,
  actionLabel,
  showFilters = true,
  theme = 'green',
  currentUserId,
  showViewButton = false,
}: PetGalleryProps) => {
  const themeColors = {
    green: {
      accent: 'from-green-500 to-emerald-600',
      border: 'border-green-500',
      text: 'text-[#2BB6AF]',
      bg: 'bg-[#E8F8EE]',
    },
    orange: {
      accent: 'from-orange-500 to-amber-600',
      border: 'border-orange-500',
      text: 'text-[#2BB6AF]',
      bg: 'bg-[#E8F8EE]',
    },
    blue: {
      accent: 'from-blue-500 to-indigo-600',
      border: 'border-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  };
  
  const colors = themeColors[theme];
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const filteredPets = pets.filter((pet) => {
    const breed = pet.breed || '';
    const location = pet.location || '';
    const color = pet.color || '';
    const species = (pet.species || pet.category?.name || '').toString().trim();
    
    const matchesSearch = !searchTerm || (
      breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      species.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Case-insensitive species matching
    const matchesSpecies = speciesFilter === 'all' || 
      species.toLowerCase() === speciesFilter.toLowerCase();

    return matchesSearch && matchesSpecies;
  });

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
    <div className="space-y-8 w-full overflow-x-hidden">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1 w-12 bg-gradient-to-r ${colors.accent} rounded-full`} />
            <h2 className="text-xl font-bold text-gray-900">Search & Filter</h2>
          </div>
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-3 block text-sm font-semibold text-gray-700">
                Search Pets
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by breed, location, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-12 h-12 border-2 border-gray-200 rounded-xl text-base ${
                    theme === 'green' ? 'focus:border-green-500 focus:ring-green-500' :
                    theme === 'orange' ? 'focus:border-orange-500 focus:ring-orange-500' :
                    'focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <Label htmlFor="species" className="mb-3 block text-sm font-semibold text-gray-700">
                Species
              </Label>
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger id="species" className={`h-12 border-2 border-gray-200 rounded-xl ${
                  theme === 'green' ? 'focus:border-green-500' :
                  theme === 'orange' ? 'focus:border-orange-500' :
                  'focus:border-blue-500'
                }`}>
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Cow">Cow</SelectItem>
                  <SelectItem value="Buffalo">Buffalo</SelectItem>
                  <SelectItem value="Goat">Goat</SelectItem>
                  <SelectItem value="Sheep">Sheep</SelectItem>
                  <SelectItem value="Horse">Horse</SelectItem>
                  <SelectItem value="Donkey">Donkey</SelectItem>
                  <SelectItem value="Camel">Camel</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                  <SelectItem value="Hen">Hen</SelectItem>
                  <SelectItem value="Duck">Duck</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Available Pets
            </h3>
            <p className="text-sm text-gray-600">
              Showing <span className={`font-semibold ${colors.text}`}>{filteredPets.length}</span> {filteredPets.length === 1 ? 'pet' : 'pets'} found
            </p>
          </div>
        </div>

        {filteredPets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white py-24 px-6">
            <div className={`h-24 w-24 rounded-full ${colors.bg} flex items-center justify-center mb-6`}>
              <PawPrint className={`h-12 w-12 ${colors.text}`} />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No pets found</h3>
            <p className="text-base text-gray-600 text-center max-w-md">
              Try adjusting your search filters or check back later for new found pets.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-full">
            {filteredPets.map((pet) => {
              const petId = pet.id || pet._id || '';
              return (
                <PetCard
                  key={petId}
                  pet={pet}
                  onActionClick={onActionClick}
                  actionLabel={actionLabel}
                  currentUserId={currentUserId}
                  showViewButton={showViewButton}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
