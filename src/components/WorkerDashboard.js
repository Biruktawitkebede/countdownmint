import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import "./WorkerDashboard.css";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import Navbar from "./Navbar";
import { useAuth } from "./AuthContext";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Eye,
  Trash,
  Edit3,
  Check,
  X,
  Plus,
  Send,
  LayoutDashboard,
  User,
  Mail,
  Bell,
} from "lucide-react";

function WorkerDashboard() {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("expo");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [image, setImage] = useState(null);

  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewImage, setViewImage] = useState(null);
  const [viewDetailsEvent, setViewDetailsEvent] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const eventTypes = [
    { value: "expo", label: "Expo" },
    { value: "forum", label: "Forum" },
    { value: "hackathon", label: "Hackathon" },
    { value: "workshop", label: "Workshop" },
    { value: "conference", label: "Conference" },
    { value: "other", label: "Other" },
  ];

  const resetForm = () => {
    setTitle("");
    setEventName("");
    setDescription("");
    setLocation("");
    setEventType("expo");
    setDate("");
    setTime("");
    setImage(null);
    setSelectedEvent(null);
  };

  const loadSubmittedEvents = useCallback(async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, "events"),
        where("proposedById", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubmittedEvents(list);
    } catch (err) {
      console.error("Error loading submitted events:", err);
    }
  }, [currentUser]);

  const loadDashboardEvents = useCallback(async () => {
    if (!currentUser) return;
    try {
      const snapshot = await getDocs(
        collection(db, "users", currentUser.uid, "dashboard")
      );
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDashboardEvents(list);
    } catch (err) {
      console.error("Error loading dashboard events:", err);
    }
  }, [currentUser]);

  const loadMessages = useCallback(async () => {
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
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);



  useEffect(() => {
    loadSubmittedEvents();
    loadDashboardEvents();
    loadMessages();
  }, [loadSubmittedEvents, loadDashboardEvents, loadMessages]);


  const saveEvent = async () => {
    if (!title || !eventName || !date || !time || !description || !location) {
      return alert("Please fill in all fields.");
    }

    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime < new Date()) {
      return alert("Event must be in the future.");
    }

    try {
      let imageURL = "";
      if (image) {
        imageURL = await uploadToCloudinary(image);
      }

      const eventData = {
        title,
        eventName,
        description,
        location,
        eventType,
        date,
        time,
        fullDate: eventDateTime.toISOString(),
        imageURL,
        proposedBy: currentUser.email,
        proposedById: currentUser.uid,
        status: "pending_head",
        createdAt: serverTimestamp(),
      };

      if (selectedEvent) {
        await updateDoc(doc(db, "events", selectedEvent.id), eventData);
      } else {
        await addDoc(collection(db, "events"), eventData);
      }

      resetForm();
      loadSubmittedEvents();
      setActiveTab("submitted");
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Error saving event: " + err.message);
    }
  };

  const deleteSubmittedEvent = async (id) => {
    if (window.confirm("Delete this submitted event?")) {
      try {
        await deleteDoc(doc(db, "events", id));
        loadSubmittedEvents();
      } catch (err) {
        console.error(err);
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const addToDashboard = async (event) => {
    if (!currentUser) return;
    try {
      await addDoc(
        collection(db, "users", currentUser.uid, "dashboard"),
        event
      );
      loadDashboardEvents();
      alert("Added to your dashboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to dashboard: " + err.message);
    }
  };

  const removeFromDashboard = async (id) => {
    if (!currentUser) return;
    if (window.confirm("Remove this event from your dashboard?")) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "dashboard", id));
        loadDashboardEvents();
      } catch (err) {
        console.error(err);
        alert("Failed to remove: " + err.message);
      }
    }
  };

  const selectEvent = (event) => {
    setSelectedEvent(event);
    setTitle(event.title);
    setEventName(event.eventName);
    setDescription(event.description);
    setLocation(event.location);
    setEventType(event.eventType);
    setDate(event.date);
    setTime(event.time);
    setActiveTab("add");
  };

  const handleViewDetails = (event) => {
    setViewDetailsEvent(event);
    setViewImage(event.imageURL || null);
  };

  const handleCloseViewer = () => {
    setViewDetailsEvent(null);
    setViewImage(null);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.seconds) {
      const d = new Date(date.seconds * 1000);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date;
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (typeof time === "string") return time;
    if (time.seconds) {
      const d = new Date(time.seconds * 1000);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return time;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_head: { label: "Pending Head", class: "status-pending" },
      pending_admin: { label: "Pending Admin", class: "status-pending" },
      approved: { label: "Approved", class: "status-approved" },
      rejected: { label: "Rejected", class: "status-rejected" },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      class: "status-pending",
    };
    return (
      <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
    );
  };

  const getEventType = (event) => {
    if (event.eventType) return event.eventType;
    if (event.type) return event.type;
    if (event.category) return event.category;
    if (event.eventCategory) return event.eventCategory;
    return "General";
  };

  return (
    <div className="approval-page">
      <Navbar />

      {/* LEFT SIDEBAR */}
      <div className="tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => {
            resetForm();
            setActiveTab("add");
          }}
        >
          <Plus size={18} />
          Add Event
        </button>

        <button
          className={activeTab === "submitted" ? "active" : ""}
          onClick={() => setActiveTab("submitted")}
        >
          <Send size={18} />
          Submitted
        </button>

        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
        >
          <Mail size={18} />
          Messages
        </button>

      </div>

      {/* MAIN CONTENT */}
      <div className="approval-content">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="dashboard-container">
            <div className="tab-header">
              <h2>My Dashboard</h2>
              <span className="event-count">
                {dashboardEvents.length} event(s) saved
              </span>
            </div>

            {dashboardEvents.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">📊</div>
                <h3>No events in your dashboard</h3>
                <p>Save events from the home page to see them here.</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {dashboardEvents.map((event) => (
                  <div key={event.id} className="dashboard-card">
                    {event.imageURL && (
                      <div className="dashboard-image-container">
                        <img
                          src={event.imageURL}
                          alt={event.title}
                          className="dashboard-image"
                        />
                        <button
                          className="view-full-image-btn"
                          onClick={() => handleViewDetails(event)}
                        >
                          <Eye size={14} /> View Full Image
                        </button>
                      </div>
                    )}

                    <div className="dashboard-card-content">
                      <h4>{event.title}</h4>
                      {event.eventName && event.eventName !== event.title && (
                        <p className="event-subtitle">{event.eventName}</p>
                      )}
                      <p className="event-description">{event.description}</p>

                      <div className="event-meta">
                        <div className="meta-item">
                          <Calendar size={14} />
                          <span>
                            <strong>Date:</strong> {formatDate(event.date)}
                          </span>
                        </div>
                        {event.time && (
                          <div className="meta-item">
                            <Clock size={14} />
                            <span>
                              <strong>Time:</strong> {formatTime(event.time)}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="meta-item">
                            <MapPin size={14} />
                            <span>
                              <strong>Location:</strong> {event.location}
                            </span>
                          </div>
                        )}
                        {event.eventType && (
                          <div className="meta-item">
                            <Tag size={14} />
                            <span>
                              <strong>Type:</strong> {event.eventType}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeFromDashboard(event.id)}
                        className="btn-remove-red"
                      >
                        <Trash size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submitted Events - NOW USING TABLE VIEW */}
        {activeTab === "submitted" && (
          <div className="submitted-container">
            <div className="tab-header">
              <h2>My Submitted Events</h2>
              <span className="event-count">
                {submittedEvents.length} event(s) submitted
              </span>
            </div>

            {submittedEvents.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">📤</div>
                <h3>No events submitted yet</h3>
                <p>Create your first event using the "Add Event" tab.</p>
              </div>
            ) : (
              <div className="events-section">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Event Title</th>
                      <th>Type</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedEvents.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.eventName || "Untitled Event"}</strong>
                        </td>
                        <td>
                          <div className="event-title-cell">
                            {event.title ? (
                              <span className="event-title-badge">{event.title}</span>
                            ) : (
                              <span className="no-title">No Title</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="event-type">{getEventType(event)}</span>
                        </td>
                        <td>
                          <div>
                            <div>{formatDate(event.date)}</div>
                            {event.time && <small>{formatTime(event.time)}</small>}
                          </div>
                        </td>
                        <td>{event.location || "N/A"}</td>
                        <td>
                          {getStatusBadge(event.status)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              onClick={() => handleViewDetails(event)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="edit-btn"
                              onClick={() => selectEvent(event)}
                              title="Edit Event"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="add-btn"
                              onClick={() => addToDashboard(event)}
                              title="Add to Dashboard"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              className="delete-btn-red"
                              onClick={() => deleteSubmittedEvent(event.id)}
                              title="Delete Submitted Event"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add / Edit Event Form */}
        {activeTab === "add" && (
          <div className="event-form">
            <div className="form-header">
              <h3>{selectedEvent ? "Edit Event" : "Add New Event"}</h3>
              {selectedEvent && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    resetForm();
                    setActiveTab("submitted");
                  }}
                >
                  <X size={16} /> Cancel Edit
                </button>
              )}
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Event Name</label>
              <input
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter event description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                placeholder="Enter event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Event Image</label>
              {selectedEvent && selectedEvent.imageURL && (
                <div
                  className="current-image-preview"
                  style={{ marginBottom: "10px" }}
                >
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "5px",
                    }}
                  >
                    Current Image:
                  </p>
                  <img
                    src={selectedEvent.imageURL}
                    alt="Current event"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
              />
              <small>Optional: Upload a new image</small>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={saveEvent}
                className="submit-btn"
              >
                {selectedEvent ? (
                  <>
                    <Check size={16} /> Update Event
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Submit Event
                  </>
                )}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  resetForm();
                  setActiveTab("submitted");
                }}
              >
                <X size={16} /> {selectedEvent ? "Cancel & Go Back" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="messages-container">
            <div className="tab-header">
              <h2>My Messages</h2>
              <span className="event-count">
                {messages.length} message(s)
              </span>
            </div>

            {loadingMessages ? (
              <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">✉️</div>
                <h3>No messages yet</h3>
                <p>Messages you send via "Contact Us" will appear here.</p>
              </div>
            ) : (
              <div className="messages-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className="message-card" style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {formatDate(msg.createdAt)} at {formatTime(msg.createdAt)}
                      </span>
                      {msg.reply && (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                          Replied
                        </span>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}><strong>Your Message:</strong></p>
                      <div style={{ color: '#1e293b', fontSize: '15px', lineHeight: '1.6', background: '#f8fafc', padding: '15px', borderRadius: '10px' }}>
                        {msg.message}
                      </div>
                    </div>

                    {msg.reply && (
                      <div style={{ display: 'flex', gap: '15px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                        <div style={{ color: '#0b6666', fontSize: '24px', fontWeight: 'bold' }}>↳</div>
                        <div style={{ flex: 1, background: '#f0fdf4', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #0b6666' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#15803d' }}><strong>Admin Reply:</strong></p>
                          <div style={{ color: '#1e293b', fontSize: '15px', lineHeight: '1.6' }}>{msg.reply}</div>
                          <small style={{ display: 'block', marginTop: '10px', color: '#15803d', fontSize: '12px', opacity: 0.8 }}>
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

      </div>

      {/* VIEW EVENT DETAILS MODAL */}
      {viewDetailsEvent && (
        <div className="admin-modal-overlay" onClick={() => setViewDetailsEvent(null)}>
          <div className="admin-modal event-details-modal" onClick={(e) => e.stopPropagation()}>

            {/* EVENT NAME & TITLE HEADER */}
            <div className="modal-header-with-title">
              <div className="event-name-main">
                <h2>{viewDetailsEvent.eventName || "Untitled Event"}</h2>
                <h3 className="event-title-sub">Event Title: {viewDetailsEvent.title}</h3>
              </div>
              <button className="close-modal-btn" onClick={() => setViewDetailsEvent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="event-detail-section">
              <div className="section-label">
                <h3>Event Information</h3>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <User size={16} />
                  <div>
                    <strong>Proposed By:</strong>
                    <span>{viewDetailsEvent.proposedBy || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Calendar size={16} />
                  <div>
                    <strong>Date:</strong>
                    <span>{formatDate(viewDetailsEvent.date)}</span>
                  </div>
                </div>

                {viewDetailsEvent.time && (
                  <div className="detail-item">
                    <Clock size={16} />
                    <div>
                      <strong>Time:</strong>
                      <span>{formatTime(viewDetailsEvent.time)}</span>
                    </div>
                  </div>
                )}

                {viewDetailsEvent.location && (
                  <div className="detail-item">
                    <MapPin size={16} />
                    <div>
                      <strong>Location:</strong>
                      <span>{viewDetailsEvent.location}</span>
                    </div>
                  </div>
                )}

                <div className="detail-item">
                  <Tag size={16} />
                  <div>
                    <strong>Event Type:</strong>
                    <span>{getEventType(viewDetailsEvent)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div>
                    <strong>Status:</strong>
                    {getStatusBadge(viewDetailsEvent.status)}
                  </div>
                </div>
              </div>

              {viewDetailsEvent.description && (
                <div className="detail-item full-width">
                  <div>
                    <strong>Description:</strong>
                    <p className="description-text">{viewDetailsEvent.description}</p>
                  </div>
                </div>
              )}

              {viewDetailsEvent.imageURL && (
                <div className="detail-item full-width">
                  <strong>Event Image:</strong>
                  <div className="modal-image-container">
                    <img
                      src={viewDetailsEvent.imageURL}
                      alt="event"
                      className="modal-image"
                    />
                    <button
                      className="view-full-image-btn"
                      onClick={() => setViewImage(viewDetailsEvent.imageURL)}
                    >
                      <Eye size={14} /> View Full Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="edit-btn"
                onClick={() => {
                  selectEvent(viewDetailsEvent);
                  setViewDetailsEvent(null);
                }}
              >
                <Edit3 size={16} /> Edit Event
              </button>
              <button
                className="add-btn"
                onClick={() => {
                  addToDashboard(viewDetailsEvent);
                  setViewDetailsEvent(null);
                }}
              >
                <Plus size={16} /> Add to Dashboard
              </button>
              <button className="close-btn" onClick={() => setViewDetailsEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer Modal */}
      {viewImage && (
        <div className="image-viewer-overlay" onClick={() => setViewImage(null)}>
          <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="image-viewer-header">
              <h3>Event Image</h3>
              <button className="close-image-btn" onClick={() => setViewImage(null)}>
                <X size={24} />
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

export default WorkerDashboard;