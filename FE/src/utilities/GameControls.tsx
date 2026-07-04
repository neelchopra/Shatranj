import React, { useEffect, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { setWinner } from '../app-state/features/gameSlice';
import { socket } from '../socket';
import GlassCard from '../ui/GlassCard';
import { pgnToPlies } from './pgnPlies';

type Props = {
    room?: string;
    isOnline: boolean;
    /** 1-based ply index currently shown on the board (ReviewBoard convention: 0 = starting position), or null when following the live game. */
    viewIndex?: number | null;
    onSelectMove?: (index: number) => void;
}

const GameControls = ({ room, isOnline, viewIndex = null, onSelectMove }: Props) => {
    const { tokens, palette } = useTheme();
    const pgn = useAppSelector((state)=> state.game.gameState.pgn)
    const opponent = useAppSelector((state)=> state.game.gameState.opponent)
    const isGameOver = useAppSelector((state)=> state.game.gameState.gameEnded)
    const dispatch = useAppDispatch()
    const listRef = useRef<HTMLDivElement>(null);

    const plies = useMemo(() => pgnToPlies(pgn), [pgn]);
    const movePairs = useMemo(() => {
        const pairs: { number: number; white?: string; black?: string }[] = [];
        for (let i = 0; i < plies.length; i += 2) {
            pairs.push({ number: i / 2 + 1, white: plies[i]?.san, black: plies[i + 1]?.san });
        }
        return pairs;
    }, [plies]);
    const lastPlyIndex = plies.length - 1;
    const isReviewing = viewIndex !== null && viewIndex !== plies.length;

    // Keeps the most recent move in view as the list grows — but not while
    // the player has deliberately scrolled back to look at an earlier move.
    useEffect(() => {
        if (isReviewing) return;
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [plies.length, isReviewing]);

    const handleResign = ()=>{
        if (isGameOver) return;
        if (isOnline && room) {
            socket.emit('resign', { room, pgn });
        } else {
            dispatch(setWinner(opponent.color))
        }
    }

    const handleDrawOffer = ()=>{
        if (isGameOver || !isOnline || !room) return;
        socket.emit('offer_draw', { room });
    }

    const moveSx = (flatIndex: number) => ({
        minWidth: '64px',
        borderRadius: '4px',
        padding: '1px 6px',
        cursor: onSelectMove ? 'pointer' : undefined,
        ...(flatIndex === lastPlyIndex && !isReviewing && {
            fontWeight: 700,
            color: 'primary.light',
            background: `rgba(${tokens.accentRgb},0.14)`,
        }),
        ...(flatIndex + 1 === viewIndex && {
            fontWeight: 700,
            color: 'primary.light',
            border: `1px solid rgba(${tokens.accentRgb},0.6)`,
        }),
        '&:hover': onSelectMove ? { background: `rgba(${tokens.accentRgb},0.1)` } : undefined,
    });

    return (
        <GlassCard
            sx={{
                width: '100%',
                maxHeight: { lg: '70vh' },
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Moves
                </Typography>
                {isReviewing && onSelectMove && (
                    <Typography
                        onClick={() => onSelectMove(plies.length)}
                        sx={{ fontSize: '0.8rem', color: 'primary.light', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                        Back to live
                    </Typography>
                )}
            </Box>
            <Box
                ref={listRef}
                sx={{
                    flexGrow: 1,
                    minHeight: '140px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    padding: '14px',
                    borderRadius: `${tokens.radius.md}px`,
                    background: tokens.inputBackground,
                    border: tokens.glass.border,
                    marginBottom: '16px',
                    fontFamily: tokens.fontMono,
                    fontSize: '0.9rem',
                }}
            >
                {movePairs.length === 0 ? (
                    <Typography sx={{ fontFamily: tokens.fontMono, fontSize: '0.9rem', color: 'text.secondary' }}>
                        No moves yet
                    </Typography>
                ) : (
                    movePairs.map((pair) => (
                        <Box key={pair.number} sx={{ display: 'flex', gap: '10px', padding: '2px 0' }}>
                            <Box sx={{ color: 'text.secondary', minWidth: '22px' }}>{pair.number}.</Box>
                            <Box sx={moveSx(pair.number * 2 - 2)} onClick={() => onSelectMove?.(pair.number * 2 - 1)}>
                                {pair.white}
                            </Box>
                            {pair.black && (
                                <Box sx={moveSx(pair.number * 2 - 1)} onClick={() => onSelectMove?.(pair.number * 2)}>
                                    {pair.black}
                                </Box>
                            )}
                        </Box>
                    ))
                )}
            </Box>
            {isOnline && (
                <Button
                    variant='outlined'
                    disabled={isGameOver}
                    onClick={handleDrawOffer}
                    sx={{ marginBottom: '10px' }}
                >
                    Offer Draw
                </Button>
            )}
            <Button
                variant='contained'
                disabled={isGameOver}
                onClick={handleResign}
                sx={{
                    background: alpha(palette.error.main, 0.16),
                    color: 'error.main',
                    boxShadow: 'none',
                    '&:hover': { background: alpha(palette.error.main, 0.26), boxShadow: 'none' },
                }}
            >
                Resign
            </Button>
        </GlassCard>
    )
}

export default GameControls
