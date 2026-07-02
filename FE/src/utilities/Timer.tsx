import React, { useEffect } from 'react'
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useTimer } from 'react-timer-hook';
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import { setWinner } from '../app-state/features/gameSlice';
import { tokens } from '../theme';

interface timerProps {
    avatar: any,
    name:string,
    rating:number,
    expiryTimestamp: Date,
    player:string,
}

const pad = (n: number) => String(n).padStart(2, '0');

const Timer = (props:timerProps) => {
    const dispatch = useAppDispatch()
    const {name,rating,expiryTimestamp,player}=props;
    // Flag fall: the player whose clock ran out LOSES — the other side wins.
    const timer = useTimer({ expiryTimestamp, autoStart:true, onExpire: () => {dispatch(setWinner(player === 'white' ? 'black' : 'white'))} });
    const isActive = useAppSelector((state)=>
        player==='white' ? state.game.gameState.isWhiteTimerRunning : state.game.gameState.isBlackTimerRunning
    )

    useEffect(()=>{
        if (isActive){
            timer.resume();
        }
        else{
            timer.pause()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[isActive])

    return (
        <motion.div
            animate={{ scale: isActive ? 1.01 : 1, opacity: isActive ? 1 : 0.6 }}
            transition={{ duration: 0.2 }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    margin: '10px 0',
                    borderRadius: `${tokens.radius.md}px`,
                    background: tokens.glass.background,
                    border: isActive ? '1px solid rgba(16,185,129,0.5)' : tokens.glass.border,
                    backdropFilter: tokens.glass.blur,
                    boxShadow: isActive ? tokens.glowAccent : 'none',
                    transition: 'border-color .2s ease, box-shadow .2s ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            background: 'rgba(16,185,129,0.16)',
                            color: 'primary.light',
                            fontWeight: 700,
                        }}
                    >
                        {name[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                        </Typography>
                        {rating > 0 && (
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                {rating}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box
                    sx={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: tokens.fontDisplay,
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            fontVariantNumeric: 'tabular-nums',
                            color: isActive ? 'primary.light' : 'text.primary',
                        }}
                    >
                        {pad(timer.minutes)}:{pad(timer.seconds)}
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    )
    }

export default Timer
