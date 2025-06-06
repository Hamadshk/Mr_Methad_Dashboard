import { useState, useEffect } from 'react';
import Head from 'next/head';

// Custom hook for client-side time display
const useClientTime = () => {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString('en-US'));
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return currentTime;
};

const Dashboard = () => {
  // Use the custom hook for last updated time
  const currentTime = useClientTime();
  
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    unsuccessfulCalls: 0,
    bookingsGenerated: 0,
    humanTransfers: 0,
    avgCallDuration: '3.2 min',
    customerSatisfaction: 5,
    // salesIncrease: 32.5,
    newCustomers: 0,
    monthlyGrowth: 18.2,
    usedCredits: 0, // New field for used ElevenLabs credits
    remainingCredits: 0, // New field for remaining ElevenLabs credits
    totalCredits: 1000000, // New field for total credits (replace with your plan's value)
  });

  // Real feedback data from API
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

  const [dateRange, setDateRange] = useState('thisMonth');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true); // New state for credits loading

    const generateReport = async (type) => {
    setIsGeneratingReport(true);
    try {
      // Prepare comprehensive data for the report
      const reportData = {
        ...dashboardData,
        // Add any additional calculated metrics
        successRate: dashboardData.totalCalls > 0 ? 
          ((dashboardData.successfulCalls / dashboardData.totalCalls) * 100).toFixed(1) : '0',
        bookingRate: dashboardData.successfulCalls > 0 ? 
          ((dashboardData.bookingsGenerated / dashboardData.successfulCalls) * 100).toFixed(1) : '0',
        // Add feedback data if available
        feedbacks: feedbackData.map(f => `${f.customerName} (${f.rating}/5): "${f.feedback}"`),
        averageRating: feedbackSummary.averageRating,
        totalFeedbacks: feedbackSummary.totalFeedbacks,
        generatedAt: new Date().toISOString(),
        dateRange: dateRange
      };

      console.log('Generating report...'); // Debug log

      const response = await fetch('/api/generateReport', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: type, 
          range: dateRange, 
          data: reportData 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get content disposition to extract filename
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'report';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '');
        }
      }
      
      // Get content type
      const contentType = response.headers.get('content-type');
      
      // Get the blob from the response
      const blob = await response.blob();
      
      try {
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a link to download the file
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        // Append to the document and click
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
        
        console.log('Report generated successfully');
      } catch (error) {
        console.error("Error creating object URL", error);
        // Fallback: open in new tab if download link fails
        const reader = new FileReader();
        reader.onload = function() {
          window.open(reader.result, '_blank');
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      // Show error message to user
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };
  

  const getDateRangeParams = (range) => {
    const now = new Date();
    let startTime, endTime;

    switch (range) {
      case 'thisMonth':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        break;
      case 'lastMonth':
        startTime = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        endTime = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
        break;
      case 'today':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        break;
      default:
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        endTime = now.getTime();
    }

    return { startTime, endTime };
  };

  // Function to fetch feedback data
  const fetchFeedbackData = async () => {
    setIsLoadingFeedback(true);
    try {
      const now = new Date();
      let month = now.getMonth() + 1;
      let year = now.getFullYear();

      // Adjust month/year based on selected date range
      if (dateRange === 'lastMonth') {
        month = month === 1 ? 12 : month - 1;
        year = month === 12 ? year - 1 : year;
      }

      const response = await fetch(`/api/getfeedback?month=${month}&year=${year}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFeedbackData(result.data.feedbacks);
        setFeedbackSummary(result.data.summary);
        
        // Update dashboard customer satisfaction with real data
        setDashboardData(prev => ({
          ...prev,
          customerSatisfaction: result.data.summary.averageRating
        }));
      } else {
        console.error('API returned error:', result.error);
        // Keep existing sample data as fallback
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Keep existing sample data as fallback
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch call data
        const callResponse = await fetch('/api/gettotalcalls');
        const callData = await callResponse.json();
  
        // Fetch bookings data
        const { startTime, endTime } = getDateRangeParams(dateRange);
        const bookingsResponse = await fetch(
          `/api/getbookingsnumber?startTime=${startTime}&endTime=${endTime}&calendarId=74aJ5MaFR2rHPKSKUA58&locationId=dz7LWqi6yEtXtdE11bBL`
        );
        const bookingsData = await bookingsResponse.json();
  
        // Fetch ElevenLabs credits
        setIsLoadingCredits(true);
        const creditsResponse = await fetch(`/api/getElevenLabsUsage?_=${Date.now()}`);
        const creditsData = await creditsResponse.json();
        console.log('ElevenLabs credits response:', creditsData); // Debug log
  
        if (!creditsData.success) {
          console.error('Failed to fetch ElevenLabs credits:', creditsData.error);
          setDashboardData((prev) => ({
            ...prev,
            creditsError: creditsData.error,
          }));
          return;
        }
  
        setDashboardData((prev) => ({
          ...prev,
          totalCalls: callData.totalCalls || 0,
          successfulCalls: callData.successfulCalls || 0,
          unsuccessfulCalls: callData.unsuccessfulCalls || 0,
          avgCallDuration: callData.averageDurationMinutes ? `${callData.averageDurationMinutes} min` : prev.avgCallDuration,
          bookingsGenerated: bookingsData.bookingsGenerated || 0,
          usedCredits: creditsData.data.usedCredits || 0,
          remainingCredits: creditsData.data.remainingCredits || 0,
          totalCredits: creditsData.data.totalCredits || prev.totalCredits,
          creditsError: null,
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setDashboardData((prev) => ({
          ...prev,
          creditsError: error.message,
        }));
      } finally {
        setIsLoadingCredits(false);
      }
    };
  
    fetchData();
    fetchFeedbackData();
  
    const interval = setInterval(() => {
      fetchData();
      fetchFeedbackData();
    }, 300000);
  
    return () => clearInterval(interval);
  }, [dateRange]);

  
  // Using a client-side only time calculation to avoid hydration errors
  const formatTimeAgo = (timestamp) => {
    // During SSR, return a placeholder and calculate on client side only
    if (typeof window === 'undefined') {
      return 'Recently';
    }
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };
  // Using a consistent date formatter for both client and server
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const successRate = ((dashboardData.successfulCalls / dashboardData.totalCalls) * 100).toFixed(1);
  const bookingRate = ((dashboardData.bookingsGenerated / dashboardData.successfulCalls) * 100).toFixed(1);

  return (
    <>
      <Head>
        <title>AI Call Agent Dashboard</title>
        <meta name="description" content="AI Call Agent Performance Dashboard" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="dashboard">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="logo">AI Call Agent Dashboard</h1>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>System Active</span>
            </div>
          </div>
          
          <div className="header-right">
            {/* <select 
              className="date-selector"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select> */}
            
            <div className="report-buttons">            <button 
              className="btn-primary"
              onClick={() => generateReport('pdf')}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? 'Generating PDF...' : 'Generate PDF Report'}
            </button>

            <button 
              className="btn-secondary"
              onClick={() => generateReport('excel')}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? 'Generating CSV...' : 'Export CSV'}
            </button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Key Metrics Row */}
          <div className="metrics-row">
            <div className="metric-card primary">
              <div className="metric-icon">📞</div>
              <div className="metric-content">
                <div className="metric-value">{dashboardData.totalCalls.toLocaleString()}</div>
                <div className="metric-label">Total Calls Handled</div>
                <div className="metric-change positive">+{dashboardData.monthlyGrowth}% vs last month</div>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">✅</div>
              <div className="metric-content">
                <div className="metric-value">{successRate}%</div>
                <div className="metric-label">Success Rate</div>
                <div className="metric-sublabel">{dashboardData.successfulCalls} successful calls</div>
              </div>
            </div>

            <div className="metric-card booking">
              <div className="metric-icon">📅</div>
              <div className="metric-content">
                <div className="metric-value">{dashboardData.bookingsGenerated}</div>
                <div className="metric-label">Bookings Generated</div>
                <div className="metric-sublabel">{bookingRate}% conversion rate</div>
              </div>
            </div>

            {/* <div className="metric-card revenue">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <div className="metric-value">+{dashboardData.salesIncrease}%</div>
                <div className="metric-label">Sales Increase</div>
                <div className="metric-sublabel">{dashboardData.newCustomers} new customers</div>
              </div>
            </div> */}
          </div>

          {/* Performance Overview */}
          <div className="performance-section">            <div className="section-header">
              <h2>Performance Overview</h2>
              <div className="last-updated">
                {currentTime ? `Last updated: ${currentTime}` : 'Last updated: Recently'}
              </div>
            </div>
            <div className="metric-card credits">
            <div className="metric-icon">💳</div>
            <div className="metric-content">
              <div className="metric-value">
                {isLoadingCredits
                  ? 'Loading...'
                  : dashboardData.creditsError
                  ? 'Error'
                  : dashboardData.remainingCredits.toLocaleString()}
              </div>
              <div className="metric-label">Remaining ElevenLabs Credits</div>
              <div className="metric-sublabel">
                {isLoadingCredits
                  ? ''
                  : dashboardData.creditsError
                  ? dashboardData.creditsError
                  : `${dashboardData.usedCredits.toLocaleString()} used of ${dashboardData.totalCredits.toLocaleString()}`}
              </div>
            </div>
          </div>

            <div className="performance-grid">
              <div className="performance-card">
                <h3>Call Distribution</h3>
                <div className="stat-row">
                  <span>Successful Calls</span>
                  <span className="stat-value success">{dashboardData.successfulCalls}</span>
                </div>
                <div className="stat-row">
                  <span>Unsuccessful Calls</span>
                  <span className="stat-value error">{dashboardData.unsuccessfulCalls}</span>
                </div>
                <div className="stat-row">
                  <span>Transferred to Human</span>
                  <span className="stat-value warning">{dashboardData.bookingsGenerated}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${successRate}%`}}></div>
                </div>
              </div>

              <div className="performance-card">
                <h3>Customer Experience</h3>
                <div className="satisfaction-score">
                  <div className="score-value">{dashboardData.customerSatisfaction}</div>
                  <div className="score-label">Avg. Rating</div>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(dashboardData.customerSatisfaction) ? 'star filled' : 'star'}>★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* <div className="performance-card">
                <h3>Business Impact</h3>
                <div className="impact-metric">
                  <div className="impact-value">+{dashboardData.salesIncrease}%</div>
                  <div className="impact-label">Sales Growth</div>
                </div>
                <div className="stat-row">
                  <span>New Customers Acquired</span>
                  <span className="stat-value success">{dashboardData.newCustomers}</span>
                </div>
                <div className="stat-row">
                  <span>Monthly Growth</span>
                  <span className="stat-value success">+{dashboardData.monthlyGrowth}%</span>
                </div>
              </div> */}
            </div>
          </div>

        <div className="feedback-section">
          <div className="section-header">
            <h2>Customer Feedback</h2>
            <div className="feedback-summary">
              {isLoadingFeedback ? (
                <span className="loading">Loading feedback...</span>
              ) : (
                <>
                  <span className="feedback-count">{feedbackSummary.totalFeedbacks} recent reviews</span>
                  <div className="avg-rating">
                    <span className="rating-value">{feedbackSummary.averageRating}</span>
                    <span className="rating-label">avg rating</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {isLoadingFeedback ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading customer feedback...</p>
            </div>
          ) : feedbackData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>No feedback available</h3>
              <p>No customer feedback found for the selected time period.</p>
            </div>
          ) : (
            <div className="feedback-grid">
              {feedbackData.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {feedback.customerName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="customer-details">
                        <div className="customer-name">{feedback.customerName}</div>
                        <div className="call-info">
                          {formatDate(feedback.timestamp)} • {formatTimeAgo(feedback.timestamp)}
                        </div>
                        {feedback.source && (
                          <div className="feedback-source">via {feedback.source}</div>
                        )}
                      </div>
                    </div>
                    <div className="feedback-rating">
                      <div className="rating-display">
                        <span className="rating-number">{feedback.rating}</span>
                        <span className="rating-max">/5</span>
                      </div>
                      <div className="rating-indicator">
                        <div 
                          className="rating-fill" 
                          style={{width: `${(feedback.rating / 5) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="feedback-content">
                    <p>"{feedback.feedback}"</p>
                  </div>
                  {feedback.calendarName && (
                    <div className="feedback-metadata">
                      <span className="metadata-item">📅 {feedback.calendarName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        </div>

        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            padding: 20px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .logo {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(45deg, #00f5ff, #0080ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(0, 255, 127, 0.1);
            border: 1px solid rgba(0, 255, 127, 0.3);
            border-radius: 20px;
            font-size: 14px;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            background: #00ff7f;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .date-selector {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 10px 15px;
            color: white;
            font-size: 14px;
          }

          .date-selector option {
            background: #1a1a2e;
            color: white;
          }

          .report-buttons {
            display: flex;
            gap: 10px;
          }

          .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          }

          .btn-primary {
            background: linear-gradient(45deg, #0080ff, #00f5ff);
            color: white;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 128, 255, 0.3);
          }

          .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .btn-primary:disabled, .btn-secondary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .main-grid {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }

          .metrics-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
          }

          .metric-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #00f5ff, #0080ff);
          }

          .metric-card.success::before {
            background: linear-gradient(90deg, #00ff7f, #00d4aa);
          }

          .metric-card.booking::before {
            background: linear-gradient(90deg, #ff6b6b, #ffa8a8);
          }

          .metric-card.revenue::before {
            background: linear-gradient(90deg, #ffd93d, #ff9f43);
          }

          .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .metric-card {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .metric-icon {
            font-size: 32px;
            opacity: 0.8;
          }

          .metric-content {
            flex: 1;
          }

          .metric-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .metric-label {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 4px;
          }

          .metric-sublabel {
            font-size: 12px;
            opacity: 0.6;
          }

          .metric-change {
            font-size: 12px;
            font-weight: 500;
          }

          .metric-change.positive {
            color: #00ff7f;
          }

          .performance-section, .feedback-section {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 30px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          }

          .section-header h2 {
            font-size: 20px;
            font-weight: 600;
          }

          .last-updated {
            font-size: 12px;
            opacity: 0.6;
          }

          .feedback-summary {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .feedback-count {
            font-size: 14px;
            opacity: 0.7;
          }

          .avg-rating {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .rating-value {
            font-size: 18px;
            font-weight: 600;
            color: #ffd93d;
          }

          .rating-stars {
            display: flex;
            gap: 2px;
          }

          .feedback-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
          }

          .feedback-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
          }

          .feedback-card:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.08);
          }

          .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }

          .customer-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .customer-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(45deg, #0080ff, #00f5ff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            color: white;
          }

          .customer-details {
            flex: 1;
          }

          .customer-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
          }

          .call-info {
            font-size: 12px;
            opacity: 0.6;
          }

          .feedback-rating {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }

          .rating-number {
            font-size: 12px;
            opacity: 0.7;
          }

          .feedback-content {
            line-height: 1.6;
          }

          .feedback-content p {
            margin: 0;
            font-style: italic;
            opacity: 0.9;
            font-size: 14px;
          }

          .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }

          .performance-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
          }

          .performance-card h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            opacity: 0.9;
          }

          .stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .stat-row:last-child {
            border-bottom: none;
          }

          .stat-value {
            font-weight: 600;
          }

          .stat-value.success {
            color: #00ff7f;
          }

          .stat-value.error {
            color: #ff6b6b;
          }

          .stat-value.warning {
            color: #ffd93d;
          }

          .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            margin-top: 15px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff7f, #00d4aa);
            border-radius: 3px;
            transition: width 0.5s ease;
          }

          .satisfaction-score {
            text-align: center;
            margin-bottom: 15px;
          }

          .score-value {
            font-size: 36px;
            font-weight: 700;
            color: #00ff7f;
          }

          .score-label {
            font-size: 12px;
            opacity: 0.6;
            margin-bottom: 8px;
          }

          .stars {
            display: flex;
            justify-content: center;
            gap: 2px;
          }

          .star {
            color: rgba(255, 255, 255, 0.3);
            font-size: 16px;
          }

          .star.filled {
            color: #ffd93d;
          }

          .impact-metric {
            text-align: center;
            margin-bottom: 15px;
          }

          .impact-value {
            font-size: 32px;
            font-weight: 700;
            color: #ffd93d;
          }

          .impact-label {
            font-size: 12px;
            opacity: 0.6;
          }

          .activity-section {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 30px;
          }

          .activity-section h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
          }

          .activity-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .activity-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: all 0.3s ease;
          }

          .activity-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .activity-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .activity-dot.success {
            background: #00ff7f;
          }

          .activity-dot.primary {
            background: #0080ff;
          }

          .activity-dot.warning {
            background: #ffd93d;
          }

          .activity-content {
            flex: 1;
          }

          .activity-title {
            font-weight: 500;
            margin-bottom: 4px;
          }

          .activity-time {
            font-size: 12px;
            opacity: 0.6;
          }

          @media (max-width: 768px) {
            .header {
              flex-direction: column;
              gap: 20px;
              align-items: stretch;
            }

            .header-right {
              justify-content: space-between;
            }

            .report-buttons {
              flex: 1;
            }

            .btn-primary, .btn-secondary {
              flex: 1;
              text-align: center;
            }

            .metrics-row {
              grid-template-columns: 1fr;
            }

            .performance-grid {
              grid-template-columns: 1fr;
            }

            .feedback-grid {
              grid-template-columns: 1fr;
            }

            .feedback-summary {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default Dashboard;