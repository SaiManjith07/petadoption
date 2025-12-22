import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, User, MessageSquare, Heart, Image as ImageIcon, 
  Scale, Tag, Hash, Clock, CheckCircle2, Shield, Edit, 
  Trash2, Share2, PawPrint, Palette, Award, Info, Navigation2, Phone, Mail, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { petsApi } from '@/api';
import { chatApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { UserPetMedicalRecords } from '@/components/pets/UserPetMedicalRecords';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeletons';

// Helper functions
const getEstimatedAge = (pet: any): string => {
  if (pet.estimatedAge) {
    if (pet.estimatedAge.years !== null && pet.estimatedAge.years !== undefined) {
      return `${pet.estimatedAge.years} ${pet.estimatedAge.years === 1 ? 'year' : 'years'} old`;
    }
    if (pet.estimatedAge.months !== null && pet.estimatedAge.months !== undefined) {
      return `${pet.estimatedAge.months} ${pet.estimatedAge.months === 1 ? 'month' : 'months'} old`;
    }
    if (pet.estimatedAge.ageRange) {
      return pet.estimatedAge.ageRange;
    }
  }
  if (pet.age !== null && pet.age !== undefined) {
    return `${pet.age} ${pet.age === 1 ? 'year' : 'years'} old`;
  }
  if (pet.estimated_age) {
    return pet.estimated_age;
  }
  return 'Not specified';
};

const getPrimaryColor = (pet: any): string | null => {
  if (pet.physicalCharacteristics?.color?.primary) {
    return pet.physicalCharacteristics.color.primary;
  }
  if (pet.color || pet.color_primary) {
    return pet.color || pet.color_primary;
  }
  return null;
};

const getSecondaryColor = (pet: any): string | null => {
  if (pet.physicalCharacteristics?.color?.secondary) {
    return pet.physicalCharacteristics.color.secondary;
  }
  return pet.color_secondary || null;
};

const getColorPattern = (pet: any): string | null => {
  if (pet.physicalCharacteristics?.color?.pattern) {
    return pet.physicalCharacteristics.color.pattern;
  }
  return null;
};

const getCollarTagColor = (pet: any): string | null => {
  if (pet.physicalCharacteristics?.collarTag?.color) {
    return pet.physicalCharacteristics.collarTag.color;
  }
  return null;
};

const getCollarTagInfo = (pet: any): string | null => {
  if (pet.physicalCharacteristics?.collarTag?.tagInfo) {
    return pet.physicalCharacteristics.collarTag.tagInfo;
  }
  if (pet.physicalCharacteristics?.collarTag?.tagNumber) {
    return pet.physicalCharacteristics.collarTag.tagNumber;
  }
  return pet.collar_tag || null;
};

const getColorValue = (colorName: string): string => {
  if (!colorName) return '#e5e7eb';
  const color = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    'black': '#000000', 'white': '#ffffff', 'brown': '#8b4513', 'golden': '#ffd700',
    'gold': '#ffd700', 'yellow': '#ffff00', 'orange': '#ffa500', 'red': '#ff0000',
    'gray': '#808080', 'grey': '#808080', 'blue': '#0000ff', 'green': '#008000',
    'tan': '#d2b48c', 'cream': '#fffdd0', 'beige': '#f5f5dc', 'silver': '#c0c0c0',
  };
  if (colorMap[color]) return colorMap[color];
  for (const [key, value] of Object.entries(colorMap)) {
    if (color.includes(key)) return value;
  }
  return '#e5e7eb';
};

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [daysInCare, setDaysInCare] = useState<number | null>(null);
  const [requiresConsent, setRequiresConsent] = useState(false);
  const [isProcessingConsent, setIsProcessingConsent] = useState(false);
  
  const isUploadedByUser = user?.id && pet && (
    pet.posted_by?.id === user.id || pet.posted_by?._id === user.id ||
    pet.owner?.id === user.id || pet.owner?._id === user.id
  );

  const getStatusBadge = () => {
    if (!pet) return null;
    const status = (pet.adoption_status || pet.status || '').toLowerCase();
    if (status.includes('found')) return { color: 'bg-emerald-500', text: 'Found', icon: '✓' };
    if (status.includes('lost')) return { color: 'bg-orange-500', text: 'Lost', icon: '🔍' };
    if (status.includes('adopt') || status.includes('available')) return { color: 'bg-blue-500', text: 'Adoptable', icon: '❤️' };
    if (status.includes('reunited')) return { color: 'bg-purple-500', text: 'Reunited', icon: '🎉' };
    return { color: 'bg-gray-500', text: pet.adoption_status || 'Unknown', icon: '' };
  };

  useEffect(() => {
    if (id) loadPet();
    else {
      setLoading(false);
      toast({ title: 'Error', description: 'Pet ID is missing', variant: 'destructive' });
      setTimeout(() => navigate('/home'), 2000);
    }
  }, [id]);

  const loadPet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setImageError(false);
      const data = await petsApi.getById(Number(id));
      const petData = {
        ...data,
        id: data.id || data._id,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
      };
      setPet(petData);
      
      // Check if consent is needed (for found pets uploaded by current user)
      // Verify user is the uploader
      const isUserUploader = user?.id && (
        petData.posted_by?.id === user.id || 
        petData.posted_by?._id === user.id ||
        petData.posted_by?.id === Number(user.id) ||
        petData.posted_by?._id === Number(user.id)
      );
      
      if (petData.adoption_status === 'Found' && 
          petData.found_date && 
          !petData.moved_to_adoption && 
          !petData.is_reunited &&
          isUserUploader &&
          isAuthenticated) {
        try {
          const consentCheck = await petsApi.check15DayAdoption(Number(id));
          if (consentCheck.requires_decision) {
            setDaysInCare(consentCheck.days);
            setRequiresConsent(true);
            setShowConsentDialog(true);
          } else {
            setDaysInCare(consentCheck.days);
            setRequiresConsent(false);
          }
        } catch (error) {
          // Silently fail - consent check is optional
          console.log('Could not check consent status:', error);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Could not load pet details', variant: 'destructive' });
      setTimeout(() => navigate('/home'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pet || !isAdmin) return;
    try {
      await petsApi.delete(pet.id);
      toast({ title: 'Success', description: 'Pet report deleted' });
      navigate('/admin');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleClaimPet = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please sign in', description: 'You need to be logged in' });
      navigate('/auth/login');
      return;
    }
    setShowClaimDialog(true);
  };

  const handleSubmitClaimRequest = async () => {
    if (!claimMessage.trim()) {
      toast({ title: 'Message required', variant: 'destructive' });
      return;
    }
    try {
      await chatApi.requestChat(pet.id, user?.id || '', 'claim', claimMessage);
      toast({ title: 'Request sent!', description: 'Awaiting admin approval' });
      setShowClaimDialog(false);
      setClaimMessage('');
    } catch (error) {
      toast({ title: 'Error', description: 'Could not send request', variant: 'destructive' });
    }
  };

  const handleAdoptionApply = async () => {
    if (!adoptMessage.trim()) {
      toast({ title: 'Message required', variant: 'destructive' });
      return;
    }
    try {
      await chatApi.requestChat(pet.id, user?.id || '', 'adoption', adoptMessage);
      toast({ title: 'Application sent!', description: 'Awaiting admin approval' });
      setShowAdoptDialog(false);
      setAdoptMessage('');
    } catch (error) {
      toast({ title: 'Error', description: 'Could not submit', variant: 'destructive' });
    }
  };

  const handleConsentDecision = async (consent: boolean, wantsToKeep: boolean = false) => {
    if (!pet || !id) return;
    
    try {
      setIsProcessingConsent(true);
      const result = await petsApi.check15DayAdoption(Number(id), consent, wantsToKeep);
      
      if (wantsToKeep) {
        toast({ 
          title: 'Pet Ownership Transferred', 
          description: `You are now the owner of "${pet.name}"` 
        });
      } else if (consent) {
        toast({ 
          title: 'Pet Moved to Adoption', 
          description: `"${pet.name}" has been moved to adoption listing. Thank you!` 
        });
      }
      
      setShowConsentDialog(false);
      setRequiresConsent(false);
      // Reload pet to get updated status
      await loadPet();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Could not process your decision', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessingConsent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel Skeleton */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
              </Card>
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <Skeleton className="h-5 w-64 mb-6" />
                  <div className="flex gap-6 mb-6">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
            {/* Right Panel Skeleton */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </CardContent>
              </Card>
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const getPhotos = () => {
    let photos: any[] = [];
    if (Array.isArray(pet.photos) && pet.photos.length > 0) photos = pet.photos;
    else if (Array.isArray(pet.images) && pet.images.length > 0) {
      photos = pet.images.map((img: any) => typeof img === 'string' ? img : img.image_url || img.url || img.image).filter(Boolean);
    } else if (pet.image_url) photos = [pet.image_url];
    else if (pet.image) photos = [pet.image];
    return photos.filter((p: any) => p && (typeof p === 'string' ? p.trim() !== '' : p.url?.trim() !== ''));
  };

  const photos = getPhotos();
  const photoUrl = photos.length > 0 
    ? (typeof photos[currentPhotoIndex] === 'string' ? photos[currentPhotoIndex] : photos[currentPhotoIndex]?.url)
    : null;
  
  const fullImageUrl = photoUrl ? (
    photoUrl.startsWith('http') || photoUrl.startsWith('data:') ? photoUrl : getImageUrl(photoUrl)
  ) : null;

  const statusBadge = getStatusBadge();
  const description = pet.description || pet.additionalInfo?.description || '';

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Breadcrumb Header - Minimalist */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: pet.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: 'Link copied!' });
                  }
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/pets/${pet.id}/edit`)} className="text-slate-600">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Primary Info (8 columns / 65%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Image Card - 16:9 aspect ratio */}
            <Card className="overflow-hidden border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
                  {fullImageUrl && !imageError ? (
                    <img
                      src={fullImageUrl}
                      alt={pet.name || 'Pet'}
                      className="h-full w-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                      onError={() => setImageError(true)}
                      onClick={() => {
                        // Open lightbox/modal for full-size image
                        window.open(fullImageUrl, '_blank');
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#06B6D4]/10 to-[#3B82F6]/5">
                      <ImageIcon className="h-24 w-24 text-[#06B6D4]/40 mb-3" />
                      <p className="text-[#6B7280] font-medium">No Image Available</p>
                    </div>
                  )}
                </div>
                
                {/* Verified Badge - Glassmorphism green pill */}
                {pet.is_verified && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 shadow-lg flex items-center gap-1.5 rounded-full text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                )}

                {/* Image count badge if multiple images */}
                {photos.length > 1 && (
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 shadow-lg rounded-full">
                      {currentPhotoIndex + 1} / {photos.length}
                    </Badge>
                  </div>
                )}

                {/* Photo Thumbnails - Carousel dots at bottom */}
                {photos.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-2 justify-center bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
                      {photos.slice(0, 5).map((photo: any, index: number) => {
                        const thumbUrl = typeof photo === 'string' ? photo : photo?.url;
                        const thumbImageUrl = thumbUrl ? (thumbUrl.startsWith('http') || thumbUrl.startsWith('data:') ? thumbUrl : getImageUrl(thumbUrl)) : null;
                        return (
                          <button
                            key={index}
                            onClick={() => { setCurrentPhotoIndex(index); setImageError(false); }}
                            className={`h-10 w-10 rounded-lg overflow-hidden border-2 transition-all ${
                              currentPhotoIndex === index ? 'border-white scale-110 shadow-lg ring-2 ring-white' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            {thumbImageUrl && <img src={thumbImageUrl} alt="" className="h-full w-full object-cover" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Subtle gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </Card>

            {/* Pet Header - Flex-between layout */}
            <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-900 mb-1">
                      {pet.name || pet.breed || 'Unnamed Pet'}
                    </h1>
                    <p className="text-slate-600 text-base">
                      {pet.category?.name && <span className="capitalize">{pet.category.name}</span>}
                      {pet.category?.name && pet.breed && pet.name !== pet.breed && ' • '}
                      {pet.breed && pet.name !== pet.breed && <span className="capitalize">{pet.breed}</span>}
                    </p>
                  </div>
                  {statusBadge && (
                    <Badge className={`${statusBadge.color} text-white px-4 py-2 rounded-full font-medium`}>
                      {statusBadge.icon} {statusBadge.text}
                    </Badge>
                  )}
                </div>

                {/* Stats Row - Horizontal icon strip */}
                <div className="flex flex-wrap items-center gap-6 py-4 border-t border-slate-200">
                  {pet.gender && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-600" />
                      <span className="text-sm text-slate-600">Gender</span>
                      <span className="text-sm font-medium text-slate-900">{pet.gender}</span>
                    </div>
                  )}
                  {pet.weight && (
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-teal-600" />
                      <span className="text-sm text-slate-600">Weight</span>
                      <span className="text-sm font-medium text-slate-900">{pet.weight} kg</span>
                    </div>
                  )}
                  {pet.breed && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-teal-600" />
                      <span className="text-sm text-slate-600">Breed</span>
                      <span className="text-sm font-medium text-slate-900 capitalize">{pet.breed}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <span className="text-sm text-slate-600">Age</span>
                    <span className="text-sm font-medium text-slate-900">{getEstimatedAge(pet)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Section - About with Tags */}
            {(description || getPrimaryColor(pet) || getSecondaryColor(pet) || getColorPattern(pet) || getCollarTagColor(pet) || getCollarTagInfo(pet)) && (
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    About {pet.name || 'Pet'}
                  </h3>
                  
                  {/* Description */}
                  {description && (
                    <p className="text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">{description}</p>
                  )}
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {getPrimaryColor(pet) && (
                      <Badge variant="outline" className="text-slate-700 border-slate-300">
                        {getPrimaryColor(pet)}
                      </Badge>
                    )}
                    {getSecondaryColor(pet) && (
                      <Badge variant="outline" className="text-slate-700 border-slate-300">
                        {getSecondaryColor(pet)}
                      </Badge>
                    )}
                    {getColorPattern(pet) && (
                      <Badge variant="outline" className="text-slate-700 border-slate-300">
                        {getColorPattern(pet)}
                      </Badge>
                    )}
                    {getCollarTagColor(pet) && (
                      <Badge variant="outline" className="text-slate-700 border-slate-300">
                        {getCollarTagColor(pet)} Collar
                      </Badge>
                    )}
                    {getCollarTagInfo(pet) && (
                      <Badge variant="outline" className="text-slate-700 border-slate-300">
                        Tag: {getCollarTagInfo(pet)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Medical Accordion - Collapsed by default */}
            {isUploadedByUser && pet.id && (
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-0">
                  <Accordion type="single" collapsible defaultValue="">
                    <AccordionItem value="medical-records" className="border-none">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-teal-600" />
                          <span className="font-semibold text-slate-900">Medical Records</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <UserPetMedicalRecords petId={Number(pet.id)} petName={pet.name} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Actions (4 columns / 35%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Action Card */}
            <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white sticky top-24">
              <CardContent className="p-6">
                {/* Reported Date */}
                {pet.createdAt && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Reported Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(pet.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                <Separator className="my-4 bg-slate-200" />

                {/* Action Buttons */}
                {isUploadedByUser ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                      <p className="text-emerald-800 text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> You uploaded this report
                      </p>
                    </div>
                    {requiresConsent && pet.adoption_status === 'Found' && !pet.moved_to_adoption && (
                      <Button
                        size="lg"
                        onClick={() => setShowConsentDialog(true)}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-xl shadow-md"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Decision Required ({daysInCare} days)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(pet.adoption_status || '').toLowerCase().includes('found') ? (
                      <Button 
                        size="lg" 
                        onClick={handleClaimPet} 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-xl shadow-md"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        This is My Pet - Claim
                      </Button>
                    ) : (
                      <>
                        {isAuthenticated && (
                          <Button
                            size="lg" 
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-xl shadow-md"
                            onClick={() => {
                              const status = (pet.adoption_status || '').toLowerCase();
                              if (status.includes('adopt') || status.includes('available')) {
                                setShowAdoptDialog(true);
                              } else {
                                handleClaimPet();
                              }
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Reporter
                          </Button>
                        )}
                        {((pet.adoption_status || '').toLowerCase().includes('adopt') || 
                          (pet.adoption_status || '').toLowerCase().includes('available')) && (
                          <Button 
                            size="lg" 
                            onClick={() => setShowAdoptDialog(true)} 
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-xl shadow-md"
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            Apply to Adopt
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 h-11 rounded-xl"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: pet.name, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: 'Link copied!' });
                        }
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Profile
                    </Button>
                    {(pet.adoption_status === 'Reunited' || pet.is_reunited) && (
                      <div className="p-3 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                        <p className="text-emerald-800 text-sm font-medium">🎉 Successfully reunited!</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Snapshot */}
            {(pet.location || pet.location_address) && (
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-slate-100 rounded-t-2xl overflow-hidden">
                    {/* Mini-map preview - using a placeholder or static map */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                      <MapPin className="h-12 w-12 text-slate-400" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3">
                      <p className="text-white text-sm font-medium truncate">
                        {pet.location_address || pet.location}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
                      onClick={() => {
                        let url = '';
                        if (pet.location_map_url) {
                          url = pet.location_map_url;
                        } else if (pet.location_latitude && pet.location_longitude) {
                          url = `https://www.google.com/maps/dir/?api=1&destination=${pet.location_latitude},${pet.location_longitude}`;
                        } else {
                          const searchQuery = encodeURIComponent(pet.location_address || pet.location || '');
                          url = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
                        }
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation2 className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reporter Profile Compact */}
            {pet.posted_by && (
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                      {pet.posted_by.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{pet.posted_by.name || 'Unknown'}</p>
                      {pet.posted_by.email && (
                        <p className="text-sm text-slate-600 truncate">{pet.posted_by.email}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Card - Timeline only */}
            {pet.createdAt && (
              <Card className="border border-[#E5E7EB] shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                {/* Timeline - Simplified */}
                {pet.createdAt && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-3 font-medium">Timeline</p>
                    <div className="space-y-2">
                      {pet.is_reunited && pet.reunited_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-slate-600">Reunited</span>
                          <span className="text-slate-900 font-medium ml-auto">
                            {format(new Date(pet.reunited_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {pet.moved_to_adoption && (
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-teal-600" />
                          <span className="text-slate-600">Moved to Adoption</span>
                          {pet.moved_to_adoption_date && (
                            <span className="text-slate-900 font-medium ml-auto">
                              {format(new Date(pet.moved_to_adoption_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      )}
                      {pet.found_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <PawPrint className="h-4 w-4 text-amber-500" />
                          <span className="text-slate-600">Found</span>
                          <span className="text-slate-900 font-medium ml-auto">
                            {format(new Date(pet.found_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">Reported</span>
                        <span className="text-slate-900 font-medium ml-auto">
                          {format(new Date(pet.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim This Pet</DialogTitle>
            <DialogDescription>Provide details about why you believe this is your pet.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="claim-message">Your Message *</Label>
            <Textarea
              id="claim-message"
              rows={5}
              placeholder="Describe unique features, markings, or proof..."
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitClaimRequest}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdoptDialog} onOpenChange={setShowAdoptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Adopt</DialogTitle>
            <DialogDescription>Tell us why you'd like to adopt this pet.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="adopt-message">Your Message *</Label>
            <Textarea
              id="adopt-message"
              rows={5}
              placeholder="Tell us about your home and experience with pets..."
              value={adoptMessage}
              onChange={(e) => setAdoptMessage(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdoptDialog(false)}>Cancel</Button>
            <Button onClick={handleAdoptionApply}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet Report</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 15-Day Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#06B6D4]">
              <Clock className="h-5 w-5" />
              Action Required: Pet Adoption Decision
            </DialogTitle>
            <DialogDescription>
              {pet?.name} has been in care for {daysInCare} days. Please make a decision:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-5 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] rounded-xl border border-[#10B981]/30">
              <p className="text-sm text-[#065F46] mb-2 font-semibold">
                <strong>Option 1:</strong> Keep the pet as your own
              </p>
              <p className="text-xs text-[#047857]">
                The pet will be marked as "Adopted" and you will become the owner.
              </p>
            </div>
            <div className="p-5 bg-gradient-to-r from-[#CFFAFE] to-[#A5F3FC] rounded-xl border border-[#06B6D4]/30">
              <p className="text-sm text-[#164E63] mb-2 font-semibold">
                <strong>Option 2:</strong> Move to adoption listing
              </p>
              <p className="text-xs text-[#155E75]">
                The pet will be available for others to adopt.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConsentDialog(false)}
              disabled={isProcessingConsent}
              className="flex-1"
            >
              Decide Later
            </Button>
            <Button 
              onClick={() => handleConsentDecision(false, true)}
              disabled={isProcessingConsent}
              className="flex-1 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white"
            >
              <Heart className="mr-2 h-4 w-4" />
              Keep Pet
            </Button>
            <Button 
              onClick={() => handleConsentDecision(true, false)}
              disabled={isProcessingConsent}
              className="flex-1 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white"
            >
              <PawPrint className="mr-2 h-4 w-4" />
              Move to Adoption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
