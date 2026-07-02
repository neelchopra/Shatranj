import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import RecentGames from '../components/recentgames/RecentGames';
import ProfileInfo from '../components/profileinfo/ProfileInfo';
import { api } from '../api';
import { User } from '../app-state/features/userPreferenceSlice';
import { fadeUp, staggerContainer } from '../ui/motion';

type HistoryGame = {
  _id: string,
  color: string,
  opponent: { username: string, rating: number | null },
  outcome: 'win' | 'loss' | 'draw',
  variant: string,
  pgn: string,
  playedAt: string,
}

const MyAccount = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [games, setGames] = useState<HistoryGame[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me')
      .then((res) => setProfile(res.data))
      .catch(() => setError('Could not load your profile'));
    api.get('/games/history')
      .then((res) => setGames(res.data))
      .catch(() => setError('Could not load your games'));
  }, []);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate">
      <Box sx={{ maxWidth: 820 }}>
        {error && (
          <Typography sx={{ color: 'error.main', marginBottom: '20px' }}>{error}</Typography>
        )}
        {profile && (
          <motion.div variants={fadeUp}>
            <ProfileInfo
              Username={profile.username}
              Desc={profile.email}
              Rating={profile.rating}
              Games={profile.number_of_matches}
            />
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <Typography variant="h3" sx={{ margin: '36px 0 18px 0' }}>
            Recent games
          </Typography>
        </motion.div>

        {games.length === 0 && (
          <motion.div variants={fadeUp}>
            <Typography sx={{ color: 'text.secondary' }}>
              No games yet — play an online game and it will show up here.
            </Typography>
          </motion.div>
        )}
        {games.map((game) => (
          <motion.div key={game._id} variants={fadeUp}>
            <RecentGames
              variant={game.variant}
              me={profile?.username || 'You'}
              opponent={game.opponent.username}
              outcome={game.outcome}
              color={game.color}
              date={new Date(game.playedAt).toLocaleDateString()}
            />
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
};

export default MyAccount;
