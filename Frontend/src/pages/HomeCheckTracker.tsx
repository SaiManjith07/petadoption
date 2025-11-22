import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { homeCheckAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function HomeCheckTracker() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [homeChecks, setHomeChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      loadHomeChecks();
    }
  }, [isAuthenticated]);

  const loadHomeChecks = async () => {
    try {
      setLoading(true);
      const data = await homeCheckAPI.getMy();
      setHomeChecks(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load home checks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChecks = filterStatus === 'all' 
    ? homeChecks 
    : homeChecks.filter(check => check.status === filterStatus);

  const stats = {
    requested: homeChecks.filter(c => c.status === 'scheduled').length,
    scheduled: homeChecks.filter(c => c.status === 'scheduled').length,
    completed: homeChecks.filter(c => c.status === 'completed').length,
    cancelled: homeChecks.filter(c => c.status === 'cancelled').length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Adoption Home-Check Tracker</CardTitle>
            <CardDescription className="text-base mt-2">
              Track pre and post-adoption home visits conducted by NGO partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.requested}</div>
                <div className="text-xs text-gray-600">Requested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.scheduled}</div>
                <div className="text-xs text-gray-600">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              onClick={() => navigate('/auth/login')}
            >
              Login to Track
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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <ClipboardCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Adoption Home-Check Tracker</h1>
              <p className="text-gray-600 mt-1">Track pre and post-adoption home visits conducted by NGO partners</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.requested}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus}>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading home checks...</p>
              </div>
            ) : filteredChecks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Home Checks Found</h3>
                  <p className="text-gray-600">No home checks match your filter criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredChecks.map((check) => {
                  const isPreAdoption = check.check_type === 'pre_adoption';
                  
                  return (
                    <Card key={check._id || check.id} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">
                                {check.pet?.breed || check.pet?.species || 'Pet'} - {isPreAdoption ? 'Pre-Adoption' : 'Post-Adoption'} Check
                              </CardTitle>
                              <Badge className={
                                check.status === 'completed' ? 'bg-green-100 text-green-700' :
                                check.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                check.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {check.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {check.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                                {check.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                                {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                              </Badge>
                            </div>
                            <CardDescription>
                              Adopter: {check.adopter?.name || 'Unknown'} • 
                              Conducted by: {check.conducted_by?.name || check.ngo_id?.name || 'NGO Partner'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Scheduled Date</p>
                            <p className="text-sm font-semibold">
                              {check.scheduled_date ? format(new Date(check.scheduled_date), 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                          {check.completed_date && (
                            <div>
                              <p className="text-xs text-gray-500">Completed Date</p>
                              <p className="text-sm font-semibold">
                                {format(new Date(check.completed_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                          {check.findings?.overall_assessment && (
                            <div>
                              <p className="text-xs text-gray-500">Assessment</p>
                              <Badge className={
                                check.findings.overall_assessment === 'approved' ? 'bg-green-100 text-green-700' :
                                check.findings.overall_assessment === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {check.findings.overall_assessment}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {check.findings?.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {check.findings.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

