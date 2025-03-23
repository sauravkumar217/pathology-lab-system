import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PatientTestManagement from './components/PatientTestManagement';
import ReportGeneration from './components/ReportGeneration';
import './styles.css'; // If you have additional global styles

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation Menu */}
        <nav className="navbar">
          <div className="navbar-brand">
            <Link to="/">Shiv Shankar Pathology</Link>
          </div>
          <ul className="navbar-links">
            <li>
              <Link to="/patient-test-management">Manage Patients & Tests</Link>
            </li>
            <li>
              <Link to="/report-generation">Generate Reports</Link>
            </li>
          </ul>
        </nav>

        {/* Define Routes */}
        <Routes>
          <Route
            path="/patient-test-management"
            element={
              <div className="container">
                <PatientTestManagement />
              </div>
            }
          />
          <Route
            path="/report-generation"
            element={
              <div className="container">
                <ReportGeneration />
              </div>
            }
          />
          <Route
            path="/"
            element={
              <div className="container">
                <div className="welcome-header">
                  <h1>Shiv Shankar Pathology</h1>
                  <h2>Welcome to Pathology Lab Management</h2>
                  <p>Please select an option from the navigation menu.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;