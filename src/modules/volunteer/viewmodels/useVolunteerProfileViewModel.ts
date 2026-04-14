import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/shared/services/profileService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import type { ProfileUpdateRequest } from '@/shared/entities/ProfileEntity';
import { VolunteerStats } from '@/shared/entities/VolunteerEntity';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';



export function useVolunteerProfileViewModel() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<VolunteerStats>(new VolunteerStats());
  const [history, setHistory] = useState<RescueTaskEntity[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'BADGES'>('HISTORY');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Profile
      const res = await profileService.getProfile();
      const u = res.data;
      if (u) {
        updateUser({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          address: u.address,
          imageUrl: u.imageUrl
        });
      }

      // 2. Load Rescue Tasks & Calc Stats
      if (user?.id) {
        const { data: tasks } = await rescueTaskService.getTasksByUserId(user.id);
        setHistory(tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        const total = tasks.length;
        const success = tasks.filter(t => t.status === 'COMPLETED').length;
        
        let totalMs = 0;
        tasks.forEach(t => {
          if (t.status === 'COMPLETED' && t.updatedAt && t.createdAt) {
            const start = new Date(t.createdAt).getTime();
            const end = new Date(t.updatedAt).getTime();
            if (end > start) {
              totalMs += (end - start);
            }
          }
        });

        const hours = Math.round(totalMs / 3600000); // 1h = 3,600,000ms

        setStats(new VolunteerStats({
          totalMissions: total,
          successMissions: success,
          totalHours: hours,
          avgRating: 0 // Bỏ rating
        }));
      }
    } catch (err) {
      console.error('[VolunteerProfileViewModel] loadProfileData error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      const url = await profileService.uploadFile(file);
      return url;
    } catch (err) {
      console.error('[VolunteerProfile] Change avatar error:', err);
      throw err;
    }
  };

  const handleAvatarRemove = async () => {
    return '';
  };

  const handleUpdateProfile = async (data: ProfileUpdateRequest) => {
    try {
      const res = await profileService.updateProfile(data);
      if (res.data) {
        updateUser({
          fullName: res.data.fullName,
          phone: res.data.phone,
          email: res.data.email,
          address: res.data.address,
          imageUrl: res.data.imageUrl
        });
      }
      return true;
    } catch (err) {
      console.error('[VolunteerProfile] Update profile error:', err);
      throw err;
    }
  };

  const displayName = user?.fullName || 'Người Cứu Hộ';
  const displayEmail = user?.email || 'Volunteer@sosmap.vn';
  const avatarUrl = user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F85A2B&color=fff&size=200`;

  return {
    user,
    isLoading,
    stats,
    history,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    handleAvatarChange,
    handleAvatarRemove,
    handleUpdateProfile,
    displayName,
    displayEmail,
    avatarUrl
  };
}

