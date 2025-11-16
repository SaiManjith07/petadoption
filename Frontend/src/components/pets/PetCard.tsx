import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Info, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    id?: string;
    _id?: string;
  };
}

interface PetCardProps {
  pet: Pet;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
  currentUserId?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Listed Found':
      return 'bg-secondary text-secondary-foreground';
    case 'Listed Lost':
      return 'bg-warning text-warning-foreground';
    case 'Available for Adoption':
      return 'bg-primary text-primary-foreground';
    case 'Reunited':
      return 'bg-success text-success-foreground';
    case 'Pending Found Approval':
    case 'Pending Lost Approval':
      return 'bg-pending text-pending-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const PetCard = ({ pet, onActionClick, actionLabel, currentUserId }: PetCardProps) => {
  const [imageError, setImageError] = useState(false);

  const photoPath = Array.isArray(pet.photos) && pet.photos.length > 0
    ? (typeof pet.photos[0] === 'string' 
        ? pet.photos[0] 
        : pet.photos[0]?.url || pet.photos[0]?.file_url || pet.photos[0])
    : null;
  
  // If it's a data URL, use it directly; otherwise convert
  const photoUrl = photoPath?.startsWith('data:') 
    ? photoPath 
    : getImageUrl(photoPath);
  
  const isFound = pet.status === 'Listed Found';
  
  // Check if current user uploaded this pet
  const isUploadedByUser = currentUserId && (
    pet.submitted_by?.id === currentUserId || 
    pet.submitted_by?._id === currentUserId ||
    (pet as any).owner_id === currentUserId ||
    (pet as any).submitted_by_id === currentUserId
  );
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-gray-200 hover:border-green-300 bg-white rounded-xl">
      <Link to={`/pets/${pet.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
          {photoUrl && !imageError ? (
            <img
              src={photoUrl}
              alt={`${pet.species} - ${pet.breed}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
              <ImageIcon className="h-16 w-16 text-green-400 mb-2" />
              <p className="text-sm font-medium text-gray-500">No Image Available</p>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${
                isFound 
                  ? 'bg-green-600 text-white border-green-700' 
                  : 'bg-green-600 text-white border-green-700'
              } font-semibold shadow-md border-2 px-2.5 py-1 text-xs`}
            >
              {pet.status.replace('Listed ', '')}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <Link to={`/pets/${pet.id}`} className="block">
            <h3 className="font-bold text-2xl text-gray-900 mb-2 truncate group-hover:text-green-600 transition-colors">
              {pet.breed || 'Unknown Breed'}
            </h3>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {pet.species || 'Unknown Species'}
            </p>
          </Link>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0 flex gap-3">
        <Button 
          variant="outline" 
          asChild 
          className="flex-1 border-2 border-gray-300 hover:bg-green-50 hover:border-green-300 font-semibold text-gray-700 h-11 transition-all"
        >
          <Link to={`/pets/${pet.id}`} className="flex items-center justify-center">
            <Info className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        {isUploadedByUser ? (
          <Button 
            disabled
            className="flex-1 bg-gray-400 text-white font-semibold cursor-not-allowed h-11"
          >
            You uploaded this
          </Button>
        ) : (
          onActionClick && actionLabel && (
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onActionClick(pet);
              }} 
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all h-11"
            >
              {actionLabel}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};
