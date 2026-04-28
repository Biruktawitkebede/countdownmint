import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import "./ApprovalPanel.css";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  addDoc,
  setDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import Navbar from "./Navbar";
import { useAuth } from "./AuthContext";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

// ✅ Lucide icons
import {
  PlusCircle,
  Clock,
  Send,
  LayoutDashboard,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  Calendar,
  Clock as ClockIcon,
  MapPin,
  User,
  Tag,
  X as XIcon,
  Mail,
  Bell
} from "lucide-react";

function HeadApprovalPanel() {
  const { currentUser } = useAuth();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("add");

  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("expo");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
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

  // ------------------ FETCH ------------------
  const fetchPendingEvents = useCallback(async () => {
    const q = query(collection(db, "events"), where("status", "==", "pending_head"));
    const snapshot = await getDocs(q);
    setPendingEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, []);

  const fetchSubmittedEvents = useCallback(async () => {
    if (!currentUser) return;
    const q = query(collection(db, "events"), where("proposedById", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    setSubmittedEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  const fetchDashboardEvents = useCallback(async () => {
    if (!currentUser) return;
    const snapshot = await getDocs(collection(db, "users", currentUser.uid, "dashboard"));
    setDashboardEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  const fetchPanelMessages = useCallback(async () => {
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
    fetchPendingEvents();
    fetchSubmittedEvents();
    fetchDashboardEvents();
    fetchPanelMessages();
  }, [
    currentUser,
    fetchPendingEvents,
    fetchSubmittedEvents,
    fetchDashboardEvents,
    fetchPanelMessages
  ]);


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
    return event.eventName || event.name || "Untitled Event";
  };

  // Helper to get event title
  const getEventTitle = (event) => {
    return event.title || "No Title";
  };

  // ------------------ FORM FUNCTIONS ------------------
  const resetForm = () => {
    setTitle("");
    setEventName("");
    setDescription("");
    setLocation("");
    setEventType("expo");
    setDate("");
    setTime("");
    setImage(null);
    setIsEditing(false);
    setCurrentEventId(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    // Go back to submitted events tab
    setActiveTab("submitted");
  };

  const editEvent = (event) => {
    setActiveTab("add");
    setIsEditing(true);
    setCurrentEventId(event.id);
    setTitle(event.title);
    setEventName(event.eventName);
    setDescription(event.description);
    setLocation(event.location);
    setEventType(event.eventType);
    setDate(event.date);
    setTime(event.time);
  };

  const handleSaveEvent = async () => {
    if (!title || !eventName || !description || !location || !date || !time)
      return alert("Please fill all fields.");

    const fullDate = new Date(`${date}T${time}`);
    if (fullDate < new Date()) return alert("Event date must be in the future.");

    let imageURL = "";
    if (image) imageURL = await uploadToCloudinary(image);

    const eventData = {
      title,
      eventName,
      description,
      location,
      eventType,
      date,
      time,
      fullDate: fullDate.toISOString(),
      proposedBy: currentUser.email,
      proposedById: currentUser.uid,
      status: "pending_admin",
      updatedAt: serverTimestamp(),
      ...(imageURL && { imageURL }),
    };

    if (isEditing) {
      await updateDoc(doc(db, "events", currentEventId), eventData);
      alert("Event updated successfully!");
    } else {
      await addDoc(collection(db, "events"), eventData);
      alert("Event submitted successfully!");
    }

    resetForm();
    fetchSubmittedEvents();
    // Go back to submitted events tab after saving
    setActiveTab("submitted");
  };

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "events", id), {
      status: "pending_admin",
      headApprovedAt: serverTimestamp(),
    });
    fetchPendingEvents();
    alert("Event approved!");
  };

  const handleReject = async (id) => {
    await updateDoc(doc(db, "events", id), {
      status: "rejected_by_head",
      headRejectedAt: serverTimestamp(),
    });
    fetchPendingEvents();
    alert("Event rejected!");
  };

  const addToDashboard = async (event) => {
    await setDoc(doc(db, "users", currentUser.uid, "dashboard", event.id), {
      ...event,
      savedAt: new Date().toISOString(),
    });
    fetchDashboardEvents();
    alert(`${event.title} added to your dashboard!`);
  };

  const removeFromDashboard = async (eventId) => {
    await deleteDoc(doc(db, "users", currentUser.uid, "dashboard", eventId));
    fetchDashboardEvents();
    alert("Removed from your dashboard!");
  };

  // ------------------ RENDER ------------------
  return (
    <div className="approval-page">
      <Navbar />

      {/* ✅ Sidebar Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => {
            resetForm();
            setActiveTab("add");
          }}
        >
          <PlusCircle size={18} /> Add Event
        </button>
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          <Clock size={18} /> Pending
        </button>
        <button
          className={activeTab === "submitted" ? "active" : ""}
          onClick={() => setActiveTab("submitted")}
        >
          <Send size={18} /> Submitted
        </button>
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
        >
          <Mail size={18} /> Messages
        </button>
      </div>

      {/* ✅ Main Panel */}
      <div className="approval-content">
        {/* Dashboard Section - EXACT SAME SIZE AS USERDASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="user-dashboard-container">
            <div className="dashboard-header">
              <h1>My Dashboard</h1>

            </div>

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
                              <ClockIcon size={14} />
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

                      {/* Image at the bottom - ALWAYS SHOW REMOVE BUTTON */}
                      {event.imageURL && (
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
                      )}

                      <div className="remove-btn-container">
                        <button
                          className="btn-remove-dashboard"
                          onClick={() => removeFromDashboard(event.id)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Tabs - Only show main title when not in dashboard */}
        {activeTab !== "dashboard" && <h2>Head Approval Panel</h2>}

        {/* Add / Edit Form */}
        {activeTab === "add" && (
          <div className="event-form">
            <div className="form-header">
              <h3>{isEditing ? "Edit Event" : "Add New Event"}</h3>
              {isEditing && (
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  <XIcon size={16} /> Cancel Edit
                </button>
              )}
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Event Name</label>
              <input
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter event description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                placeholder="Enter event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Event Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
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
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Event Image</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleSaveEvent} className="submit-btn">
                {isEditing ? (
                  <>
                    <Edit size={16} /> Save Changes
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} /> Submit Event
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab("submitted");
                }}
                className="cancel-btn"
              >
                <XIcon size={16} /> {isEditing ? "Cancel & Go Back" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Pending Events */}
        {activeTab === "pending" && (
          <div className="events-section">
            <h3>Pending Approval</h3>
            {pendingEvents.length === 0 ? (
              <p>No pending events.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Event Title</th>
                    <th>Type</th>
                    <th>Proposed By</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>{getEventName(event)}</strong>
                      </td>
                      <td>
                        <div className="event-title-cell">
                          {event.title ? (
                            <span className="event-title-badge">{getEventTitle(event)}</span>
                          ) : (
                            <span className="no-title">No Title</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="event-type">{getEventType(event)}</span>
                      </td>
                      <td>{event.proposedBy || "N/A"}</td>
                      <td>
                        <div>
                          <div>{formatDate(event.date)}</div>
                          {event.time && <small>{formatTime(event.time)}</small>}
                        </div>
                      </td>
                      <td>{event.location || "N/A"}</td>
                      <td>
                        <span className={`status-badge status-${event.status || 'pending'}`}>
                          {event.status || "pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            onClick={() => setSelectedEvent(event)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(event.id)}
                            title="Approve Event"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(event.id)}
                            title="Reject Event"
                          >
                            <X size={16} />
                          </button>
                          <button
                            className="add-btn"
                            onClick={() => addToDashboard(event)}
                            title="Add to Dashboard"
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Submitted Events */}
        {activeTab === "submitted" && (
          <div className="events-section">
            <h3>My Submitted Events</h3>
            {submittedEvents.length === 0 ? (
              <p>No submitted events.</p>
            ) : (
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
                        <strong>{getEventName(event)}</strong>
                      </td>
                      <td>
                        <div className="event-title-cell">
                          {event.title ? (
                            <span className="event-title-badge">{getEventTitle(event)}</span>
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
                        <span className={`status-badge status-${event.status || 'pending'}`}>
                          {event.status || "pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            onClick={() => setSelectedEvent(event)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => editEvent(event)}
                            title="Edit Event"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="add-btn"
                            onClick={() => addToDashboard(event)}
                            title="Add to Dashboard"
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Messages Section */}
        {activeTab === "messages" && (
          <div className="messages-section">
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

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="admin-modal event-details-modal" onClick={(e) => e.stopPropagation()}>

            {/* EVENT NAME & TITLE HEADER */}
            <div className="modal-header-with-title">
              <div className="event-name-main">
                <h2>{getEventName(selectedEvent)}</h2>
                <h3 className="event-title-sub">Event Title: {getEventTitle(selectedEvent)}</h3>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedEvent(null)}>
                <XIcon size={20} />
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
                    <span>{selectedEvent.proposedBy || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Calendar size={16} />
                  <div>
                    <strong>Date:</strong>
                    <span>{formatDate(selectedEvent.date)}</span>
                  </div>
                </div>

                {selectedEvent.time && (
                  <div className="detail-item">
                    <ClockIcon size={16} />
                    <div>
                      <strong>Time:</strong>
                      <span>{formatTime(selectedEvent.time)}</span>
                    </div>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="detail-item">
                    <MapPin size={16} />
                    <div>
                      <strong>Location:</strong>
                      <span>{selectedEvent.location}</span>
                    </div>
                  </div>
                )}

                <div className="detail-item">
                  <Tag size={16} />
                  <div>
                    <strong>Event Type:</strong>
                    <span>{getEventType(selectedEvent)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div>
                    <strong>Status:</strong>
                    <span className={`status-badge status-${selectedEvent.status || 'pending'}`}>
                      {selectedEvent.status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="detail-item full-width">
                  <div>
                    <strong>Description:</strong>
                    <p className="description-text">{selectedEvent.description}</p>
                  </div>
                </div>
              )}

              {selectedEvent.imageURL && (
                <div className="detail-item full-width">
                  <strong>Event Image:</strong>
                  <div className="modal-image-container">
                    <img
                      src={selectedEvent.imageURL}
                      alt="event"
                      className="modal-image"
                    />
                    <button
                      className="view-full-image-btn"
                      onClick={() => handleViewImage(selectedEvent.imageURL)}
                    >
                      <Eye size={14} /> View Full Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {activeTab === "pending" && (
                <>
                  <button
                    className="approve-btn"
                    onClick={() => {
                      handleApprove(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                  >
                    <Check size={16} /> Approve Event
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => {
                      handleReject(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                  >
                    <X size={16} /> Reject Event
                  </button>
                </>
              )}
              {activeTab === "submitted" && (
                <button
                  className="edit-btn"
                  onClick={() => {
                    editEvent(selectedEvent);
                    setSelectedEvent(null);
                  }}
                >
                  <Edit size={16} /> Edit Event
                </button>
              )}
              <button
                className="add-btn"
                onClick={() => {
                  addToDashboard(selectedEvent);
                  setSelectedEvent(null);
                }}
              >
                <PlusCircle size={16} /> Add to Dashboard
              </button>
              <button className="close-btn" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer Modal */}
      {viewImage && (
        <div className="image-viewer-overlay" onClick={handleCloseImageViewer}>
          <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="image-viewer-header">
              <h3>Event Image</h3>
              <button className="close-image-btn" onClick={handleCloseImageViewer}>
                <XIcon size={24} />
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

export default HeadApprovalPanel;