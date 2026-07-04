import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom';
import StandardBotBoard  from '../components/chessboards/StandardBotBoard';
import ReviewBoard from '../components/chessboards/ReviewBoard';
import { Box, useTheme } from '@mui/material';
import GameControls from '../utilities/GameControls';
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import ResultModal from '../utilities/ResultModal';
import { initGame } from '../app-state/features/gameSlice';
import useBoardWidth from '../hooks/useBoardWidth';
import { pgnToPlies } from '../utilities/pgnPlies';

const StandardBotGame = () => {
    const { tokens } = useTheme();
    const location = useLocation()
    const dispatch = useAppDispatch()
    const rating = (location.state as { rating?: number } | null)?.rating ?? null;
    const isGameOver = useAppSelector((state) => state.game.gameState.gameEnded);
    const pgn = useAppSelector((state) => state.game.gameState.pgn);
    const opponent = useAppSelector((state) => state.game.gameState.opponent);
    const room = useAppSelector((state) => state.game.gameState.room);
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const boardWidth = useBoardWidth(boardContainerRef);
    const [viewIndex, setViewIndex] = useState<number | null>(null);
    const plies = pgnToPlies(pgn);

    useEffect(() => {
        if (!rating) return;
        // Leaving mid-game (back button, a nav link) and coming back to the
        // same difficulty resumes rather than restarts — PlayComputer offers
        // this as "Resume game" when it detects an unfinished one, so this
        // effect must not stomp the game it's about to resume.
        const alreadyThisGame = !isGameOver && !room && opponent.name === `Stockfish (~${rating})`;
        if (alreadyThisGame) return;
        dispatch(initGame({
            opponent: { name: `Stockfish (~${rating})`, rating, color: 'black' },
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, rating])

    if (!rating) return <Navigate to="/play/computer" replace />;

    const reviewPosition =
        viewIndex === null
            ? undefined
            : viewIndex === 0
                ? plies[0]?.before
                : plies[viewIndex - 1]?.after;

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
                            border: tokens.glass.border,
                            boxShadow: tokens.glowSoft,
                        }}
                    >
                        {isGameOver ? (
                            <ReviewBoard plies={plies} boardWidth={boardWidth} orientation="white" />
                        ) : (
                            <StandardBotBoard
                                rating={rating}
                                color="white"
                                boardWidth={boardWidth}
                                reviewPosition={reviewPosition}
                            />
                        )}
                    </Box>
                )}
            </Box>
            <GameControls
                isOnline={false}
                viewIndex={viewIndex}
                onSelectMove={(index) => setViewIndex(index === plies.length ? null : index)}
            />
            <ResultModal myColor="white" />
        </Box>
    )
}

export default StandardBotGame
