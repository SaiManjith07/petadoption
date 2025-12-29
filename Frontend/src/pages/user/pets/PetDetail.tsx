import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, MessageSquare, Heart, Image as ImageIcon,
  Scale, Tag, Hash, Clock, CheckCircle2, Shield, Edit,
  Trash2, Share2, PawPrint, Palette, Award, Info, Navigation2, Phone, Mail, AlertCircle,
  FileText, ExternalLink
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


// Helper component for grid items
const DetailItem = ({ label, icon, value, color }: { label: string, icon: any, value: any, color?: string }) => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-2 mb-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
      <span className={color || 'text-slate-400'}>{icon}</span>
      {label}
    </div>
    <div className="font-semibold text-slate-900 text-sm truncate" title={value?.toString()}>
      {value}
    </div>
  </div>
);

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
  let description = pet.description || pet.additionalInfo?.description || '';
  let colorFromDesc = '';

  // Extract explicit "Color: ..." from description to show in details instead
  const colorMatch = description.match(/Color:\s*([^\n\.]+)/i);
  if (colorMatch) {
    colorFromDesc = colorMatch[1].trim();
    description = description.replace(colorMatch[0], '').trim();
    // Clean up trailing punctuation if it left a weird ending
    description = description.replace(/,\s*$/, '').replace(/\.$/, '') + '.';
  }

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

  // Format Pet ID
  const getFormattedId = (id: number, status: string) => {
    const prefix = status.toLowerCase().includes('found') ? 'FP' :
      status.toLowerCase().includes('lost') ? 'LP' : 'AP';
    return `#${prefix}${id.toString().padStart(6, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Actions */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:bg-white/50"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to list
          </Button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </>
            )}
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
              className="gap-2"
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
          {/* Left Column: Image & Description */}
          <div className="space-y-6">
            <div className="relative w-full aspect-[4/5] lg:aspect-auto rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              {fullImageUrl && !imageError ? (
                <img
                  src={fullImageUrl}
                  alt={pet.name || 'Pet'}
                  className="w-full h-auto object-cover max-h-[70vh]"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="h-[400px] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                  <ImageIcon className="h-24 w-24 mb-3" />
                  <p className="font-medium">No Image Available</p>
                </div>
              )}

              {/* Image Navigation Dots if multiple */}
              {photos.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {photos.slice(0, 5).map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(index); }}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${currentPhotoIndex === index ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/70'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Description Card - Moved to Left Column */}
            <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/30">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {description || "No description provided."}
              </p>
              {distinguishingMarks && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Distinguishing Marks</h4>
                  <p className="text-slate-600 text-sm">{distinguishingMarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6">
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {statusBadge && (
                  <span className={`${statusBadge.color} text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider`}>
                    {statusBadge.text}
                  </span>
                )}
                {pet.is_verified && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                    Approved
                  </span>
                )}
                <div className="flex-1" />
                <span className="text-slate-500 font-mono font-medium">
                  Pet ID: <span className="text-slate-900">{getFormattedId(pet.id, pet.adoption_status || '')}</span>
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{pet.name || 'Unknown Pet'}</h1>
              <div className="flex items-center text-slate-500">
                {locationFound ? (
                  <>
                    <MapPin className="h-4 w-4 mr-1" />
                    {locationFound}
                  </>
                ) : (
                  <span className="italic">Location not specified</span>
                )}
              </div>
            </div>

            {/* Pets Details Card */}
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
              <div className="flex items-center gap-2 mb-6">
                <PawPrint className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">Pets Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                {/* Row 1 */}
                <DetailItem label="TAG" icon={<Tag className="h-4 w-4" />} value={pet.tag_registration_number || collarTagInfo || 'Not Present'} color="text-orange-500" />
                <DetailItem label="PET NAME" icon={<Heart className="h-4 w-4" />} value={(!pet.name || (pet.category?.name && pet.name.toLowerCase() === pet.category.name.toLowerCase())) ? '—' : pet.name} color="text-red-500" />
                <DetailItem label="PET TYPE" icon={<PawPrint className="h-4 w-4" />} value={pet.category?.name || pet.type || '—'} color="text-blue-500" />

                {/* Row 2 */}
                <DetailItem label="BREED" icon={<Award className="h-4 w-4" />} value={pet.breed || '—'} color="text-purple-500" />
                <DetailItem label="GENDER" icon={<User className="h-4 w-4" />} value={pet.gender || '—'} color="text-pink-500" />
                <DetailItem label="COLOR" icon={<Palette className="h-4 w-4" />} value={colorFromDesc || [getPrimaryColor(pet), getSecondaryColor(pet)].filter(Boolean).join(' - ') || '—'} color="text-indigo-500" />

                {/* Row 3 */}
                <DetailItem label="WEIGHT" icon={<Scale className="h-4 w-4" />} value={pet.weight ? `${pet.weight}kg` : '—'} color="text-yellow-600" />
                <DetailItem label="ESTIMATED AGE" icon={<Calendar className="h-4 w-4" />} value={getEstimatedAge(pet)} color="text-orange-600" />
              </div>
            </div>

            {/* Medical Records Accordion (if uploaded by user) - Kept in Right Column */}
            {isUploadedByUser && pet.id && (
              <Card className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E5E7EB]">
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
        </div>

        {/* Location Details - Full Width */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Location Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">FOUND CITY</div>
                  <div className="font-semibold text-slate-900 text-sm truncate">{locationFound ? locationFound.split(',')[0] : '—'}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shrink-0">
                  <Navigation2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">STATE</div>
                  <div className="font-semibold text-slate-900 text-sm truncate">
                    {locationFound && locationFound.split(',').length > 1 ? locationFound.split(',').slice(1).join(',').trim() : 'Telangana'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 shrink-0">
                  <Hash className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">PINCODE</div>
                  <div className="font-semibold text-slate-900 text-sm truncate">
                    {pet.pincode || '—'}
                  </div>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationFound + (pet.pincode ? ` ${pet.pincode}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors group"
              >
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 transition-transform">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">VIEW ON MAP</div>
                  <div className="font-semibold text-blue-600 text-sm truncate flex items-center gap-1">
                    Open Google Maps
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Reported Details - Full Width */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <User className="h-5 w-5 text-indigo-600" />
                Reported Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                    {pet.posted_by?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">REPORTED BY</div>
                    <div className="font-semibold text-slate-900 text-sm truncate">{pet.posted_by?.name || 'Unknown'} (USR{pet.posted_by?.id?.toString().padStart(6, '0')})</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">REPORTED ON</div>
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {reportedDate ? format(new Date(reportedDate), 'dd/MM/yyyy') : '—'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">LAST UPDATED</div>
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {pet.updatedAt ? format(new Date(pet.updatedAt), 'dd/MM/yyyy') : '—'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">FOUND TIME</div>
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {foundDate ? format(new Date(foundDate), 'dd/MM/yyyy') : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
              {isUploadedByUser ? (
                <Button
                  variant="outline"
                  className="w-full h-12 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200 gap-2 font-semibold shadow-sm"
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                >
                  <Edit className="h-4 w-4" /> Manage Pet
                </Button>
              ) : (
                <Button
                  className="w-full h-12 bg-amber-200 hover:bg-amber-300 text-amber-900 gap-2 font-bold shadow-sm"
                  onClick={() => {
                    const status = (pet.adoption_status || '').toLowerCase();
                    if (status.includes('adopt') || status.includes('available')) {
                      setShowAdoptDialog(true);
                    } else {
                      handleClaimPet();
                    }
                  }}
                >
                  <Shield className="h-5 w-5" />
                  Request to Reunite
                </Button>
              )}
            </div>
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
