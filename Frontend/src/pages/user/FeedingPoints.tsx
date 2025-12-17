import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Droplet, UtensilsCrossed, AlertCircle, CheckCircle2, Search, Filter, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { feedingPointAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { shelterApi } from '@/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function FeedingPoints() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedingPoints, setFeedingPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [myShelter, setMyShelter] = useState<any>(null);
  const [canAddFeedingPoint, setCanAddFeedingPoint] = useState(false);
  const [newPoint, setNewPoint] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: '',
    lng: '',
    type: 'both',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadFeedingPoints();
      checkShelterStatus();
    }
  }, [isAuthenticated, isAdmin]);

  const checkShelterStatus = async () => {
    if (isAdmin) {
      setCanAddFeedingPoint(true);
      return;
    }

    try {
      const shelterData = await shelterApi.getMyShelter();
      if (shelterData && shelterData.is_verified) {
        setMyShelter(shelterData);
        setCanAddFeedingPoint(true);
      } else {
        setCanAddFeedingPoint(false);
      }
    } catch (error) {
      console.error('Error checking shelter status:', error);
      setCanAddFeedingPoint(false);
    }
  };

  const loadFeedingPoints = async () => {
    try {
      setLoading(true);
      const data = await feedingPointAPI.getAll({ status: 'approved' });
      setFeedingPoints(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load feeding points',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = async () => {
    if (!newPoint.name || !newPoint.address || !newPoint.city || !newPoint.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await feedingPointAPI.create({
        name: newPoint.name,
        location: {
          address: newPoint.address,
          city: newPoint.city,
          state: newPoint.state,
          pincode: newPoint.pincode,
          coordinates: {
            lat: parseFloat(newPoint.lat) || 0,
            lng: parseFloat(newPoint.lng) || 0,
          },
        },
        type: newPoint.type,
        description: newPoint.description,
      });
      const isAutoApproved = isAdmin;
      toast({
        title: 'Success',
        description: isAutoApproved
          ? 'Feeding point added successfully and is now visible on the map!'
          : 'Feeding point submitted. Admin will review it shortly.',
      });
      setShowAddDialog(false);
      setNewPoint({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        lat: '',
        lng: '',
        type: 'both',
        description: '',
      });
      loadFeedingPoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add feeding point',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewPoint({
            ...newPoint,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
        },
        () => {
          toast({
            title: 'Error',
            description: 'Could not get your location',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const filteredPoints = feedingPoints.filter(point =>
    point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.location?.pincode?.includes(searchTerm)
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Feeding Points Map</CardTitle>
            <CardDescription className="text-base mt-2">
              Discover community-maintained water and feeding stations for stray animals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 text-center">Interactive map available after login</p>
            <Button 
              className="w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1a7a75] text-white"
              onClick={() => navigate('/auth/login')}
            >
              Login to Access Map
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Feeding Points Map</h1>
              <p className="text-gray-600 mt-1">Discover community-maintained water and feeding stations</p>
            </div>
          </div>
          {canAddFeedingPoint && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1a7a75] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Feed Point
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Feeding Point</DialogTitle>
                <DialogDescription>
                  {isAdmin
                    ? 'Add a new community feeding or water point. It will be automatically approved and visible on the map.'
                    : 'Add a new community feeding or water point. Admin will review and approve it.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newPoint.name}
                    onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                    placeholder="e.g., Park Feeding Station"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type *</Label>
                    <select
                      value={newPoint.type}
                      onChange={(e) => setNewPoint({ ...newPoint, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="water">Water Only</option>
                      <option value="food">Food Only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={newPoint.address}
                    onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={newPoint.city}
                      onChange={(e) => setNewPoint({ ...newPoint, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={newPoint.state}
                      onChange={(e) => setNewPoint({ ...newPoint, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label>Pincode *</Label>
                    <Input
                      value={newPoint.pincode}
                      onChange={(e) => setNewPoint({ ...newPoint, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPoint.lat}
                        onChange={(e) => setNewPoint({ ...newPoint, lat: e.target.value })}
                        placeholder="Latitude"
                      />
                      <Button type="button" variant="outline" onClick={getCurrentLocation} size="sm">
                        Get Location
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      value={newPoint.lng}
                      onChange={(e) => setNewPoint({ ...newPoint, lng: e.target.value })}
                      placeholder="Longitude"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newPoint.description}
                    onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                    placeholder="Additional details about this feeding point..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-[#2BB6AF] to-[#239a94] hover:from-[#239a94] hover:to-[#1a7a75] text-white"
                  onClick={handleAddPoint}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
          {!canAddFeedingPoint && !isAdmin && (
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Only admins and users with approved shelters can add feeding points.</p>
              <Button
                variant="outline"
                onClick={() => navigate('/register-shelter')}
                className="border-green-200 hover:bg-green-50"
              >
                Register Shelter
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search feeding points..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Interactive Map */}
        <Card className="mb-6 border-2 border-gray-300 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-[#2BB6AF]" />
              <CardTitle>Interactive Map</CardTitle>
            </div>
            <CardDescription>Click on markers to see feeding point details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full h-[500px] bg-gray-100">
              {filteredPoints.length > 0 ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6V4qOZjFJw'}&q=${filteredPoints[0]?.location?.city || 'India'}&zoom=10`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <MapPin className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Feeding Points</h3>
                  <p className="text-gray-600">Add feeding points to see them on the map</p>
                </div>
              )}
            </div>
            {filteredPoints.length > 0 && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex flex-wrap gap-2">
                  {filteredPoints.slice(0, 5).map((point) => (
                    <Button
                      key={point._id || point.id}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (point.location?.coordinates?.lat && point.location?.coordinates?.lng) {
                          window.open(
                            `https://www.google.com/maps?q=${point.location.coordinates.lat},${point.location.coordinates.lng}`,
                            '_blank'
                          );
                        } else if (point.location?.address) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${point.location.address}, ${point.location.city}`
                            )}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {point.name}
                    </Button>
                  ))}
                  {filteredPoints.length > 5 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{filteredPoints.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feeding Points List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading feeding points...</p>
          </div>
        ) : filteredPoints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Feeding Points Found</h3>
              <p className="text-gray-600">Be the first to add a feeding point in your area!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPoints.map((point) => (
              <Card key={point._id || point.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-bold">{point.name}</CardTitle>
                    <Badge className={
                      point.type === 'water' ? 'bg-blue-100 text-blue-700' :
                      point.type === 'food' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {point.type === 'water' ? <Droplet className="h-3 w-3 mr-1" /> :
                       point.type === 'food' ? <UtensilsCrossed className="h-3 w-3 mr-1" /> :
                       <><Droplet className="h-3 w-3 mr-1" /><UtensilsCrossed className="h-3 w-3" /></>}
                      {point.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{point.location?.address}, {point.location?.city}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Pincode: {point.location?.pincode}
                  </div>
                </CardHeader>
                <CardContent>
                  {point.description && (
                    <p className="text-sm text-gray-600 mb-4">{point.description}</p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-green-200 hover:bg-green-50"
                    onClick={() => {
                      if (point.location?.coordinates) {
                        window.open(`https://www.google.com/maps?q=${point.location.coordinates.lat},${point.location.coordinates.lng}`, '_blank');
                      }
                    }}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Map
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

