import React from 'react';
import { ShieldCheck, Database } from 'lucide-react';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import '@/styles/AuthView.css';

export const AuthView: React.FC = () => {
  const {
    email, setEmail,
    otp, setOtp,
    role, setRole,
    step, setStep,
    isLoading, error, successMessage, countdown,
    handleCheckEmail, handleResendOtp, handleVerifyOtp
  } = useAuthViewModel();

  return (
    <div className="auth-layout">
      {/* MAP THEMED BACKGROUND - LEFT SIDE */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="brand-container">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h2 className="brand-text">SOSMap</h2>
          </div>

          <h1 className="hero-heading">Every Second Counts in Emergency Response.</h1>
          <p className="hero-subtitle">
            Access the global platform for real-time crisis coordination and emergency management.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Database size={12} />
              </div>
              <p className="feature-text">End-to-end encrypted data</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={12} />
              </div>
              <p className="feature-text">Used by 500+ rescue agencies</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORM SECTION - RIGHT SIDE */}
      <div className="auth-right">
        <div className="form-container">
          <div className="form-header">
            <h1 className="form-title">Truy cập SOSMap</h1>
          </div>

          <div className="role-tabs">
            <div
              className={`role-tab citizen ${role === 'CITIZEN' ? 'active' : ''}`}
              onClick={() => step === 'EMAIL' && setRole('CITIZEN')}
            >
              Người dân
            </div>
            <div
              className={`role-tab volunteer ${role === 'VOLUNTEER' ? 'active' : ''}`}
              onClick={() => step === 'EMAIL' && setRole('VOLUNTEER')}
            >
              Tình nguyện viên
            </div>
          </div>

          {step === 'EMAIL' && (
            <form className="form-body" onSubmit={handleCheckEmail}>
              <div className="form-group">
                <label className="form-label">Địa chỉ Email truy cập</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@agency.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="submit-button primary" disabled={isLoading}>
                {isLoading ? 'ĐANG KIỂM TRA...' : 'TIẾP TỤC'}
              </button>
            </form>
          )}


          {step === 'OTP' && (
            <form className="form-body" onSubmit={handleVerifyOtp}>
              {successMessage && <div className="message-box success">{successMessage}</div>}

              <div className="form-group">
                <label className="form-label">Nhập 6 số mã OTP từ {email}</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="••••••"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="submit-button primary" disabled={isLoading}>
                {isLoading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN TRUY CẬP'}
              </button>

              <div className="auth-actions">
                <div
                  className={`resend-otp ${countdown > 0 ? 'disabled' : ''}`}
                  onClick={handleResendOtp}
                  style={{ cursor: countdown > 0 ? 'default' : 'pointer', color: countdown > 0 ? '#999' : '#0056b3', marginTop: '10px', textAlign: 'center' }}
                >
                  {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
                </div>
                <div
                  className="change-email"
                  onClick={() => setStep('EMAIL')}
                  style={{ marginTop: '10px', textAlign: 'center' }}
                >
                  Nhập lại Email khác
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthView;
