import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { petsAPI, chatAPI } from '@/services/api';
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
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadPet();
    }
  }, [id]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const data = await petsAPI.getById(id!);
      setPet(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load pet details',
        variant: 'destructive',
      });
      navigate('/pets/found');
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

    try {
      const { roomId } = await chatAPI.createRoom(pet.id, 'current-user-id');
      toast({
        title: 'Chat room created',
        description: 'You can now communicate with the rescuer and admin',
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
      await petsAPI.applyForAdoption(pet.id, { message: adoptMessage });
      toast({
        title: 'Application submitted!',
        description: 'Our team will review your application and contact you soon.',
      });
      setShowAdoptDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not submit application',
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
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <img
                src={pet.photos[currentPhotoIndex]}
                alt={`${pet.species} - ${pet.breed}`}
                className="h-full w-full object-cover"
              />
            </div>
            {pet.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {pet.photos.map((photo: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      currentPhotoIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground/20'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{pet.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(pet.date_found_or_lost), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Reported by {pet.submitted_by.name}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-2">Color/Pattern</h2>
              <p className="text-muted-foreground">{pet.color}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Description & Distinguishing Marks</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {pet.distinguishing_marks}
              </p>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {pet.status === 'Listed Found' && (
                <Button size="lg" onClick={handleClaimPet} className="w-full">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  This is My Pet - Start Reunification
                </Button>
              )}

              {pet.status === 'Available for Adoption' && (
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

      {/* Adoption Application Dialog */}
      <Dialog open={showAdoptDialog} onOpenChange={setShowAdoptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Adopt {pet.breed}</DialogTitle>
            <DialogDescription>
              Tell us a bit about yourself and why you'd like to adopt this pet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
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
