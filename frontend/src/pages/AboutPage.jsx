import { NavLink, Outlet } from 'react-router-dom';
import './AboutPage.css';

export const Team = () => (
  <div className="sub-route-box">
    <h3>Climate Analytics Team</h3>
    <p>Our dedicated team of environmental data scientists, meteorologists, and software engineers working to provide real-time air quality & weather monitoring.</p>
    <ul className="team-list">
      <li><strong>Dr. Asha Roy</strong> - Chief Meteorologist</li>
      <li><strong>Rahul Sharma</strong> - Sensor Network Lead</li>
      <li><strong>Priya Patel</strong> - Environmental Data Scientist</li>
    </ul>
  </div>
);

export const Company = () => (
  <div className="sub-route-box">
    <h3>Climate Watch Station & Org</h3>
    <p>Established in 2026, Climate Monitoring Network operates high-precision sensor nodes across major urban centers to safeguard public health and track climate trends.</p>
    <div className="stat-pills">
      <span className="pill">5 Major Cities</span>
      <span className="pill">24/7 Real-Time Telemetry</span>
      <span className="pill">AQI & Extreme Heat Warnings</span>
    </div>
  </div>
);

export const Contact = () => (
  <div className="about-page-container contact-page-container">
    <div className="contact-header">
      <div className="contact-status-badge">
        <span className="live-dot"></span>
        24/7 Support Online
      </div>
      <h2>Contact Station Support</h2>
      <p className="about-lead">Reach out to our environmental monitoring helpdesk.</p>
    </div>
    <div className="contact-card">
      <div className="contact-row">
        <div className="contact-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <div className="contact-info">
          <span className="contact-label">Email Support</span>
          <a href="mailto:support@climatenetwork.org" className="contact-link">support@climatenetwork.org</a>
        </div>
      </div>

      <div className="contact-row">
        <div className="contact-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div className="contact-info">
          <span className="contact-label">Phone Line</span>
          <a href="tel:+912255501928" className="contact-link">+91 22 5550 1928</a>
        </div>
      </div>

      <div className="contact-row">
        <div className="contact-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div className="contact-info">
          <span className="contact-label">Location</span>
          <span className="contact-text">Environmental Research Center, Bandra, Mumbai</span>
        </div>
      </div>
    </div>
  </div>
);

const AboutPage = () => {
  return (
    <div className="about-page-container">
      <h2>About Climate Monitoring Network</h2>
      <p className="about-lead">
        Learn more about our mission, our scientific team, and our environmental monitoring operations.
      </p>

      <nav className="sub-nav">
        <ul>
          <li>
            <NavLink
              to="team"
              className={({ isActive }) => (isActive ? "sub-nav-link active" : "sub-nav-link")}
            >
              Our Team
            </NavLink>
          </li>
          <li>
            <NavLink
              to="company"
              className={({ isActive }) => (isActive ? "sub-nav-link active" : "sub-nav-link")}
            >
              Our Company
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Outlet renders the matched nested route component (Team or Company) */}
      <div className="outlet-container">
        <Outlet />
      </div>
    </div>
  );
};

export default AboutPage;
