import React, { useState } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { Restaurant, CalendarMonth, Menu as MenuIcon, Logout } from '@mui/icons-material';
import Login from './pages/Login';
import Gerichte from './pages/Gerichte';
import Wochenplan from './pages/Wochenplan';

const DRAWER_WIDTH = 220;

const SEITEN = [
  { name: 'Gerichte', icon: <Restaurant /> },
  { name: 'Wochenplan', icon: <CalendarMonth /> },
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [aktiveSeite, setAktiveSeite] = useState('Gerichte');
  const [drawerOffen, setDrawerOffen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogin = (t: string, name: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userName', name);
    setToken(t);
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken('');
    setUserName('');
  };

  if (!token) return <Login onLogin={handleLogin} />;

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" color="primary">Menüplan</Typography>
      </Toolbar>
      <List>
        {SEITEN.map(s => (
          <ListItem key={s.name} disablePadding>
            <ListItemButton
              selected={aktiveSeite === s.name}
              onClick={() => { setAktiveSeite(s.name); setDrawerOffen(false); }}
            >
              <ListItemIcon>{s.icon}</ListItemIcon>
              <ListItemText primary={s.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box display="flex">
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOffen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" flexGrow={1}>Hotel Hohenlohe — Menüdatenbank</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{userName}</Typography>
          <IconButton color="inherit" onClick={handleLogout}><Logout /></IconButton>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer open={drawerOffen} onClose={() => setDrawerOffen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      )}

      <Box component="main" flexGrow={1} p={3} mt={8} ml={isMobile ? 0 : `${DRAWER_WIDTH}px`}>
        {aktiveSeite === 'Gerichte' && <Gerichte />}
        {aktiveSeite === 'Wochenplan' && <Wochenplan />}
      </Box>
    </Box>
  );
}
