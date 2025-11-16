import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Match {
  id: string;
  species: string;
  breed: string;
  color: string;
  location: string;
  photos: string[];
  date_found_or_lost: string;
}

interface LiveMatchResultsProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const LiveMatchResults = ({ matches, onSelectMatch }: LiveMatchResultsProps) => {
  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Possible Matches Found!</CardTitle>
        </div>
        <CardDescription>
          We found {matches.length} {matches.length === 1 ? 'pet' : 'pets'} that might match your description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-32 sm:h-32 h-48 overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={match.photos[0]}
                  alt={`${match.species} - ${match.breed}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold">{match.breed}</h4>
                    <p className="text-sm text-muted-foreground">{match.species}</p>
                  </div>
                  <Badge variant="secondary">Found</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{match.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(match.date_found_or_lost), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectMatch(match)}
                  className="mt-auto"
                >
                  This is my pet!
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
