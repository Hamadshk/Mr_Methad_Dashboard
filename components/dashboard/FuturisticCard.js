'use client';

import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';

const FuturisticCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1e1e2f 30%, #2a2a4a 90%)',
  color: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

export default FuturisticCard;