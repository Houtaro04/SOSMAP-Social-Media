import { useState, useEffect } from 'react';
import { ProfileResponse, ProfileUpdateRequest, SosStatsResponse, SosHistoryItemResponse } from '@/shared/entities/ProfileEntity';
import { profileService } from '@/shared/services/profileService';
import { useAuthStore } from '@/store/authStore';

export function useProfileViewModel() {
  const { updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [stats, setStats] = useState<SosStatsResponse | null>(null);
  const [history, setHistory] = useState<SosHistoryItemResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ProfileUpdateRequest>(new ProfileUpdateRequest({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    imageUrl: ''
  }));

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, statsRes, historyRes] = await Promise.all([
        profileService.getProfile(),
        profileService.getStats(),
        profileService.getHistory()
      ]);

      const profileDetail = profileRes.data;
      setProfile(profileDetail);
      setStats(statsRes.data);
      setHistory(historyRes.data);

      // Cập nhật lên global store
      updateUser({
        fullName: profileDetail.fullName,
        phone: profileDetail.phone,
        email: profileDetail.email,
        address: profileDetail.address,
        imageUrl: profileDetail.imageUrl
      });

      setFormData(new ProfileUpdateRequest({
        fullName: profileDetail.fullName || '',
        phone: profileDetail.phone || '',
        email: profileDetail.email || '',
        address: profileDetail.address || '',
        imageUrl: profileDetail.imageUrl || ''
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setIsSaving(true);
    try {
      const url = await profileService.uploadFile(file);
      setFormData(prev => new ProfileUpdateRequest({ ...prev, imageUrl: url }));
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarRemove = () => {
    setFormData(prev => new ProfileUpdateRequest({ ...prev, imageUrl: '' }));
  };

  const handleInputChange = (field: keyof ProfileUpdateRequest, value: string) => {
    setFormData(prev => new ProfileUpdateRequest({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await profileService.updateProfile(formData);
      setProfile(res.data);

      // Cập nhật lên global store
      updateUser({
        fullName: res.data.fullName,
        phone: res.data.phone,
        email: res.data.email,
        address: res.data.address,
        imageUrl: res.data.imageUrl
      });

      setMessage({ type: 'success', text: res.message });
      // Go back to dashboard on success
      setTimeout(() => {
        setMessage(null);
        setIsEditing(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Lỗi hệ thống.' });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setFormData(new ProfileUpdateRequest({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        imageUrl: profile.imageUrl || ''
      }));
    }
    setMessage(null);
    setIsEditing(false);
  };

  return {
    profile,
    stats,
    history,
    isLoading,
    isEditing,
    setIsEditing,
    isSaving,
    formData,
    handleInputChange,
    saveProfile,
    cancelEdit,
    handleAvatarChange,
    handleAvatarRemove,
    message
  };
}
