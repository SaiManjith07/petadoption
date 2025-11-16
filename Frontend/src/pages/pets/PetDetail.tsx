import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, MessageSquare, Heart, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { petsAPI, chatAPI, getImageUrl } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Listed Found':
      return 'bg-secondary text-secondary-foreground';
    case 'Listed Lost':
      return 'bg-warning text-warning-foreground';
    case 'Available for Adoption':
      return 'bg-primary text-primary-foreground';
    case 'Reunited':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Check if current user uploaded this pet
  const isUploadedByUser = user?.id && pet && (
    pet.submitted_by?.id === user.id || 
    pet.submitted_by?._id === user.id ||
    pet.owner_id === user.id ||
    pet.submitted_by_id === user.id
  );

  useEffect(() => {
    if (id) {
      loadPet();
    } else {
      // If no ID in route, show error
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Pet ID is missing from the URL',
        variant: 'destructive',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [id]);

  const loadPet = async () => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Pet ID is missing',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      setImageError(false);
      const data = await petsAPI.getById(id);
      setPet(data);
    } catch (error: any) {
      console.error('Error loading pet:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Could not load pet details. Please try again.',
        variant: 'destructive',
      });
      // Don't navigate away immediately, let user see the error
      setTimeout(() => {
        navigate('/pets/found');
      }, 2000);
    } finally {
      setLoading(false);
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
      await chatAPI.requestChat(pet.id, user?.id || '', 'claim', claimMessage);
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
      // Create chat request for adoption
      await chatAPI.requestChat(pet.id, user?.id || '', 'adoption', adoptMessage);
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photo Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {(() => {
                const photos = Array.isArray(pet.photos) ? pet.photos : [];
                // Filter out invalid photos
                const validPhotos = photos.filter((p: any) => {
                  if (typeof p === 'string') return p && p.trim() !== '';
                  if (typeof p === 'object' && p !== null) return p.url && p.url.trim() !== '';
                  return false;
                });
                
                const photoUrl = validPhotos.length > 0 
                  ? (typeof validPhotos[currentPhotoIndex] === 'string' 
                      ? validPhotos[currentPhotoIndex] 
                      : validPhotos[currentPhotoIndex]?.url || validPhotos[currentPhotoIndex]?.file_url || validPhotos[currentPhotoIndex])
                  : null;
                
                // If it's a data URL (starts with data:), use it directly
                // Otherwise, convert relative path to full URL
                const fullImageUrl = photoUrl?.startsWith('data:') 
                  ? photoUrl 
                  : getImageUrl(photoUrl);
                
                if (fullImageUrl && !imageError) {
                  return (
                    <img
                      src={fullImageUrl}
                      alt={`${pet.species} - ${pet.breed}`}
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  );
                }
                return (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                    <ImageIcon className="h-20 w-20 text-green-400 mb-3" />
                    <p className="text-base font-medium text-gray-500">No Image Available</p>
                  </div>
                );
              })()}
            </div>
            {(() => {
              const photos = Array.isArray(pet.photos) ? pet.photos : [];
              // Filter out invalid photos
              const validPhotos = photos.filter((p: any) => {
                if (typeof p === 'string') return p && p.trim() !== '';
                if (typeof p === 'object' && p !== null) return p.url && p.url.trim() !== '';
                return false;
              });
              
              if (validPhotos.length > 1) {
                return (
                  <div className="grid grid-cols-4 gap-2">
                    {validPhotos.map((photo: any, index: number) => {
                      const photoUrl = typeof photo === 'string' 
                        ? photo 
                        : photo?.url || photo?.file_url || photo;
                      // If it's a data URL, use it directly; otherwise convert
                      const fullImageUrl = photoUrl?.startsWith('data:') 
                        ? photoUrl 
                        : getImageUrl(photoUrl);
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPhotoIndex(index);
                            setImageError(false);
                          }}
                          className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            currentPhotoIndex === index
                              ? 'border-primary'
                              : 'border-transparent hover:border-muted-foreground/20'
                          }`}
                        >
                          {fullImageUrl ? (
                            <img
                              src={fullImageUrl}
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
                );
              }
              return null;
            })()}
          </div>

          {/* Pet Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{pet.breed}</h1>
                  <p className="text-xl text-muted-foreground">{pet.species}</p>
                </div>
                <Badge className={`${getStatusColor(pet.status)} text-sm px-3 py-1`}>
                  {pet.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {pet.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{pet.location}</span>
                  </div>
                )}
                {pet.date_found_or_lost && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(pet.date_found_or_lost), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                {pet.submitted_by?.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Reported by {pet.submitted_by.name}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {pet.color && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Color/Pattern</h2>
                <p className="text-muted-foreground">{pet.color}</p>
              </div>
            )}

            {pet.distinguishing_marks && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description & Distinguishing Marks</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {pet.distinguishing_marks}
                </p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {isUploadedByUser && pet.status === 'Listed Found' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-blue-700 font-medium">
                      ✓ You uploaded this found pet report
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Waiting for the owner to claim this pet
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {!isUploadedByUser && pet.status === 'Listed Found' && (
                <Button size="lg" onClick={handleClaimPet} className="w-full">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  This is My Pet - Start Reunification
                </Button>
              )}

              {!isUploadedByUser && pet.status === 'Available for Adoption' && (
                <Button size="lg" onClick={() => setShowAdoptDialog(true)} className="w-full">
                  <Heart className="mr-2 h-5 w-5" />
                  Apply to Adopt
                </Button>
              )}

              {pet.status === 'Reunited' && (
                <Card className="border-success bg-success/10">
                  <CardContent className="pt-6 text-center">
                    <p className="text-success-foreground font-medium">
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
              <p className="text-xs text-muted-foreground">
                Be as detailed as possible to help verify your claim
              </p>
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
            <DialogTitle>Apply to Adopt {pet.breed}</DialogTitle>
            <DialogDescription>
              Tell us a bit about yourself and why you'd like to adopt this pet. The owner will review your request.
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
    </div>
  );
}
