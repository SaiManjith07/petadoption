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

  // Get all pet data fields
  const distinguishingMarks = pet.distinguishing_marks || pet.physicalCharacteristics?.distinguishingMarks || '';
  const tagRegistrationNumber = pet.tag_registration_number || pet.physicalCharacteristics?.tagRegistrationNumber || '';
  const collarTagInfo = getCollarTagInfo(pet);
  const locationFound = pet.location || pet.location_address || '';
  const mapUrl = pet.location_map_url || '';
  const latitude = pet.location_latitude || '';
  const longitude = pet.location_longitude || '';
  const foundDate = pet.found_date || '';
  const reportedDate = pet.createdAt || pet.created_at || '';

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header Actions */}
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:-translate-x-1 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: pet.name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: 'Link copied!' });
              }
            }}
            className="px-5 py-2.5 rounded-lg border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Full Width Pet Image - 600px height */}
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)] mb-6 bg-white">
          {fullImageUrl && !imageError ? (
            <img
              src={fullImageUrl}
              alt={pet.name || 'Pet'}
              className="w-full h-full object-cover object-center"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB]">
              <ImageIcon className="h-24 w-24 text-[#6B7280] mb-3" />
              <p className="text-[#6B7280] font-medium">No Image Available</p>
            </div>
          )}
          
          {/* Verified Badge */}
          {pet.is_verified && (
            <div className="absolute top-5 right-5 bg-[#10B981] text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </div>
          )}

          {/* Image Navigation */}
          {photos.length > 1 && (
            <>
              <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
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
                          currentPhotoIndex === index ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        {thumbImageUrl && <img src={thumbImageUrl} alt="" className="h-full w-full object-cover" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Row 1: Basic Information Card */}
        <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#1F2937] mb-1">
                  {pet.name || pet.category?.name || 'Unnamed Pet'}
                </h1>
                <p className="text-lg text-[#6B7280]">
                  {pet.breed || pet.category?.name || 'Unknown Breed'}
                </p>
              </div>
              {statusBadge && (
                <Badge className={`${statusBadge.color} text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5`}>
                  {statusBadge.icon} {statusBadge.text}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
              {pet.gender && (
                <div className="flex items-center gap-2.5">
                  <User className="h-5 w-5 text-[#2DD4BF]" />
                  <div>
                    <div className="text-xs text-[#6B7280] font-medium">Gender</div>
                    <div className="text-base font-semibold text-[#1F2937]">{pet.gender}</div>
                  </div>
                </div>
              )}
              {pet.weight && (
                <div className="flex items-center gap-2.5">
                  <Scale className="h-5 w-5 text-[#2DD4BF]" />
                  <div>
                    <div className="text-xs text-[#6B7280] font-medium">Weight</div>
                    <div className="text-base font-semibold text-[#1F2937]">{pet.weight} kg</div>
                  </div>
                </div>
              )}
              {pet.breed && (
                <div className="flex items-center gap-2.5">
                  <PawPrint className="h-5 w-5 text-[#2DD4BF]" />
                  <div>
                    <div className="text-xs text-[#6B7280] font-medium">Breed</div>
                    <div className="text-base font-semibold text-[#1F2937] capitalize">{pet.breed}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-[#2DD4BF]" />
                <div>
                  <div className="text-xs text-[#6B7280] font-medium">Age</div>
                  <div className="text-base font-semibold text-[#1F2937]">{getEstimatedAge(pet)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 2: Color/Pattern Card */}
        {(getPrimaryColor(pet) || getSecondaryColor(pet) || getColorPattern(pet)) && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-3 flex items-center gap-2.5">
                <span className="text-2xl">🎨</span>
                Color/Pattern
              </h3>
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-[#2DD4BF]">
                <div className="text-base text-[#4B5563]">
                  {[getPrimaryColor(pet), getSecondaryColor(pet), getColorPattern(pet)].filter(Boolean).join(' / ') || 'Not specified'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 3: About/Description Card */}
        {(description || distinguishingMarks) && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-[#1F2937] mb-4 flex items-center gap-2.5">
                <span className="text-2xl">📋</span>
                About {pet.name || pet.category?.name || 'Pet'}
              </h3>
              {description && (
                <p className="text-[#4B5563] leading-relaxed mb-4 whitespace-pre-wrap">{description}</p>
              )}
              {distinguishingMarks && (
                <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
                  <h4 className="text-base font-semibold text-[#1F2937] mb-2.5">Distinguishing Marks:</h4>
                  <p className="text-[#4B5563] leading-relaxed">{distinguishingMarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Row 4: Timeline Card */}
        {(foundDate || reportedDate) && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2.5">
                <span className="text-2xl">📅</span>
                Timeline
              </h3>
              <div className="space-y-3">
                {foundDate && (
                  <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                    <span className="text-xl">🔍</span>
                    <div className="flex-1">
                      <div className="text-sm text-[#6B7280] font-medium">Found</div>
                      <div className="text-base font-semibold text-[#1F2937]">
                        {format(new Date(foundDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                )}
                {reportedDate && (
                  <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                    <span className="text-xl">📢</span>
                    <div className="flex-1">
                      <div className="text-sm text-[#6B7280] font-medium">Reported</div>
                      <div className="text-base font-semibold text-[#1F2937]">
                        {format(new Date(reportedDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 5: Location Card */}
        {locationFound && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2.5">
                <span className="text-2xl">📍</span>
                Location Details
              </h3>
              <div className="p-3 bg-[#F9FAFB] rounded-lg mb-4 flex items-center gap-2.5">
                <span className="text-lg">📌</span>
                <div className="text-base font-semibold text-[#1F2937]">{locationFound}</div>
              </div>
              
              {/* Map Preview */}
              {(latitude && longitude) && (
                <div className="w-full h-[250px] bg-[#E5E7EB] rounded-xl mb-4 flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-[#6B7280]" />
                </div>
              )}

              {/* Additional Location Info */}
              {(mapUrl || (latitude && longitude)) && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <h4 className="text-sm font-semibold text-[#1F2937] mb-3">Additional Location Info:</h4>
                  <div className="space-y-2">
                    {mapUrl && (
                      <div className="flex items-start gap-2 text-sm text-[#4B5563]">
                        <span className="text-[#2DD4BF] font-bold text-lg">•</span>
                        <span>Map URL: <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-[#2DD4BF] hover:underline">{mapUrl}</a></span>
                      </div>
                    )}
                    {(latitude && longitude) && (
                      <div className="flex items-start gap-2 text-sm text-[#4B5563]">
                        <span className="text-[#2DD4BF] font-bold text-lg">•</span>
                        <span>Coordinates: {latitude}, {longitude}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Get Directions Button */}
              <Button
                variant="outline"
                className="w-full mt-4 p-3.5 bg-white border-2 border-[#2DD4BF] text-[#2DD4BF] rounded-lg font-semibold text-base hover:bg-[#2DD4BF] hover:text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(45,212,191,0.3)]"
                onClick={() => {
                  let url = '';
                  if (mapUrl) {
                    url = mapUrl;
                  } else if (latitude && longitude) {
                    url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                  } else {
                    const searchQuery = encodeURIComponent(locationFound);
                    url = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
                  }
                  window.open(url, '_blank');
                }}
              >
                <Navigation2 className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Row 6: Tag/Registration Card (if available) */}
        {(tagRegistrationNumber || collarTagInfo) && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2.5">
                <span className="text-2xl">🏷️</span>
                Tag & Registration
              </h3>
              {tagRegistrationNumber && (
                <div className="mb-3">
                  <div className="text-sm text-[#6B7280] font-medium mb-1">Tag/Registration Number:</div>
                  <div className="text-base text-[#1F2937] font-semibold p-2.5 bg-[#F9FAFB] rounded-lg">{tagRegistrationNumber}</div>
                </div>
              )}
              {collarTagInfo && (
                <div>
                  <div className="text-sm text-[#6B7280] font-medium mb-1">Collar/Tag Information:</div>
                  <div className="text-base text-[#1F2937] font-semibold p-2.5 bg-[#F9FAFB] rounded-lg">{collarTagInfo}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Row 7: Reporter Information Card */}
        {pet.posted_by && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2.5">
                <span className="text-2xl">👤</span>
                Reported By
              </h3>
              <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-xl">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {pet.posted_by.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-[#1F2937] truncate">{pet.posted_by.name || 'Unknown'}</div>
                  {pet.posted_by.email && (
                    <div className="text-sm text-[#6B7280] truncate">{pet.posted_by.email}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 8: Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {isUploadedByUser ? (
            <>
              {requiresConsent && pet.adoption_status === 'Found' && !pet.moved_to_adoption && (
                <Button
                  size="lg"
                  onClick={() => setShowConsentDialog(true)}
                  className="w-full bg-[#2DD4BF] hover:bg-[#14B8A6] text-white h-14 rounded-lg font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(45,212,191,0.3)]"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Decision Required ({daysInCare} days)
                </Button>
              )}
            </>
          ) : (
            <>
              {(pet.adoption_status || '').toLowerCase().includes('found') ? (
                <Button 
                  size="lg" 
                  onClick={handleClaimPet} 
                  className="w-full bg-[#2DD4BF] hover:bg-[#14B8A6] text-white h-14 rounded-lg font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(45,212,191,0.3)]"
                >
                  <span className="mr-2">💬</span>
                  This is My Pet - Claim
                </Button>
              ) : (
                <>
                  {isAuthenticated && (
                    <Button
                      size="lg" 
                      className="w-full bg-[#2DD4BF] hover:bg-[#14B8A6] text-white h-14 rounded-lg font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(45,212,191,0.3)]"
                      onClick={() => {
                        const status = (pet.adoption_status || '').toLowerCase();
                        if (status.includes('adopt') || status.includes('available')) {
                          setShowAdoptDialog(true);
                        } else {
                          handleClaimPet();
                        }
                      }}
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Contact Reporter
                    </Button>
                  )}
                  {((pet.adoption_status || '').toLowerCase().includes('adopt') || 
                    (pet.adoption_status || '').toLowerCase().includes('available')) && (
                    <Button 
                      size="lg" 
                      onClick={() => setShowAdoptDialog(true)} 
                      className="w-full bg-[#2DD4BF] hover:bg-[#14B8A6] text-white h-14 rounded-lg font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(45,212,191,0.3)]"
                    >
                      <Heart className="mr-2 h-5 w-5" />
                      Apply to Adopt
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full border-2 border-[#2DD4BF] text-[#2DD4BF] bg-white hover:bg-[#E0F2F1] h-14 rounded-lg font-semibold text-base transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: pet.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: 'Link copied!' });
                  }
                }}
              >
                <span className="mr-2">🔗</span>
                Share Profile
              </Button>
            </>
          )}
        </div>

        {/* Medical Records Accordion (if uploaded by user) */}
        {isUploadedByUser && pet.id && (
          <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB] mb-5">
            <CardContent className="p-0">
              <Accordion type="single" collapsible defaultValue="">
                <AccordionItem value="medical-records" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-[#2DD4BF]" />
                      <span className="font-semibold text-[#1F2937]">Medical Records</span>
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
