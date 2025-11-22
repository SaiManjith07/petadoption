import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, MapPin, Bell, AlertCircle, CheckCircle2, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { alertAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function NeighborhoodAlerts() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [myAlerts, setMyAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    pincode: '',
    alert_type: 'lost',
    title: '',
    description: '',
    priority: 'medium',
    expires_in_days: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadMyAlerts();
    }
  }, [isAuthenticated]);

  const loadMyAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertAPI.getMy();
      setMyAlerts(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlertsByPincode = async () => {
    if (!pincode || pincode.length < 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid pincode',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const data = await alertAPI.getByPincode(pincode);
      setAlerts(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.pincode || !newAlert.title || !newAlert.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await alertAPI.create(newAlert);
      toast({
        title: 'Success',
        description: 'Alert submitted. Admin will review it shortly.',
      });
      setShowCreateDialog(false);
      setNewAlert({
        pincode: '',
        alert_type: 'lost',
        title: '',
        description: '',
        priority: 'medium',
        expires_in_days: 30,
      });
      loadMyAlerts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create alert',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Neighborhood Watch Alerts</CardTitle>
            <CardDescription className="text-base mt-2">
              Get instant notifications about lost or found animals in your pincode area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Pincode-based alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>SMS & push notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Local volunteer network</span>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              onClick={() => navigate('/auth/login')}
            >
              Login to Subscribe
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
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Neighborhood Watch Alerts</h1>
              <p className="text-gray-600 mt-1">Get instant notifications about lost or found animals in your area</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Neighborhood Alert</DialogTitle>
                <DialogDescription>
                  Create an alert for your pincode area. Admin will review and approve it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={newAlert.pincode}
                    onChange={(e) => setNewAlert({ ...newAlert, pincode: e.target.value })}
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label>Alert Type *</Label>
                  <select
                    value={newAlert.alert_type}
                    onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="lost">Lost Animal</option>
                    <option value="found">Found Animal</option>
                    <option value="adoption">Adoption Available</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="Brief title for the alert"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={newAlert.description}
                    onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                    placeholder="Detailed description..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <select
                      value={newAlert.priority}
                      onChange={(e) => setNewAlert({ ...newAlert, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <Label>Expires In (days)</Label>
                    <Input
                      type="number"
                      value={newAlert.expires_in_days}
                      onChange={(e) => setNewAlert({ ...newAlert, expires_in_days: parseInt(e.target.value) || 30 })}
                      min={1}
                      max={90}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  onClick={handleCreateAlert}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">Search by Pincode</TabsTrigger>
            <TabsTrigger value="my">My Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Alerts by Pincode</CardTitle>
                <CardDescription>Enter a pincode to see active alerts in that area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter pincode (e.g., 110001)"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                    className="flex-1"
                  />
                  <Button onClick={loadAlertsByPincode} disabled={!pincode || pincode.length < 6}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {alerts.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Alerts Found</h3>
                  <p className="text-gray-600">Try searching with a different pincode</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <Card key={alert._id || alert.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <Badge className={
                              alert.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              alert.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {alert.priority}
                            </Badge>
                            <Badge className={
                              alert.alert_type === 'lost' ? 'bg-blue-100 text-blue-700' :
                              alert.alert_type === 'found' ? 'bg-green-100 text-green-700' :
                              alert.alert_type === 'adoption' ? 'bg-purple-100 text-purple-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {alert.alert_type}
                            </Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>Pincode: {alert.pincode}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <Badge className={
                          alert.status === 'active' ? 'bg-green-100 text-green-700' :
                          alert.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {alert.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {alert.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{alert.description}</p>
                      <div className="text-sm text-gray-500">
                        Created: {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                        {alert.expires_at && ` • Expires: ${format(new Date(alert.expires_at), 'MMM d, yyyy')}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading your alerts...</p>
              </div>
            ) : myAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Alerts Created</h3>
                  <p className="text-gray-600 mb-4">Create your first neighborhood alert to get started</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Alert
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myAlerts.map((alert) => (
                  <Card key={alert._id || alert.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <Badge className={
                              alert.status === 'active' ? 'bg-green-100 text-green-700' :
                              alert.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              alert.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {alert.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {alert.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>Pincode: {alert.pincode} • Type: {alert.alert_type}</span>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{alert.description}</p>
                      <div className="text-sm text-gray-500">
                        Created: {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

