import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Shield, FileText, Phone, MapPin, Calendar, Edit2, Save, X, 
  CheckCircle2, Lock, Eye, EyeOff, Camera, Globe, Building, Hash, 
  AlertCircle, CheckCircle, Clock, UserCheck, Award, TrendingUp, Activity,
  Heart, Search, Home, Users, Building2, Truck, Utensils, BarChart3,
  Star, Zap, Target, Award as AwardIcon, Bell, MessageSquare, MapPin as MapPinIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { petsApi, authApi } from '@/api';
import { getImageUrl } from '@/services/api';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { shelterApi } from '@/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [myShelter, setMyShelter] = useState<any>(null);
  const [myRoleRequests, setMyRoleRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    foundPets: 0,
    lostPets: 0,
    adoptedPets: 0,
    reunitedPets: 0,
    pendingReports: 0,
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    address: {
      city: '',
      state: '',
      country: '',
      pincode: '',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadMyPets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await petsApi.getAll();
      // Handle different response formats from backend
      const pets = response.results || response.data || response.items || [];
      
      const userId = user?._id || user?.id;
      if (!userId) {
        console.warn('User ID not found');
        setMyPets([]);
        return;
      }
      
      const userPets = pets.filter((p: any) => {
        // Check multiple possible fields for user identification
        const postedById = typeof p.posted_by === 'object' 
          ? (p.posted_by._id || p.posted_by.id)
          : (typeof p.submitted_by === 'object'
            ? (p.submitted_by._id || p.submitted_by.id)
            : (p.submitted_by || p.posted_by));
        
        const isMyPet = postedById && String(postedById) === String(userId);
        
        // Include all pet types (lost, found, adoption)
        const isRelevantPet = p.report_type === 'lost' || 
                             p.report_type === 'found' || 
                             p.report_type === 'adoption' ||
                             p.status?.includes('Lost') || 
                             p.status?.includes('Found') ||
                             p.adoption_status === 'Lost' || 
                             p.adoption_status === 'Found' ||
                             p.adoption_status === 'Available for Adoption';
        
        return isMyPet && isRelevantPet;
      });
      
      // Sort by date (most recent first)
      userPets.sort((a: any, b: any) => {
        const dateA = new Date(a.date_submitted || a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.date_submitted || b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      // Normalize pet IDs
      const normalizedPets = userPets.map((pet: any) => {
        if (!pet.id && pet._id) {
          pet.id = pet._id;
        }
        return pet;
      });
      
      setMyPets(normalizedPets);
    } catch (error: any) {
      console.error('Error loading pets:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load your pet reports. Please try again.',
        variant: 'destructive',
      });
      setMyPets([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadMyPets();
      loadAdditionalData();
    }
  }, [user, loadMyPets]);

  // Sync personalInfo with user data whenever user changes
  useEffect(() => {
    if (user && !isEditing) {
      setPersonalInfo({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        address: {
          city: user?.address?.city || '',
          state: user?.address?.state || '',
          country: user?.address?.country || '',
          pincode: user?.address?.pincode || '',
        },
      });
    }
  }, [user, isEditing]);

  const loadAdditionalData = async () => {
    try {
      const API_URL = API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.warn('No access token found, skipping additional data load');
        return;
      }

      // Load shelter registration
      try {
        const shelterData = await shelterApi.getMyShelter();
        setMyShelter(shelterData);
      } catch (error) {
        console.error('Error loading shelter:', error);
        // Don't throw, just log - shelter is optional
      }

      // Load role requests
      try {
        const roleRes = await fetch(`${API_URL}/role-requests/my`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setMyRoleRequests(roleData.data || []);
        } else if (roleRes.status === 401) {
          console.warn('Unauthorized access to role requests - token may be expired');
          // Don't set error, just skip loading role requests
        } else {
          console.error('Error loading role requests:', roleRes.status, roleRes.statusText);
        }
      } catch (error) {
        console.error('Error loading role requests:', error);
        // Don't throw, just log - role requests are optional
      }
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  useEffect(() => {
    // Calculate statistics
    const found = myPets.filter((p: any) => 
      p.report_type === 'found' || 
      p.status === 'Found' || 
      p.adoption_status === 'Found'
    ).length;
    const lost = myPets.filter((p: any) => 
      p.report_type === 'lost' || 
      p.status === 'Lost' || 
      p.adoption_status === 'Lost'
    ).length;
    const adopted = myPets.filter((p: any) => 
      p.status === 'Adopted' || 
      p.status === 'Available for Adoption' ||
      p.adoption_status === 'Adopted'
    ).length;
    const reunited = myPets.filter((p: any) => 
      p.status === 'Reunited' || 
      p.status === 'Matched' ||
      p.adoption_status === 'Reunited'
    ).length;
    const pending = myPets.filter((p: any) => 
      p.status?.includes('Pending') || 
      p.adoption_status?.includes('Pending')
    ).length;

    setStats({
      totalReports: myPets.length,
      foundPets: found,
      lostPets: lost,
      adoptedPets: adopted,
      reunitedPets: reunited,
      pendingReports: pending,
    });
  }, [myPets]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data
      const updateData: any = {
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        bio: personalInfo.bio,
        address: personalInfo.address,
      };

      // Use authApi.updateProfile which updates the current user's profile
      await authApi.updateProfile(updateData);
      
      // Refresh user data to get the latest from server
      if (refreshUser) {
        await refreshUser();
      }
      
      // Close editing mode - the useEffect will sync personalInfo with updated user
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    setPersonalInfo({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
        address: {
          city: user?.address?.city || '',
          state: user?.address?.state || '',
          country: user?.address?.country || '',
          pincode: user?.address?.pincode || '',
        },
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setChangingPassword(true);
      const API_URL = API_BASE_URL;
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/users/change-password/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update password' }));
        throw new Error(error.message || error.detail || 'Failed to update password');
      }
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordDialog(false);
      
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        const petId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(petId)) {
          throw new Error('Invalid pet ID');
        }
        await petsApi.delete(petId);
        setMyPets(myPets.filter((p: any) => {
          const petIdNum = p.id || p._id;
          return String(petIdNum) !== String(id);
        }));
        loadMyPets();
        toast({
          title: 'Success',
          description: 'Pet report deleted successfully',
        });
      } catch (error: any) {
        console.error('Error deleting pet:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to delete pet report',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 -m-6 lg:-m-8 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {user?.profile_image && (
                        <img
                          src={getImageUrl(user.profile_image) || ''}
                          alt={user.name}
                          className="h-24 w-24 rounded-full object-cover absolute inset-0"
                        />
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-xl">{user?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Role</span>
                      <Badge variant="secondary" className="capitalize">
                        {user?.role || 'user'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Status</span>
                      <div className="flex items-center gap-2">
                        {user?.is_verified ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Account Status</span>
                      <Badge className={user?.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Total Reports</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.totalReports}</span>
                    </div>
                    {user?.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Member Since</span>
                        <span className="text-sm text-gray-900">
                          {format(new Date(user.createdAt), 'MMM yyyy')}
                        </span>
                      </div>
                    )}
                    {user?.address?.pincode && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Pincode</span>
                        <span className="text-sm text-gray-900">{user.address.pincode}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  {/* Volunteer Status */}
                  {['rescuer', 'feeder', 'transporter'].includes(user?.role || '') && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Volunteer Status</p>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#4CAF50]" />
                        <span className="text-sm font-medium text-gray-900 capitalize">{user?.role} Volunteer</span>
                      </div>
                    </div>
                  )}
                  {/* Shelter Status */}
                  {myShelter && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shelter</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#4CAF50]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{myShelter.shelter_name}</p>
                          <Badge 
                            variant={myShelter.status === 'approved' ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {myShelter.status === 'approved' ? 'Approved' : myShelter.status === 'pending' ? 'Pending' : 'Rejected'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personal Information Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-[#4CAF50]" />
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-[#4CAF50] hover:text-[#2E7D32] hover:bg-green-50"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={personalInfo.name}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={personalInfo.email}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              type="tel"
                              value={personalInfo.phone}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                              placeholder="Enter your phone number"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="country"
                              value={personalInfo.address.country}
                              onChange={(e) => setPersonalInfo({
                                ...personalInfo,
                                address: { ...personalInfo.address, country: e.target.value }
                              })}
                              placeholder="Country"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="state"
                              value={personalInfo.address.state}
                              onChange={(e) => setPersonalInfo({
                                ...personalInfo,
                                address: { ...personalInfo.address, state: e.target.value }
                              })}
                              placeholder="State/Province"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="city"
                              value={personalInfo.address.city}
                              onChange={(e) => setPersonalInfo({
                                ...personalInfo,
                                address: { ...personalInfo.address, city: e.target.value }
                              })}
                              placeholder="City"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="pincode"
                              value={personalInfo.address.pincode}
                              onChange={(e) => setPersonalInfo({
                                ...personalInfo,
                                address: { ...personalInfo.address, pincode: e.target.value }
                              })}
                              placeholder="Pincode"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="bio">Bio / About Me</Label>
                          <Textarea
                            id="bio"
                            value={personalInfo.bio}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94]"
                        >
                          {saving ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Email Address</p>
                            <p className="text-sm font-medium text-gray-900">{personalInfo.email || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                            <p className="text-sm font-medium text-gray-900">{personalInfo.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        {(personalInfo.address.city || personalInfo.address.state || personalInfo.address.country) && (
                          <>
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">City</p>
                                <p className="text-sm font-medium text-gray-900">{personalInfo.address.city || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">State/Province</p>
                                <p className="text-sm font-medium text-gray-900">{personalInfo.address.state || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Country</p>
                                <p className="text-sm font-medium text-gray-900">{personalInfo.address.country || 'Not provided'}</p>
                              </div>
                            </div>
                            {personalInfo.address.pincode && (
                              <div className="flex items-start gap-3">
                                <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Pincode</p>
                                  <p className="text-sm font-medium text-gray-900">{personalInfo.address.pincode}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {personalInfo.bio && (
                          <div className="flex items-start gap-3 md:col-span-2">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Bio</p>
                              <p className="text-sm font-medium text-gray-900">{personalInfo.bio}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {!personalInfo.phone && !personalInfo.address.city && !personalInfo.bio && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 mb-2">Complete your profile</p>
                          <p className="text-xs text-gray-400">Click Edit to add your personal information</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* Your Activity Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Activity</h2>
              <p className="text-gray-600">Overview of your pet reports and contributions</p>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card className="border-2 border-gray-200 hover:border-blue-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Reports</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:border-green-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Found Pets</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.foundPets}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:border-orange-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Lost Reports</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.lostPets}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <Search className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:border-purple-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Reunited</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.reunitedPets}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:border-yellow-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pendingReports}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Volunteer Information */}
            {['rescuer', 'feeder', 'transporter'].includes(user?.role || '') && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#4CAF50]" />
                    <CardTitle>Volunteer Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {user?.role === 'rescuer' && <Heart className="h-5 w-5 text-red-500" />}
                      {user?.role === 'feeder' && <Utensils className="h-5 w-5 text-orange-500" />}
                      {user?.role === 'transporter' && <Truck className="h-5 w-5 text-blue-500" />}
                      <div>
                        <p className="font-medium capitalize">{user?.role} Volunteer</p>
                        <p className="text-sm text-gray-500">Active volunteer status</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  {myRoleRequests.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Role Request History</p>
                      {myRoleRequests.map((request: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium capitalize">{request.role_requested}</p>
                            <p className="text-xs text-gray-500">
                              {request.requested_at ? format(new Date(request.requested_at), 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <Badge 
                            variant={request.status === 'approved' ? 'default' : request.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shelter Information */}
            {myShelter && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#4CAF50]" />
                    <CardTitle>Shelter Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Shelter Name</p>
                      <p className="text-lg font-semibold">{myShelter.shelter_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                      <Badge 
                        variant={myShelter.status === 'approved' ? 'default' : myShelter.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {myShelter.status === 'approved' ? 'Approved' : myShelter.status === 'pending' ? 'Pending Approval' : 'Rejected'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                      <p className="text-sm text-gray-900">
                        {myShelter.location?.address}, {myShelter.location?.city}, {myShelter.location?.state}
                      </p>
                      {myShelter.location?.pincode && (
                        <p className="text-xs text-gray-500 mt-1">Pincode: {myShelter.location.pincode}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Capacity</p>
                      <p className="text-sm text-gray-900">
                        {myShelter.current_occupancy || 0} / {myShelter.capacity} animals
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Area: {myShelter.area_sqft} sq ft</p>
                    </div>
                  </div>
                  {myShelter.facilities && myShelter.facilities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Facilities</p>
                      <div className="flex flex-wrap gap-2">
                        {myShelter.facilities.map((facility: string, index: number) => (
                          <Badge key={index} variant="outline">{facility}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {myShelter.accepts_feeding_data && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-700">Accepts feeding data from users</p>
                    </div>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register-shelter">View/Edit Shelter Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Account Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#4CAF50]" />
                  <CardTitle>Account Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Member Since</p>
                      <p className="text-xs text-gray-500">
                        {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {user?.updatedAt && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(user.updatedAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {user?.address?.pincode && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pincode</p>
                        <p className="text-xs text-gray-500">{user.address.pincode}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security & Password Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#4CAF50]" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>
                  Update your password to keep your account secure. Use a strong password with at least 6 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#2BB6AF] hover:bg-[#239a94]">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password *</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          >
                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password *</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Enter new password (min 6 characters)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          >
                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          >
                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={changingPassword}
                          className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94]"
                        >
                          {changingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPasswordDialog(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          disabled={changingPassword}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#4CAF50]" />
                  <CardTitle>Account Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Account Verification</p>
                      <p className="text-sm text-gray-500">
                        {user?.is_verified ? 'Your account is verified' : 'Verify your account to unlock all features'}
                      </p>
                    </div>
                  </div>
                  {user?.is_verified ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Pending
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Submissions</CardTitle>
                    <CardDescription>All your pet reports and their current status</CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : myPets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start by reporting a found or lost pet
                    </p>
                    <Button asChild className="bg-[#2BB6AF] hover:bg-[#239a94]">
                      <Link to="/pets/new/found">Report a Pet</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPets.map((pet: any) => {
                      const petId = pet.id || pet._id;
                      const photoPath = Array.isArray(pet.photos) && pet.photos.length > 0
                        ? (typeof pet.photos[0] === 'string' 
                            ? pet.photos[0] 
                            : pet.photos[0]?.url || pet.photos[0]?.file_url || pet.photos[0])
                        : null;
                      const photoUrl = photoPath?.startsWith('data:') 
                        ? photoPath 
                        : (getImageUrl(photoPath) || 'https://via.placeholder.com/300');
                      return (
                        <Card key={petId} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-32 sm:h-32 h-48 overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={photoUrl}
                                alt={pet.breed || 'Pet'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300';
                                }}
                              />
                            </div>
                            <div className="flex-1 p-4 flex flex-col">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h4 className="font-semibold text-lg">{pet.breed || 'Unknown Breed'}</h4>
                                  <p className="text-sm text-gray-600">{pet.species || 'Unknown Species'}</p>
                                </div>
                                <Badge variant="secondary">{pet.status || 'Unknown'}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{pet.location || 'Location not specified'}</p>
                              <p className="text-xs text-gray-500 mb-3">
                                Submitted {format(new Date(pet.date_submitted || pet.createdAt || new Date()), 'MMM d, yyyy')}
                              </p>
                              <div className="flex gap-2 mt-auto">
                                {petId ? (
                                  <>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      asChild 
                                      className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94]"
                                    >
                                      <Link to={`/pets/${petId}`}>View Details</Link>
                                    </Button>
                                  </>
                                ) : (
                                  <Button variant="outline" size="sm" disabled className="flex-1">
                                    ID Missing
                                  </Button>
                                )}
                                {pet.status && pet.status.includes('Pending') && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(petId)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
