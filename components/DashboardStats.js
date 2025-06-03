// components/DashboardStats.js
import styles from '../styles/Dashboard.module.css';

export default function DashboardStats({ data }) {
  const stats = [
    {
      id: 'totalCalls',
      value: data.totalCalls,
      label: 'Total Calls Handled',
      change: '+12.3%',
      positive: true
    },
    {
      id: 'successfulCalls',
      value: data.successfulCalls,
      label: 'Successful Calls',
      change: '+8.7%',
      positive: true
    },
    {
      id: 'bookingsMade',
      value: data.bookingsMade,
      label: 'Appointments Booked',
      change: '+15.2%',
      positive: true
    },
    {
      id: 'humanTransfers',
      value: data.humanTransfers,
      label: 'Human Transfers',
      change: '-3.1%',
      positive: true // Negative is good for transfers
    },
    {
      id: 'avgRating',
      value: data.avgRating,
      label: 'Customer Satisfaction',
      change: '+0.3',
      positive: true
    },
    {
      id: 'newCustomers',
      value: data.newCustomers,
      label: 'New Customers',
      change: '+22.1%',
      positive: true
    }
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((stat) => (
        <div key={stat.id} className={styles.statCard}>
          <div className={styles.statValue}>{stat.value}</div>
          <div className={styles.statLabel}>{stat.label}</div>
          <div className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
            <span>{stat.positive ? '↗' : '↘'}</span> {stat.change} vs last month
          </div>
        </div>
      ))}
    </div>
  );
}

// components/DashboardCharts.js
import { useEffect, useRef } from 'react';
import styles from '../styles/Dashboard.module.css';

export default function DashboardCharts({ data }) {
  const performanceChartRef = useRef(null);
  const successChartRef = useRef(null);

  useEffect(() => {
    // Load Chart.js dynamically
    const loadCharts = async () => {
      if (typeof window !== 'undefined') {
        const Chart = (await import('chart.js/auto')).default;
        
        // Performance trends chart
        if (performanceChartRef.current) {
          new Chart(performanceChartRef.current, {
            type: 'line',
            data: {
              labels: data.dailyData.map(d => d.date.slice(-5)),
              datasets: [{
                label: 'Total Calls',
                data: data.dailyData.map(d => d.calls),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                tension: 0.4,
                fill: true
              }, {
                label: 'Bookings Made',
                data: data.dailyData.map(d => d.bookings),
                borderColor: '#06ffa5',
                backgroundColor: 'rgba(6, 255, 165, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  labels: { color: 'white' }
                }
              },
              scales: {
                x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
              }
            }
          });
        }

        // Success vs Failed chart
        if (successChartRef.current) {
          new Chart(successChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['Successful Calls', 'Failed Calls'],
              datasets: [{
                data: [data.successfulCalls, data.failedCalls],
                backgroundColor: ['#06ffa5', '#ff006e'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  labels: { color: 'white' }
                }
              }
            }
          });
        }
      }
    };

    loadCharts();
  }, [data]);

  return (
    <div className={styles.chartsSection}>
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Call Performance Trends</h3>
        <canvas ref={performanceChartRef}></canvas>
      </div>
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Success vs Failed Calls</h3>
        <canvas ref={successChartRef}></canvas>
      </div>
    </div>
  );
}

// components/RecentActivity.js
import styles from '../styles/Dashboard.module.css';

export default function RecentActivity({ activities }) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'success': return styles.statusSuccess;
      case 'failed': return styles.statusFailed;
      case 'transfer': return styles.statusPending;
      default: return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'Success';
      case 'failed': return 'Failed';
      case 'transfer': return 'Transfer';
      default: return 'Pending';
    }
  };

  return (
    <div className={styles.recentActivity}>
      <h3 className={styles.chartTitle}>Recent Activity</h3>
      <div>
        {activities.map((activity) => (
          <div key={activity.id} className={styles.activityItem}>
            <div>
              <strong>{activity.title}</strong><br />
              <small>{activity.description}</small>
            </div>
            <div className={`${styles.activityStatus} ${getStatusClass(activity.status)}`}>
              {getStatusText(activity.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// components/ExportControls.js
import styles from '../styles/Dashboard.module.css';

export default function ExportControls({ onExportPDF, onExportExcel, onEmailReport }) {
  return (
    <div className={styles.actionButtons}>
      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onExportPDF}>
        Export PDF
      </button>
      <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={onExportExcel}>
        Export Excel
      </button>
      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onEmailReport}>
        Send Report
      </button>
    </div>
  );
}