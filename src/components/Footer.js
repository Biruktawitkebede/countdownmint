import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About / Logo */}
        <div className="footer-about">
          <div className="footer-logo">
            <h3>Ministry of Innovation and Technology</h3>
          </div>
          <p>
            The government merged the former Ministry of Science and Technology 
            and the Ministry of Communication and Information Technology to form 
            the Ministry of Innovation and Technology in 2019.
          </p>
          <a
            href="https://www.ictpark.et"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-ref-link"
          >
            Visit Ethio ICT Park
          </a>
        </div>

        {/* Focus Areas */}
        <div className="footer-links">
          <h3>Focus Areas</h3>
          <ul>
            <li>Research</li>
            <li>Innovation</li>
            <li>Technology Transfer</li>
            <li>Digitalization</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-contact">
          <h3>Contact</h3>
          <ul>
            <li>
              <span className="contact-icon">📞</span>
              Tel: +251118132191
            </li>
            <li>
              <span className="contact-icon">✉️</span>
              Email: contact@mint.gov.et
            </li>
            <li>
              <span className="contact-icon">🌐</span>
              Website: www.mint.gov.et
            </li>
          </ul>
        </div>

        {/* Social Icons with SVG */}
        <div className="footer-social">
          <h3>Connect</h3>
          <div className="social-icons">
            <a 
              href="https://www.facebook.com/MInT.Ethiopia" 
              className="social-circle facebook" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/MInT/" 
              className="social-circle twitter" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/company/ministry-of-innovation-and-technology-ethiopia/" 
              className="social-circle linkedin" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a 
              href="https://t.me/MInT/#" 
              className="social-circle telegram" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 7.935c.167.117.27.297.281.49.01.194-.072.382-.227.51-1.713 1.498-3.535 2.949-5.302 4.465-.307.268-.708.402-1.109.402-.422 0-.844-.153-1.168-.447-.364-.33-.922-.314-1.266.036l-2.335 2.342c-.344.345-.344.902 0 1.247.172.172.398.258.623.258.225 0 .451-.086.623-.258l1.654-1.658c.344-.345.898-.345 1.242 0 .345.344.345.902 0 1.247l-1.654 1.658c-.344.345-.344.902 0 1.247.172.172.398.258.623.258.225 0 .451-.086.623-.258l2.335-2.342c.344-.345.902-.361 1.266-.036.324.294.746.447 1.168.447.401 0 .802-.134 1.109-.402 1.767-1.516 3.589-2.967 5.302-4.465.155-.128.237-.316.227-.51-.01-.193-.114-.373-.281-.49-1.708-1.195-3.416-2.39-5.124-3.585-.344-.24-.822-.24-1.166 0-1.708 1.195-3.416 2.39-5.124 3.585z"/>
              </svg>
            </a>
            <a 
              href="https://www.youtube.com/@MinistryofInnovationandTechnol" 
              className="social-circle youtube" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
          
          {/* Quick Contact Info */}
          <div className="footer-social-info">
            <p>Follow us for updates</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Ministry of Innovation and Technology. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;