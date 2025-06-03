'use client';

import { CardContent, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import FuturisticCard from './FuturisticCard';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SuccessRateChart({ successfulCalls, unsuccessfulCalls }) {
  const barChartData = {
    labels: ['Successful', 'Unsuccessful'],
    datasets: [
      {
        label: 'Calls',
        data: [successfulCalls, unsuccessfulCalls],
        backgroundColor: ['#00ff88', '#ff4d4d'],
        borderColor: ['#00cc66', '#cc0000'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <FuturisticCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Call Success Rate
        </Typography>
        <Bar
          data={barChartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Successful vs. Unsuccessful Calls', color: '#fff' },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' },
              },
              x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            },
          }}
        />
      </CardContent>
    </FuturisticCard>
  );
}