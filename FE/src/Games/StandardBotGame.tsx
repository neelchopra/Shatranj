import React, { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom';
import StandardBotBoard  from '../components/chessboards/StandardBotBoard';
import { Box } from '@mui/material';
import GameControls from '../utilities/GameControls';
import { useAppDispatch } from '../app-state/hooks';
import ResultModal from '../utilities/ResultModal';
import { initGame } from '../app-state/features/gameSlice';
import useBoardWidth from '../hooks/useBoardWidth';

const StandardBotGame = () => {
    const location = useLocation()
    const dispatch = useAppDispatch()
    const rating = (location.state as { rating?: number } | null)?.rating ?? null;
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const boardWidth = useBoardWidth(boardContainerRef);

    useEffect(() => {
        if (!rating) return;
        dispatch(initGame({
            opponent: { name: `Stockfish (~${rating})`, rating, color: 'black' },
        }))
    }, [dispatch, rating])

    if (!rating) return <Navigate to="/play/computer" replace />;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 340px' },
                gap: 3,
                alignItems: 'start',
            }}
        >
            <Box ref={boardContainerRef} sx={{ display: 'flex', justifyContent: 'center' }}>
                {boardWidth > 0 && (
                    <Box
                        sx={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            touchAction: 'manipulation',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                        }}
                    >
                        <StandardBotBoard rating={rating} color="white" boardWidth={boardWidth} />
                    </Box>
                )}
            </Box>
            <GameControls isOnline={false} />
            <ResultModal myColor="white" />
        </Box>
    )
}

export default StandardBotGame
