// src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { Mail, Trash2, Calendar, Clock, MapPin, Tag } from "lucide-react";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  // Fetch dashboard events
  const fetchDashboardEvents = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = collection(db, "users", currentUser.uid, "dashboard");
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort by savedAt descending to show most recent first
      list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      setDashboardEvents(list);
    } catch (err) {
      console.error("Error fetching dashboard events:", err);
    } finally {
      setLoading(false);
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

  // Remove event
  const removeFromDashboard = async (eventId) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "dashboard", eventId));
      setDashboardEvents((prev) => prev.filter((e) => e.id !== eventId));
      alert("Event removed from your dashboard.");
    } catch (err) {
      console.error(err);
      alert("Failed to remove event: " + (err.message || err));
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.seconds) {
      const d = new Date(date.seconds * 1000);
      return d.toLocaleDateString();
    }
    return date;
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (typeof time === 'string') return time;
    if (time.seconds) {
      const d = new Date(time.seconds * 1000);
      return d.toLocaleTimeString();
    }
    return time;
  };

  return (
    <div className="user-dashboard-container" style={{ padding: '40px' }}>
      <div className="dashboard-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#0b6666', borderBottom: '3px solid #0b6666', paddingBottom: '10px' }}>My Dashboard</h1>
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
            fontWeight: '500'
          }}
        >
          Saved Events
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
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          {loading ? (
            <p>Loading events...</p>
          ) : dashboardEvents.length === 0 ? (
            <p>Your dashboard is empty.</p>
          ) : (
            dashboardEvents.map((event) => (
              <div key={event.id} className="dashboard-card" style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', padding: '20px' }}>
                {event.imageURL && (
                  <img src={event.imageURL} alt={event.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', marginBottom: '15px' }} />
                )}
                <h3 style={{ color: '#0b6666', margin: '0 0 10px 0' }}>{event.title || event.eventName}</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>{event.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#555' }}>
                  <span><Calendar size={14} /> {formatDate(event.date)}</span>
                  <span><MapPin size={14} /> {event.location}</span>
                </div>
                <button 
                  onClick={() => removeFromDashboard(event.id)} 
                  style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="messages-tab-content">
          {loadingMessages ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Mail size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <h3>No messages found</h3>
              <p>Inquiries sent via "Contact Us" will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg) => (
                <div key={msg.id} className="user-message-card" style={{ background: 'white', borderRadius: '16px', padding: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{formatDate(msg.createdAt)}</span>
                    {msg.reply && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Replied</span>}
                  </div>
                  <div style={{ marginBottom: msg.reply ? '20px' : '0' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#64748b' }}><strong>Your Message:</strong></p>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', color: '#1e293b' }}>{msg.message}</div>
                  </div>
                  {msg.reply && (
                    <div style={{ display: 'flex', gap: '15px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                      <div style={{ color: '#0b6666', fontSize: '20px', fontWeight: 'bold' }}>↳</div>
                      <div style={{ flex: 1, background: '#f0fdf4', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #0b6666' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#15803d' }}><strong>Admin Reply:</strong></p>
                        <div style={{ color: '#1e293b' }}>{msg.reply}</div>
                        <small style={{ display: 'block', marginTop: '10px', color: '#15803d', opacity: 0.8 }}>Replied on {formatDate(msg.repliedAt)}</small>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
