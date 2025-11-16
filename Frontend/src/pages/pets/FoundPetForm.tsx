import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import {
  SpeciesSelector,
  BreedInput,
  SexSelector,
  AgeSelector,
  SizeSelector,
  ColorInput,
  CoatTypeSelector,
  DistinguishingMarksInput,
  MicrochipIdInput,
  CollarTagInput,
  NotesInput,
  LocationInput,
  PincodeInput,
  DateTimeInput,
  ContactPreferenceSelector,
  TagsInput,
  PhotoUploader,
  LocationPicker,
} from '@/components/pets/PetFormFields';

// Back to Home Button
const BackToHomeButton = () => {
  const navigate = useNavigate();
  return (
    <Button variant="outline" className="mb-4" onClick={() => navigate('/')}>← Back to Home</Button>
  );
};
const MatchPreview = ({ matches, onClose }: { matches: any[]; onClose: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Possible Matches Found!</CardTitle>
      <CardDescription>These lost animals might be the one you found</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Found {matches.length} match(es) - Details coming soon</p>
    </CardContent>
  </Card>
);

const FoundPetForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pet-info');

  const [formData, setFormData] = useState({
    species: '',
    breed: '',
    sex: '',
    estimated_age: 'unknown',
    size: 'Unknown',
    color_primary: '',
    color_secondary: '',
    coat_type: 'Unknown',
    distinguishing_marks: '',
    microchip_id: '',
    collar_tag: '',
    behavior_notes: '',
    medical_notes: '',
    last_seen_or_found_date: '',
    last_seen_or_found_location_text: '',
    last_seen_or_found_pincode: '',
    last_seen_or_found_coords: { latitude: '', longitude: '' },
    additional_tags: [],
    contact_preference: '',
    allow_public_listing: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleCoordsChange = useCallback((coords) => {
    setFormData(prev => ({
      ...prev,
      last_seen_or_found_coords: coords,
    }));
  }, []);

  // Debounced matching for found pets (match against lost reports)
  const searchMatches = React.useCallback(
    async (searchData: any) => {
      if (!searchData.species || !searchData.color_primary) return;

      try {
        const params = new URLSearchParams({
          report_type: 'lost', // Look for lost reports when we find an animal
          species: searchData.species,
          color_primary: searchData.color_primary,
          ...(searchData.color_secondary && { color_secondary: searchData.color_secondary }),
          ...(searchData.last_seen_or_found_coords?.latitude && {
            latitude: searchData.last_seen_or_found_coords.latitude,
            longitude: searchData.last_seen_or_found_coords.longitude,
          }),
          ...(searchData.microchip_id && { microchip_id: searchData.microchip_id }),
          limit: '5',
        });

        const res = await fetch(`/api/pets/match/search?${params}`);
        const data = await res.json();

        if (data.success) {
          setMatches(data.matches || []);
          if (data.matches?.length > 0) {
            setShowMatches(true);
          }
        }
      } catch (error) {
        console.error('Error searching matches:', error);
      }
    },
    []
  );

  // Debounce matches search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchMatches(formData);
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData.species, formData.color_primary, formData.microchip_id, searchMatches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();

      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'last_seen_or_found_coords') {
          submitFormData.append(key, JSON.stringify(value));
        } else if (key === 'additional_tags') {
          submitFormData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== '') {
          submitFormData.append(key, String(value));
        }
      });

      submitFormData.append('report_type', 'found');

      // Add photos
      photos.forEach((photo) => {
        submitFormData.append('photos', photo);
      });

      const response = await fetch('/api/pets/found', {
        method: 'POST',
        body: submitFormData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        toast({
          title: 'Error',
          description: data.message || 'Failed to submit found pet report',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success!',
        description: 'Your found pet report has been submitted. Thank you for helping! Our team will review it and contact any potential owners.',
      });

      // Redirect to pet detail
      navigate(`/pets/${data.data._id}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <BackToHomeButton />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Report a Found Pet</h1>
          <p className="mt-2 text-gray-600">Help us reunite this animal with its family. Provide detailed information and photos.</p>
        </div>

        {showMatches && matches.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <MapPin className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              We found {matches.length} potential owner{matches.length !== 1 ? 's' : ''}! Check below to see if anyone reported this pet as lost.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pet-info">Pet Info</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="photos">Photos & Contact</TabsTrigger>
            </TabsList>

            {/* PET INFO TAB */}
            <TabsContent value="pet-info">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Tell us about the pet you found</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SpeciesSelector
                      value={formData.species}
                      onChange={v => handleFieldChange('species', v)}
                      error={errors.species}
                    />
                    <BreedInput
                      value={formData.breed}
                      onChange={v => handleFieldChange('breed', v)}
                      error={errors.breed}
                    />
                    <SexSelector
                      value={formData.sex}
                      onChange={v => handleFieldChange('sex', v)}
                      error={errors.sex}
                    />
                    <AgeSelector
                      value={formData.estimated_age}
                      onChange={v => handleFieldChange('estimated_age', v)}
                      error={errors.estimated_age}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PHYSICAL TAB */}
            <TabsContent value="physical">
              <Card>
                <CardHeader>
                  <CardTitle>Physical Description</CardTitle>
                  <CardDescription>Detailed appearance helps us find the owner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorInput
                      label="Primary Color"
                      value={formData.color_primary}
                      onChange={v => handleFieldChange('color_primary', v)}
                      error={errors.color_primary}
                      required
                    />
                    <ColorInput
                      label="Secondary Color"
                      value={formData.color_secondary}
                      onChange={v => handleFieldChange('color_secondary', v)}
                      error={errors.color_secondary}
                    />
                    <SizeSelector
                      value={formData.size}
                      onChange={v => handleFieldChange('size', v)}
                      error={errors.size}
                    />
                    <CoatTypeSelector
                      value={formData.coat_type}
                      onChange={v => handleFieldChange('coat_type', v)}
                      error={errors.coat_type}
                    />
                  </div>

                  <DistinguishingMarksInput
                    value={formData.distinguishing_marks}
                    onChange={v => handleFieldChange('distinguishing_marks', v)}
                    error={errors.distinguishing_marks}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MicrochipIdInput
                      value={formData.microchip_id}
                      onChange={v => handleFieldChange('microchip_id', v)}
                      error={errors.microchip_id}
                    />
                    <CollarTagInput
                      value={formData.collar_tag}
                      onChange={v => handleFieldChange('collar_tag', v)}
                      error={errors.collar_tag}
                    />
                  </div>

                  <NotesInput
                    label="Behavior Notes"
                    value={formData.behavior_notes}
                    onChange={v => handleFieldChange('behavior_notes', v)}
                    error={errors.behavior_notes}
                    placeholder="e.g., friendly, scared, aggressive"
                  />

                  <NotesInput
                    label="Health Observations"
                    value={formData.medical_notes}
                    onChange={v => handleFieldChange('medical_notes', v)}
                    error={errors.medical_notes}
                    placeholder="e.g., appears injured, matted fur, visible illness"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* LOCATION TAB */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>When & Where Found</CardTitle>
                  <CardDescription>Location helps us locate the owner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DateTimeInput
                    label="Date & Time Found"
                    value={formData.last_seen_or_found_date}
                    onChange={v => handleFieldChange('last_seen_or_found_date', v)}
                    error={errors.last_seen_or_found_date}
                  />

                  <LocationInput
                    value={formData.last_seen_or_found_location_text}
                    onChange={v => handleFieldChange('last_seen_or_found_location_text', v)}
                    error={errors.last_seen_or_found_location_text}
                  />

                  <PincodeInput
                    value={formData.last_seen_or_found_pincode}
                    onChange={v => handleFieldChange('last_seen_or_found_pincode', v)}
                    error={errors.last_seen_or_found_pincode}
                  />

                  <LocationPicker
                    coords={formData.last_seen_or_found_coords}
                    onChange={handleCoordsChange}
                    error={errors.last_seen_or_found_coords}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PHOTOS & CONTACT TAB */}
            <TabsContent value="photos">
              <Card>
                <CardHeader>
                  <CardTitle>Photos & Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <PhotoUploader
                    files={photos}
                    onFilesChange={setPhotos}
                    error={errors.photos}
                  />

                  <TagsInput
                    value={formData.additional_tags}
                    onChange={v => handleFieldChange('additional_tags', v)}
                    error={errors.additional_tags}
                  />

                  <ContactPreferenceSelector
                    value={formData.contact_preference}
                    onChange={v => handleFieldChange('contact_preference', v)}
                    error={errors.contact_preference}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SUBMIT BUTTON */}
          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Found Pet Report'
              )}
            </Button>
          </div>
        </form>

        {/* MATCHES PREVIEW */}
        {showMatches && matches.length > 0 && (
          <div className="mt-12">
            <MatchPreview matches={matches} onClose={() => setShowMatches(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundPetForm;
