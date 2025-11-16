import { Link } from 'react-router-dom';
import { MapPin, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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

interface PetCardProps {
  pet: Pet;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
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

export const PetCard = ({ pet, onActionClick, actionLabel }: PetCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link to={`/pets/${pet.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={pet.photos[0]}
            alt={`${pet.species} - ${pet.breed}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link to={`/pets/${pet.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {pet.breed}
            </h3>
            <p className="text-sm text-muted-foreground">{pet.species}</p>
          </Link>
          <Badge className={getStatusColor(pet.status)} variant="secondary">
            {pet.status.replace('Listed ', '')}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{format(new Date(pet.date_found_or_lost), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {pet.color && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Color:</span> {pet.color}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link to={`/pets/${pet.id}`}>
            <Info className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        {onActionClick && actionLabel && (
          <Button onClick={() => onActionClick(pet)} className="flex-1">
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
