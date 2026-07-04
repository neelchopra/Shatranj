import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Play from './pages/Play';
import LeaderboardPage from './pages/LeaderboardPage';
import FriendsPage from './pages/FriendsPage';
import MyAccount from './pages/MyAccount';
import PlayOnline from './pages/PlayOnline';
import PlayComputer from './pages/PlayComputer';
import StandardGame from './Games/StandardGame';
import StandardBotGame from './Games/StandardBotGame';
import Analysis from './pages/Analysis';
import Puzzles from './pages/Puzzles';
import RequireAuth from './utilities/RequireAuth';
import NotFound from './pages/NotFound';
import AppShell from './layout/AppShell';
import { pageTransition } from './ui/motion';

function App() {
  const location = useLocation();

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Routes location={location}>
            <Route path="/" element={<Home/>}/>
            <Route path="/play">
              <Route path="" element={<Play/>}/>
              <Route path="/play/online" element={<RequireAuth><PlayOnline/></RequireAuth>}/>
              <Route path="/play/computer" element={<PlayComputer/>}/>
              <Route path="/play/online/game" element={<RequireAuth><StandardGame/></RequireAuth>}/>
              <Route path="/play/computer/game" element={<StandardBotGame/>}/>
            </Route>
            <Route path="/analysis" element={<Analysis/>}/>
            <Route path="/puzzles" element={<Puzzles/>}/>
            <Route path="/leaderboard" element={<LeaderboardPage/>}/>
            <Route path="/friends" element={<RequireAuth><FriendsPage/></RequireAuth>}/>
            <Route path="/my-account" element={<RequireAuth><MyAccount/></RequireAuth>}/>
            <Route path="*" element={<NotFound/>}/>
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

export default App;
