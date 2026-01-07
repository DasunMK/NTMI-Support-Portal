import React from 'react';
import { Container, Typography } from '@mui/material';

export default function Inbox() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">Inbox</Typography>
      <Typography color="textSecondary">No new notifications.</Typography>
    </Container>
  );
}