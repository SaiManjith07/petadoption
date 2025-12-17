import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { petsApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const editPetSchema = z.object({
  species: z.string().min(1, 'Please select a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  gender: z.string().min(1, 'Please select gender'),
  estimated_age: z.string().optional(),
  weight: z.string().optional(),
  tag_registration_number: z.string().optional(),
  microchip_id: z.string().optional(),
  collar_tag: z.string().optional(),
  distinguishing_marks: z.string().min(10, 'Please provide detailed description'),
  location: z.string().min(3, 'Please enter the location'),
  location_map_url: z.string().optional(),
  location_latitude: z.string().optional(),
  location_longitude: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
});

type EditPetForm = z.infer<typeof editPetSchema>;

function EditPet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditPetForm>({
    resolver: zodResolver(editPetSchema),
  });

  const species = watch('species');

  useEffect(() => {
    if (id) {
      loadPet();
    }
  }, [id]);

  const loadPet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await petsApi.getById(Number(id));
      
      // Check if user owns this pet
      const isOwner = user?.id && (
        data.posted_by?.id === user.id || 
        data.posted_by?._id === user.id ||
        data.posted_by?.id === user._id
      );

      if (!isOwner && !user?.is_admin) {
        toast({
          title: 'Access Denied',
          description: 'You can only edit pets that you posted',
          variant: 'destructive',
        });
        navigate(`/pets/${id}`);
        return;
      }

      setPet(data);
      
      // Pre-populate form with existing data
      const categoryName = data.category?.name || data.species || '';
      setValue('species', categoryName || '');
      setValue('breed', data.breed || '');
      setValue('color', data.color || data.color_primary || '');
      setValue('gender', data.gender || '');
      setValue('estimated_age', data.age?.toString() || data.estimated_age || '');
      setValue('weight', data.weight?.toString() || '');
      setValue('tag_registration_number', data.tag_registration_number || '');
      setValue('microchip_id', data.microchip_id || '');
      setValue('collar_tag', data.collar_tag || '');
      setValue('distinguishing_marks', data.description || data.distinguishing_marks || '');
      setValue('location', data.location || data.location_lost || data.location_found || '');
      setValue('location_map_url', data.location_map_url || '');
      setValue('location_latitude', data.location_latitude?.toString() || '');
      setValue('location_longitude', data.location_longitude?.toString() || '');
      setValue('date', data.date_lost || data.date_found || '');
      setValue('description', data.description || '');

      // Load existing photos
      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        const photoUrls = data.photos.map((photo: any) => {
          if (typeof photo === 'string') {
            return photo.startsWith('http') ? photo : getImageUrl(photo);
          }
          return photo.url || photo.image_url || photo.image || '';
        }).filter(Boolean);
        setExistingPhotos(photoUrls);
      } else if (data.image_url || data.image) {
        const imageUrl = data.image_url || data.image;
        setExistingPhotos([imageUrl.startsWith('http') ? imageUrl : getImageUrl(imageUrl)]);
      }
    } catch (error: any) {
      console.error('Error loading pet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pet details',
        variant: 'destructive',
      });
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const removeExistingPhoto = (photoUrl: string) => {
    setExistingPhotos(existingPhotos.filter(url => url !== photoUrl));
    setPhotosToRemove([...photosToRemove, photoUrl]);
  };

  const onSubmit = async (data: EditPetForm) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to edit a pet',
      });
      navigate('/auth/login');
      return;
    }

    if (!pet) {
      toast({
        title: 'Error',
        description: 'Pet data not loaded',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Build description from multiple fields
      const descriptionParts = [
        data.distinguishing_marks,
        data.color && `Color: ${data.color}`,
        data.microchip_id && `Microchip ID: ${data.microchip_id}`,
        data.collar_tag && `Collar Tag: ${data.collar_tag}`,
        data.description,
      ].filter(Boolean);
      const fullDescription = descriptionParts.join('\n');

      // Convert age string to number if possible
      let age: number | null = null;
      if (data.estimated_age) {
        const ageMatch = data.estimated_age.match(/\d+/);
        if (ageMatch) {
          age = parseInt(ageMatch[0], 10);
        }
      }

      // Create FormData for update
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', pet.name || `Pet ${data.species || ''}`);
      formData.append('breed', data.breed || '');
      if (data.species) {
        formData.append('species', data.species);
      }
      formData.append('color', data.color || '');
      formData.append('gender', data.gender || '');
      if (age !== null) {
        formData.append('age', age.toString());
      }
      if (data.weight) {
        formData.append('weight', data.weight);
      }
      if (data.tag_registration_number) {
        formData.append('tag_registration_number', data.tag_registration_number);
      }
      if (data.microchip_id) {
        formData.append('microchip_id', data.microchip_id);
      }
      if (data.collar_tag) {
        formData.append('collar_tag', data.collar_tag);
      }
      formData.append('description', fullDescription);
      formData.append('location', data.location || '');
      if (data.location_map_url) {
        formData.append('location_map_url', data.location_map_url);
      }
      if (data.location_latitude) {
        formData.append('location_latitude', data.location_latitude);
      }
      if (data.location_longitude) {
        formData.append('location_longitude', data.location_longitude);
      }

      // Add new photos
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      // Update pet using PUT request
      await petsApi.update(Number(id), formData as any);

      toast({
        title: 'Success',
        description: 'Pet details updated successfully',
      });

      navigate(`/pets/${id}`);
    } catch (error: any) {
      console.error('Error updating pet:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'Failed to update pet',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-gray-200 border-t-[#4CAF50] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Pet not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const speciesOptions = ['Dog', 'Cat', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Horse', 'Bird', 'Rabbit', 'Reptile', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/pets/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pet Details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Pet Details</h1>
          <p className="text-gray-600 mt-2">Update the information for this pet</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the pet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="species">
                      Species <span className="text-red-500">*</span>
                    </Label>
                    <Select value={species || ''} onValueChange={(value) => setValue('species', value)}>
                      <SelectTrigger id="species" className={errors.species ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent>
                        {speciesOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.species && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.species.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed">Breed <span className="text-red-500">*</span></Label>
                    <Input
                      id="breed"
                      {...register('breed')}
                      className={errors.breed ? 'border-red-500' : ''}
                    />
                    {errors.breed && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.breed.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color <span className="text-red-500">*</span></Label>
                    <Input
                      id="color"
                      {...register('color')}
                      className={errors.color ? 'border-red-500' : ''}
                    />
                    {errors.color && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.color.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('gender') || ''}
                      onValueChange={(value) => setValue('gender', value)}
                    >
                      <SelectTrigger id="gender" className={errors.gender ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_age">Estimated Age</Label>
                    <Input
                      id="estimated_age"
                      {...register('estimated_age')}
                      placeholder="e.g., 2 years, puppy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      {...register('weight')}
                      placeholder="e.g., 15.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle>Identification</CardTitle>
                <CardDescription>Tags, microchips, and other identifiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag_registration_number">Tag Registration Number</Label>
                    <Input
                      id="tag_registration_number"
                      {...register('tag_registration_number')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="microchip_id">Microchip ID</Label>
                    <Input
                      id="microchip_id"
                      {...register('microchip_id')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collar_tag">Collar Tag</Label>
                    <Input
                      id="collar_tag"
                      {...register('collar_tag')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Distinguishing marks and additional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="distinguishing_marks">
                    Distinguishing Marks <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="distinguishing_marks"
                    {...register('distinguishing_marks')}
                    rows={4}
                    className={errors.distinguishing_marks ? 'border-red-500' : ''}
                    placeholder="Describe any distinguishing features, scars, markings, etc."
                  />
                  {errors.distinguishing_marks && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.distinguishing_marks.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    placeholder="Any additional information about the pet"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Where the pet was found or lost</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    {...register('location')}
                    className={errors.location ? 'border-red-500' : ''}
                    placeholder="Street address, area, landmark"
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_latitude">Latitude</Label>
                    <Input
                      id="location_latitude"
                      type="number"
                      step="any"
                      {...register('location_latitude')}
                      placeholder="e.g., 28.6139"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_longitude">Longitude</Label>
                    <Input
                      id="location_longitude"
                      type="number"
                      step="any"
                      {...register('location_longitude')}
                      placeholder="e.g., 77.2090"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_map_url">Map URL</Label>
                  <Input
                    id="location_map_url"
                    type="url"
                    {...register('location_map_url')}
                    placeholder="Google Maps or other map service URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Update pet photos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Photos */}
                {existingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Photos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingPhotos.map((photoUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photoUrl}
                            alt={`Pet photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(photoUrl)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Photos */}
                <div className="space-y-2">
                  <Label htmlFor="photos">Add New Photos</Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/pets/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2BB6AF] hover:bg-[#239a94]"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPet;
