import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom';
import StandardBotBoard  from '../components/chessboards/StandardBotBoard';
import { Box } from '@mui/material';
import GameControls from '../utilities/GameControls';
import { useAppDispatch } from '../app-state/hooks';
import ResultModal from '../utilities/ResultModal';
import { initGame } from '../app-state/features/gameSlice';

const StandardBotGame = () => {
    const location = useLocation()
    const dispatch = useAppDispatch()
    const depth = location.state as number | null;

    useEffect(() => {
        if (!depth) return;
        dispatch(initGame({
            opponent: { name: `Stockfish (depth ${depth})`, rating: 0, color: 'black' },
        }))
    }, [dispatch, depth])

    if (!depth) return <Navigate to="/play/computer" replace />;

    return (
        <Box sx={{padding:'30px',display:'flex',justifyContent:'center',alignItems:'center'}}>
            <Box sx={{position:'relative',marginRight:'100px'}}>
                <ResultModal/>
                <StandardBotBoard
                    depth={depth}
                    color="white"
                />
            </Box>
            <GameControls isOnline={false} />
        </Box>
    )
}

export default StandardBotGame
