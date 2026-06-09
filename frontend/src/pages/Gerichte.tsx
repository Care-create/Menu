import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Grid, Card, CardContent, Chip, CircularProgress
} from '@mui/material';
import api from '../api';

interface Gericht {
  id: number;
  name: string;
  kategorie: string;
  saison: string;
  beschreibung: string;
  datum: string;
}

const KATEGORIEN = ['Alle', 'Vorspeise', 'Suppe', 'Hauptgang', 'Beilage', 'Dessert'];
const SAISONEN = ['Alle', 'Frühling', 'Sommer', 'Herbst', 'Winter'];

const KATEGORIE_FARBEN: Record<string, string> = {
  Vorspeise: '#4caf50', Suppe: '#ff9800', Hauptgang: '#f44336',
  Beilage: '#9c27b0', Dessert: '#e91e63',
};

export default function Gerichte() {
  const [gerichte, setGerichte] = useState<Gericht[]>([]);
  const [suche, setSuche] = useState('');
  const [kategorie, setKategorie] = useState('Alle');
  const [saison, setSaison] = useState('Alle');
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (kategorie !== 'Alle') params.kategorie = kategorie;
    if (saison !== 'Alle') params.saison = saison;
    if (suche) params.suche = suche;

    setLaden(true);
    api.get('/gerichte', { params })
      .then(res => setGerichte(res.data))
      .finally(() => setLaden(false));
  }, [suche, kategorie, saison]);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Gerichte</Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Suchen..." value={suche}
          onChange={e => setSuche(e.target.value)}
          sx={{ minWidth: 200 }} size="small"
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Kategorie</InputLabel>
          <Select value={kategorie} label="Kategorie" onChange={e => setKategorie(e.target.value)}>
            {KATEGORIEN.map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Saison</InputLabel>
          <Select value={saison} label="Saison" onChange={e => setSaison(e.target.value)}>
            {SAISONEN.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {laden ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : (
        <>
          <Typography color="text.secondary" mb={2}>{gerichte.length} Gerichte gefunden</Typography>
          <Grid container spacing={2}>
            {gerichte.map(g => (
              <Grid item xs={12} sm={6} md={4} key={g.id}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography fontWeight="bold">{g.name}</Typography>
                      <Chip
                        label={g.kategorie} size="small"
                        sx={{ bgcolor: KATEGORIE_FARBEN[g.kategorie] || '#888', color: 'white' }}
                      />
                    </Box>
                    <Chip label={g.saison} size="small" variant="outlined" sx={{ mr: 1 }} />
                    {g.datum && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(g.datum).toLocaleDateString('de-DE')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
