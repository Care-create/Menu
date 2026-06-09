import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Grid, Card, CardContent, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
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
  const [editGericht, setEditGericht] = useState<Gericht | null>(null);
  const [editName, setEditName] = useState('');
  const [editKategorie, setEditKategorie] = useState('');
  const [editSaison, setEditSaison] = useState('');

  const ladeGerichte = () => {
    const params: Record<string, string> = {};
    if (kategorie !== 'Alle') params.kategorie = kategorie;
    if (saison !== 'Alle') params.saison = saison;
    if (suche) params.suche = suche;
    setLaden(true);
    api.get('/gerichte', { params })
      .then(res => setGerichte(res.data))
      .finally(() => setLaden(false));
  };

  useEffect(() => { ladeGerichte(); }, [suche, kategorie, saison]);

  const bearbeiten = (g: Gericht) => {
    setEditGericht(g);
    setEditName(g.name);
    setEditKategorie(g.kategorie);
    setEditSaison(g.saison);
  };

  const speichern = async () => {
    if (!editGericht) return;
    await api.put(`/gerichte/${editGericht.id}`, {
      name: editName,
      kategorie: editKategorie,
      saison: editSaison,
    });
    setEditGericht(null);
    ladeGerichte();
  };

  const loeschen = async (id: number) => {
    if (!window.confirm('Gericht wirklich löschen?')) return;
    await api.delete(`/gerichte/${id}`);
    ladeGerichte();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Gerichte</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>{gerichte.length} Gerichte gefunden</Typography>
          <Grid container spacing={2}>
            {gerichte.map(g => (
              <Grid item xs={12} sm={6} md={4} key={g.id}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', flex: 1, mr: 1 }}>{g.name}</Typography>
                      <Chip
                        label={g.kategorie} size="small"
                        sx={{ bgcolor: KATEGORIE_FARBEN[g.kategorie] || '#888', color: 'white', flexShrink: 0 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Box>
                        <Chip label={g.saison} size="small" variant="outlined" sx={{ mr: 1 }} />
                        {g.datum && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(g.datum).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => bearbeiten(g)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => loeschen(g.id)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Bearbeitungs-Dialog */}
      <Dialog open={!!editGericht} onClose={() => setEditGericht(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Gericht bearbeiten</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Name" value={editName}
            onChange={e => setEditName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Kategorie</InputLabel>
            <Select value={editKategorie} label="Kategorie" onChange={e => setEditKategorie(e.target.value)}>
              {KATEGORIEN.filter(k => k !== 'Alle').map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Saison</InputLabel>
            <Select value={editSaison} label="Saison" onChange={e => setEditSaison(e.target.value)}>
              {SAISONEN.filter(s => s !== 'Alle').map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGericht(null)}>Abbrechen</Button>
          <Button variant="contained" onClick={speichern}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
