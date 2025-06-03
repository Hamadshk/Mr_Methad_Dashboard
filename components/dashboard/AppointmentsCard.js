'use client';

import { CardContent, Typography } from '@mui/material';
import FuturisticCard from './FuturisticCard';

export default function AppointmentsCard({ appointments }) {
  return (
    <FuturisticCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Appointments Booked
        </Typography>
        <Typography variant="h3" sx={{ color: '#00ff88' }}>
          {appointments}
        </Typography>
        <Typography variant="body2">
          Appointments booked via GHL-CRM this month
        </Typography>
      </CardContent>
    </FuturisticCard>
  );
}