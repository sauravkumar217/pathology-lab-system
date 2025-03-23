import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Pathology Lab Dashboard</h1>
      <nav>
        <Link to="/patients">Patient Management</Link>
        <Link to="/tests">Test Management</Link>
        <Link to="/reports">Report Generation</Link>
      </nav>
    </div>
  );
}

export default Dashboard;