import React from 'react';
import { Mail, ArrowRight, ShieldAlert, KeyRound, ChevronLeft } from 'lucide-react';
import { useAdminLoginViewModel } from '../viewmodels/useAdminLoginViewModel';
import './AdminLoginView.css';

export const AdminLoginView: React.FC = () => {
  const {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    isLoading,
    error,
    successMsg,
    handleSendOtp,
    handleVerifyOtp,
    resetStep
  } = useAdminLoginViewModel();

  return (
    <div className="al-layout">
      {/* LEFT: BRANDING */}
      <div className="al-left">
        <div className="al-left-content">
          <div className="al-brand">
            <div className="al-brand-icon">
              <ShieldAlert size={32} color="white" />
            </div>
            <div>
              <h2 className="al-brand-name">SOSMap</h2>
              <p className="al-brand-sub">Hệ thống quản trị</p>
            </div>
          </div>

          <div className="al-hero">
            <h1>Trung tâm<br />Điều phối<br />Cứu trợ.</h1>
            <p>Quản lý toàn diện hệ thống cứu hộ khẩn cấp. Theo dõi, phân tích và điều phối các hoạt động cứu trợ theo thời gian thực.</p>
          </div>

          <div className="al-stat-row">
            <div className="al-stat">
              <span className="al-stat-num">1,205</span>
              <span className="al-stat-lbl">Tài khoản cứu hộ</span>
            </div>
            <div className="al-stat">
              <span className="al-stat-num">156</span>
              <span className="al-stat-lbl">Đang hoạt động</span>
            </div>
            <div className="al-stat">
              <span className="al-stat-num">99.2%</span>
              <span className="al-stat-lbl">Uptime hệ thống</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div className="al-right">
        <div className="al-form-card">
          <div className="al-form-header">
            <div className="al-form-icon">
              <ShieldAlert size={22} color="#F85A2B" />
            </div>
            <h1 className="al-form-title">Đăng nhập hệ thống</h1>
            <p className="al-form-subtitle">TRANG QUẢN TRỊ VIÊN</p>
          </div>

          {/* STEP INDICATOR */}
          <div className="al-steps">
            <div className={`al-step ${step === 'EMAIL' ? 'active' : 'done'}`}>
              <div className="al-step-dot">{step === 'OTP' ? '✓' : '1'}</div>
              <span>Email</span>
            </div>
            <div className="al-step-line" />
            <div className={`al-step ${step === 'OTP' ? 'active' : ''}`}>
              <div className="al-step-dot">2</div>
              <span>Xác thực OTP</span>
            </div>
          </div>

          {successMsg && step === 'OTP' && (
            <div className="al-success-note">{successMsg}</div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 'EMAIL' && (
            <form className="al-form" onSubmit={handleSendOtp}>
              <div className="al-field">
                <label>ĐỊA CHỈ EMAIL QUẢN TRỊ</label>
                <div className="al-input-wrap">
                  <Mail size={16} className="al-input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@sosmap.vn"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && <div className="al-error"><ShieldAlert size={15} /><span>{error}</span></div>}

              <button id="admin-send-otp-btn" type="submit" className="al-submit-btn" disabled={isLoading}>
                {isLoading ? <span className="al-spinner" /> : <>Gửi mã OTP <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 'OTP' && (
            <form className="al-form" onSubmit={handleVerifyOtp}>
              <div className="al-field">
                <label>MÃ XÁC THỰC OTP</label>
                <div className="al-input-wrap">
                  <KeyRound size={16} className="al-input-icon" />
                  <input
                    id="admin-otp"
                    type="text"
                    placeholder="Nhập mã 6 chữ số"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className="al-error"><ShieldAlert size={15} /><span>{error}</span></div>}

              <button id="admin-verify-btn" type="submit" className="al-submit-btn" disabled={isLoading}>
                {isLoading ? <span className="al-spinner" /> : <>Xác nhận & Đăng nhập <ArrowRight size={18} /></>}
              </button>

              <button
                type="button"
                className="al-back-btn"
                onClick={resetStep}
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
            </form>
          )}

          <div className="al-security-note">
            <ShieldAlert size={13} />
            <p>Hệ thống này được giám sát liên tục. Chỉ tài khoản có quyền ADMIN mới được đăng nhập.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;
