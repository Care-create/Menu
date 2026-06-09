import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent,
  Grid, Chip, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import api from '../api';

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const SAISONEN = ['Frühling', 'Sommer', 'Herbst', 'Winter'];

function aktuelleSaison(): string {
  const monat = new Date().getMonth() + 1;
  if (monat <= 2 || monat === 12) return 'Winter';
  if (monat <= 5) return 'Frühling';
  if (monat <= 8) return 'Sommer';
  return 'Herbst';
}

export default function Wochenplan() {
  const [saison, setSaison] = useState(aktuelleSaison());
  const [plan, setPlan] = useState<any>(null);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState('');

  const vorschlagLaden = async () => {
    setLaden(true);
    setFehler('');
    try {
      const res = await api.get(`/wochenplan/vorschlag/${saison}`);
      setPlan(res.data);
    } catch {
      setFehler('Keine Gerichte für diese Saison gefunden. Bitte zuerst Daten importieren.');
    } finally {
      setLaden(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Wochenplan</Typography>

      <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Saison</InputLabel>
          <Select value={saison} label="Saison" onChange={e => setSaison(e.target.value)}>
            {SAISONEN.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Button
          variant="contained" startIcon={<AutoAwesome />}
          onClick={vorschlagLaden} disabled={laden}
        >
          Wochenplan vorschlagen
        </Button>
      </Box>

      {fehler && <Alert severity="warning" sx={{ mb: 2 }}>{fehler}</Alert>}

      {laden && <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}

      {plan && (
        <Grid container spacing={2}>
          {TAGE.map(tag => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tag}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2}>{tag}</Typography>
                  {plan[tag]?.vorspeise && (
                    <Box mb={1}>
                      <Chip label="Vorspeise" size="small" sx={{ bgcolor: '#4caf50', color: 'white', mb: 0.5 }} />
                      <Typography variant="body2">{plan[tag].vorspeise.name}</Typography>
                    </Box>
                  )}
                  {plan[tag]?.suppe && (
                    <Box mb={1}>
                      <Chip label="Suppe" size="small" sx={{ bgcolor: '#ff9800', color: 'white', mb: 0.5 }} />
                      <Typography variant="body2">{plan[tag].suppe.name}</Typography>
                    </Box>
                  )}
                  {plan[tag]?.hauptgang?.map((g: any, i: number) => (
                    <Box mb={1} key={i}>
                      <Chip label={`Hauptgang ${i + 1}`} size="small" sx={{ bgcolor: '#f44336', color: 'white', mb: 0.5 }} />
                      <Typography variant="body2">{g.name}</Typography>
                    </Box>
                  ))}
                  {plan[tag]?.dessert && (
                    <Box>
                      <Chip label="Dessert" size="small" sx={{ bgcolor: '#e91e63', color: 'white', mb: 0.5 }} />
                      <Typography variant="body2">{plan[tag].dessert.name}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
