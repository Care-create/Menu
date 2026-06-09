import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import api from '../api';

interface Props {
  onLogin: (token: string, name: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, passwort });
      onLogin(res.data.token, res.data.name);
    } catch {
      setFehler('E-Mail oder Passwort falsch');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" fontWeight="bold" mb={1} textAlign="center">
          Hotel Hohenlohe
        </Typography>
        <Typography variant="subtitle1" mb={3} textAlign="center" color="text.secondary">
          Menüdatenbank
        </Typography>
        {fehler && <Alert severity="error" sx={{ mb: 2 }}>{fehler}</Alert>}
        <TextField
          fullWidth label="E-Mail" type="email" value={email}
          onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }}
        />
        <TextField
          fullWidth label="Passwort" type="password" value={passwort}
          onChange={e => setPasswort(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          sx={{ mb: 3 }}
        />
        <Button fullWidth variant="contained" size="large" onClick={handleLogin}>
          Anmelden
        </Button>
      </Paper>
    </Box>
  );
}
