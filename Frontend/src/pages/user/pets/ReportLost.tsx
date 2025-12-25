import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft, AlertCircle, Search, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveMatchResults } from '@/components/pets/LiveMatchResults';
import { petsApi } from '@/api';
import { uploadsAPI, chatAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const lostPetSchema = z.object({
  species: z.string().min(1, 'Please enter a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  gender: z.string().min(1, 'Please select gender'),
  estimated_age: z.string().optional(),
  weight: z.string().optional(),
  tag_registration_number: z.string().optional(),
  microchip_id: z.string().optional(),
  collar_tag: z.string().optional(),
  distinguishing_marks: z.string().min(10, 'Please provide detailed description'),
  location_lost: z.string().min(3, 'Please enter the location'),
  location_map_url: z.string().optional(),
  location_latitude: z.string().optional(),
  location_longitude: z.string().optional(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSpecies, debouncedColor, debouncedLocation]);

  const searchMatches = async () => {
    try {
      setIsLoadingMatches(true);
      // Search for found pets that might match
      const params: any = {
        status: 'Found',
      };
      if (debouncedSpecies) {
        params.search = debouncedSpecies;
      }
      if (debouncedLocation) {
        params.location = debouncedLocation;
      }
      const response = await petsApi.getAll(params);
      // Filter results by color if provided
      let results = response.results || response.data || [];
      if (debouncedColor) {
        results = results.filter((pet: any) =>
          pet.description?.toLowerCase().includes(debouncedColor.toLowerCase()) ||
          pet.name?.toLowerCase().includes(debouncedColor.toLowerCase())
        );
      }
      setMatches(results);
    } catch (error) {
      console.error('Error searching matches:', error);
      setMatches([]);
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

    if (photos.length === 0) {
      toast({
        title: 'Photos required',
        description: 'Please upload at least one photo for identification',
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
      ].filter(Boolean);
      const description = descriptionParts.join('\n');

      // Convert age string to number if possible
      let age: number | null = null;
      if (data.estimated_age) {
        const ageMatch = data.estimated_age.match(/\d+/);
        if (ageMatch) {
          age = parseInt(ageMatch[0], 10);
        }
      }

      // Create FormData for multipart/form-data (for file uploads)
      const formData = new FormData();

      // Map fields to Pet model - status will be set to 'Pending' by backend
      formData.append('name', data.species || 'Pet');
      formData.append('breed', data.breed || '');
      // Send species so backend can map it to category_id
      if (data.species) {
        formData.append('species', data.species);
      }
      if (age) formData.append('age', age.toString());
      formData.append('gender', data.gender || 'Unknown');
      if (data.weight) formData.append('weight', data.weight);
      if (data.tag_registration_number) formData.append('tag_registration_number', data.tag_registration_number);
      if (data.location_map_url) formData.append('location_map_url', data.location_map_url);
      if (data.location_latitude) formData.append('location_latitude', data.location_latitude);
      if (data.location_longitude) formData.append('location_longitude', data.location_longitude);
      formData.append('description', description);
      formData.append('location', data.location_lost || '');
      if (data.date_lost) {
        formData.append('last_seen', new Date(data.date_lost).toISOString());
      }

      // Add images - first photo as main image
      if (photos.length > 0) {
        formData.append('image', photos[0]);
        // Additional images can be added later via PetImage model
      }

      // Create pet using new API - will be created with 'Pending' status for admin approval
      await petsApi.create(formData, 'lost');

      toast({
        title: 'Report submitted!',
        description: 'Your lost pet report is pending admin verification. You will be notified once it\'s approved.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      // Display validation errors in a more user-friendly way
      let errorMessage = 'Could not submit report. Please try again.';

      // Check for validation errors in response
      if (error.response?.data) {
        const errorData = error.response.data;

        // If there are field-specific errors, format them nicely
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorFields = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const message = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${fieldName}: ${message}`;
            })
            .join('\n• ');

          errorMessage = `Validation errors:\n• ${errorFields}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // If it's a validation error with multiple fields, show them in a list
      if (errorMessage.includes('Validation failed:') || errorMessage.includes('Validation errors:')) {
        const errorLines = errorMessage.split('\n').slice(1); // Skip first line
        const errorList = errorLines.join('\n• ');
        toast({
          title: 'Validation Failed',
          description: `Please fix the following errors:\n• ${errorList}`,
          variant: 'destructive',
          duration: 10000,
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 relative">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 via-white/95 to-green-50/30"></div>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Single Container with Image and Form */}
        <Card className="shadow-2xl border-2 border-gray-200 bg-white rounded-2xl overflow-hidden">
          {/* Top Image with Text Overlay */}
          <div className="relative w-full h-64 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&q=80"
              alt="Lost pets - dogs, cats, and other animals waiting to be found"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/50" />

            {/* Text Overlay - Better Aligned */}
            <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
              <div className="max-w-4xl">
                <div className="flex items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 flex-shrink-0 shadow-lg">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl leading-tight mb-2 sm:mb-3">
                      Report a Lost Pet
                    </h1>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-white/90 flex-shrink-0 mt-0.5" />
                      <p className="text-base sm:text-lg lg:text-xl text-white/95 drop-shadow-lg leading-relaxed">
                        We'll search for matches as you type and help you reunite with your pet. Provide detailed information for better matching.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-gradient-to-b from-white to-gray-50/50">
            <CardHeader className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 px-4 sm:px-6 md:px-8 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Pet Details</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    Fill in the details below and we'll automatically search for matching found pets in real-time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 sm:space-y-6 md:space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">

                <Alert className="bg-[#E8F8EE] border-2 border-[#2BB6AF]/30 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-[#2BB6AF]" />
                  <AlertDescription className="text-[#239a94] font-semibold">
                    As you fill in the details, we'll automatically search for matching found pets in real-time
                  </AlertDescription>
                </Alert>

                {/* Section 1: Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  </div>

                  {/* First Row - Species and Breed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Species - Manual Input */}
                    <div className="space-y-2">
                      <Label htmlFor="species" className="text-sm font-semibold">Species *</Label>
                      <Input
                        id="species"
                        placeholder="e.g., Dog, Cat, Cow, Bird, etc."
                        className="h-11"
                        {...register('species')}
                      />
                      <p className="text-xs text-gray-500">Enter the type of animal (e.g., Dog, Cat, Bird, Rabbit, etc.)</p>
                      {errors.species && (
                        <p className="text-sm text-destructive mt-1">{errors.species.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed" className="text-sm font-semibold">Breed *</Label>
                      <Input
                        id="breed"
                        placeholder="e.g., Golden Retriever, Mixed Breed"
                        className="h-11"
                        {...register('breed')}
                      />
                      {errors.breed && (
                        <p className="text-sm text-destructive mt-1">{errors.breed.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Second Row - Gender and Color */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-semibold">Gender *</Label>
                      <Select onValueChange={(value) => setValue('gender', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-sm font-semibold">Color/Pattern *</Label>
                      <Input
                        id="color"
                        placeholder="e.g., Golden, Black and White"
                        className="h-11"
                        {...register('color')}
                      />
                      {errors.color && (
                        <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Section 2: Physical Characteristics */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-900">Physical Characteristics</h3>
                  </div>

                  {/* Third Row - Age and Weight */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estimated Age */}
                    <div className="space-y-2">
                      <Label htmlFor="estimated_age" className="text-sm font-semibold">Estimated Age</Label>
                      <Select onValueChange={(value) => setValue('estimated_age', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="puppy/kitten">Puppy/Kitten (0-6 months)</SelectItem>
                          <SelectItem value="young">Young (6 months - 2 years)</SelectItem>
                          <SelectItem value="adult">Adult (2-7 years)</SelectItem>
                          <SelectItem value="senior">Senior (7+ years)</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-sm font-semibold">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 15.5"
                        className="h-11"
                        {...register('weight')}
                      />
                      <p className="text-xs text-gray-500">Enter weight in kilograms</p>
                    </div>
                  </div>

                  {/* Fourth Row - Tag/Registration and Collar/Tag */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tag/Registration Number */}
                    <div className="space-y-2">
                      <Label htmlFor="tag_registration_number" className="text-sm font-semibold">Tag/Registration Number (optional)</Label>
                      <Input
                        id="tag_registration_number"
                        placeholder="e.g., Tag ID, Registration No., License No."
                        className="h-11"
                        {...register('tag_registration_number')}
                      />
                      <p className="text-xs text-gray-500">Enter any tag ID, registration number, or license number</p>
                    </div>

                    {/* Collar/Tag Info */}
                    <div className="space-y-2">
                      <Label htmlFor="collar_tag" className="text-sm font-semibold">Collar/Tag Information</Label>
                      <Input
                        id="collar_tag"
                        placeholder="e.g., Blue collar with name tag 'Max'"
                        className="h-11"
                        {...register('collar_tag')}
                      />
                      <p className="text-xs text-gray-500">Describe any collar, tags, or identification markers</p>
                    </div>
                  </div>

                  {/* Distinguishing Marks - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="distinguishing_marks" className="text-sm font-semibold">Distinguishing Marks & Description *</Label>
                    <Textarea
                      id="distinguishing_marks"
                      rows={5}
                      placeholder="Describe any unique features, markings, collar, tags, behavior, etc."
                      className="resize-none"
                      {...register('distinguishing_marks')}
                    />
                    {errors.distinguishing_marks && (
                      <p className="text-sm text-destructive mt-1">{errors.distinguishing_marks.message}</p>
                    )}
                  </div>
                </div>

                {/* Section 3: Location & Date */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-900">Location & Date</h3>
                  </div>

                  {/* Location and Date */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location_lost" className="text-sm font-semibold">Location Last Seen *</Label>
                      <Input
                        id="location_lost"
                        placeholder="e.g., Central Park, 5th Avenue entrance"
                        className="h-11"
                        {...register('location_lost')}
                      />
                      {errors.location_lost && (
                        <p className="text-sm text-destructive mt-1">{errors.location_lost.message}</p>
                      )}
                    </div>

                    {/* Location Options */}
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <Label className="text-sm font-semibold">Additional Location Information (Optional)</Label>
                      <p className="text-xs text-gray-500 mb-3">You can provide location in one of the following ways:</p>

                      <div className="space-y-3">
                        {/* Map URL Option */}
                        <div className="space-y-2">
                          <Label htmlFor="location_map_url" className="text-xs font-medium">Map URL (Google Maps, etc.)</Label>
                          <Input
                            id="location_map_url"
                            type="url"
                            placeholder="https://maps.google.com/..."
                            className="h-10 text-sm"
                            {...register('location_map_url')}
                          />
                        </div>

                        {/* Coordinates Option */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="location_latitude" className="text-xs font-medium">Latitude</Label>
                            <Input
                              id="location_latitude"
                              type="number"
                              step="any"
                              placeholder="e.g., 28.6139"
                              className="h-10 text-sm"
                              {...register('location_latitude')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location_longitude" className="text-xs font-medium">Longitude</Label>
                            <Input
                              id="location_longitude"
                              type="number"
                              step="any"
                              placeholder="e.g., 77.2090"
                              className="h-10 text-sm"
                              {...register('location_longitude')}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Or use a map app to get coordinates and paste them here</p>
                      </div>
                    </div>

                    {/* Date Lost */}
                    <div className="space-y-2">
                      <Label htmlFor="date_lost" className="text-sm font-semibold">Date Lost *</Label>
                      <Input
                        id="date_lost"
                        type="date"
                        className="h-11"
                        max={new Date().toISOString().split('T')[0]}
                        {...register('date_lost')}
                      />
                      {errors.date_lost && (
                        <p className="text-sm text-destructive mt-1">{errors.date_lost.message}</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Section 4: Photos */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
                  </div>

                  {/* Photos - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="photos" className="text-sm font-semibold">
                      Photos <span className="text-destructive">*</span>
                      <span className="text-xs font-normal text-gray-600 ml-2">(Required for identification)</span>
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="photos"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${photos.length === 0
                            ? 'bg-red-50/50 border-red-300 hover:border-red-400 hover:bg-red-50'
                            : 'bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className={`text-sm font-medium ${photos.length === 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {photos.length > 0
                              ? `${photos.length} photo(s) selected`
                              : 'Click to upload photos or drag and drop (Required)'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB - At least 1 photo required</p>
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-full object-cover rounded-lg border-2 border-border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Match Results */}
                {matches.length > 0 && (
                  <LiveMatchResults matches={matches} onSelectMatch={handleSelectMatch} />
                )}
              </CardContent>

              <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row gap-3 border-t bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || photos.length === 0}
                  className="flex-1 h-11 bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1a7a75] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report (No Match Found)'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
