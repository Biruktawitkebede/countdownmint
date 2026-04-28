import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { allCountries } from "country-telephone-data";
import "./Signup.css";

const Signup = () => {
  // Sort countries alphabetically by name
  const sortedCountries = allCountries.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const [formData, setFormData] = useState({
    fullName: "",
    countryCode: "+251", // Default to Ethiopia
    phoneNumber: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );

  const isValidPhone = (phone, countryCode) => {
    // Remove any spaces, dashes, or other special characters
    const cleanPhone = phone.replace(/[-\s]/g, '');

    // Get country data for specific validation
    const country = sortedCountries.find(c => `+${c.dialCode}` === countryCode);

    if (country) {
      // Ethiopia specific validation
      if (countryCode === "+251") {
        return /^9[0-9]{8}$/.test(cleanPhone);
      }
      // Add other country-specific validations here if needed
      // For now, use general validation for all other countries
    }

    // Default validation for other countries
    return /^[0-9]{6,15}$/.test(cleanPhone);
  };

  const getPhoneValidationMessage = (countryCode) => {
    if (countryCode === "+251") {
      return "Ethiopian numbers must start with 9 and be 9 digits (e.g., 912345678)";
    }

    const country = sortedCountries.find(c => `+${c.dialCode}` === countryCode);
    if (country && country.format) {
      return `Enter a valid ${country.name} phone number`;
    }

    return "Enter a valid phone number (6–15 digits)";
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-format phone number based on country
    if (name === "phoneNumber") {
      const country = sortedCountries.find(c => `+${c.dialCode}` === formData.countryCode);

      if (country && formData.countryCode === "+251") {
        // Ethiopia specific formatting - fixed the variable name here
        const cleanedValue = value.replace(/\D/g, '').slice(0, 9);
        setFormData((prev) => ({
          ...prev,
          [name]: cleanedValue,
        }));
      } else {
        // General formatting for other countries
        const cleanedValue = value.replace(/\D/g, '').slice(0, 15);
        setFormData((prev) => ({
          ...prev,
          [name]: cleanedValue,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleCountryCodeChange = (e) => {
    const newCountryCode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      countryCode: newCountryCode,
      phoneNumber: "", // Clear phone number when country changes
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!isValidPhone(formData.phoneNumber, formData.countryCode)) {
      setError(getPhoneValidationMessage(formData.countryCode));
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Invalid email address.");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError(
        "Password must contain uppercase, lowercase, number, symbol, and at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await sendEmailVerification(userCredential.user);

      const fullPhone = `${formData.countryCode}${formData.phoneNumber}`;

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        phoneNumber: fullPhone,
        email: formData.email,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        countryCode: formData.countryCode,
        role: "user",
      });

      alert("Verification email sent! Please check your inbox.");
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      setError(
        err.message.includes("email-already-in-use")
          ? "This email is already registered. Please use a different email or login."
          : err.message
      );
    }

    setLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "#e53e3e";
    if (passwordStrength < 70) return "#d69e2e";
    return "#38a169";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  const getPhonePlaceholder = () => {
    const country = sortedCountries.find(c => `+${c.dialCode}` === formData.countryCode);

    if (country && country.format) {
      // Convert format pattern to placeholder (remove dots, keep spaces)
      return country.format.replace(/\./g, ' ').replace(/x/g, 'X');
    }

    if (formData.countryCode === "+251") {
      return "912345678";
    }

    return "1234567890";
  };

  const getCurrentCountry = () => {
    return sortedCountries.find(c => `+${c.dialCode}` === formData.countryCode);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="signup-logo">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2>Create Your Account</h2>
          <p>Securely join our innovation community</p>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-user input-icon"></i>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="form-input"
              />
              <label className="form-label">Full Name</label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-static">Phone Number</label>
            <div className="phone-input-group">
              <div className="country-select-wrapper">
                <i className="fas fa-globe input-icon"></i>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="country-select"
                >
                  {sortedCountries.map((country) => (
                    <option
                      key={country.iso2}
                      value={`+${country.dialCode}`}
                    >
                      {country.emoji} +{country.dialCode} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="phone-number-wrapper">
                <i className="fas fa-phone input-icon"></i>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder={getPhonePlaceholder()}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="phone-hint">
              <small>{getPhoneValidationMessage(formData.countryCode)}</small>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-envelope input-icon"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="form-input"
              />
              <label className="form-label">Email Address</label>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-lock input-icon"></i>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                className="form-input"
              />
              <label className="form-label">Password</label>
            </div>

            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  ></div>
                </div>
                <div className="strength-text">
                  Password strength:{" "}
                  <span style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              </div>
            )}

            <div className="password-requirements">
              <h4>Password must contain:</h4>
              <ul>
                <li className={formData.password.length >= 8 ? "met" : ""}>
                  <i
                    className={`fas ${formData.password.length >= 8 ? "fa-check" : "fa-times"
                      }`}
                  ></i>
                  At least 8 characters
                </li>
                <li className={/[a-z]/.test(formData.password) ? "met" : ""}>
                  <i
                    className={`fas ${/[a-z]/.test(formData.password)
                        ? "fa-check"
                        : "fa-times"
                      }`}
                  ></i>
                  One lowercase letter
                </li>
                <li className={/[A-Z]/.test(formData.password) ? "met" : ""}>
                  <i
                    className={`fas ${/[A-Z]/.test(formData.password)
                        ? "fa-check"
                        : "fa-times"
                      }`}
                  ></i>
                  One uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? "met" : ""}>
                  <i
                    className={`fas ${/[0-9]/.test(formData.password)
                        ? "fa-check"
                        : "fa-times"
                      }`}
                  ></i>
                  One number
                </li>
                <li className={/[@$!%*?&]/.test(formData.password) ? "met" : ""}>
                  <i
                    className={`fas ${/[@$!%*?&]/.test(formData.password)
                        ? "fa-check"
                        : "fa-times"
                      }`}
                  ></i>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`signup-button ${loading ? "loading" : ""}`}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Create Account
              </>
            )}
          </button>
        </form>

        <div className="login-redirect">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Sign In
            </Link>
          </p>
        </div>

        
      </div>

      <div className="signup-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Signup;