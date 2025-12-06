import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI, adminAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function NGOVerification() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'This page is only accessible to admin users.',
        variant: 'destructive',
      });
      navigate('/home');
      return;
    }
    if (isAuthenticated && isAdmin) {
      loadMyReports();
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const loadMyReports = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user
      const userReports = items.filter((p: any) => {
        const submittedById = typeof p.submitted_by === 'object' 
          ? (p.submitted_by._id || p.submitted_by.id)
          : p.submitted_by;
        const userId = (user as any)?._id || user?.id;
        return submittedById && userId && String(submittedById) === String(userId);
      });
      setMyReports(userReports);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = myReports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      (report.breed || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.species || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: myReports.filter(r => r.status === 'Pending Verification').length,
    approved: myReports.filter(r => ['Listed Found', 'Listed Lost', 'Available for Adoption'].includes(r.status)).length,
    rejected: myReports.filter(r => r.status === 'Rejected').length,
    total: myReports.length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">NGO Verification</CardTitle>
            <CardDescription className="text-base mt-2">
              Reports reviewed and approved by partner NGOs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              onClick={() => navigate('/auth/login')}
            >
              Login to View
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
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">NGO Verification</h1>
              <p className="text-gray-600 mt-1">Track your reports reviewed and approved by partner NGOs</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="Pending Verification">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus}>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
                  <p className="text-gray-600 mb-4">You haven't submitted any reports yet</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/pets/new/found')}>
                      Report Found Pet
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/pets/new/lost')}>
                      Report Lost Pet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const isPending = report.status === 'Pending Verification';
                  const isApproved = ['Listed Found', 'Listed Lost', 'Available for Adoption'].includes(report.status);
                  const isRejected = report.status === 'Rejected';
                  
                  return (
                    <Card key={report._id || report.id} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">
                                {report.breed || report.species || 'Pet'} - {report.report_type === 'found' ? 'Found' : report.report_type === 'lost' ? 'Lost' : 'Adoption'}
                              </CardTitle>
                              <Badge className={
                                isApproved ? 'bg-green-100 text-green-700' :
                                isRejected ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {isApproved && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {isRejected && <XCircle className="h-3 w-3 mr-1" />}
                                {isPending && <Clock className="h-3 w-3 mr-1" />}
                                {report.status}
                              </Badge>
                            </div>
                            <CardDescription>
                              Location: {report.location || report.last_seen_or_found_location_text || 'Not specified'} • 
                              Submitted: {format(new Date(report.date_submitted || report.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {report.verification_notes && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-700">
                              <strong>Verification Notes:</strong> {report.verification_notes}
                            </p>
                          </div>
                        )}
                        {report.verification_date && (
                          <div className="text-sm text-gray-500 mb-2">
                            Verified on: {format(new Date(report.verification_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/pets/${report._id || report.id}`)}
                          >
                            View Details
                          </Button>
                          {isPending && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Under Review
                            </Badge>
                          )}
                        </div>
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

