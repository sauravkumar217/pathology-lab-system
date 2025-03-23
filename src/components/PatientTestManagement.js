import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles.css';

function PatientTestManagement() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientData, setPatientData] = useState({
    name: '',
    mobile: '',
    age: '',
    referredBy: '',
    gender: '',
    address: '',
    sample: '',
    date: '',
    tests: [{ testName: '', result: '', unit: '', referenceRange: '', testMethod: '' }]
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // New state for success message

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      fetchPatients();
    }
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:3001/patients');
      const allPatients = response.data;

      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() - 7);

      const recentPatients = allPatients.filter(patient => {
        const patientDate = new Date(patient.date);
        return patientDate >= cutoffDate && patientDate <= today;
      });

      setPatients(recentPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to fetch patients. Please check if the server is running.');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setUsername('');
      setPassword('');
      fetchPatients();
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    setPatients([]);
    setPatientData({
      name: '',
      mobile: '',
      age: '',
      referredBy: '',
      gender: '',
      address: '',
      sample: '',
      date: '',
      tests: [{ testName: '', result: '', unit: '', referenceRange: '', testMethod: '' }]
    });
    setSuccess(null); // Clear success message on logout
  };

  const generateReportId = async (reportDate) => {
    try {
      console.log('Generating report ID for date:', reportDate);
      const response = await axios.get('http://localhost:3001/reports');
      const reports = response.data;
      console.log('Fetched reports:', reports);

      const date = new Date(reportDate);
      console.log('Parsed date:', date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format: ' + reportDate);
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const yearMonthPrefix = `${year}${month}`;
      console.log('Year-Month Prefix:', yearMonthPrefix);

      const reportsInSameMonth = reports.filter(report => {
        if (!report.id || typeof report.id !== 'string') {
          console.warn('Invalid report ID:', report);
          return false;
        }
        const reportYearMonth = report.id.substring(0, 6);
        return reportYearMonth === yearMonthPrefix;
      });
      console.log('Reports in same month:', reportsInSameMonth);

      let nextNumber = 1;
      if (reportsInSameMonth.length > 0) {
        const lastReport = reportsInSameMonth[reportsInSameMonth.length - 1];
        const lastNumber = parseInt(lastReport.id.substring(6), 10);
        if (isNaN(lastNumber)) {
          throw new Error('Invalid report ID format in last report: ' + lastReport.id);
        }
        nextNumber = lastNumber + 1;
      }

      const sequentialNumber = String(nextNumber).padStart(4, '0');
      const newReportId = `${yearMonthPrefix}${sequentialNumber}`;
      console.log('Generated report ID:', newReportId);
      return newReportId;
    } catch (error) {
      console.error('Error generating report ID:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      } else if (error.request) {
        console.error('No response from server');
      }
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestChange = (index, e) => {
    const { name, value } = e.target;
    const updatedTests = [...patientData.tests];
    updatedTests[index] = { ...updatedTests[index], [name]: value };
    setPatientData(prev => ({ ...prev, tests: updatedTests }));
  };

  const addTest = () => {
    setPatientData(prev => ({
      ...prev,
      tests: [...prev.tests, { testName: '', result: '', unit: '', referenceRange: '', testMethod: '' }]
    }));
  };

  const removeTest = (index) => {
    if (patientData.tests.length === 1) {
      setError('At least one test is required.');
      return;
    }
    const updatedTests = patientData.tests.filter((_, i) => i !== index);
    setPatientData(prev => ({ ...prev, tests: updatedTests }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that at least one test is filled (excluding testMethod)
      const hasEmptyTest = patientData.tests.some(test =>
        !test.testName || !test.result || !test.unit || !test.referenceRange
      );
      if (hasEmptyTest) {
        setError('Please fill in all test details (except Test Method, which is optional).');
        return;
      }

      // Validate date
      const patientDate = new Date(patientData.date);
      if (isNaN(patientDate.getTime())) {
        setError('Please select a valid date.');
        return;
      }

      // Add patient (let json-server assign the ID)
      const newPatient = {
        name: patientData.name,
        mobile: patientData.mobile,
        age: patientData.age,
        referredBy: patientData.referredBy,
        gender: patientData.gender,
        address: patientData.address,
        sample: patientData.sample,
        date: patientData.date
      };
      console.log('Adding patient:', newPatient);
      const patientResponse = await axios.post('http://localhost:3001/patients', newPatient);
      console.log('Patient added:', patientResponse.data);

      // Generate report
      const reportId = await generateReportId(patientData.date);
      if (!reportId) {
        throw new Error('Failed to generate report ID. Check the console for details.');
      }

      const newReport = {
        id: reportId,
        patientId: patientResponse.data.id,
        tests: patientData.tests.map(test => ({
          name: test.testName,
          result: test.result,
          unit: test.unit,
          referenceRange: test.referenceRange,
          method: test.testMethod // Will be empty string if not filled
        })),
        date: patientData.date
      };
      console.log('Adding report:', newReport);
      const reportResponse = await axios.post('http://localhost:3001/reports', newReport);
      console.log('Report added:', reportResponse.data);

      // Refresh patients list
      await fetchPatients();

      // Reset form and show success message
      setPatientData({
        name: '',
        mobile: '',
        age: '',
        referredBy: '',
        gender: '',
        address: '',
        sample: '',
        date: '',
        tests: [{ testName: '', result: '', unit: '', referenceRange: '', testMethod: '' }]
      });
      setError(null);
      setSuccess('Patient and test added. Please go to Report Generation section.');
    } catch (error) {
      console.error('Error adding patient and report:', error);
      if (error.response) {
        setError(`Failed to add patient and report: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to add patient and report: No response from server. Please check if the server is running.');
      } else {
        setError(`Failed to add patient and report: ${error.message}`);
      }
    }
  };

  const handleDelete = async (patientId) => {
    try {
      await axios.delete(`http://localhost:3001/patients/${patientId}`);

      const reports = await axios.get('http://localhost:3001/reports');
      const reportsToDelete = reports.data.filter(report => report.patientId === patientId);
      for (const report of reportsToDelete) {
        await axios.delete(`http://localhost:3001/reports/${report.id}`);
      }

      fetchPatients();
      setSuccess(null); // Clear success message on delete
    } catch (error) {
      console.error('Error deleting patient:', error);
      setError('Failed to delete patient.');
    }
  };

  return (
    <div>
      <header className="dashboard-header">
        <h1>Shiv Shankar Pathology Dashboard</h1>
        {isLoggedIn && (
          <button onClick={handleLogout} className="logout">
            Logout
          </button>
        )}
      </header>

      {!isLoggedIn ? (
        <div>
          <h2>Admin Login</h2>
          {error && <p className="error">{error}</p>}
          <p className="info">
            Use username: <b>{ADMIN_USERNAME}</b> and password: <b>{ADMIN_PASSWORD}</b>
          </p>
          <form onSubmit={handleLogin}>
            <div>
              <label>Username: </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      ) : (
        <div>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <h2>Patient and Test Management</h2>
          <h3>Add Patient</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Name: </label>
              <input
                type="text"
                name="name"
                value={patientData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Mobile: </label>
              <input
                type="text"
                name="mobile"
                value={patientData.mobile}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Age: </label>
              <input
                type="number"
                name="age"
                value={patientData.age}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Referred By: </label>
              <input
                type="text"
                name="referredBy"
                value={patientData.referredBy}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>Gender: </label>
              <select name="gender" value={patientData.gender} onChange={handleInputChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label>Address: </label>
              <input
                type="text"
                name="address"
                value={patientData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Sample: </label>
              <input
                type="text"
                name="sample"
                value={patientData.sample}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Date: </label>
              <input
                type="date"
                name="date"
                value={patientData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <h4>Test Details</h4>
            {patientData.tests.map((test, index) => (
              <div key={index} className="test-section">
                <h5>Test {index + 1}</h5>
                <div>
                  <label>Test Name: </label>
                  <input
                    type="text"
                    name="testName"
                    value={test.testName}
                    onChange={(e) => handleTestChange(index, e)}
                    placeholder="e.g., CBC"
                    required
                  />
                </div>
                <div>
                  <label>Result: </label>
                  <input
                    type="text"
                    name="result"
                    value={test.result}
                    onChange={(e) => handleTestChange(index, e)}
                    placeholder="e.g., 119"
                    required
                  />
                </div>
                <div>
                  <label>Unit: </label>
                  <input
                    type="text"
                    name="unit"
                    value={test.unit}
                    onChange={(e) => handleTestChange(index, e)}
                    placeholder="e.g., mg/dL"
                    required
                  />
                </div>
                <div>
                  <label>Reference Range: </label>
                  <input
                    type="text"
                    name="referenceRange"
                    value={test.referenceRange}
                    onChange={(e) => handleTestChange(index, e)}
                    placeholder="e.g., 70-100"
                    required
                  />
                </div>
                <div>
                  <label>Test Method: </label>
                  <input
                    type="text"
                    name="testMethod"
                    value={test.testMethod}
                    onChange={(e) => handleTestChange(index, e)}
                    placeholder="e.g., N/A"
                    // Removed required attribute to make it optional
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTest(index)}
                  className="remove-test"
                >
                  Remove Test
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTest}
              className="add-test"
            >
              Add Another Test
            </button>
            <br />
            <button type="submit">Add Patient</button>
          </form>

          <h3>Patients List (Recent - Last 7 Days)</h3>
          {patients.length === 0 ? (
            <p>No recent patients available.</p>
          ) : (
            <ul>
              {patients.map(patient => (
                <li key={patient.id}>
                  <span>
                    <b>Name:</b> {patient.name} | <b>Mobile:</b> {patient.mobile} | <b>Date:</b> {patient.date}
                  </span>
                  <button
                    onClick={() => handleDelete(patient.id)}
                    className="delete"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientTestManagement;