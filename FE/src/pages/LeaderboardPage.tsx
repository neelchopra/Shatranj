import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Leaderboard, { LeaderboardPlayer } from '../components/leaderboard/Leaderboard';
import { api } from '../api';

const LeaderboardPage = ()=>{
    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/users/leaderboard')
            .then((res) => setPlayers(res.data))
            .catch(() => setError('Could not load the leaderboard'));
    }, []);

    return(
        <Box sx={{display:'flex',alignItems:'center',flexDirection:'column'}}>
            {error && <Typography sx={{color:'#f44336',margin:'20px'}}>{error}</Typography>}
            <Leaderboard players={players} />
        </Box>
    )
}
export default LeaderboardPage;
