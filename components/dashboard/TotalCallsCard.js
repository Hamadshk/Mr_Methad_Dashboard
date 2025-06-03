import React, { useState, useEffect } from 'react';

const TotalCallsCard = ({ totalCalls = 45782 }) => {
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const increment = totalCalls / steps;
    let current = 0;
    
    const counter = setInterval(() => {
      current += increment;
      if (current >= totalCalls) {
        setCurrentCount(totalCalls);
        clearInterval(counter);
      } else {
        setCurrentCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(counter);
  }, [totalCalls]);

  return (
    <div className="calls-card">
      <div className="card-header">
        <div className="icon">📞</div>
        <h3>AI Calls Handled</h3>
      </div>
      
      <div className="counter">
        {currentCount.toLocaleString()}
      </div>
      
      <div className="status">
        <span className="dot"></span>
        System Active
      </div>

      <style jsx>{`
        .calls-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 12px;
          padding: 24px;
          width: 300px;
          color: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .calls-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .icon {
          font-size: 24px;
          background: rgba(59, 130, 246, 0.2);
          padding: 8px;
          border-radius: 8px;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
        }
        
        .counter {
          font-size: 36px;
          font-weight: 700;
          color: #3b82f6;
          text-align: center;
          margin: 20px 0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
          justify-content: center;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default TotalCallsCard;