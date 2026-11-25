import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./form.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const ROLE_OPTIONS = [
  "Resident",
  "Student/Researcher",
  "Local Authority",
  "Guest"
];

const OBSERVED_CONDITION_OPTIONS = [
  "Humid & Sunny",
  "Extreme Heat",
  "Pleasant",
  "Thunderstorm",
  "Poor Air Quality/Smog"
];

const AQI_IMPACT_OPTIONS = [
  "Good / Breathable",
  "Moderate Haze",
  "Unhealthy",
  "Severe / Hazardous"
];

const THERMAL_COMFORT_OPTIONS = [
  "1 - Pleasant / Cool",
  "2 - Normal",
  "3 - Warm",
  "4 - Hot",
  "5 - Unbearable Heat"
];

const NOTIFICATION_CHANNEL_OPTIONS = [
  "Banner Alerts",
  "Email Alerts",
  "Daily Summary Digest"
];

function UserInfoForm({ onSaveUser, userData: existingUserData, locationsList = [] }) {
  const navigate = useNavigate();

  const cityOptions = [
    ...locationsList.map(
      (loc) => `${loc.name} (${loc.state || "India"} - ${loc.regionName || "IMD Station"})`
    ),
    "Other Indian District/Station"
  ];

  const getInitialState = () => ({
    fullName: existingUserData?.name || "",
    email: existingUserData?.email || "",
    primaryCity: existingUserData?.location || "",
    customCity: "",
    observerRole: "",
    observedCondition: "",
    perceivedAqiImpact: "",
    thermalComfortLevel: "",
    triggerHeatAlert: "",
    triggerAqiAlert: "",
    notificationChannels: ["Banner Alerts", "Email Alerts"],
    fieldNotes: ""
  });

  const [formData, setFormData] = useState(getInitialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Observer Profile validation
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Full Name is required.";
    } else if (trimmedName.length < 2) {
      newErrors.fullName = "Full Name must be at least 2 characters long.";
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      newErrors.fullName = "Full Name can only contain letters and spaces.";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.primaryCity) {
      newErrors.primaryCity = "Please select a primary city.";
    } else if (
      (formData.primaryCity === "Other Region" ||
        formData.primaryCity === "Other Indian District/Station") &&
      !formData.customCity.trim()
    ) {
      newErrors.customCity = "Please specify the city or region name.";
    }

    if (!formData.observerRole) {
      newErrors.observerRole = "Please select an observer role.";
    }

    // City Weather & Air Report validation
    if (!formData.observedCondition) {
      newErrors.observedCondition = "Please select an observed weather condition.";
    }

    if (!formData.perceivedAqiImpact) {
      newErrors.perceivedAqiImpact = "Please select perceived AQI impact.";
    }

    if (!formData.thermalComfortLevel) {
      newErrors.thermalComfortLevel = "Please select thermal comfort level.";
    }

    // Alert Thresholds validation
    if (formData.triggerHeatAlert) {
      const heat = Number(formData.triggerHeatAlert);
      if (isNaN(heat) || heat < -50 || heat > 70) {
        newErrors.triggerHeatAlert = "Heat threshold must be between -50°C and 70°C.";
      }
    }

    if (formData.triggerAqiAlert) {
      const aqi = Number(formData.triggerAqiAlert);
      if (isNaN(aqi) || aqi < 0 || aqi > 1000) {
        newErrors.triggerAqiAlert = "AQI threshold must be between 0 and 1000.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleCheckboxToggle = (channel) => {
    setFormData((prev) => {
      const exists = prev.notificationChannels.includes(channel);
      const updated = exists
        ? prev.notificationChannels.filter((c) => c !== channel)
        : [...prev.notificationChannels, channel];
      return {
        ...prev,
        notificationChannels: updated
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const effectiveLocation =
      formData.primaryCity === "Other Region" ||
      formData.primaryCity === "Other Indian District/Station"
        ? formData.customCity.trim() || "Other Region"
        : formData.primaryCity;

    const upperFullName = formData.fullName.trim().toUpperCase();

    const submissionData = {
      ...formData,
      fullName: upperFullName,
      email: formData.email.trim(),
      resolvedCity: effectiveLocation
    };

    console.log("Observer Report Submitted:", submissionData);

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        }
        throw new Error(result.error || "Failed to save submission to database.");
      }

      if (onSaveUser) {
        onSaveUser({
          name: upperFullName,
          location: effectiveLocation,
          email: submissionData.email,
          role: formData.observerRole,
          ...submissionData,
          _id: result.submission?._id
        });
      }

      alert("Observer report submitted and saved to MongoDB successfully!");
      navigate("/");
    } catch (err) {
      console.error("Failed to save observer form submission:", err);
      alert(`Error saving submission: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(getInitialState());
    setErrors({});
  };

  return (
    <div className="observer-root">
      <div className="observer-header">
        <h1 className="observer-title">Observer Report Form</h1>
        <p className="observer-subtitle">
          Submit real-time ground telemetry, thermal observations, and localized climate alerts
        </p>
      </div>

      <form className="observer-form-card" onSubmit={handleSubmit} noValidate>
        {/* OBSERVER PROFILE */}
        <section className="form-section">
          <h2 className="section-title">Observer Profile</h2>

          <div className="field-group">
            <label className="field-label" htmlFor="fullName">
              Full Name
            </label>
            <input
              className={`field-input ${errors.fullName ? "input-error" : ""}`}
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={(e) => {
                const upperVal = e.target.value.toUpperCase();
                handleChange({ target: { name: "fullName", value: upperVal } });
              }}
              placeholder="Enter your full name"
              style={{ textTransform: "uppercase" }}
              required
            />
            {errors.fullName && (
              <span className="field-error-text">{errors.fullName}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="email">
              Email Address
            </label>
            <input
              className={`field-input ${errors.email ? "input-error" : ""}`}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
            {errors.email && (
              <span className="field-error-text">{errors.email}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="primaryCity">
              Primary City
            </label>
            <select
              className={`field-input field-select ${errors.primaryCity ? "input-error" : ""}`}
              id="primaryCity"
              name="primaryCity"
              value={formData.primaryCity}
              onChange={handleChange}
              required
            >
              <option value="">Select Primary City...</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.primaryCity && (
              <span className="field-error-text">{errors.primaryCity}</span>
            )}
          </div>

          {(formData.primaryCity === "Other Region" ||
            formData.primaryCity === "Other Indian District/Station") && (
            <div className="field-group custom-city-group">
              <label className="field-label" htmlFor="customCity">
                Specify Other City / Region Name
              </label>
              <input
                className={`field-input ${errors.customCity ? "input-error" : ""}`}
                type="text"
                id="customCity"
                name="customCity"
                value={formData.customCity}
                onChange={handleChange}
                placeholder="Specify city or region..."
                required
              />
              {errors.customCity && (
                <span className="field-error-text">{errors.customCity}</span>
              )}
            </div>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="observerRole">
              Observer Role
            </label>
            <select
              className={`field-input field-select ${errors.observerRole ? "input-error" : ""}`}
              id="observerRole"
              name="observerRole"
              value={formData.observerRole}
              onChange={handleChange}
              required
            >
              <option value="">Select Observer Role...</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.observerRole && (
              <span className="field-error-text">{errors.observerRole}</span>
            )}
          </div>
        </section>

        {/* CITY WEATHER & AIR REPORT */}
        <section className="form-section">
          <h2 className="section-title">City Weather & Air Report</h2>

          <div className="field-group">
            <label className="field-label" htmlFor="observedCondition">
              Observed Condition
            </label>
            <select
              className={`field-input field-select ${errors.observedCondition ? "input-error" : ""}`}
              id="observedCondition"
              name="observedCondition"
              value={formData.observedCondition}
              onChange={handleChange}
              required
            >
              <option value="">Select Observed Condition...</option>
              {OBSERVED_CONDITION_OPTIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
            {errors.observedCondition && (
              <span className="field-error-text">{errors.observedCondition}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="perceivedAqiImpact">
              Perceived AQI Impact
            </label>
            <select
              className={`field-input field-select ${errors.perceivedAqiImpact ? "input-error" : ""}`}
              id="perceivedAqiImpact"
              name="perceivedAqiImpact"
              value={formData.perceivedAqiImpact}
              onChange={handleChange}
              required
            >
              <option value="">Select Perceived AQI Impact...</option>
              {AQI_IMPACT_OPTIONS.map((impact) => (
                <option key={impact} value={impact}>
                  {impact}
                </option>
              ))}
            </select>
            {errors.perceivedAqiImpact && (
              <span className="field-error-text">{errors.perceivedAqiImpact}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="thermalComfortLevel">
              Thermal Comfort Level
            </label>
            <select
              className={`field-input field-select ${errors.thermalComfortLevel ? "input-error" : ""}`}
              id="thermalComfortLevel"
              name="thermalComfortLevel"
              value={formData.thermalComfortLevel}
              onChange={handleChange}
              required
            >
              <option value="">Select Thermal Comfort Level...</option>
              {THERMAL_COMFORT_OPTIONS.map((comfort) => (
                <option key={comfort} value={comfort}>
                  {comfort}
                </option>
              ))}
            </select>
            {errors.thermalComfortLevel && (
              <span className="field-error-text">{errors.thermalComfortLevel}</span>
            )}
          </div>
        </section>

        {/* ALERT THRESHOLDS & PREFERENCES */}
        <section className="form-section">
          <h2 className="section-title">Alert Thresholds & Preferences</h2>

          <div className="field-group">
            <label className="field-label" htmlFor="triggerHeatAlert">
              Trigger Heat Alert Above (°C)
            </label>
            <input
              className={`field-input ${errors.triggerHeatAlert ? "input-error" : ""}`}
              type="number"
              id="triggerHeatAlert"
              name="triggerHeatAlert"
              value={formData.triggerHeatAlert}
              onChange={handleChange}
              placeholder="e.g. 38"
            />
            {errors.triggerHeatAlert && (
              <span className="field-error-text">{errors.triggerHeatAlert}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="triggerAqiAlert">
              Trigger AQI Alert Above
            </label>
            <input
              className={`field-input ${errors.triggerAqiAlert ? "input-error" : ""}`}
              type="number"
              id="triggerAqiAlert"
              name="triggerAqiAlert"
              value={formData.triggerAqiAlert}
              onChange={handleChange}
              placeholder="e.g. 150"
            />
            {errors.triggerAqiAlert && (
              <span className="field-error-text">{errors.triggerAqiAlert}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">Notification Channels</label>
            <div className="checkbox-stack">
              {NOTIFICATION_CHANNEL_OPTIONS.map((channel) => {
                const isChecked = formData.notificationChannels.includes(channel);
                return (
                  <label key={channel} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(channel)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">{channel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADDITIONAL NOTES & ACTIONS */}
        <section className="form-section">
          <h2 className="section-title">Additional Notes & Actions</h2>

          <div className="field-group">
            <label className="field-label" htmlFor="fieldNotes">
              Field Notes / Remarks
            </label>
            <textarea
              className="field-input field-textarea"
              id="fieldNotes"
              name="fieldNotes"
              rows={3}
              value={formData.fieldNotes}
              onChange={handleChange}
              placeholder="Enter micro-climate observations, localized smog details, or road heat notes..."
            />
          </div>

          <div className="action-buttons-group">
            <button className="btn-amber-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Observer Report"}
            </button>
            <button className="btn-ghost-secondary" type="button" onClick={handleReset}>
              Reset Form
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default UserInfoForm;
