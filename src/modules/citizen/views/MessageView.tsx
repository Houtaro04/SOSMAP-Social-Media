import { useRef, useEffect, useState } from 'react';
import {
  Search, Send, Image as ImageIcon,
  MoreVertical,
  MapPin, Clock, CheckCircle, AlertCircle,
  User as UserIcon, Check
} from 'lucide-react';
import { useMessageViewModel } from '../viewmodels/useMessageViewModel';
import { SosFormModal } from './SosFormModal';
import '@/styles/MessageView.css';

export const MessageView: React.FC = () => {
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
    handleRequestRescue,
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
    isSosModalOpen,
    setIsSosModalOpen,
    currentSosStatus,
    onSosFormSuccess,
    currentUser
  } = useMessageViewModel();

  const [showInfoPanel, setShowInfoPanel] = useState(false);
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
    <div className="cm-msg-container">
      {/* LEFT: CONVERSATION LIST */}
      <div className="cm-msg-sidebar">
        <div className="cm-msg-sidebar-header">
          <div className="cm-msg-header-top">
            <h2>Tin nhắn</h2>
            <div className="cm-msg-header-actions">
              <button
                className={`cm-action-btn ${isGroupMode ? 'active' : ''}`}
                onClick={() => setIsGroupMode(!isGroupMode)}
                title="Tạo nhóm"
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="cm-msg-search">
            <Search size={16} />
            <input
              placeholder="Tìm hội thoại hoặc người dùng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="cm-msg-conv-list">
          {/* GROUP SETUP (inline) */}
          {isGroupMode && selectedUserIds.length > 0 && (
            <div className="cm-group-setup-inline">
              <input
                className="cm-group-name-input"
                placeholder="Tên nhóm mới..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <button className="cm-confirm-group" onClick={onCreateGroupConfirm}>
                Tạo nhóm ({selectedUserIds.length})
              </button>
            </div>
          )}

          {/* SEARCH RESULTS: NEW USERS */}
          {searchQuery.trim().length > 0 && (
            <div className="cm-search-section">
              <p className="cm-section-label">NGƯỜI DÙNG MỚI</p>
              {isSearchingUsers && <div className="cm-loading-small">Đang tìm...</div>}
              {!isSearchingUsers && userSearchResults.length === 0 && (
                <div className="cm-no-results">Không thấy người dùng</div>
              )}
              {userSearchResults.map(user => (
                <div
                  key={user.id}
                  className={`cm-search-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => handleStartChat(user)}
                >
                  <div className="cm-search-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="cm-search-avatar-img" />
                    ) : (
                      user.fullName.charAt(0)
                    )}
                  </div>
                  <div className="cm-search-info">
                    <span className="cm-search-name">{user.fullName}</span>
                    <span className="cm-search-role">{user.role}</span>
                  </div>
                  {isGroupMode && (
                    <div className={`cm-checkbox ${selectedUserIds.includes(user.id) ? 'checked' : ''}`}>
                      {selectedUserIds.includes(user.id) && <Check size={12} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* EXISTING CONVERSATIONS */}
          <div className="cm-search-section">
            <p className="cm-section-label">CUỘC TRÒ CHUYỆN</p>
            {isLoadingList && (
              <div className="cm-loading">Đang tải...</div>
            )}

            {!isLoadingList && conversations.map(conv => (
              <div
                key={conv.id}
                className={`cm-msg-conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="cm-msg-avatar-wrap">
                  <div className="cm-msg-avatar">
                    {conv.avatarUrl ? (
                      <img src={conv.avatarUrl} alt={conv.name} />
                    ) : (
                      conv.name.charAt(0)
                    )}
                  </div>
                  {conv.isOnline && <span className="cm-msg-online" />}
                </div>
                <div className="cm-msg-conv-info">
                  <div className="cm-msg-conv-top">
                    <span className="cm-msg-conv-name">{conv.name}</span>
                    <span className="cm-msg-conv-time">{conv.lastMessageTime}</span>
                  </div>
                  <div className="cm-msg-conv-bottom">
                    <span className={`cm-msg-last-msg ${conv.unreadCount ? 'unread' : ''}`}>
                      {conv.lastMessageText || 'Chưa có tin nhắn'}
                    </span>
                    {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                      <span className="cm-msg-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isLoadingList && conversations.length === 0 && (
              <div className="cm-no-results">Chưa có hội thoại nào</div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER: CHAT AREA */}
      <div className="cm-msg-chat">
        {activeConvId && activeConversationInfo ? (
          <>
            <div className="cm-msg-chat-header">
              <div className="cm-msg-chat-user">
                <div className="cm-msg-avatar">
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
              <div className="cm-msg-chat-actions">
                <button
                  className={`cm-icon-btn ${showInfoPanel ? 'active' : ''}`}
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="cm-msg-chat-body">
              {isLoadingMessages && messages.length === 0 && (
                <div className="cm-loading-msg">Đang tải tin nhắn...</div>
              )}

              {messages.map(msg => (
                msg.type === 'SYSTEM' ? (
                  <div key={msg.id} className="cm-system-msg">
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <div key={msg.id} className={`cm-bubble-wrap ${msg.isMine ? 'mine' : 'theirs'}`}>
                    {!msg.isMine && (
                      <div className="cm-bubble-avatar">
                        {msg.senderAvatarUrl ? (
                          <img src={msg.senderAvatarUrl} alt={msg.senderName} />
                        ) : (
                          msg.senderName ? msg.senderName.charAt(0) : <UserIcon size={14} />
                        )}
                      </div>
                    )}
                    <div className={`cm-bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                      {msg.fileUrl && (
                        <div className="cm-bubble-image" style={{ marginBottom: msg.content ? '8px' : '0' }}>
                          <img src={msg.fileUrl} alt="Đính kèm" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
                        </div>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      <span className="cm-bubble-time">{msg.createdAt}</span>
                    </div>
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={`cm-msg-chat-footer ${(activeConversationInfo.status === 'DONE' || currentSosStatus === 'DONE' || activeConversationInfo.status === 'COMPLETED' || currentSosStatus === 'COMPLETED') ? 'blocked' : ''}`}>
              {(activeConversationInfo.status === 'DONE' || currentSosStatus === 'DONE' || activeConversationInfo.status === 'COMPLETED' || currentSosStatus === 'COMPLETED') ? (
                <div className="cm-blocked-overlay">
                  <CheckCircle size={18} />
                  <span>Hội thoại đã kết thúc thành công</span>
                </div>
              ) : (
                <>
                  <button className="cm-attach-btn"><ImageIcon size={20} /></button>
                  <div className="cm-msg-input-wrap">
                    <input
                      type="text"
                      placeholder="Gõ tin nhắn..."
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                  </div>
                  <button
                    className={`cm-send-btn ${inputText.trim() ? 'active' : ''}`}
                    onClick={handleSend}
                  >
                    <Send size={18} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="cm-msg-empty">
            <Search size={40} />
            <h3>Khám phá SOSMap!</h3>
            <p>Tìm kiếm người người dân hoặc đội cứu trợ ở thanh bên trái để bắt đầu trò chuyện.</p>
          </div>
        )}
      </div>

      {/* RIGHT: CONTACT INFO PANEL */}
      {activeConvId && showInfoPanel && activeConversationInfo && (
        <div className="cm-info-panel">
          <div className="cm-ip-header">
            <AlertCircle size={18} color="#F85A2B" />
            <h3>Thông tin liên hệ</h3>
          </div>

          <div className="cm-ip-status-badge" style={{ background: `#3B82F620`, color: '#3B82F6' }}>
            {(activeConversationInfo.type === 'GROUP' || activeConversationInfo.type === 'Group') ? 'Nhóm cứu trợ' : 'Trò chuyện cá nhân'}
          </div>

          <div className="cm-ip-info-card">
            <h4>{activeConversationInfo.name}</h4>
            <div className="cm-ip-info-row">
              <MapPin size={14} /> <span>{activeConversationInfo.address || 'Vị trí không xác định'}</span>
            </div>
            <div className="cm-ip-info-row">
              <Clock size={14} /> <span>Cập nhật: {activeConversationInfo.lastMessageTime}</span>
            </div>
          </div>

          <div className="cm-ip-requester">
            <p className="cm-ip-section-label">THÀNH VIÊN ({activeParticipants.length})</p>

            {activeParticipants.map(member => (
              <div key={member.userId} className="cm-ip-user">
                <div className="cm-ip-avatar">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.fullName} />
                  ) : (
                    (member.fullName || 'U').charAt(0)
                  )}
                </div>
                <div>
                  <p className="cm-ip-user-name">
                    {member.fullName} {member.userId === currentUser?.id ? '(Bạn)' : ''}
                  </p>
                  <p className="cm-ip-user-role">{member.role || 'Thành viên'}</p>
                </div>
              </div>
            ))}
          </div>

          {!currentSosStatus || currentSosStatus === 'COMPLETED' ? (
            <button className="cm-complete-btn" onClick={() => handleRequestRescue()}>
              <CheckCircle size={18} />
              GỬI YÊU CẦU HỖ TRỢ
            </button>
          ) : (
            <div className="cm-ip-status-badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
              <Clock size={16} /> {currentSosStatus === 'PENDING' ? 'Đang chờ duyệt' : 'Đang cứu trợ'}
            </div>
          )}
        </div>
      )}

      <SosFormModal 
        isOpen={isSosModalOpen} 
        onClose={() => setIsSosModalOpen(false)} 
        onSuccess={onSosFormSuccess}
        userId={currentUser?.id}
      />
    </div>
  );
};

export default MessageView;
