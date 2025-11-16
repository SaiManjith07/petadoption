import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft, Heart, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
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
  sex: z.string().min(1, 'Please select sex'),
  estimated_age: z.string().optional(),
  size: z.string().optional(),
  microchip_id: z.string().optional(),
  collar_tag: z.string().optional(),
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

      // Create pet report with files directly
      await petsAPI.create({
        report_type: 'found',
        species: data.species,
        breed: data.breed,
        sex: data.sex || 'Unknown',
        estimated_age: data.estimated_age || 'unknown',
        size: data.size || 'Unknown',
        color_primary: data.color,
        microchip_id: data.microchip_id || null,
        collar_tag: data.collar_tag || null,
        distinguishing_marks: data.distinguishing_marks,
        last_seen_or_found_location_text: data.location_found,
        last_seen_or_found_date: data.date_found,
        contact_preference: 'Email',
        allow_public_listing: true,
        photos: photos, // Send File objects directly
      });

      toast({
        title: 'Report submitted!',
        description: 'Your found pet report is pending admin verification.',
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
              alt="Found pets - dogs, cats, and other animals waiting to be reunited"
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
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl leading-tight mb-3">
                      Report a Found Pet
                    </h1>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-white/90 flex-shrink-0 mt-0.5" />
                      <p className="text-base sm:text-lg lg:text-xl text-white/95 drop-shadow-lg leading-relaxed">
                        Help reunite this pet with their family. Provide detailed information for accurate identification and faster reunification.
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
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Pet Details</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Please provide as much information as possible to help identify the pet and reunite them with their family
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-8 px-6 sm:px-8 lg:px-12 py-8">
                
                {/* Section 1: Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  {/* First Row - Species and Breed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Species */}
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

                {/* Breed */}
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
                {/* Sex */}
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

                {/* Color */}
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
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location_found" className="text-sm font-semibold">Location Found *</Label>
                  <Input
                    id="location_found"
                    placeholder="e.g., Central Park, 5th Avenue entrance"
                    className="h-11"
                    {...register('location_found')}
                  />
                  {errors.location_found && (
                    <p className="text-sm text-destructive mt-1">{errors.location_found.message}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date_found" className="text-sm font-semibold">Date Found *</Label>
                  <Input
                    id="date_found"
                    type="date"
                    className="h-11"
                    max={new Date().toISOString().split('T')[0]}
                    {...register('date_found')}
                  />
                  {errors.date_found && (
                    <p className="text-sm text-destructive mt-1">{errors.date_found.message}</p>
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
              </CardContent>

              <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 h-12 border-2 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || photos.length === 0}
            className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
              </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
