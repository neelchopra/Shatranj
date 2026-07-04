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
}

const GameControls = ({ room, isOnline }: Props) => {
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

    // Keeps the most recent move in view as the list grows.
    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [plies.length]);

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

    const moveSx = (index: number) => ({
        minWidth: '64px',
        borderRadius: '4px',
        padding: '1px 6px',
        ...(index === lastPlyIndex && {
            fontWeight: 700,
            color: 'primary.light',
            background: `rgba(${tokens.accentRgb},0.14)`,
        }),
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
            <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Moves
            </Typography>
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
                            <Box sx={moveSx(pair.number * 2 - 2)}>{pair.white}</Box>
                            {pair.black && <Box sx={moveSx(pair.number * 2 - 1)}>{pair.black}</Box>}
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
