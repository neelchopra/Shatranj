import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box' ;
import Typography from '@mui/material/Typography';
import RecentGames from '../components/recentgames/RecentGames';
import ProfileInfo from '../components/profileinfo/ProfileInfo';
import styled from '@emotion/styled';
import theme from '../theme';
import { api } from '../api';
import { User } from '../app-state/features/userPreferenceSlice';

type HistoryGame = {
  _id: string,
  color: string,
  opponent: { username: string, rating: number | null },
  outcome: 'win' | 'loss' | 'draw',
  variant: string,
  pgn: string,
  playedAt: string,
}

const RecentgameText=styled(Box)({
  background:`${theme.palette.primary.main}`,
  color:'white',
  height:'30px',
  width:'120px',
  padding:'5px 5px 0 10px',
  borderRadius:'10px 10px 0 0',
  fontSize:'16px',
  [theme.breakpoints.up('laptop')]: {
      fontSize:'20px',
      width:'151px',
      padding:'9px 10px 2px 10px',
  },
})

const MainBox=styled(Box)({
  height:'420px',
  width:'1200px',
  background:`${theme.palette.primary.main}`,
  justifyContent:'center',
  alignItems:'center',
  overflow:'hidden',
  overflowY:'scroll',
  borderRadius:'0 10px 10px 10px',
  padding:'0px 10px 20px 10px',
  position:'initial',

  '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      background:`${theme.palette.primary.main}`,
      borderRadius: '100px',

    },
    '&::-webkit-scrollbar-track': {
      background:`${theme.palette.primary.main}`,
      borderRadius:'30px',
      margin:'10px 0 10px 0'
    },
    [theme.breakpoints.up('laptop')]: {
      width:'1050px',
      height:'523px',
      padding:'0px 15px 30px 15px',
  },
})

const MyAccount = ()=> {
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
    <Box sx={{display:'flex',flexDirection:'column',justifyContent:'center', alignItems:'center'}}>
        {error && <Typography sx={{color:'#f44336',margin:'20px'}}>{error}</Typography>}
        <Box>
          {profile && (
            <ProfileInfo
              Username={profile.username}
              Desc={profile.email}
              Rating={profile.rating}
              Games={profile.number_of_matches}
            />
          )}
        </Box>
        <Box>

          <RecentgameText>Recent Games</RecentgameText>


            <MainBox>
            {games.length === 0 && (
              <Typography sx={{color:'white',padding:'30px'}}>
                No games yet — play an online game and it will show up here.
              </Typography>
            )}
            {games.map((game)=>(
                <RecentGames
                  key={game._id}
                  variant={game.variant}
                  me={profile?.username || 'You'}
                  opponent={game.opponent.username}
                  outcome={game.outcome}
                  color={game.color}
                  date={new Date(game.playedAt).toLocaleDateString()}
                />
            ))}
            </MainBox>

        </Box>
    </Box>

  )
}

export default MyAccount
