import React, { useRef, useEffect, useState } from 'react';
import {
  Search, Send, Image as ImageIcon,
  MoreVertical,
  MapPin, Clock, CheckCircle, AlertCircle,
  User as UserIcon, Users, Check
} from 'lucide-react';
import { useVolunteerMessageViewModel } from '../viewmodels/useVolunteerMessageViewModel';
import '@/styles/VolunteerMessageView.css';

export const VolunteerMessageView: React.FC = () => {
  const {
    conversations,
    messages,
    activeConvId,
    setActiveConvId,
    activeConversationInfo,
    searchQuery,
    setSearchQuery,
    inputText,
    setInputText,
    handleSendMessage,
    handleCreateNewChat,
    handleCreateGroup,
    handleConfirmRescue,
    handleCompleteRescue,
    currentSosReport,
    isLoadingList,
    isLoadingMessages,
    activeParticipants,

    // Search Related
    userSearchResults,
    isSearchingUsers,
    isGroupMode,
    setIsGroupMode,
    selectedUserIds,
    setSelectedUserIds,
    groupName,
    setGroupName,
    currentUser
  } = useVolunteerMessageViewModel();

  const [showIncidentPanel, setShowIncidentPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, messages]);

  const handleSend = () => {
    handleSendMessage();
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStartChat = (user: any) => {
    if (isGroupMode) {
      toggleUserSelection(user.id);
    } else {
      handleCreateNewChat(user.id, user.fullName, user.avatarUrl, user.role, user.address);
    }
  };

  const onCreateGroupConfirm = () => {
    if (selectedUserIds.length > 0) {
      handleCreateGroup(selectedUserIds, groupName);
    }
  };

  return (
    <div className="rm-msg-container">
      {/* LEFT: CONVERSATION LIST */}
      <div className="rm-msg-sidebar">
        <div className="rm-msg-sidebar-header">
          <div className="rm-msg-header-top">
            <h2>Tin nhắn</h2>
            <div className="rm-msg-header-actions">
              <button
                className={`rm-action-btn ${isGroupMode ? 'active' : ''}`}
                onClick={() => isGroupMode ? setIsGroupMode(false) : setIsGroupMode(true)}
                title="Tạo nhóm"
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          <div className="rm-msg-search">
            <Search size={16} />
            <input
              placeholder="Tìm hội thoại hoặc người dùng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rm-msg-conv-list">
          {/* GROUP SETUP (inline) */}
          {isGroupMode && selectedUserIds.length > 0 && (
            <div className="rm-group-setup-inline">
              <input
                className="rm-group-name-input"
                placeholder="Tên nhóm mới..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <button className="rm-confirm-group" onClick={onCreateGroupConfirm}>
                Tạo nhóm ({selectedUserIds.length})
              </button>
            </div>
          )}

          {/* SEARCH RESULTS: NEW USERS */}
          {searchQuery.trim().length > 0 && (
            <div className="rm-search-section">
              <p className="rm-section-label">NGƯỜI DÙNG MỚI</p>
              {isSearchingUsers && <div className="rm-loading-small">Đang tìm...</div>}
              {!isSearchingUsers && userSearchResults.length === 0 && (
                <div className="rm-no-results">Không thấy người dùng</div>
              )}
              {userSearchResults.map(user => (
                <div
                  key={user.id}
                  className={`rm-search-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => handleStartChat(user)}
                >
                  <div className="rm-search-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="rm-search-avatar-img" />
                    ) : (
                      user.fullName.charAt(0)
                    )}
                  </div>
                  <div className="rm-search-info">
                    <span className="rm-search-name">{user.fullName}</span>
                    <span className="rm-search-role">{user.role}</span>
                  </div>
                  {isGroupMode && (
                    <div className={`rm-checkbox ${selectedUserIds.includes(user.id) ? 'checked' : ''}`}>
                      {selectedUserIds.includes(user.id) && <Check size={12} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* EXISTING CONVERSATIONS */}
          <div className="rm-search-section">
            <p className="rm-section-label">CUỘC TRÒ CHUYỆN</p>
            {isLoadingList && (
              <div className="rm-loading">Đang tải...</div>
            )}

            {!isLoadingList && conversations.map(conv => (
              <div
                key={conv.id}
                className={`rm-msg-conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="rm-msg-avatar-wrap">
                  <div className="rm-msg-avatar">
                    {conv.avatarUrl ? (
                      <img src={conv.avatarUrl} alt={conv.name} />
                    ) : (
                      conv.name.charAt(0)
                    )}
                  </div>
                  {conv.isOnline && <span className="rm-msg-online" />}
                </div>
                <div className="rm-msg-conv-info">
                  <div className="rm-msg-conv-top">
                    <span className="rm-msg-conv-name">{conv.name}</span>
                    <span className="rm-msg-conv-time">{conv.lastMessageTime}</span>
                  </div>
                  <div className="rm-msg-conv-bottom">
                    <span className={`rm-msg-last-msg ${conv.unreadCount ? 'unread' : ''}`}>
                      {conv.lastMessageText || 'Chưa có tin nhắn'}
                    </span>
                    {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                      <span className="rm-msg-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isLoadingList && conversations.length === 0 && (
              <div className="rm-no-results">Chưa có hội thoại nào</div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER: CHAT AREA */}
      <div className="rm-msg-chat">
        {activeConvId && activeConversationInfo ? (
          <>
            <div className="rm-msg-chat-header">
              <div className="rm-msg-chat-user">
                <div className="rm-msg-avatar">
                  {activeConversationInfo.avatarUrl ? (
                    <img src={activeConversationInfo.avatarUrl} alt={activeConversationInfo.name} />
                  ) : (
                    activeConversationInfo.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3>{activeConversationInfo.name}</h3>
                  <p>{activeConversationInfo.isOnline ? '🟢 Đang hoạt động' : '⚫ Ngoại tuyến'}</p>
                </div>
              </div>
              <div className="rm-msg-chat-actions">
                <button
                  className={`rm-icon-btn ${showIncidentPanel ? 'active' : ''}`}
                  onClick={() => setShowIncidentPanel(!showIncidentPanel)}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="rm-msg-chat-body">
              {isLoadingMessages && messages.length === 0 && (
                <div className="rm-loading-msg">Đang tải tin nhắn...</div>
              )}

              {messages.map(msg => (
                msg.type === 'SYSTEM' ? (
                  <div key={msg.id} className="rm-system-msg">
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <div key={msg.id} className={`rm-bubble-wrap ${msg.isMine ? 'mine' : 'theirs'}`}>
                    {!msg.isMine && (
                      <div className="rm-bubble-avatar">
                        {msg.senderAvatarUrl ? (
                          <img src={msg.senderAvatarUrl} alt={msg.senderName} />
                        ) : (
                          msg.senderName ? msg.senderName.charAt(0) : <UserIcon size={14} />
                        )}
                      </div>
                    )}
                    <div className={`rm-bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                      <p>{msg.content}</p>
                      <span className="rm-bubble-time">{msg.createdAt}</span>
                    </div>
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={`rm-msg-chat-footer ${(activeConversationInfo?.status === 'DONE' || currentSosReport?.status === 'DONE') ? 'blocked' : ''}`}>
              {(activeConversationInfo?.status === 'DONE' || currentSosReport?.status === 'DONE') ? (
                <div className="rm-blocked-overlay">
                  <CheckCircle size={18} />
                  <span>Nhiệm vụ đã hoàn thành</span>
                </div>
              ) : (
                <>
                  <button className="rm-attach-btn"><ImageIcon size={20} /></button>
                  <div className="rm-msg-input-wrap">
                    <input
                      type="text"
                      placeholder="Gõ tin nhắn..."
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                  </div>
                  <button
                    className={`rm-send-btn ${inputText.trim() ? 'active' : ''}`}
                    onClick={handleSend}
                  >
                    <Send size={18} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="rm-msg-empty">
            <Search size={40} />
            <h3>Chọn cuộc trò chuyện</h3>
            <p>Tìm kiếm người dùng ở thanh bên trái để bắt đầu trò chuyện.</p>
          </div>
        )}
      </div>

      {/* RIGHT: CONTACT INFO PANEL */}
      {activeConvId && showIncidentPanel && activeConversationInfo && (
        <div className="rm-incident-panel">
          <div className="rm-ip-header">
            <AlertCircle size={18} color="#F85A2B" />
            <h3>Thông tin liên hệ</h3>
          </div>

          <div className="rm-ip-status-badge" style={{ background: `#3B82F620`, color: '#3B82F6' }}>
            {activeConversationInfo.type === 'GROUP' ? 'Nhóm cứu trợ' : 'Trò chuyện cá nhân'}
          </div>

          <div className="ip-info-card">
            <h4>{activeConversationInfo.name}</h4>
            <div className="rm-ip-info-row">
              <MapPin size={14} /> <span>{activeConversationInfo.address || 'Vị trí không xác định'}</span>
            </div>
            <div className="rm-ip-info-row">
              <Clock size={14} /> <span>Cập nhật: {activeConversationInfo.lastMessageTime}</span>
            </div>
          </div>

          <div className="rm-ip-requester">
            <p className="rm-ip-section-label">THÀNH VIÊN ({activeParticipants.length})</p>

            {activeParticipants.map(member => (
              <div key={member.userId} className="rm-ip-user">
                <div className="rm-ip-avatar">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.fullName} />
                  ) : (
                    (member.fullName || 'U').charAt(0)
                  )}
                </div>
                <div>
                  <p className="rm-ip-user-name">
                    {member.fullName} {member.userId === currentUser?.id ? '(Bạn)' : ''}
                  </p>
                  <p className="rm-ip-user-role">{member.role || 'Thành viên'}</p>
                </div>
              </div>
            ))}
          </div>

          {currentSosReport?.status === 'APPROVED' ? (
            <button className="rm-complete-btn" onClick={() => handleConfirmRescue()}>
              <CheckCircle size={18} />
              NHẬN ĐƠN
            </button>
          ) : currentSosReport?.status === 'PROCESSING' ? (
            <button className="rm-complete-btn" style={{ background: '#3B82F6' }} onClick={() => handleCompleteRescue()}>
              <Check size={18} />
              XÁC NHẬN HOÀN THÀNH
            </button>
          ) : (currentSosReport?.status === 'DONE' || currentSosReport?.status === 'COMPLETED') ? (
            <div className="rm-completed-badge">
              <CheckCircle size={18} /> NHIỆM VỤ HOÀN TẤT
            </div>
          ) : (
            <div className="rm-waiting-badge">
              Chờ Admin duyệt yêu cầu cứu trợ
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VolunteerMessageView;

