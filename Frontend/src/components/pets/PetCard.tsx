import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Info, Image as ImageIcon, PawPrint, MapPin, Calendar, User } from 'lucide-react';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Pet {
  id?: string;
  _id?: string;
  name?: string;
  status?: string;
  adoption_status?: string; // Backend field
  species?: string;
  category?: {
    name?: string;
    type?: string;
  } | string;
  pet_type?: string;
  type?: string;
  animal_type?: string;
  breed?: string;
  color?: string;
  photos?: Array<string | { url?: string; file_url?: string }>;
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
  created_at?: string;
}

interface PetCardProps {
  pet: Pet;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
  currentUserId?: string;
  showViewButton?: boolean; // Show separate view button alongside action button
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

export const PetCard = ({ pet, onActionClick, actionLabel, currentUserId, showViewButton = false }: PetCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Normalize pet ID
  const petId = pet.id || pet._id || '';
  
  // Get status from either status or adoption_status field
  const petStatus = pet.status || pet.adoption_status || 'Unknown';
  
  // Get species from either species or category field and clean it
  const getCleanPetSpecies = () => {
    // Check multiple possible fields for pet type in order of preference
    let rawSpecies: any = null;
    
    // First, try category.name (most common structure)
    if (pet.category) {
      if (typeof pet.category === 'object' && pet.category !== null) {
        rawSpecies = pet.category.name || pet.category.type || pet.category;
      } else if (typeof pet.category === 'string') {
        rawSpecies = pet.category;
      }
    }
    
    // Fallback to other fields - including name field (as it stores pet type in database)
    if (!rawSpecies || rawSpecies === 'null' || rawSpecies === 'undefined') {
      rawSpecies = pet.species || 
                   pet.name ||  // Name field stores pet type in database
                   pet.pet_type || 
                   pet.type ||
                   pet.animal_type ||
                   'Unknown';
    }
    
    // Convert to string and clean
    if (!rawSpecies || rawSpecies === 'null' || rawSpecies === 'undefined') {
      return 'Unknown';
    }
    
    let cleanSpecies = String(rawSpecies).trim();
    
    // Return Unknown if empty or invalid
    if (!cleanSpecies || cleanSpecies === '') {
      return 'Unknown';
    }
    
    // Remove "Found" or "Lost" prefix from species name
    if (cleanSpecies.toLowerCase().startsWith('found ')) {
      cleanSpecies = cleanSpecies.substring(6).trim();
    } else if (cleanSpecies.toLowerCase().startsWith('lost ')) {
      cleanSpecies = cleanSpecies.substring(5).trim();
    }
    
    // Capitalize first letter and lowercase rest
    if (cleanSpecies && cleanSpecies.length > 0) {
      return cleanSpecies.charAt(0).toUpperCase() + cleanSpecies.slice(1).toLowerCase();
    }
    
    return 'Unknown';
  };
  
  const petSpecies = getCleanPetSpecies();
  
  // Get image from various possible fields
  let photoPath: string | null = null;
  if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
    const firstPhoto = pet.photos[0];
    photoPath = typeof firstPhoto === 'string' 
      ? firstPhoto 
      : (firstPhoto && typeof firstPhoto === 'object' ? (firstPhoto.url || firstPhoto.file_url || null) : null);
  } else if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
    photoPath = pet.images[0]?.image || pet.images[0]?.image_url || null;
  } else if (pet.image) {
    photoPath = pet.image;
  } else if (pet.image_url) {
    photoPath = pet.image_url;
  }
  
  // If it's a data URL, use it directly; otherwise convert
  const photoUrl = photoPath?.startsWith('data:') 
    ? photoPath 
    : photoPath ? getImageUrl(photoPath) : null;
  
  // Map backend status to frontend status format
  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    // Map backend statuses to display labels
    if (status === 'Found') return 'Found';
    if (status === 'Lost') return 'Lost';
    if (status === 'Available for Adoption') return 'Adoptable';
    if (status === 'Adopted') return 'Adopted';
    if (status === 'Pending') return 'Pending';
    if (status === 'Reunited') return 'Reunited';
    // Handle old format
    if (status.includes('Listed')) return status.replace('Listed ', '');
    return status;
  };
  
  const statusLabel = getStatusLabel(petStatus);
  const isFound = petStatus === 'Found' || petStatus === 'Listed Found';
  
  // Check if current user uploaded this pet
  const isUploadedByUser = currentUserId && (
    pet.submitted_by?.id === currentUserId || 
    pet.submitted_by?._id === currentUserId ||
    pet.posted_by?.id === currentUserId ||
    pet.posted_by?._id === currentUserId ||
    (pet as any).owner_id === currentUserId ||
    (pet as any).submitted_by_id === currentUserId ||
    (pet as any).posted_by_id === currentUserId
  );
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-gray-200 hover:border-[#2BB6AF] bg-white rounded-xl flex flex-col h-full">
      <Link to={`/pets/${petId}`} className="block">
        <div className="w-full h-[250px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center rounded-t-xl">
          {photoUrl && !imageError ? (
            <img
              src={photoUrl}
              alt={`${petSpecies} - ${pet.breed || pet.name || 'Pet'}`}
              className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
              <ImageIcon className="h-16 w-16 text-[#2BB6AF] mb-2" />
              <p className="text-sm font-medium text-gray-500">No Image Available</p>
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <Badge 
              className={`${
                isFound 
                  ? 'bg-[#2BB6AF] text-white border-[#239a94]' 
                  : 'bg-[#2BB6AF] text-white border-[#239a94]'
              } font-semibold shadow-md border-2 px-2.5 py-1 text-xs`}
            >
              {statusLabel}
            </Badge>
          </div>
          {isUploadedByUser && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-[#2BB6AF] text-white border-[#239a94] font-semibold shadow-md border-2 px-2.5 py-1 text-xs">
                Your Post
              </Badge>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <Link to={`/pets/${petId}`} className="block">
            <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-1">
              {petSpecies}
            </h3>
          </Link>
          
          {/* Pet Details */}
          <div className="space-y-2">
            {pet.breed && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PawPrint className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium">Breed:</span>
                <span className="truncate">{pet.breed}</span>
              </div>
            )}
            {pet.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium">Location:</span>
                <span className="truncate">{pet.location}</span>
              </div>
            )}
            {pet.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium">Reported:</span>
                <span>{new Date(pet.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
            )}
            {(pet.posted_by?.name || pet.submitted_by?.name) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium">By:</span>
                <span className="truncate">{pet.posted_by?.name || pet.submitted_by?.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 mt-auto">
        {isUploadedByUser ? (
          <Button 
            disabled
            className="w-full bg-gray-400 text-white font-semibold cursor-not-allowed h-10 text-sm opacity-75"
          >
            You uploaded this
          </Button>
        ) : showViewButton && onActionClick && actionLabel ? (
          // Two buttons: View + Action (for Found pets)
          <div className="flex gap-2 w-full">
        <Button 
          variant="outline" 
          asChild 
          className="flex-1 border-2 border-gray-300 hover:bg-[#2BB6AF] hover:border-[#2BB6AF] hover:text-white font-semibold text-gray-700 h-10 text-sm transition-all"
        >
          <Link to={`/pets/${petId}`} className="flex items-center justify-center gap-1.5">
            <Info className="h-4 w-4" />
                View
          </Link>
        </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onActionClick(pet);
              }} 
              className="flex-1 bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1E8E87] text-white font-semibold shadow-md hover:shadow-lg transition-all h-10 text-sm"
            >
              {actionLabel}
            </Button>
          </div>
        ) : onActionClick && actionLabel ? (
          // Single action button (for Lost pets)
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onActionClick(pet);
            }} 
            className="w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1E8E87] text-white font-semibold shadow-md hover:shadow-lg transition-all h-10 text-sm"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button 
              asChild
            className="w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1E8E87] text-white font-semibold shadow-md hover:shadow-lg transition-all h-10 text-sm"
            >
            <Link to={`/pets/${petId}`} className="flex items-center justify-center gap-1.5">
              <Info className="h-4 w-4" />
              View Details
              </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
};
