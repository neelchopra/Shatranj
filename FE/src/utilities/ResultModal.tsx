import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app-state/hooks'
import { Box, Typography, Button, Dialog, Grow } from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import SentimentDissatisfiedOutlinedIcon from '@mui/icons-material/SentimentDissatisfiedOutlined';
import { TransitionProps } from '@mui/material/transitions';
import { closeModal } from '../app-state/features/gameSlice';
import AnimatedNumber from '../ui/AnimatedNumber';
import { socket } from '../socket';
import { playGameEndSound } from './sounds';

const GrowTransition = React.forwardRef(function GrowTransition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Grow ref={ref} {...props} />;
});

export type RatingUpdate = { rating: number; delta: number } | null;

type Props = {
    ratingUpdate?: RatingUpdate;
    myColor?: string;
    room?: string;
}

const ResultModal = ({ ratingUpdate, myColor, room }: Props) => {
    const dispatch  = useAppDispatch();
    const open = useAppSelector((state)=> state.game.gameState.isGameOver)
    const result = useAppSelector((state)=> state.game.gameState.result)
    const [rematchState, setRematchState] = useState<'idle' | 'waiting' | 'offered'>('idle');

    const handleClose = () => {
        dispatch(closeModal())
    }

    const canRematch = !!room && result !== 'abort';

    useEffect(() => {
        if (!canRematch) return;
        const onOffered = () => setRematchState('offered');
        const onWaiting = () => setRematchState('waiting');
        socket.on('rematch_offered', onOffered);
        socket.on('rematch_waiting', onWaiting);
        return () => {
            socket.off('rematch_offered', onOffered);
            socket.off('rematch_waiting', onWaiting);
        };
    }, [canRematch]);

    const requestRematch = () => {
        if (!room) return;
        socket.emit('request_rematch', { room });
        if (rematchState !== 'offered') setRematchState('waiting');
    };

    const isDraw = result === 'draw' || result === 'abort';
    const won = !isDraw && myColor && result === myColor;

    useEffect(() => {
        if (!open || !result) return;
        playGameEndSound(isDraw ? 'draw' : won ? 'win' : 'loss');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const icon = isDraw
        ? <HandshakeOutlinedIcon sx={{ fontSize: 40 }} />
        : won
            ? <EmojiEventsOutlinedIcon sx={{ fontSize: 40 }} />
            : <SentimentDissatisfiedOutlinedIcon sx={{ fontSize: 40 }} />;

    const resultText =
        result === 'white' ? 'White wins' :
        result === 'black' ? 'Black wins' :
        result === 'draw' ? 'Draw' :
        result === 'abort' ? 'Game aborted' : result;

    return (
        <Dialog open={open} onClose={handleClose} TransitionComponent={GrowTransition}>
            <Box sx={{ padding: '40px', textAlign: 'center', minWidth: 280 }}>
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        background: isDraw
                            ? 'rgba(148,163,184,0.15)'
                            : won
                                ? 'rgba(52,211,153,0.15)'
                                : 'rgba(248,113,113,0.15)',
                        color: isDraw ? 'text.secondary' : won ? 'success.main' : 'error.main',
                    }}
                >
                    {icon}
                </Box>
                <Typography variant='h2' sx={{ marginBottom: '8px' }}>
                    {resultText}
                </Typography>
                {ratingUpdate && (
                    <Typography sx={{ color: 'text.secondary', marginBottom: '24px' }}>
                        New rating <AnimatedNumber value={ratingUpdate.rating} />{' '}
                        <Box
                            component="span"
                            sx={{ color: ratingUpdate.delta >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}
                        >
                            ({ratingUpdate.delta >= 0 ? '+' : ''}{ratingUpdate.delta})
                        </Box>
                    </Typography>
                )}
                <Box sx={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: ratingUpdate ? 0 : '16px' }}>
                    {canRematch && (
                        <Button
                            onClick={requestRematch}
                            variant={rematchState === 'offered' ? 'contained' : 'outlined'}
                            disabled={rematchState === 'waiting'}
                        >
                            {rematchState === 'waiting' ? 'Waiting for opponent…' : rematchState === 'offered' ? 'Accept rematch' : 'Rematch'}
                        </Button>
                    )}
                    <Button onClick={handleClose} variant='contained'>
                        Close
                    </Button>
                </Box>
            </Box>
        </Dialog>
    )
    }

export default ResultModal
