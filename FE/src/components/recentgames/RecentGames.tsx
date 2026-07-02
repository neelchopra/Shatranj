import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import GlassCard from '../../ui/GlassCard';

export interface RecentGameProps {
    variant: string,
    me: string,
    opponent: string,
    outcome: 'win' | 'loss' | 'draw',
    color: string,
    date: string,
}

const outcomeStyles: Record<string, { color: string; background: string }> = {
    win: { color: '#34D399', background: 'rgba(52,211,153,0.14)' },
    loss: { color: '#F87171', background: 'rgba(248,113,113,0.14)' },
    draw: { color: '#94A3B8', background: 'rgba(148,163,184,0.14)' },
};

const RecentGames = (props: RecentGameProps) => {
    const style = outcomeStyles[props.outcome];
    return (
        <GlassCard
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 20px',
                marginBottom: '12px',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
        >
            <Chip
                label={props.variant}
                size="small"
                sx={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 160 }}>
                <Typography sx={{ fontWeight: 600 }}>
                    {props.me}{' '}
                    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.85rem' }}>
                        ({props.color})
                    </Box>
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    vs {props.opponent}
                </Typography>
            </Box>
            <Chip
                label={props.outcome.toUpperCase()}
                size="small"
                sx={{
                    color: style.color,
                    background: style.background,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                }}
            />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', minWidth: 80, textAlign: 'right' }}>
                {props.date}
            </Typography>
        </GlassCard>
    );
};

export default RecentGames;
