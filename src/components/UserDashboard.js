import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import "./UserDashboard.css";

// Lucide icons
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Eye,
  Trash2,
  PlusCircle,
  XCircle,
  Mail,
  Bell
} from "lucide-react";

function UserDashboard() {
  const { currentUser } = useAuth();
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [loadingMessages, setLoadingMessages] = useState(false);

  // ------------------ FETCH DASHBOARD EVENTS ------------------
  const fetchDashboardEvents = useCallback(async () => {
    if (!currentUser) return;
    try {
      const snapshot = await getDocs(collection(db, "users", currentUser.uid, "dashboard"));
      setDashboardEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoadingMessages(true);
      const q = query(
        collection(db, "contact_messages"),
        where("email", "==", currentUser.email.toLowerCase().trim())
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually to avoid index requirement
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMessages(list);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardEvents();
    fetchMessages();
  }, [fetchDashboardEvents, fetchMessages]);

  // ------------------ IMAGE VIEWER FUNCTIONS -------------------
  const handleViewImage = (imageURL) => {
    setViewImage(imageURL);
  };

  const handleCloseImageViewer = () => {
    setViewImage(null);
  };


  // ------------------ HELPERS ------------------
  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.seconds) {
      const d = new Date(date.seconds * 1000);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return date;
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (typeof time === 'string') return time;
    if (time.seconds) {
      const d = new Date(time.seconds * 1000);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return time;
  };

  const getEventType = (event) => {
    if (event.eventType) return event.eventType;
    if (event.type) return event.type;
    if (event.category) return event.category;
    if (event.eventCategory) return event.eventCategory;
    return "General";
  };

  // Helper to get event name
  const getEventName = (event) => {
    return event.eventName || event.name || event.title || "Untitled Event";
  };

  // Helper to get event title
  const getEventTitle = (event) => {
    return event.title || "No Title";
  };

  // ------------------ DASHBOARD FUNCTIONS ------------------
  const removeFromDashboard = async (eventId) => {
    if (!window.confirm("Are you sure you want to remove this event from your dashboard?")) {
      return;
    }

    try {
      const dashboardRef = doc(db, "users", currentUser.uid, "dashboard", eventId);
      await deleteDoc(dashboardRef);

      setDashboardEvents(dashboardEvents.filter(event => event.id !== eventId));
      alert("Event removed from dashboard!");
    } catch (err) {
      console.error("Error removing from dashboard:", err);
      alert("Error removing event from dashboard: " + err.message);
    }
  };

  // ------------------ RENDER ------------------

  return (
    <div className="user-dashboard-container">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab("events")}
          style={{
            padding: '12px 24px',
            background: activeTab === "events" ? '#0b6666' : 'transparent',
            color: activeTab === "events" ? 'white' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === "events" ? '3px solid #0b6666' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '16px'
          }}
        >
          My Events
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          style={{
            padding: '12px 24px',
            background: activeTab === "messages" ? '#0b6666' : 'transparent',
            color: activeTab === "messages" ? 'white' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === "messages" ? '3px solid #0b6666' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Mail size={18} />
          Messages
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <>
          {dashboardEvents.length === 0 ? (
            <div className="empty-dashboard">
              <div className="empty-state">
                <PlusCircle size={64} className="empty-icon" />
                <h3>No events saved yet</h3>
                <p>Start exploring events and add them to your dashboard to see them here.</p>
              </div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="dashboard-grid">
                {dashboardEvents.map((event) => (
                  <div key={event.id} className="dashboard-card">
                    <div className="dashboard-card-content">
                      <h4>{getEventName(event)}</h4>
                      {getEventTitle(event) && getEventTitle(event) !== getEventName(event) && (
                        <p className="event-subtitle">Title: {getEventTitle(event)}</p>
                      )}

                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}

                      <div className="event-meta">
                        <div className="meta-item">
                          <Calendar size={14} />
                          <span><strong>Date:</strong> {formatDate(event.date)}</span>
                        </div>

                        {event.time && (
                          <div className="meta-item">
                            <Clock size={14} />
                            <span><strong>Time:</strong> {formatTime(event.time)}</span>
                          </div>
                        )}

                        {event.location && (
                          <div className="meta-item">
                            <MapPin size={14} />
                            <span><strong>Location:</strong> {event.location}</span>
                          </div>
                        )}

                        {event.eventType && (
                          <div className="meta-item">
                            <Tag size={14} />
                            <span><strong>Type:</strong> {getEventType(event)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image at the bottom */}
                    {event.imageURL ? (
                      <>
                        <div className="dashboard-image-container">
                          <img
                            src={event.imageURL}
                            alt="event"
                            className="dashboard-image"
                          />
                          <button
                            className="view-full-image-btn"
                            onClick={() => handleViewImage(event.imageURL)}
                          >
                            <Eye size={14} /> View Full Image
                          </button>
                        </div>
                        <div className="remove-btn-container">
                          <button
                            className="btn-dashboard-remove"
                            onClick={() => removeFromDashboard(event.id)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="remove-btn-container">
                        <button
                          className="btn-dashboard-remove"
                          onClick={() => removeFromDashboard(event.id)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="messages-tab-content">
          {loadingMessages ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <Mail size={64} className="empty-icon" />
              <h3>No messages found</h3>
              <p>When you send messages via "Contact Us", they will appear here along with admin replies.</p>
            </div>
          ) : (
            <div className="messages-list-container">
              {messages.map((msg) => (
                <div key={msg.id} className="user-message-card">
                  <div className="message-item-header">
                    <span className="message-date">
                      {formatDate(msg.createdAt)} at {formatTime(msg.createdAt)}
                    </span>
                    {msg.reply && <span className="reply-badge">Replied</span>}
                  </div>
                  
                  <div className="user-message-body">
                    <p><strong>Your Message:</strong></p>
                    <div className="message-text">{msg.message}</div>
                  </div>

                  {msg.reply && (
                    <div className="admin-reply-body">
                      <div className="reply-arrow">↳</div>
                      <div className="reply-content">
                        <p><strong>Admin Reply:</strong></p>
                        <div className="reply-text">{msg.reply}</div>
                        <small className="reply-timestamp">
                          Replied on {formatDate(msg.repliedAt)} at {formatTime(msg.repliedAt)}
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Image Viewer Modal */}
      {viewImage && (
        <div className="image-viewer-overlay" onClick={handleCloseImageViewer}>
          <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="image-viewer-header">
              <h3>Event Image</h3>
              <button className="close-image-btn" onClick={handleCloseImageViewer}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="image-viewer-content">
              <img
                src={viewImage}
                alt="Full event"
                className="full-size-image"
              />
            </div>

            <div className="image-viewer-footer">
              <p>Click outside the image to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;