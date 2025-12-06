import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Shield,
  PawPrint,
  Search,
  Home,
  MessageSquare,
  Users,
  FileText,
  User,
  ArrowRight,
  Building2,
  UserPlus,
  UtensilsCrossed,
  MapPin,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/api';
import { roleRequestAPI } from '@/services/api';
import { shelterApi } from '@/api';
import { feedingPointAPI } from '@/services/api';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface PendingCounts {
  foundPets: number;
  lostPets: number;
  roleRequests: number;
  shelterRegistrations: number;
  feedingPoints: number;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    pendingKey: null,
  },
  {
    title: 'Found Pets',
    icon: PawPrint,
    path: '/admin/found-pets',
    pendingKey: 'foundPets',
  },
  {
    title: 'Lost Pets',
    icon: Search,
    path: '/admin/lost-pets',
    pendingKey: 'lostPets',
  },
  {
    title: 'Adoption',
    icon: Home,
    path: '/admin/adopt',
    pendingKey: null,
  },
  {
    title: 'Chats',
    icon: MessageSquare,
    path: '/admin/chats',
    pendingKey: null,
  },
  {
    title: 'Users',
    icon: Users,
    path: '/admin/users',
    pendingKey: null,
  },
  {
    title: 'All Pets',
    icon: FileText,
    path: '/admin/all-pets',
    pendingKey: null,
  },
  {
    title: 'Role Requests',
    icon: UserPlus,
    path: '/admin/role-requests',
    pendingKey: 'roleRequests',
  },
  {
    title: 'Feeding Points',
    icon: UtensilsCrossed,
    path: '/admin/feeding-points',
    pendingKey: 'feedingPoints',
  },
  {
    title: 'Shelter Locations',
    icon: MapPin,
    path: '/admin/shelter-locations',
    pendingKey: 'shelterRegistrations',
  },
  {
    title: 'Medical Registration',
    icon: Stethoscope,
    path: '/admin/medical-records',
    pendingKey: null,
  },
];

export const AdminSidebar = ({ isOpen = true, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    foundPets: 0,
    lostPets: 0,
    roleRequests: 0,
    shelterRegistrations: 0,
    feedingPoints: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      loadPendingCounts();
      // Refresh counts every 30 seconds
      const interval = setInterval(loadPendingCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const loadPendingCounts = async () => {
    try {
      // Load all counts in parallel
      const [allPetsRes, pendingFoundRes, pendingLostRes, roleRequestsRes, sheltersRes, feedingPointsRes] = await Promise.allSettled([
        adminApi.getAllPets(),
        adminApi.getPendingReports('found'),
        adminApi.getPendingReports('lost'),
        roleRequestAPI.getPending(),
        shelterApi.getAllShelters(),
        feedingPointAPI.getAll(),
      ]);

      // Count found pets pending - check both all pets and pending reports
      let foundPendingCount = 0;
      if (allPetsRes.status === 'fulfilled') {
        try {
          const allPets = allPetsRes.value || [];
          const foundPets = allPets.filter((p: any) => {
            const isFound = p.adoption_status === 'Found' || 
                           p.report_type === 'found' || 
                           p.type === 'found' ||
                           (p.status && p.status.includes('Found'));
            return isFound;
          });
          foundPendingCount = foundPets.filter((p: any) => 
            !p.is_verified || 
            (p.status || p.adoption_status || '').toLowerCase().includes('pending') ||
            p.status === 'Pending Verification'
          ).length;
        } catch (e) {
          console.error('Error counting found pets from all:', e);
        }
      }
      if (pendingFoundRes.status === 'fulfilled') {
        try {
          const pendingPets = pendingFoundRes.value || [];
          foundPendingCount = Math.max(foundPendingCount, pendingPets.length);
        } catch (e) {
          console.error('Error counting pending found pets:', e);
        }
      }
      setPendingCounts(prev => ({ ...prev, foundPets: foundPendingCount }));

      // Count lost pets pending - check both all pets and pending reports
      let lostPendingCount = 0;
      if (allPetsRes.status === 'fulfilled') {
        try {
          const allPets = allPetsRes.value || [];
          const lostPets = allPets.filter((p: any) => {
            const isLost = p.adoption_status === 'Lost' || 
                           p.report_type === 'lost' || 
                           p.type === 'lost' ||
                           (p.status && p.status.includes('Lost'));
            return isLost;
          });
          lostPendingCount = lostPets.filter((p: any) => 
            !p.is_verified || 
            (p.status || p.adoption_status || '').toLowerCase().includes('pending') ||
            p.status === 'Pending Verification'
          ).length;
        } catch (e) {
          console.error('Error counting lost pets from all:', e);
        }
      }
      if (pendingLostRes.status === 'fulfilled') {
        try {
          const pendingPets = pendingLostRes.value || [];
          lostPendingCount = Math.max(lostPendingCount, pendingPets.length);
        } catch (e) {
          console.error('Error counting pending lost pets:', e);
        }
      }
      setPendingCounts(prev => ({ ...prev, lostPets: lostPendingCount }));

      // Count role requests pending
      if (roleRequestsRes.status === 'fulfilled') {
        try {
          const requests = roleRequestsRes.value || [];
          setPendingCounts(prev => ({ ...prev, roleRequests: requests.length }));
        } catch (e) {
          console.error('Error counting role requests:', e);
        }
      }

      // Count shelter registrations pending
      if (sheltersRes.status === 'fulfilled') {
        try {
          const shelters = sheltersRes.value || [];
          const pending = shelters.filter((s: any) => s.status === 'pending' || !s.is_verified).length;
          setPendingCounts(prev => ({ ...prev, shelterRegistrations: pending }));
        } catch (e) {
          console.error('Error counting shelters:', e);
        }
      }

      // Count feeding points pending
      if (feedingPointsRes.status === 'fulfilled') {
        try {
          const points = feedingPointsRes.value || [];
          const pending = points.filter((p: any) => !p.is_active).length;
          setPendingCounts(prev => ({ ...prev, feedingPoints: pending }));
        } catch (e) {
          console.error('Error counting feeding points:', e);
        }
      }
    } catch (error) {
      console.error('Error loading pending counts:', error);
    }
  };

  const isActive = (path: string, hash?: string) => {
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    return location.pathname === path;
  };

  const getPendingCount = (pendingKey: string | null): number => {
    if (!pendingKey) return 0;
    return pendingCounts[pendingKey as keyof PendingCounts] || 0;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Fixed Sidebar - Clean White Design */}
      <div className={cn(
        "w-64 bg-white border-r border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
        "relative overflow-hidden flex flex-col",
        // Desktop: fixed position
        "lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40",
        // Mobile: fixed and slideable
        "fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100">
          <div className="h-10 w-10 rounded-xl bg-[#E8F8EE] flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#4CAF50]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">PetReunite</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 py-6 space-y-1 overflow-y-auto flex-1 min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.hash);
            const pendingCount = getPendingCount(item.pendingKey);
            const hasPending = pendingCount > 0;
            
            return (
              <Link
                key={item.path + (item.hash || '')}
                to={item.path + (item.hash || '')}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative',
                  active
                    ? 'bg-[#E8F8EE] text-[#4CAF50]'
                    : hasPending
                    ? 'text-gray-700 hover:bg-yellow-50 hover:text-[#4CAF50] bg-yellow-50/50'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#4CAF50]'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#4CAF50] rounded-r-full" />
                )}
                {/* Pending indicator bar */}
                {hasPending && !active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-r-full" />
                )}
                <Icon className={cn('h-5 w-5', active && 'text-[#4CAF50]', hasPending && !active && 'text-yellow-600')} strokeWidth={2} />
                <span className="font-medium text-sm flex-1">{item.title}</span>
                {hasPending && (
                  <Badge 
                    variant="destructive" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-0.5 min-w-[20px] flex items-center justify-center"
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Badge>
                )}
                {active && !hasPending && (
                  <ArrowRight className="h-4 w-4 text-[#4CAF50]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Info Section - Bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-full bg-[#E8F8EE] flex items-center justify-center border-2 border-[#4CAF50]/20">
              <User className="h-5 w-5 text-[#4CAF50]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@petreunite.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
