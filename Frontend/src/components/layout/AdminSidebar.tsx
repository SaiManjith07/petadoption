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
import { Logo } from '@/components/ui/Logo';
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

      // Count found pets pending - use pending reports API directly (most accurate)
      let foundPendingCount = 0;
      if (pendingFoundRes.status === 'fulfilled') {
        try {
          const pendingPets = pendingFoundRes.value?.data || pendingFoundRes.value || [];
          foundPendingCount = Array.isArray(pendingPets) ? pendingPets.length : 0;
        } catch (e) {
          console.error('Error counting pending found pets:', e);
        }
      } else {
        console.warn('Failed to load pending found pets:', pendingFoundRes.reason);
      }
      setPendingCounts(prev => ({ ...prev, foundPets: foundPendingCount }));

      // Count lost pets pending - use pending reports API directly (most accurate)
      let lostPendingCount = 0;
      if (pendingLostRes.status === 'fulfilled') {
        try {
          const pendingPets = pendingLostRes.value?.data || pendingLostRes.value || [];
          lostPendingCount = Array.isArray(pendingPets) ? pendingPets.length : 0;
        } catch (e) {
          console.error('Error counting pending lost pets:', e);
        }
      } else {
        console.warn('Failed to load pending lost pets:', pendingLostRes.reason);
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Fixed Sidebar - Modern floating design with 280px width */}
      <div className={cn(
        "w-[280px] bg-white border-r border-[#E5E7EB] rounded-r-2xl",
        "shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]",
        "relative overflow-hidden flex flex-col",
        // Desktop: fixed position below navbar
        "lg:fixed lg:left-0 lg:top-[70px] lg:h-[calc(100vh-70px)] lg:z-[999]",
        // Mobile: fixed and slideable
        "fixed left-0 top-[70px] h-[calc(100vh-70px)] z-[999] transform transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Navigation Menu */}
        <nav className="px-4 py-4 sm:py-6 space-y-1 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
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
                    ? 'bg-gradient-to-r from-[#14b8a6]/10 to-[#0891b2]/10 text-[#14b8a6] shadow-sm'
                    : hasPending
                    ? 'text-[#374151] hover:bg-[#FEF3C7] hover:text-[#F59E0B] bg-[#FEF3C7]/50'
                    : 'text-[#374151] hover:bg-[#F9FAFB] hover:text-[#14b8a6]'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-3 w-1 h-8 bg-gradient-to-b from-[#14b8a6] to-[#0891b2] rounded-r-full shadow-sm" />
                )}
                {/* Pending indicator bar */}
                {hasPending && !active && (
                  <div className="absolute left-0 top-3 w-1 h-8 bg-[#F59E0B] rounded-r-full" />
                )}
                <Icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-[#14b8a6]' : hasPending && !active ? 'text-[#F59E0B]' : 'text-[#6B7280] group-hover:text-[#14b8a6]')} strokeWidth={2} />
                <span className={cn('font-semibold text-sm flex-1', active ? 'text-[#14b8a6]' : hasPending && !active ? 'text-[#92400E]' : 'text-[#111827]')}>{item.title}</span>
                {hasPending && (
                  <Badge 
                    variant="destructive" 
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs px-2 py-0.5 min-w-[20px] flex items-center justify-center rounded-full"
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Badge>
                )}
                {active && !hasPending && (
                  <ArrowRight className="h-4 w-4 text-[#14b8a6] flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Info Section - Bottom */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-[#E5E7EB] shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0891b2] flex items-center justify-center border-2 border-white shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-[#6B7280] truncate">{user?.email || 'admin@petreunite.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
