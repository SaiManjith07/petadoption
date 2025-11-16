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
import { petsAPI, uploadsAPI, chatAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const lostPetSchema = z.object({
  species: z.string().min(1, 'Please select a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  sex: z.string().min(1, 'Please select sex'),
  estimated_age: z.string().optional(),
  size: z.string().optional(),
  microchip_id: z.string().optional(),
  collar_tag: z.string().optional(),
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

      // Create pet report with files directly
      await petsAPI.create({
        report_type: 'lost',
        species: data.species,
        breed: data.breed,
        sex: data.sex || 'Unknown',
        estimated_age: data.estimated_age || 'unknown',
        size: data.size || 'Unknown',
        color_primary: data.color,
        microchip_id: data.microchip_id || null,
        collar_tag: data.collar_tag || null,
        distinguishing_marks: data.distinguishing_marks,
        last_seen_or_found_location_text: data.location_lost,
        last_seen_or_found_date: data.date_lost,
        contact_preference: 'Email',
        allow_public_listing: true,
        photos: photos, // Send File objects directly
      });

      toast({
        title: 'Report submitted!',
        description: 'Your lost pet report is pending admin verification.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      // Display validation errors in a more user-friendly way
      const errorMessage = error.message || 'Could not submit report. Please try again.';
      
      // If it's a validation error with multiple fields, show them in a list
      if (errorMessage.includes('Validation failed:')) {
        const errorLines = errorMessage.split('\n').slice(1); // Skip "Validation failed:" line
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Single Container with Image and Form */}
        <Card className="shadow-2xl border-2 border-gray-200 bg-white rounded-2xl overflow-hidden">
          {/* Top Image with Text Overlay */}
          <div className="relative w-full h-56 sm:h-64 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&q=80"
              alt="Lost pets - dogs, cats, and other animals waiting to be found"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/50" />
            
            {/* Text Overlay - Better Aligned */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-8">
              <div className="max-w-4xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 flex-shrink-0 shadow-lg">
                    <Search className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl leading-tight mb-3">
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
            <CardHeader className="pt-8 pb-6 px-6 sm:px-8 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Pet Details</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Fill in the details below and we'll automatically search for matching found pets in real-time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-8 px-6 sm:px-8 lg:px-12 py-8">
              
              <Alert className="bg-orange-50 border-2 border-orange-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-900 font-semibold">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="species" className="text-sm font-semibold">Species *</Label>
                  <Select value={species} onValueChange={(value) => setValue('species', value)}>
                    <SelectTrigger id="species" className="h-11">
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

                {/* Second Row - Sex and Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sex" className="text-sm font-semibold">Sex *</Label>
                  <Select onValueChange={(value) => setValue('sex', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && (
                    <p className="text-sm text-destructive mt-1">{errors.sex.message}</p>
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
                
                {/* Third Row - Age and Size */}
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

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm font-semibold">Size</Label>
                  <Select onValueChange={(value) => setValue('size', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                      <SelectItem value="Extra Large">Extra Large</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                {/* Fourth Row - Tag/Registration and Collar/Tag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tag/Registration Number */}
                <div className="space-y-2">
                  <Label htmlFor="microchip_id" className="text-sm font-semibold">Tag/Registration Number</Label>
                  <Input
                    id="microchip_id"
                    placeholder="e.g., Tag ID, Registration No., License No."
                    className="h-11"
                    {...register('microchip_id')}
                  />
                  <p className="text-xs text-gray-500">Enter any tag ID, registration number, license number, or microchip ID</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      photos.length === 0 
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
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
