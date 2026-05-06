import React from 'react';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAccountStatusCheck } from '@/hooks/useAccountStatusCheck';
import '@/styles/AuthView.css'; // Reuse some auth styles

export const LockedView: React.FC = () => {
  const { logout, user } = useAuthStore();
  useAccountStatusCheck();

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="auth-card" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ width: '80px', height: '80px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShieldAlert size={40} color="#ef4444" />
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
          Tài khoản bị khóa
        </h1>
        
        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
          Chào <strong>{user?.fullName || 'bạn'}</strong>, tài khoản của bạn hiện đã bị tạm khóa do vi phạm các điều khoản cộng đồng hoặc quy định của hệ thống SOSMap.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => window.location.href = 'mailto:support@sosmap.vn'}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: '#1e293b', color: 'white', border: 'none', 
              borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <MessageCircle size={18} /> Liên hệ hỗ trợ
          </button>
          
          <button 
            onClick={logout}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', 
              borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
        
        <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8' }}>
          ID tài khoản: {user?.id}
        </p>
      </div>
    </div>
  );
};

export default LockedView;
