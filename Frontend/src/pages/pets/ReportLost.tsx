import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveMatchResults } from '@/components/pets/LiveMatchResults';
import { petsAPI, uploadsAPI, chatAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const lostPetSchema = z.object({
  species: z.string().min(1, 'Please select a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  distinguishing_marks: z.string().min(10, 'Please provide detailed description'),
  location_lost: z.string().min(3, 'Please enter the location'),
  date_lost: z.string().min(1, 'Please select the date'),
});

type LostPetForm = z.infer<typeof lostPetSchema>;

export default function ReportLost() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LostPetForm>({
    resolver: zodResolver(lostPetSchema),
  });

  const species = watch('species');
  const color = watch('color');
  const location = watch('location_lost');

  const debouncedSpecies = useDebounce(species, 300);
  const debouncedColor = useDebounce(color, 300);
  const debouncedLocation = useDebounce(location, 300);

  useEffect(() => {
    if (debouncedSpecies || debouncedColor || debouncedLocation) {
      searchMatches();
    }
  }, [debouncedSpecies, debouncedColor, debouncedLocation]);

  const searchMatches = async () => {
    try {
      setIsLoadingMatches(true);
      const results = await petsAPI.getMatches(
        debouncedSpecies,
        debouncedColor,
        debouncedLocation
      );
      setMatches(results);
    } catch (error) {
      console.error('Error searching matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleSelectMatch = async (match: any) => {
    try {
      const { roomId } = await chatAPI.createRoom(match.id, 'current-user-id');
      toast({
        title: 'Match confirmed!',
        description: 'Starting reunification chat with rescuer and admin',
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: LostPetForm) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to report a lost pet',
      });
      navigate('/auth/login');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload photos
      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const { url } = await uploadsAPI.upload(photo);
          return url;
        })
      );

      // Create pet report
      await petsAPI.create({
        ...data,
        photos: photoUrls,
        status: 'Pending Lost Approval',
        location: data.location_lost,
        date_found_or_lost: data.date_lost,
      });

      toast({
        title: 'Report submitted!',
        description: 'Your lost pet report is pending admin verification.',
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Report a Lost Pet</CardTitle>
            <CardDescription>
              We'll search for matches as you type and help you reunite with your pet
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As you fill in the details, we'll automatically search for matching found pets
                </AlertDescription>
              </Alert>

              {/* Form fields - same as ReportFound */}
              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Select value={species} onValueChange={(value) => setValue('species', value)}>
                  <SelectTrigger id="species">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Cow">Cow</SelectItem>
                    <SelectItem value="Camel">Camel</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.species && (
                  <p className="text-sm text-destructive">{errors.species.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  placeholder="e.g., Golden Retriever, Mixed Breed"
                  {...register('breed')}
                />
                {errors.breed && (
                  <p className="text-sm text-destructive">{errors.breed.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color/Pattern *</Label>
                <Input
                  id="color"
                  placeholder="e.g., Golden, Black and White"
                  {...register('color')}
                />
                {errors.color && (
                  <p className="text-sm text-destructive">{errors.color.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="distinguishing_marks">Distinguishing Marks & Description *</Label>
                <Textarea
                  id="distinguishing_marks"
                  rows={4}
                  placeholder="Describe any unique features, markings, collar, tags, behavior, etc."
                  {...register('distinguishing_marks')}
                />
                {errors.distinguishing_marks && (
                  <p className="text-sm text-destructive">{errors.distinguishing_marks.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_lost">Location Last Seen *</Label>
                <Input
                  id="location_lost"
                  placeholder="e.g., Central Park, 5th Avenue entrance"
                  {...register('location_lost')}
                />
                {errors.location_lost && (
                  <p className="text-sm text-destructive">{errors.location_lost.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_lost">Date Lost *</Label>
                <Input
                  id="date_lost"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('date_lost')}
                />
                {errors.date_lost && (
                  <p className="text-sm text-destructive">{errors.date_lost.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Photos (Optional but helpful)</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="photos"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {photos.length > 0
                          ? `${photos.length} photo(s) selected`
                          : 'Click to upload photos'}
                      </p>
                    </div>
                    <input
                      id="photos"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {photos.map((photo, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Live Match Results */}
              {matches.length > 0 && (
                <LiveMatchResults matches={matches} onSelectMatch={handleSelectMatch} />
              )}
            </CardContent>

            <div className="p-6 pt-0 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Report (No Match Found)'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
