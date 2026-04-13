import React from 'react';
import { ArrowRight, Heart, MessageCircle, AlertCircle } from 'lucide-react';
import '@/styles/VolunteerHomeView.css';

export const VolunteerHomeView: React.FC = () => {
  return (
    <div className="Volunteer-home">

      {/* LEFT COLUMN: ACTIVITY FEED */}
      <div className="main-feed-column">
        <div className="feed-header">
          <h2>Bảng tin hoạt động</h2>
          <button className="view-all-link">Xem tất cả</button>
        </div>

        {/* Post Card 1 */}
        <div className="feed-card">
          <div className="card-cover">
            <img
              src="https://images.unsplash.com/photo-1593113565694-c6c28f11fe65?auto=format&fit=crop&q=80&w=800&h=400"
              alt="Cover 1"
              className="cover-img"
            />
          </div>
          <div className="card-content">
            <div className="post-author-meta">
              <div className="author-avatar green">
                <span>Đ</span>
              </div>
              <div className="author-info">
                <h4>Đội phản ứng nhanh Quảng Nam</h4>
                <p>2 giờ trước • Duy Xuyên, Quảng Nam</p>
              </div>
            </div>
            <h3 className="post-title">Đã tiếp cận và hỗ trợ 50 hộ dân tại vùng cô lập</h3>
            <p className="post-desc">
              Hiện tại mực nước đã bắt đầu rút nhưng giao thông vẫn còn chia cắt. Chúng tôi đã hoàn thành việc trao tặng 200 thùng mì tôm và 500 lít nước sạch cho bà con tại xã Duy Vinh.
            </p>
          </div>
          <div className="card-footer">
            <div className="post-reactions">
              <div className="avatar-stack">
                <img src="https://ui-avatars.com/api/?name=Thanh+Tra&background=random" alt="av" />
                <img src="https://ui-avatars.com/api/?name=Huu+Loc&background=random" alt="av" />
                <div className="avatar-more">+12</div>
              </div>
            </div>
            <button className="action-button primary">
              Xem chi tiết hành trình <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Post Card 2 */}
        <div className="feed-card">
          <div className="card-content">
            <div className="post-author-meta">
              <div className="author-avatar teal">
                <span>Đ</span>
              </div>
              <div className="author-info">
                <h4>Đội tình nguyện 24/7</h4>
                <p>5 giờ trước • TP. Đà Nẵng</p>
              </div>
            </div>
            <h3 className="post-title">Hỗ trợ di dời người già và trẻ em tại vùng trũng thấp</h3>
            <p className="post-desc">
              Mưa lớn kéo dài gây ngập úng cục bộ tại các hẻm nhỏ khu vực Liên Chiểu. Đội đã điều động 3 xuồng máy hỗ trợ di dời khẩn cấp 15 hộ dân trong đêm qua.
            </p>
            <div className="post-images-grid">
              <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400" alt="img1" />
              <div className="more-images-overlay">
                <img src="https://images.unsplash.com/photo-1628348070889-cb656235b4eb?auto=format&fit=crop&q=80&w=400" alt="img2" />
                <div className="overlay-text">+4 ảnh</div>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <div className="post-actions-left">
              <button className="icon-action"><Heart size={18} /> 124</button>
              <button className="icon-action"><MessageCircle size={18} /> 18</button>
            </div>
            <button className="action-button secondary">
              Xem chi tiết hành trình <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SIDEBAR WIDGETS */}
      <div className="right-sidebar-column">
        {/* Latest Requests Widget */}
        <div className="widget requests-widget">
          <div className="widget-header">
            <div className="title-with-icon">
              <AlertCircle color="#F85A2B" size={24} />
              <h3>YÊU CẦU MỚI NHẤT</h3>
            </div>
            <span className="urgent-badge">CẤP BÁCH</span>
          </div>

          <div className="urgent-requests-list">
            <div className="request-card evacuation">
              <div className="req-card-header">
                <span className="req-type">DI TẢN</span>
                <span className="req-time">Vừa xong</span>
              </div>
              <h4>Cần thuyền cứu hộ khẩn cấp</h4>
              <p>Đội 4, thôn Trung, xã Duy Vinh. Có 3 người già bị mắc kẹt trên mái nhà.</p>
              <div className="req-location">📍 Quảng Nam - 1.2km</div>
            </div>

            <div className="request-card medical">
              <div className="req-card-header">
                <span className="req-type">Y TẾ</span>
                <span className="req-time">5 phút trước</span>
              </div>
              <h4>Cần thuốc sơ cứu & hạ sốt</h4>
              <p>Trẻ em 5 tuổi đang sốt cao trong vùng ngập lụt, không có thuốc dự trữ.</p>
              <div className="req-location">📍 Đà Nẵng - 3.5km</div>
            </div>

            <div className="request-card food">
              <div className="req-card-header">
                <span className="req-type">THỰC PHẨM</span>
                <span className="req-time">12 phút trước</span>
              </div>
              <h4>Thiếu nước sạch & lương khô</h4>
              <p>Khu dân cư đường Hoàng Văn Thái, 20 hộ dân cạn kiệt nước uống.</p>
              <div className="req-location">📍 Đà Nẵng - 2.1km</div>
            </div>
          </div>

          <button className="outline-button full-width">
            Xem tất cả yêu cầu (42)
          </button>
        </div>

        {/* Your Activity Widget */}
        <div className="widget activity-widget">
          <h3>Hoạt động của bạn</h3>
          <div className="stats-grid">
            <div className="stat-box light">
              <span className="stat-label">ĐÃ HỖ TRỢ</span>
              <span className="stat-value">12</span>
              <span className="stat-desc">Ca thành công</span>
            </div>
            <div className="stat-box dark">
              <span className="stat-label">ĐANG XỬ LÝ</span>
              <span className="stat-value">03</span>
              <span className="stat-desc">Yêu cầu</span>
            </div>
          </div>
        </div>

        {/* Map Widget Placeholder */}
        <div className="widget map-widget">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600"
            alt="Mapplaceholder"
            className="map-layer"
          />
        </div>
      </div>

    </div>
  );
};

export default VolunteerHomeView;

