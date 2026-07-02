import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import Leaderboard, { LeaderboardPlayer } from '../components/leaderboard/Leaderboard';
import { api } from '../api';
import { fadeUp } from '../ui/motion';

const LeaderboardPage = ()=>{
    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/users/leaderboard')
            .then((res) => setPlayers(res.data))
            .catch(() => setError('Could not load the leaderboard'));
    }, []);

    return(
        <motion.div variants={fadeUp} initial="initial" animate="animate">
            <Box sx={{display:'flex',alignItems:'center',flexDirection:'column'}}>
                {error && <Typography sx={{color:'error.main',marginBottom:'20px'}}>{error}</Typography>}
                <Leaderboard players={players} />
            </Box>
        </motion.div>
    )
}
export default LeaderboardPage;
