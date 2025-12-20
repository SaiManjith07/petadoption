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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2BB6AF] border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-500">Loading pet details...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
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
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/pets/${pet.id}/edit`)}>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Image Section */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  {fullImageUrl && !imageError ? (
                    <img
                      src={fullImageUrl}
                      alt={pet.name || 'Pet'}
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2BB6AF]/10 to-[#2BB6AF]/5">
                      <ImageIcon className="h-24 w-24 text-[#2BB6AF]/40 mb-3" />
                      <p className="text-gray-400 font-medium">No Image Available</p>
                    </div>
                  )}
                </div>
                
                {/* Verified Badge */}
                {pet.is_verified && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1.5 shadow-lg flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                )}

                {/* Photo Thumbnails */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 justify-center bg-black/60 backdrop-blur-md rounded-lg p-2">
                      {photos.slice(0, 5).map((photo: any, index: number) => {
                        const thumbUrl = typeof photo === 'string' ? photo : photo?.url;
                        const thumbImageUrl = thumbUrl ? (thumbUrl.startsWith('http') || thumbUrl.startsWith('data:') ? thumbUrl : getImageUrl(thumbUrl)) : null;
                        return (
                          <button
                            key={index}
                            onClick={() => { setCurrentPhotoIndex(index); setImageError(false); }}
                            className={`h-12 w-12 rounded-md overflow-hidden border-2 transition-all ${
                              currentPhotoIndex === index ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            {thumbImageUrl && <img src={thumbImageUrl} alt="" className="h-full w-full object-cover" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Pet Name & Basic Info */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {pet.name || pet.breed || 'Unnamed Pet'}
                    </h1>
                    {pet.breed && pet.name !== pet.breed && (
                      <p className="text-lg text-gray-600 capitalize">{pet.breed}</p>
                    )}
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {pet.category?.name && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <PawPrint className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Species</p>
                      <p className="font-semibold text-gray-900 capitalize text-sm">{pet.category.name}</p>
                    </div>
                  )}
                  {pet.gender && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Gender</p>
                      <p className="font-semibold text-gray-900 text-sm">{pet.gender}</p>
                    </div>
                  )}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Age</p>
                    <p className="font-semibold text-gray-900 text-sm">{getEstimatedAge(pet)}</p>
                  </div>
                  {pet.size && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Scale className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Size</p>
                      <p className="font-semibold text-gray-900 text-sm">{pet.size}</p>
                    </div>
                  )}
                </div>

                {/* Breed and Weight - Above About Section */}
                {(pet.breed || pet.weight) && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {pet.breed && (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Award className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Breed</p>
                        <p className="font-semibold text-gray-900 capitalize text-sm">{pet.breed}</p>
                      </div>
                    )}
                    {pet.weight && (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Scale className="h-5 w-5 text-[#2BB6AF] mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Weight</p>
                        <p className="font-semibold text-gray-900 text-sm">{pet.weight} kg</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator className="my-6" />

                {/* About Section - Color, Description, Collar Tag */}
            {(description || getPrimaryColor(pet) || getSecondaryColor(pet) || getColorPattern(pet) || getCollarTagColor(pet) || getCollarTagInfo(pet)) && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b-2 border-[#2BB6AF]">
                      <Info className="h-5 w-5 text-[#2BB6AF]" />
                      About
                    </h3>
                    
                    {/* Color Information - Show First */}
                    {(getPrimaryColor(pet) || getSecondaryColor(pet) || getColorPattern(pet)) && (
                      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-semibold text-orange-700 mb-3 uppercase tracking-wide">Color Information</p>
                        <div className="space-y-2">
                          {getPrimaryColor(pet) && (
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-8 w-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: getColorValue(getPrimaryColor(pet)!) }}
                              />
                              <div>
                                <p className="text-xs text-gray-600">Primary Color</p>
                                <p className="font-semibold text-gray-900 capitalize">{getPrimaryColor(pet)}</p>
                              </div>
                            </div>
                          )}
                          {getSecondaryColor(pet) && (
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-8 w-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: getColorValue(getSecondaryColor(pet)!) }}
                              />
                              <div>
                                <p className="text-xs text-gray-600">Secondary Color / Features</p>
                                <p className="font-semibold text-gray-900 capitalize">{getSecondaryColor(pet)}</p>
                              </div>
                            </div>
                          )}
                          {getColorPattern(pet) && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">Pattern</p>
                              <p className="font-semibold text-gray-900">{getColorPattern(pet)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description - Show After Color */}
                    {description && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</p>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
                      </div>
                    )}

                    {/* Collar Tag Information - Show After Description */}
                    {(getCollarTagColor(pet) || getCollarTagInfo(pet)) && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-semibold text-purple-700 mb-3 uppercase tracking-wide">Collar Tag Information</p>
                        <div className="space-y-2">
                          {getCollarTagColor(pet) && (
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-8 w-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: getColorValue(getCollarTagColor(pet)!) }}
                              />
                              <div>
                                <p className="text-xs text-gray-600">Collar/Tag Color</p>
                                <p className="font-semibold text-gray-900 capitalize">{getCollarTagColor(pet)}</p>
                              </div>
                            </div>
                          )}
                          {getCollarTagInfo(pet) && (
                            <div>
                              <p className="text-xs text-gray-600">Tag Information</p>
                              <p className="font-semibold text-gray-900">{getCollarTagInfo(pet)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Physical Characteristics */}
            {(getPrimaryColor(pet) || getSecondaryColor(pet) || getColorPattern(pet) || pet.physicalCharacteristics?.color?.distinguishingMarks || pet.distinguishing_marks || pet.coat_type) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-[#2BB6AF]">
                    <Palette className="h-5 w-5 text-[#2BB6AF]" />
                    Physical Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Colors */}
                  {(getPrimaryColor(pet) || getSecondaryColor(pet)) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Colors</p>
                      <div className="flex flex-wrap gap-3">
                        {getPrimaryColor(pet) && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <div 
                              className="h-6 w-6 rounded-full border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: getColorValue(getPrimaryColor(pet)!) }}
                            />
                            <span className="text-sm font-medium text-gray-900 capitalize">{getPrimaryColor(pet)}</span>
                          </div>
                        )}
                        {getSecondaryColor(pet) && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <div 
                              className="h-6 w-6 rounded-full border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: getColorValue(getSecondaryColor(pet)!) }}
                            />
                            <span className="text-sm font-medium text-gray-900 capitalize">{getSecondaryColor(pet)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pattern */}
                  {getColorPattern(pet) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Pattern</p>
                      <p className="text-gray-900">{getColorPattern(pet)}</p>
                    </div>
                  )}

                  {/* Coat Type */}
                  {pet.coat_type && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Coat Type</p>
                      <p className="text-gray-900 capitalize">{pet.coat_type}</p>
                    </div>
                  )}

                  {/* Distinguishing Marks */}
                  {(pet.physicalCharacteristics?.color?.distinguishingMarks || pet.distinguishing_marks) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Distinguishing Marks</p>
                      <p className="text-gray-900">
                        {pet.physicalCharacteristics?.color?.distinguishingMarks || pet.distinguishing_marks}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location Information */}
            {(pet.location || pet.location_address) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-[#2BB6AF]">
                    <MapPin className="h-5 w-5 text-[#2BB6AF]" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Address</p>
                    <p className="text-gray-900">{pet.location_address || pet.location}</p>
                    {pet.pincode && (
                      <p className="text-sm text-gray-600 mt-1">Pincode: {pet.pincode}</p>
                    )}
                  </div>
                  
                  {/* Google Maps Links */}
                  <div className="space-y-3">
                    {/* Show location_map_url if provided, otherwise generate from coordinates/address */}
                    {pet.location_map_url ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Google Maps URL:</p>
                          <a
                            href={pet.location_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#2BB6AF] hover:underline break-all block font-medium"
                          >
                            {pet.location_map_url}
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white"
                          onClick={() => {
                            window.open(pet.location_map_url, '_blank');
                          }}
                        >
                          <Navigation2 className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      </>
                    ) : (pet.location_latitude && pet.location_longitude) ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Google Maps URL:</p>
                          <a
                            href={`https://www.google.com/maps?q=${pet.location_latitude},${pet.location_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#2BB6AF] hover:underline break-all block font-medium"
                          >
                            https://www.google.com/maps?q={pet.location_latitude},{pet.location_longitude}
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${pet.location_latitude},${pet.location_longitude}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <Navigation2 className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Google Maps URL:</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.location_address || pet.location || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#2BB6AF] hover:underline break-all block font-medium"
                          >
                            https://www.google.com/maps/search/?api=1&query={encodeURIComponent(pet.location_address || pet.location || '')}
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-[#2BB6AF] text-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(pet.location_address || pet.location || '');
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <Navigation2 className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reunification Information */}
            {pet.is_reunited && (
              <Card className="border-0 shadow-lg bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-green-500">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Reunification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-green-100 rounded-lg border border-green-300">
                    <p className="text-green-800 font-semibold mb-2">🎉 Successfully Reunited!</p>
                    {pet.reunited_at && (
                      <p className="text-sm text-green-700">
                        Reunited on: {format(new Date(pet.reunited_at), 'MMM d, yyyy')}
                      </p>
                    )}
                    {pet.reunited_with_owner && (
                      <p className="text-sm text-green-700 mt-1">
                        Reunited with: {pet.reunited_with_owner.name || pet.reunited_with_owner.email || 'Owner'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adoption Workflow Information */}
            {pet.moved_to_adoption && (
              <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-blue-500">
                    <Heart className="h-5 w-5 text-blue-600" />
                    Adoption Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-blue-100 rounded-lg border border-blue-300">
                    <p className="text-blue-800 font-semibold mb-2">Moved to Adoption</p>
                    {pet.moved_to_adoption_date && (
                      <p className="text-sm text-blue-700">
                        Moved on: {format(new Date(pet.moved_to_adoption_date), 'MMM d, yyyy')}
                      </p>
                    )}
                    {pet.owner_consent_for_adoption && (
                      <p className="text-sm text-blue-700 mt-1">
                        ✓ Owner consent received for adoption
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Records */}
            {isUploadedByUser && pet.id && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <UserPetMedicalRecords petId={Number(pet.id)} petName={pet.name} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status & Action Card */}
            <Card className="border-0 shadow-lg sticky top-24">
              <CardContent className="p-6">
                {/* Status Badge */}
                {statusBadge && (
                  <div className="mb-6">
                    <Badge className={`${statusBadge.color} text-white px-4 py-2 text-base font-semibold w-full justify-center`}>
                      {statusBadge.icon} {statusBadge.text}
                    </Badge>
                  </div>
                )}

                {/* Action Buttons */}
                {isUploadedByUser ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#E8F8EE] rounded-lg text-center border border-[#2BB6AF]/30">
                      <p className="text-[#2BB6AF] font-medium text-sm">✓ You uploaded this report</p>
                    </div>
                    {/* Show consent button if 15 days passed and consent needed */}
                    {requiresConsent && pet.adoption_status === 'Found' && !pet.moved_to_adoption && (
                      <Button
                        size="lg"
                        onClick={() => setShowConsentDialog(true)}
                        className="w-full bg-[#2BB6AF] hover:bg-[#239a94] text-white"
                      >
                        <Clock className="mr-2 h-5 w-5" />
                        Decision Required ({daysInCare} days in care)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* For Found pets, only show claim button (no Request Chat) */}
                    {(pet.adoption_status || '').toLowerCase().includes('found') ? (
                      <Button 
                        size="lg" 
                        onClick={handleClaimPet} 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        This is My Pet - Claim
                      </Button>
                    ) : (
                      <>
                        {/* For other statuses, show Request Chat if authenticated */}
                        {isAuthenticated && (
                          <Button
                            size="lg" 
                            className="w-full bg-[#2BB6AF] hover:bg-[#239a94] text-white"
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
                            Request Chat
                          </Button>
                        )}
                        
                        {((pet.adoption_status || '').toLowerCase().includes('adopt') || 
                          (pet.adoption_status || '').toLowerCase().includes('available')) && (
                          <Button 
                            size="lg" 
                            onClick={() => setShowAdoptDialog(true)} 
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                          >
                            <Heart className="mr-2 h-5 w-5" />
                            Apply to Adopt
                          </Button>
                        )}
                      </>
                    )}
                    {(pet.adoption_status === 'Reunited' || pet.is_reunited) && (
                      <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
                        <p className="text-green-700 font-medium">🎉 Successfully reunited!</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-[#2BB6AF]">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Identification */}
                {(pet.microchip_id || pet.tag_registration_number) && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Identification</p>
                    <div className="space-y-3">
                      {pet.microchip_id && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Microchip ID</p>
                          <p className="font-mono text-sm font-semibold text-gray-900">{pet.microchip_id}</p>
                        </div>
                      )}
                      {pet.tag_registration_number && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tag/Registration</p>
                          <p className="font-semibold text-sm text-gray-900">{pet.tag_registration_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Collar Tag */}
                {(getCollarTagColor(pet) || getCollarTagInfo(pet)) && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Collar/Tag</p>
                    <div className="space-y-2">
                      {getCollarTagColor(pet) && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-5 w-5 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: getColorValue(getCollarTagColor(pet)!) }}
                          />
                          <span className="text-sm font-medium text-gray-900 capitalize">{getCollarTagColor(pet)}</span>
                        </div>
                      )}
                      {getCollarTagInfo(pet) && (
                        <p className="text-sm text-gray-900">{getCollarTagInfo(pet)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-4 border-t space-y-3">
                  {pet.last_seen && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Seen</p>
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(pet.last_seen), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {pet.found_date && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Found Date</p>
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(pet.found_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {pet.createdAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Days Since Reported</p>
                      <p className="font-medium text-sm text-gray-900">
                        {Math.floor((new Date().getTime() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  )}
                  {pet.current_location_type && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Location</p>
                      <p className="font-medium text-sm text-gray-900 capitalize">{pet.current_location_type}</p>
                    </div>
                  )}
                  {pet.createdAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reported</p>
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(pet.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {pet.updatedAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(pet.updatedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {pet.moved_to_adoption && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Moved to Adoption</p>
                      <p className="font-medium text-sm text-gray-900">
                        {pet.moved_to_adoption_date 
                          ? format(new Date(pet.moved_to_adoption_date), 'MMM d, yyyy')
                          : 'Yes'}
                      </p>
                    </div>
                  )}
                  {pet.is_reunited && pet.reunited_at && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reunited On</p>
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(pet.reunited_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {pet.reunited_with_owner && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reunited With</p>
                      <p className="font-medium text-sm text-gray-900">
                        {pet.reunited_with_owner.name || pet.reunited_with_owner.email || 'Owner'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reporter Information */}
            {pet.posted_by && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-[#2BB6AF]">Reporter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#2BB6AF] flex items-center justify-center text-white font-bold text-lg">
                      {pet.posted_by.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pet.posted_by.name || 'Unknown'}</p>
                      {pet.posted_by.email && (
                        <p className="text-sm text-gray-600">{pet.posted_by.email}</p>
                      )}
                      {pet.posted_by.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {pet.posted_by.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Information (if different from reporter) */}
            {pet.owner && pet.owner.id !== pet.posted_by?.id && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-[#2BB6AF]">Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {pet.owner.name?.charAt(0) || 'O'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pet.owner.name || 'Unknown'}</p>
                      {pet.owner.email && (
                        <p className="text-sm text-gray-600">{pet.owner.email}</p>
                      )}
                      {pet.owner.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {pet.owner.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Info */}
            {isAdmin && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-[#2BB6AF] flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Admin Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Verification</span>
                    <Badge className={pet.is_verified ? 'bg-green-500' : 'bg-yellow-500'}>
                      {pet.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Featured</span>
                    <Badge className={pet.is_featured ? 'bg-purple-500' : 'bg-gray-400'}>
                      {pet.is_featured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {pet.views_count !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="font-bold text-gray-900">{pet.views_count}</span>
                    </div>
                  )}
                  {pet.owner_consent_for_adoption !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Owner Consent</span>
                      <Badge className={pet.owner_consent_for_adoption ? 'bg-green-500' : 'bg-red-500'}>
                        {pet.owner_consent_for_adoption ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  {pet.moved_to_adoption && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Moved to Adoption</span>
                      <Badge className="bg-blue-500">Yes</Badge>
                    </div>
                  )}
                  {pet.current_location_id && (
                    <div>
                      <span className="text-sm text-gray-600">Location ID</span>
                      <p className="font-semibold text-gray-900 text-sm mt-1">{pet.current_location_id}</p>
                    </div>
                  )}
                  {pet.owner && (
                    <div>
                      <span className="text-sm text-gray-600">Owner</span>
                      <p className="font-semibold text-gray-900 text-sm mt-1">
                        {pet.owner.name || pet.owner.email}
                      </p>
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
            <DialogTitle className="flex items-center gap-2 text-[#2BB6AF]">
              <Clock className="h-5 w-5" />
              Action Required: Pet Adoption Decision
            </DialogTitle>
            <DialogDescription>
              {pet?.name} has been in care for {daysInCare} days. Please make a decision:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-[#E8F8EE] rounded-lg border border-[#2BB6AF]/30">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Option 1:</strong> Keep the pet as your own
              </p>
              <p className="text-xs text-gray-600">
                The pet will be marked as "Adopted" and you will become the owner.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Option 2:</strong> Move to adoption listing
              </p>
              <p className="text-xs text-gray-600">
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
              className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94] text-white"
            >
              <Heart className="mr-2 h-4 w-4" />
              Keep Pet
            </Button>
            <Button 
              onClick={() => handleConsentDecision(true, false)}
              disabled={isProcessingConsent}
              className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94] text-white"
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
