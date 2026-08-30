import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Sparkles, AlertCircle, Info, ExternalLink } from "lucide-react";
import { api } from "../../api/client";

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "prediction":
        return <Sparkles size={16} style={{ color: "#818cf8" }} />;
      case "recommendation":
        return <Info size={16} style={{ color: "#34d399" }} />;
      default:
        return <AlertCircle size={16} style={{ color: "#fbbf24" }} />;
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid var(--border-glass)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          color: "var(--text-primary)",
          transition: "all 0.2s ease"
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            background: "#f43f5e",
            color: "#ffffff",
            fontSize: "0.68rem",
            fontWeight: 700,
            borderRadius: "999px",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "2px solid var(--bg-main)"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "48px",
          right: "0",
          width: "360px",
          maxHeight: "440px",
          background: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(20px)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "0.85rem 1.1rem",
            borderBottom: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.4)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-high" style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary-light)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1, padding: "0.5rem" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "0.4rem",
                    background: notif.is_read ? "transparent" : "rgba(99, 102, 241, 0.08)",
                    border: notif.is_read ? "1px solid transparent" : "1px solid rgba(99, 102, 241, 0.2)",
                    display: "flex",
                    gap: "0.75rem",
                    transition: "background 0.2s ease"
                  }}
                >
                  <div style={{ marginTop: "2px" }}>{getIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", justifyContent: "space-between" }}>
                      <span>{notif.title}</span>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.notification_id, e)}
                          title="Mark as read"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "3px", lineHeight: "1.3" }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "5px" }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
