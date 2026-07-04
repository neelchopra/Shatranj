import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import Leaderboard, { LeaderboardPlayer, PuzzleLeaderboardPlayer } from '../components/leaderboard/Leaderboard';
import SegmentedControl from '../ui/SegmentedControl';
import { api } from '../api';
import { fadeUp } from '../ui/motion';

type Tab = 'games' | 'puzzles';

const LeaderboardPage = ()=>{
    const [tab, setTab] = useState<Tab>('games');
    const [gamePlayers, setGamePlayers] = useState<LeaderboardPlayer[] | null>(null);
    const [puzzlePlayers, setPuzzlePlayers] = useState<PuzzleLeaderboardPlayer[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tab === 'games' && gamePlayers === null) {
            api.get('/users/leaderboard')
                .then((res) => setGamePlayers(res.data))
                .catch(() => setError('Could not load the leaderboard'));
        }
        if (tab === 'puzzles' && puzzlePlayers === null) {
            api.get('/users/puzzle-leaderboard')
                .then((res) => setPuzzlePlayers(res.data))
                .catch(() => setError('Could not load the puzzle leaderboard'));
        }
    }, [tab, gamePlayers, puzzlePlayers]);

    const players = tab === 'games' ? (gamePlayers ?? []) : (puzzlePlayers ?? []);

    return(
        <motion.div variants={fadeUp} initial="initial" animate="animate">
            <Box sx={{display:'flex',alignItems:'center',flexDirection:'column'}}>
                <Box sx={{ marginBottom: '20px' }}>
                    <SegmentedControl<Tab>
                        options={[{ label: 'Games', value: 'games' }, { label: 'Puzzles', value: 'puzzles' }]}
                        value={tab}
                        onChange={setTab}
                        layoutId="leaderboard-tab"
                    />
                </Box>
                {error && <Typography sx={{color:'error.main',marginBottom:'20px'}}>{error}</Typography>}
                <Leaderboard players={players} variant={tab} />
            </Box>
        </motion.div>
    )
}
export default LeaderboardPage;
