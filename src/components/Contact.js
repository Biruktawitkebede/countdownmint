import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import "./Contact.css";

const Contact = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  // Pre-fill user info if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || prev.name,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setStatus("❌ Please login to send a message.");
      return;
    }
    setStatus("Sending...");

    try {
      await addDoc(collection(db, "contact_messages"), {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        message: formData.message,
        createdAt: serverTimestamp(),
        read: false,
        senderUid: currentUser.uid,
        senderRole: currentUser.role || "user"
      });

      setStatus("✅ Message sent to Admin successfully!");
      setFormData(prev => ({ ...prev, message: "" }));
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("❌ Failed to send message. Please try again.");
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>Contact Us</h1>
      </header>

      <main className="content">
        <section className="contact-info">
          <h2>Get in Touch</h2>
          <div className="contact-details">
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <div>
                <strong>Tel:</strong>
                <span>+251118132191</span>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <div>
                <strong>Email:</strong>
                <span>contact@mint.gov.et</span>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-globe"></i>
              <div>
                <strong>Website:</strong>
                <span>www.mint.gov.et</span>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <div>
                <strong>Address:</strong>
                <span>Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-form-section">
          <h2>Send us a Message</h2>

          {!currentUser ? (
            <div className="login-prompt" style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              marginTop: "20px"
            }}>
              <p style={{ color: "#991b1b", fontWeight: "bold", marginBottom: "10px" }}>
                🔒 Please login to send a message
              </p>
              <a href="/login" style={{
                display: "inline-block",
                background: "#0b6666",
                color: "white",
                padding: "8px 20px",
                borderRadius: "5px",
                textDecoration: "none"
              }}>Login Now</a>
            </div>
          ) : (
            <>
              <form onSubmit={sendEmail} className="contact-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    readOnly={!!currentUser}
                    style={{ backgroundColor: currentUser ? "#f3f4f6" : "white" }}
                  />
                </div>

                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Send Message
                </button>
              </form>

              {status && (
                <div
                  className={`status-message ${status.includes("✅") ? "success" : "error"
                    }`}
                >
                  {status}
                </div>
              )}
            </>
          )}
        </section>

        <section className="social">
          <h2>Connect with Us</h2>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/MInT.Ethiopia"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-facebook"></i>
              <span>Facebook</span>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
              <span>Twitter</span>
            </a>
            <a
              href="https://www.linkedin.com/company/ministry-of-innovation-and-technology-ethiopia/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin"></i>
              <span>LinkedIn</span>
            </a>
            <a
              href="https://www.youtube.com/@MinistryofInnovationandTechnol"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-youtube"></i>
              <span>YouTube</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
