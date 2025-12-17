import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ChatRequest {
  id: number;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  target: {
    id: number;
    name: string;
    email: string;
  };
  status: string;
  message?: string;
  created_at: string;
}

export function AdminChatPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChatRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllChatRequests();
      setRequests(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load chat requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await adminApi.approveChatRequest(requestId, adminNotes);
      toast({
        title: 'Request Approved',
        description: 'The chat request has been approved',
      });
      setDialogOpen(false);
      setAdminNotes('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Could not approve request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await adminApi.rejectChatRequest(requestId, adminNotes);
      toast({
        title: 'Request Rejected',
        description: 'The chat request has been rejected',
      });
      setDialogOpen(false);
      setAdminNotes('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Could not reject request',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (request: ChatRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat Request Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pending chat requests</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.requester.name}</p>
                      <p className="text-xs text-gray-500">{request.requester.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.target.name}</p>
                      <p className="text-xs text-gray-500">{request.target.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openDialog(request, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog(request, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* View/Approve/Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat Request Details</DialogTitle>
            <DialogDescription>Review and respond to the chat request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Requester</Label>
                  <p className="font-medium">{selectedRequest.requester.name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.requester.email}</p>
                </div>
                <div>
                  <Label>Target User</Label>
                  <p className="font-medium">{selectedRequest.target.name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.target.email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {format(new Date(selectedRequest.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              {selectedRequest.message && (
                <div>
                  <Label>Message</Label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1">
                    <p className="text-sm">{selectedRequest.message}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

