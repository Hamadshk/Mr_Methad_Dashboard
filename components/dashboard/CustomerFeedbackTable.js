'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider,
  Chip,
  Paper,
  styled,
} from '@mui/material';

const FuturisticTableContainer = styled(TableContainer)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1e1e2f 30%, #2a2a4a 90%)',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
}));

export default function CustomerFeedbackTable({ feedback }) {
  return (
    <FuturisticTableContainer component={Paper}>
      <Typography
        variant="h6"
        sx={{ p: 2, color: '#fff', fontWeight: 'bold' }}
      >
        Customer Feedback
      </Typography>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#fff' }}>Customer</TableCell>
            <TableCell sx={{ color: '#fff' }}>Comment</TableCell>
            <TableCell sx={{ color: '#fff' }}>Rating</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {feedback.map((row) => (
            <TableRow key={row.id}>
              <TableCell sx={{ color: '#fff' }}>{row.customer}</TableCell>
              <TableCell sx={{ color: '#fff' }}>{row.comment}</TableCell>
              <TableCell sx={{ color: '#fff' }}>
                <Chip
                  label={`${row.rating}/5`}
                  color={row.rating >= 4 ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </FuturisticTableContainer>
  );
}