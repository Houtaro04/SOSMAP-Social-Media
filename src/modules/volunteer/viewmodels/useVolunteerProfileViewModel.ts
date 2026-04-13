import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/shared/services/profileService';
import type { ProfileUpdateRequest } from '@/shared/entities/ProfileEntity';
import type { VolunteerStats } from '@/shared/entities/VolunteerEntity';



export function useVolunteerProfileViewModel() {
  const { user, updateUser } = useAuthStore();
  const [stats] = useState<VolunteerStats>();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'BADGES'>('HISTORY');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const res = await profileService.getProfile();
      const u = res.data;
      if (u) {
        // Đồng bộ dữ liệu vào global store
        updateUser({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          address: u.address,
          imageUrl: u.imageUrl
        });
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
      if (user) {
        await profileService.updateProfile({
          fullName: user.fullName || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          imageUrl: url
        });
        updateUser({ imageUrl: url });
      }
    } catch (err) {
      console.error('[VolunteerProfile] Change avatar error:', err);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      if (user) {
        await profileService.updateProfile({
          fullName: user.fullName || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          imageUrl: ''
        });
        updateUser({ imageUrl: '' });
      }
    } catch (err) {
      console.error('[VolunteerProfile] Remove avatar error:', err);
    }
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

