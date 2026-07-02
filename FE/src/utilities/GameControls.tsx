import React from 'react'
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import { Box, Typography, Button } from '@mui/material';
import { setWinner } from '../app-state/features/gameSlice';
import { socket } from '../socket';
import GlassCard from '../ui/GlassCard';
import { tokens } from '../theme';

type Props = {
    room?: string;
    isOnline: boolean;
}

const GameControls = ({ room, isOnline }: Props) => {
    const pgn = useAppSelector((state)=> state.game.gameState.pgn)
    const opponent = useAppSelector((state)=> state.game.gameState.opponent)
    const isGameOver = useAppSelector((state)=> state.game.gameState.isGameOver)
    const dispatch = useAppDispatch()

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
                sx={{
                    flexGrow: 1,
                    minHeight: '140px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    padding: '14px',
                    borderRadius: `${tokens.radius.md}px`,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '16px',
                }}
            >
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {pgn || 'No moves yet'}
                </Typography>
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
                    background: 'rgba(248,113,113,0.16)',
                    color: '#F87171',
                    boxShadow: 'none',
                    '&:hover': { background: 'rgba(248,113,113,0.26)', boxShadow: 'none' },
                }}
            >
                Resign
            </Button>
        </GlassCard>
    )
}

export default GameControls
