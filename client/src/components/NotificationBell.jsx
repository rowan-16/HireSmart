import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore background errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Marked all as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await API.put(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '12px',
          width: '40px',
          height: '40px',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title="Notifications"
      >
        <i className="fa-solid fa-bell" style={{ fontSize: '1.1rem', color: unreadCount > 0 ? 'var(--c2, #45f3ff)' : 'rgba(255,255,255,0.7)' }}></i>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #ff2770, #ff5e62)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '700',
            borderRadius: '999px',
            padding: '2px 6px',
            minWidth: '18px',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(255,39,112,0.6)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: '0',
          width: 'min(360px, 90vw)',
          maxHeight: '440px',
          background: 'rgba(18, 17, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>
              <i className="fa-solid fa-bell" style={{ marginRight: '8px', color: 'var(--c2, #45f3ff)' }}></i> Notifications
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--c2, #45f3ff)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                <i className="fa-regular fa-bell-slash" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', display: 'block' }}></i>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '6px',
                    background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(69, 243, 255, 0.08)',
                    borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--c2, #45f3ff)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, marginBottom: '6px' }}>
                    {n.message}
                  </div>

                  {/* Google Meet Link Button */}
                  {n.meetLink && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={n.meetLink.startsWith('http') ? n.meetLink : `https://${n.meetLink}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #00875a, #00b8d9)',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="fa-solid fa-video"></i> Join Google Meet
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
