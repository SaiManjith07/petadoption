import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, User, MessageSquare, Heart, Image as ImageIcon, 
  Scale, Tag, Hash, Globe, Clock, CheckCircle2, XCircle, Shield, Edit, 
  Trash2, Eye, Mail, Phone, Building, MapPinned, AlertCircle, Palette, 
  Award, Info, Navigation2, ExternalLink, Star, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { petsApi } from '@/api';
import { chatApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Helper function to convert color name to hex value
const getColorValue = (colorName: string): string => {
  if (!colorName) return '#e5e7eb';
  const color = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#ffffff',
    'brown': '#8b4513',
    'golden': '#ffd700',
    'gold': '#ffd700',
    'yellow': '#ffff00',
    'orange': '#ffa500',
    'red': '#ff0000',
    'gray': '#808080',
    'grey': '#808080',
    'blue': '#0000ff',
    'green': '#008000',
    'tan': '#d2b48c',
    'cream': '#fffdd0',
    'beige': '#f5f5dc',
    'silver': '#c0c0c0',
    'brindle': '#8b4513',
    'merle': '#9370db',
    'spotted': '#696969',
    'striped': '#2f2f2f',
    'patched': '#8b4513',
  };
  
  // Check for exact match
  if (colorMap[color]) return colorMap[color];
  
  // Check for partial matches
  for (const [key, value] of Object.entries(colorMap)) {
    if (color.includes(key) || key.includes(color)) {
      return value;
    }
  }
  
  // Default gray if no match
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
  const [adoptMessage, setAdoptMessage] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Check if current user uploaded this pet
  const isUploadedByUser = user?.id && pet && (
    pet.posted_by?.id === user.id || 
    pet.posted_by?._id === user.id ||
    pet.posted_by?.id === user._id ||
    pet.owner?.id === user.id ||
    pet.owner?._id === user.id
  );

  // Determine pet type (Found/Lost/Adoption)
  const getPetType = () => {
    if (!pet) return 'Pet';
    const status = pet.adoption_status || pet.status || '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('found')) return 'Found Pet';
    if (statusLower.includes('lost')) return 'Lost Pet';
    if (statusLower.includes('adopt') || statusLower.includes('available')) return 'Adoptable Pet';
    if (statusLower.includes('reunited')) return 'Reunited Pet';
    return 'Pet';
  };

  const getPetTypeBadge = () => {
    if (!pet) return null;
    const status = pet.adoption_status || pet.status || '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('found')) {
      return <Badge className="bg-green-500 text-white px-4 py-2 text-sm font-semibold">Found Pet</Badge>;
    }
    if (statusLower.includes('lost')) {
      return <Badge className="bg-orange-500 text-white px-4 py-2 text-sm font-semibold">Lost Pet</Badge>;
    }
    if (statusLower.includes('adopt') || statusLower.includes('available')) {
      return <Badge className="bg-blue-500 text-white px-4 py-2 text-sm font-semibold">Adoptable Pet</Badge>;
    }
    if (statusLower.includes('reunited')) {
      return <Badge className="bg-purple-500 text-white px-4 py-2 text-sm font-semibold">Reunited</Badge>;
    }
    return <Badge className="bg-gray-500 text-white px-4 py-2 text-sm font-semibold">{status || 'Unknown'}</Badge>;
  };

  useEffect(() => {
    if (id) {
      loadPet();
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Pet ID is missing from the URL',
        variant: 'destructive',
      });
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    }
  }, [id]);

  const loadPet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setImageError(false);
      const data = await petsApi.getById(Number(id));
      const normalizedPet = {
        ...data,
        id: data.id || data._id,
        _id: data.id || data._id,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
      };
      setPet(normalizedPet);
    } catch (error: any) {
      console.error('Error loading pet:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Could not load pet details. Please try again.',
        variant: 'destructive',
      });
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pet || !isAdmin) return;
    try {
      await petsApi.delete(pet.id || pet._id);
      toast({
        title: 'Success',
        description: 'Pet report deleted successfully',
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete pet report',
        variant: 'destructive',
      });
    }
  };

  const handleClaimPet = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to claim a pet',
      });
      navigate('/auth/login');
      return;
    }
    setShowClaimDialog(true);
  };

  const handleSubmitClaimRequest = async () => {
    if (!claimMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please provide details about why you think this is your pet',
        variant: 'destructive',
      });
      return;
    }

    try {
      await chatApi.requestChat(pet.id || pet._id, user?.id || user?._id || '', 'claim', claimMessage);
      toast({
        title: 'Chat request sent!',
        description: 'The pet owner will review your request and approve it if it matches.',
      });
      setShowClaimDialog(false);
      setClaimMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send chat request',
        variant: 'destructive',
      });
    }
  };

  const handleAdoptionApply = async () => {
    if (!adoptMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please tell us why you want to adopt this pet',
        variant: 'destructive',
      });
      return;
    }

    try {
      await chatApi.requestChat(pet.id || pet._id, user?.id || user?._id || '', 'adoption', adoptMessage);
      toast({
        title: 'Adoption request sent!',
        description: 'The pet owner will review your request and approve it to start chatting.',
      });
      setShowAdoptDialog(false);
      setAdoptMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not submit adoption request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pet) return null;

  // Get all photos
  const getPhotos = () => {
    let photos: any[] = [];
    if (Array.isArray(pet.photos) && pet.photos.length > 0) {
      photos = pet.photos;
    } else if (Array.isArray(pet.images) && pet.images.length > 0) {
      photos = pet.images.map((img: any) => {
        if (typeof img === 'string') return img;
        return img.image_url || img.url || img.image || null;
      }).filter(Boolean);
    } else if (pet.image_url) {
      photos = [pet.image_url];
    } else if (pet.image) {
      photos = [pet.image];
    }
    return photos.filter((p: any) => {
      if (typeof p === 'string') return p && p.trim() !== '';
      if (typeof p === 'object' && p !== null) return p.url && p.url.trim() !== '';
      return false;
    });
  };

  const photos = getPhotos();
  const photoUrl = photos.length > 0 
    ? (typeof photos[currentPhotoIndex] === 'string' 
        ? photos[currentPhotoIndex] 
        : photos[currentPhotoIndex]?.url || photos[currentPhotoIndex]?.image_url || photos[currentPhotoIndex]?.file_url || photos[currentPhotoIndex])
    : null;
  
  const fullImageUrl = photoUrl && (
    photoUrl.startsWith('http://') || 
    photoUrl.startsWith('https://') || 
    photoUrl.startsWith('data:')
  ) ? photoUrl : getImageUrl(photoUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/pets/${pet.id || pet._id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container - Grid Layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,40%)_1fr] gap-6 lg:gap-8">
          
          {/* Left Column - Sticky Image Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 relative shadow-lg">
                {fullImageUrl && !imageError ? (
                  <img
                    src={fullImageUrl}
                    alt={pet.name || pet.breed || 'Pet'}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                    <ImageIcon className="h-20 w-20 text-green-400 mb-3" />
                    <p className="text-base font-medium text-gray-500">No Image Available</p>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo: any, index: number) => {
                    const photoUrl = typeof photo === 'string' 
                      ? photo 
                      : photo?.url || photo?.image_url || photo?.file_url || photo;
                    const thumbImageUrl = photoUrl && (
                      photoUrl.startsWith('http://') || 
                      photoUrl.startsWith('https://') || 
                      photoUrl.startsWith('data:')
                    ) ? photoUrl : getImageUrl(photoUrl);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentPhotoIndex(index);
                          setImageError(false);
                        }}
                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          currentPhotoIndex === index
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                        aria-label={`View photo ${index + 1}`}
                      >
                        {thumbImageUrl ? (
                          <img
                            src={thumbImageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Scrollable Content */}
          <div className="space-y-6 max-w-[600px]">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {getPetTypeBadge()}
                    {pet.is_verified && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {pet.name || pet.breed || 'Unnamed Pet'}
                  </h1>
                  {pet.breed && pet.name !== pet.breed && (
                    <p className="text-lg text-gray-600 capitalize font-medium">
                      {pet.breed}
                    </p>
                  )}
                  {pet.category?.name && (
                    <p className="text-base text-gray-500 capitalize mt-1">
                      {pet.category.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${pet.name || 'Pet'} - ${getPetType()}`,
                        text: `Check out this ${getPetType().toLowerCase()}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: 'Link copied!',
                        description: 'Pet detail link copied to clipboard',
                      });
                    }
                  }}
                  className="flex-shrink-0"
                  aria-label="Share pet details"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Upload Information Card */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <User className="h-5 w-5 text-gray-600" />
                  Upload Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {pet.posted_by && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600">Reported by:</span>
                    <span className="text-gray-900 font-semibold">{pet.posted_by.name || pet.posted_by.email || 'Unknown'}</span>
                    {pet.posted_by.email && (
                      <Mail className="h-4 w-4 text-gray-400 ml-2" />
                    )}
                  </div>
                )}
                {pet.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Posted on:</span>
                    <span className="text-gray-900 font-semibold">
                      {format(new Date(pet.createdAt), 'MMMM d, yyyy, h:mm a')}
                    </span>
                  </div>
                )}
                {pet.updatedAt && pet.updatedAt !== pet.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Last updated:</span>
                    <span className="text-gray-900 font-semibold">
                      {format(new Date(pet.updatedAt), 'MMMM d, yyyy, h:mm a')}
                    </span>
                  </div>
                )}
                {pet.views_count !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Views:</span>
                    <span className="text-gray-900 font-semibold">{pet.views_count || 0}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Primary Pet Information Card */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Info className="h-5 w-5 text-gray-600" />
                  Pet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field Item Component */}
                  {pet.category?.name && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Tag className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Species</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{pet.category.name}</p>
                      </div>
                    </div>
                  )}

                  {pet.breed && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Award className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Breed</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.breed}</p>
                      </div>
                    </div>
                  )}

                  {pet.gender && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Gender</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Color Field - Enhanced */}
                  {(pet.color || pet.color_primary || pet.primary_color || pet.color_secondary || pet.secondary_color) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 md:col-span-2">
                      <Palette className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-2">Color/Pattern</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(pet.color || pet.color_primary || pet.primary_color) && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-5 w-5 rounded-full border-2 border-gray-300 shadow-sm" 
                                style={{
                                  backgroundColor: getColorValue(pet.color || pet.color_primary || pet.primary_color)
                                }}
                                title={pet.color || pet.color_primary || pet.primary_color}
                                aria-label={`Color: ${pet.color || pet.color_primary || pet.primary_color}`}
                              />
                              <span className="text-sm font-semibold text-gray-900 capitalize">
                                {pet.color || pet.color_primary || pet.primary_color}
                              </span>
                            </div>
                          )}
                          {(pet.color_secondary || pet.secondary_color) && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">/</span>
                              <div 
                                className="h-5 w-5 rounded-full border-2 border-gray-300 shadow-sm"
                                style={{
                                  backgroundColor: getColorValue(pet.color_secondary || pet.secondary_color)
                                }}
                                title={pet.color_secondary || pet.secondary_color}
                                aria-label={`Secondary color: ${pet.color_secondary || pet.secondary_color}`}
                              />
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {pet.color_secondary || pet.secondary_color}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {pet.size && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Scale className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Size</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.size}</p>
                      </div>
                    </div>
                  )}

                  {pet.age !== null && pet.age !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Age</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.age} {pet.age === 1 ? 'year' : 'years'} old</p>
                      </div>
                    </div>
                  )}

                  {pet.weight && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Scale className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Weight</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.weight} kg</p>
                      </div>
                    </div>
                  )}

                  {pet.coat_type && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Palette className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Coat Type</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{pet.coat_type}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distinctive Features Card */}
            {(pet.distinguishing_marks || pet.collar_tag || pet.microchip_id || pet.tag_registration_number) && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Star className="h-5 w-5 text-amber-600" />
                    Distinctive Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {pet.distinguishing_marks && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Distinguishing Marks</p>
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap bg-white/60 p-3 rounded-lg border border-amber-100">
                        {pet.distinguishing_marks}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pet.microchip_id && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-amber-100">
                        <Hash className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Microchip ID</p>
                          <p className="text-sm font-semibold text-gray-900 font-mono">{pet.microchip_id}</p>
                        </div>
                      </div>
                    )}
                    {pet.tag_registration_number && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-amber-100">
                        <Hash className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Tag/Registration</p>
                          <p className="text-sm font-semibold text-gray-900">{pet.tag_registration_number}</p>
                        </div>
                      </div>
                    )}
                    {pet.collar_tag && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-amber-100 md:col-span-2">
                        <Tag className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Collar Tag</p>
                          <p className="text-sm font-semibold text-gray-900">{pet.collar_tag}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Information Card */}
            {(pet.last_seen || pet.found_date || pet.days_in_care !== undefined || pet.current_location_type) && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Status Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Species/Category */}
                  {pet.category?.name && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Tag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Species</p>
                        <p className="text-sm font-semibold capitalize text-gray-900">{pet.category.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Breed */}
                  {pet.breed && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Breed</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.breed}</p>
                      </div>
                    </div>
                  )}

                  {/* Color - Comprehensive Display */}
                  {(pet.color || pet.color_primary || pet.primary_color || pet.color_secondary || pet.secondary_color) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-colors border border-purple-100/50 md:col-span-2">
                      <Palette className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Color/Pattern</p>
                        <div className="space-y-2">
                          {/* Primary Color */}
                          {(pet.color || pet.color_primary || pet.primary_color) && (
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="h-5 w-5 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0" 
                                style={{
                                  backgroundColor: getColorValue(pet.color || pet.color_primary || pet.primary_color)
                                }}
                                title={pet.color || pet.color_primary || pet.primary_color}
                              />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-0.5">Primary Color</p>
                                <p className="text-sm font-semibold text-gray-900 capitalize">
                                  {pet.color || pet.color_primary || pet.primary_color}
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Secondary Color */}
                          {(pet.color_secondary || pet.secondary_color) && (
                            <div className="flex items-center gap-2.5 pl-1">
                              <div 
                                className="h-5 w-5 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                                style={{
                                  backgroundColor: getColorValue(pet.color_secondary || pet.secondary_color)
                                }}
                                title={pet.color_secondary || pet.secondary_color}
                              />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-0.5">Secondary Color</p>
                                <p className="text-sm font-medium text-gray-700 capitalize">
                                  {pet.color_secondary || pet.secondary_color}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Age */}
                  {pet.age !== null && pet.age !== undefined && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Age</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.age} {pet.age === 1 ? 'year' : 'years'} old</p>
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {pet.gender && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Gender</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Weight */}
                  {pet.weight && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Weight</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.weight} kg</p>
                      </div>
                    </div>
                  )}

                  {/* Size */}
                  {pet.size && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Size</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.size}</p>
                      </div>
                    </div>
                  )}

                  {/* Coat Type */}
                  {pet.coat_type && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Palette className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Coat Type</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{pet.coat_type}</p>
                      </div>
                    </div>
                  )}

                  {/* Microchip ID */}
                  {pet.microchip_id && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Hash className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Microchip ID</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono">{pet.microchip_id}</p>
                      </div>
                    </div>
                  )}

                  {/* Tag/Registration Number */}
                  {pet.tag_registration_number && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Hash className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Tag/Registration Number</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.tag_registration_number}</p>
                      </div>
                    </div>
                  )}

                  {/* Collar Tag */}
                  {pet.collar_tag && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <Tag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Collar Tag</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.collar_tag}</p>
                      </div>
                    </div>
                  )}

                    {pet.last_seen && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Last Seen</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(new Date(pet.last_seen), 'MMMM d, yyyy, h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}

                    {pet.found_date && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Found Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(new Date(pet.found_date), 'MMMM d, yyyy, h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}

                    {pet.days_in_care !== undefined && pet.days_in_care !== null && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Days in Care</p>
                          <p className="text-sm font-semibold text-gray-900">{pet.days_in_care} days</p>
                        </div>
                      </div>
                    )}

                    {pet.current_location_type && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Current Location</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{pet.current_location_type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description Card */}
            {pet.description && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Info className="h-5 w-5 text-gray-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {pet.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Location Details Card */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {pet.location && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Address/Location</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.location}</p>
                      </div>
                    </div>
                  )}

                  {(pet.location_found || pet.location_lost) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <Navigation2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {pet.location_found ? 'Location Found' : 'Location Lost'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {pet.location_found || pet.location_lost}
                        </p>
                      </div>
                    </div>
                  )}

                  {pet.pincode && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <MapPinned className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Postal Code</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.pincode}</p>
                      </div>
                    </div>
                  )}

                  {(pet.location_latitude && pet.location_longitude) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Coordinates</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono mb-2">
                          {pet.location_latitude}, {pet.location_longitude}
                        </p>
                        <a 
                          href={`https://www.google.com/maps?q=${pet.location_latitude},${pet.location_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          View on Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {pet.location_map_url && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Map Link</p>
                        <a 
                          href={pet.location_map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline break-all inline-flex items-center gap-1"
                        >
                          {pet.location_map_url.length > 50 ? `${pet.location_map_url.substring(0, 50)}...` : pet.location_map_url}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {pet.location_address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-1">Full Address</p>
                        <p className="text-sm font-semibold text-gray-900">{pet.location_address}</p>
                      </div>
                    </div>
                  )}

                  {!pet.location && !pet.pincode && !pet.location_latitude && !pet.location_map_url && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No location information available
                    </div>
                  )}
                </div>

                {/* Interactive Map Section */}
                {(pet.location_latitude && pet.location_longitude) && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Interactive Map</h3>
                      <a 
                        href={`https://www.google.com/maps?q=${pet.location_latitude},${pet.location_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Open in Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6V4qOZjFJw'}&q=${pet.location_latitude},${pet.location_longitude}&zoom=15&maptype=roadmap`}
                        title="Pet Location Map"
                        aria-label="Interactive map showing pet location"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${pet.location_latitude},${pet.location_longitude}`, '_blank');
                        }}
                        className="text-xs"
                      >
                        <Navigation2 className="h-3 w-3 mr-1" />
                        Get Directions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `geo:${pet.location_latitude},${pet.location_longitude}?q=${pet.location_latitude},${pet.location_longitude}(${pet.name || 'Pet Location'})`;
                          window.open(url, '_blank');
                        }}
                        className="text-xs"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Open in Maps App
                      </Button>
                    </div>
                  </div>
                )}

                {/* Map for location text (if no coordinates but has location text) */}
                {!pet.location_latitude && pet.location && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Location Map</h3>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Open in Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6V4qOZjFJw'}&q=${encodeURIComponent(pet.location)}&zoom=15&maptype=roadmap`}
                        title="Pet Location Map"
                        aria-label="Interactive map showing pet location"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pet.location)}`, '_blank');
                        }}
                        className="text-xs"
                      >
                        <Navigation2 className="h-3 w-3 mr-1" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distinguishing Marks */}
            {pet.distinguishing_marks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Distinguishing Marks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {pet.distinguishing_marks}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {pet.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {pet.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Admin Only: Additional Information */}
            {isAdmin && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Admin Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Verification Status</p>
                      <Badge className={pet.is_verified ? 'bg-green-500' : 'bg-yellow-500'}>
                        {pet.is_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Featured Status</p>
                      <Badge className={pet.is_featured ? 'bg-purple-500' : 'bg-gray-500'}>
                        {pet.is_featured ? 'Featured' : 'Not Featured'}
                      </Badge>
                    </div>
                    {pet.owner && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Owner</p>
                        <p className="text-sm font-medium">{pet.owner.name || pet.owner.email || 'Unknown'}</p>
                      </div>
                    )}
                    {pet.is_reunited && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reunited Status</p>
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Reunited
                        </Badge>
                      </div>
                    )}
                    {pet.reunited_at && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reunited Date</p>
                        <p className="text-sm font-medium">
                          {format(new Date(pet.reunited_at), 'MMMM d, yyyy, h:mm a')}
                        </p>
                      </div>
                    )}
                    {pet.moved_to_adoption && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Moved to Adoption</p>
                        <Badge className="bg-blue-500">Yes</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {isUploadedByUser && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-blue-700 font-medium">
                      ✓ You uploaded this {getPetType().toLowerCase()} report
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {!isUploadedByUser && (
                (pet.adoption_status === 'Found' || pet.status === 'Found' || 
                 (pet.adoption_status || pet.status || '').toLowerCase().includes('found')) && (
                  <Button size="lg" onClick={handleClaimPet} className="w-full">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    This is My Pet - Start Reunification
                  </Button>
                )
              )}

              {!isUploadedByUser && (
                (pet.adoption_status === 'Available for Adoption' || 
                 (pet.adoption_status || pet.status || '').toLowerCase().includes('adopt') ||
                 (pet.adoption_status || pet.status || '').toLowerCase().includes('available')) && (
                  <Button size="lg" onClick={() => setShowAdoptDialog(true)} className="w-full">
                    <Heart className="mr-2 h-5 w-5" />
                    Apply to Adopt
                  </Button>
                )
              )}

              {(pet.adoption_status === 'Reunited' || pet.is_reunited) && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-green-700 font-medium">
                      🎉 This pet has been successfully reunited with their family!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Pet Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim This Pet</DialogTitle>
            <DialogDescription>
              Provide details about why you believe this is your pet. The finder will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claim-message">Your Message *</Label>
              <Textarea
                id="claim-message"
                rows={6}
                placeholder="Describe unique features, markings, behavior, or any proof that this is your pet..."
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClaimRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adoption Application Dialog */}
      <Dialog open={showAdoptDialog} onOpenChange={setShowAdoptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Adopt {pet.name || pet.breed}</DialogTitle>
            <DialogDescription>
              Tell us a bit about yourself and why you'd like to adopt this pet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message *</Label>
              <Textarea
                id="message"
                rows={6}
                placeholder="Tell us about your home, experience with pets, and why you want to adopt..."
                value={adoptMessage}
                onChange={(e) => setAdoptMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdoptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdoptionApply}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Admin Only) */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pet report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
