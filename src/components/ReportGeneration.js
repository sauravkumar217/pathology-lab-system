import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles.css'; // Ensure styles.css is imported

function ReportGeneration() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [error, setError] = useState(null);

  console.log('ReportGeneration rendered');

  useEffect(() => {
    fetchReports();
    fetchPatients();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:3001/reports');
      console.log('Fetched reports:', response.data);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports. Please check if the server is running.');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:3001/patients');
      console.log('Fetched patients:', response.data);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to fetch patients. Please check if the server is running.');
    }
  };

  const filteredReports = searchDate
    ? reports.filter(report => report.date === searchDate)
    : reports;

  const getPatientDetails = (patientId) => {
    const patient = patients.find(p => p.id === patientId) || {};
    return {
      name: patient.name || 'Unknown',
      mobile: patient.mobile || 'N/A',
      age: patient.age || 'N/A',
      referredBy: patient.referredBy || 'SELF',
      gender: patient.gender || 'N/A',
      address: patient.address || 'N/A',
      sample: patient.sample || 'N/A',
      date: patient.date || 'N/A'
    };
  };

  // Helper function to format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (reportId, patientId) => {
    try {
      // Delete the report
      await axios.delete(`http://localhost:3001/reports/${reportId}`);
      console.log(`Report ${reportId} deleted`);

      // Delete the associated patient
      await axios.delete(`http://localhost:3001/patients/${patientId}`);
      console.log(`Patient ${patientId} deleted`);

      // Refresh the reports and patients lists
      await fetchReports();
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting report and patient:', error);
      setError('Failed to delete report and patient. Please check if the server is running.');
    }
  };

  const handlePrint = (report) => {
    const patient = getPatientDetails(report.patientId);
    const printContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Poppins', sans-serif; margin: 20px; color: #000000; }
            .header { height: 120px; } /* 6 lines of space */
            .patient-info { margin-bottom: 20px; font-size: 16px; margin-left: 60px; }
            .patient-info .info-row { margin: 5px 0; display: flex; gap: 20px; }
            .patient-info .info-row span { flex: 1; }
            .patient-info p { margin: 5px 0; }
            hr { border: 0; border-top: 1px solid #000000; margin: 10px 0; margin-left: 60px; margin-right: 30px; }
            .subheader { margin: 10px 0; font-weight: 600; font-size: 18px; text-align: center; color: #000000; }
            .test-table { width: 90%; margin: 20px auto; border-collapse: collapse; }
            .test-table th, .test-table td { border: 1px solid #e9ecef; padding: 8px; text-align: left; }
            .test-table th { background: #e9ecef; color: #000000; font-weight: 600; }
            .test-table td { font-size: 14px; }
            .test-table th.test-name, .test-table td.test-name { width: 35%; }
            .test-table th.result, .test-table td.result { width: 15%; }
            .test-table th.unit, .test-table td.unit { width: 15%; }
            .test-table th.reference-range, .test-table td.reference-range { width: 35%; }
            .footer { margin-top: 20px; font-size: 14px; color: #000000; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header"></div>
          <div class="patient-info">
            <div class="info-row">
              <span><b>Patient Name:</b> ${patient.name}</span>
              <span><b>Report ID:</b> ${report.id}</span>
              <span><b>Date:</b> ${formatDate(patient.date)}</span>
            </div>
            <div class="info-row">
              <span><b>Mobile:</b> ${patient.mobile}</span>
              <span><b>Age:</b> ${patient.age} Years</span>
              <span><b>Gender:</b> ${patient.gender}</span>
            </div>
            <div class="info-row">
              <span><b>Ref By:</b> ${patient.referredBy}</span>
              <span><b>Sample:</b> ${patient.sample}</span>
              <span><b>A/c Status:</b> P</span>
            </div>
            <p><b>Address:</b> ${patient.address}</p>
            <p><b>Collected at:</b> Shiv Shankar Pathology, Hospital More, Jehanabad, Bihar - 804408</p>
            <p><b>Processed at:</b> Shiv Shankar Pathology, Hospital More, Jehanabad, Bihar - 804408</p>
          </div>
          <hr>
          <div class="subheader">Test Report</div>
          <table class="test-table">
            <tr>
              <th class="test-name">Test Name</th>
              <th class="result">Result</th>
              <th class="unit">Unit</th>
              <th class="reference-range">Reference Range</th>
            </tr>
            ${report.tests.map(test => `
              <tr>
                <td class="test-name">${test.name}${test.method ? ` (${test.method})` : ''}</td>
                <td class="result">${test.result}</td>
                <td class="unit">${test.unit}</td>
                <td class="reference-range">${test.referenceRange || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = (report) => {
    const patient = getPatientDetails(report.patientId);
    const patientIndent = '          '; // 10 spaces for patient info
    const content = `
\n\n\n\n\n\n <!-- 6 lines of space for pad/logo -->
${patientIndent}Patient Name: ${patient.name}    Report ID: ${report.id}    Date: ${formatDate(patient.date)}
${patientIndent}Mobile: ${patient.mobile}    Age: ${patient.age} Years    Gender: ${patient.gender}
${patientIndent}Ref By: ${patient.referredBy}    Sample: ${patient.sample}    A/c Status: P
${patientIndent}Address: ${patient.address}
${patientIndent}Collected at: Shiv Shankar Pathology, Hospital More, Jehanabad, Bihar - 804408
${patientIndent}Processed at: Shiv Shankar Pathology, Hospital More, Jehanabad, Bihar - 804408
${patientIndent}------------------------------------------------------------

                    Test Report
------------------------------------------------------------
Test Name                           Result          Unit    Reference Range
------------------------------------------------------------
${report.tests.map(test => `${(test.name + (test.method ? ` (${test.method})` : '')).padEnd(35)} ${test.result.padEnd(15)} ${test.unit.padEnd(10)} ${(test.referenceRange || 'N/A').padEnd(35)}`).join('\n')}
------------------------------------------------------------
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${report.id}.txt`;
    link.click();
  };

  return (
    <div>
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <h1>Shiv Shankar Pathology Dashboard</h1>
      </header>

      {error && <div className="error">{error}</div>}

      <h2>Report Generation</h2>
      <input
        type="date"
        value={searchDate}
        onChange={(e) => setSearchDate(e.target.value)}
        placeholder="Search by date"
      />
      {filteredReports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul>
          {filteredReports.map(report => {
            const patient = getPatientDetails(report.patientId);
            return (
              <li key={report.id} className="report-item">
                <span>
                  <b>Name:</b> {patient.name} - <b>Date:</b> {report.date}
                </span>
                <div>
                  <button onClick={() => handlePrint(report)}>Print</button>
                  <button onClick={() => handleDownload(report)}>Download</button>
                  <button onClick={() => handleDelete(report.id, report.patientId)} className="delete">Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ReportGeneration;