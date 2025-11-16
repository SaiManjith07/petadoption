import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { petsAPI, uploadsAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const foundPetSchema = z.object({
  species: z.string().min(1, 'Please select a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  distinguishing_marks: z.string().min(10, 'Please provide detailed description'),
  location_found: z.string().min(3, 'Please enter the location'),
  date_found: z.string().min(1, 'Please select the date'),
});

type FoundPetForm = z.infer<typeof foundPetSchema>;

export default function ReportFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FoundPetForm>({
    resolver: zodResolver(foundPetSchema),
  });

  const species = watch('species');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: FoundPetForm) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to report a found pet',
      });
      navigate('/auth/login');
      return;
    }

    if (photos.length === 0) {
      toast({
        title: 'Photos required',
        description: 'Please upload at least one photo',
        variant: 'destructive',
      });
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
        status: 'Pending Found Approval',
        location: data.location_found,
        date_found_or_lost: data.date_found,
      });

      toast({
        title: 'Report submitted!',
        description: 'Your found pet report is pending admin verification.',
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
            <CardTitle className="text-2xl">Report a Found Pet</CardTitle>
            <CardDescription>
              Help reunite this pet with their family by providing detailed information
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Species */}
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

              {/* Breed */}
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

              {/* Color */}
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

              {/* Distinguishing Marks */}
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

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location_found">Location Found *</Label>
                <Input
                  id="location_found"
                  placeholder="e.g., Central Park, 5th Avenue entrance"
                  {...register('location_found')}
                />
                {errors.location_found && (
                  <p className="text-sm text-destructive">{errors.location_found.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date_found">Date Found *</Label>
                <Input
                  id="date_found"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('date_found')}
                />
                {errors.date_found && (
                  <p className="text-sm text-destructive">{errors.date_found.message}</p>
                )}
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label htmlFor="photos">Photos *</Label>
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
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
