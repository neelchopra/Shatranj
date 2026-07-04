import React from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import GlassCard from '../../ui/GlassCard';

export interface RecentGameProps {
    variant: string,
    me: string,
    opponent: string,
    outcome: 'win' | 'loss' | 'draw',
    color: string,
    date: string,
}

const RecentGames = (props: RecentGameProps) => {
    const { tokens, palette } = useTheme();
    const outcomeStyles: Record<string, { color: string; background: string }> = {
        win: { color: palette.success.main, background: alpha(palette.success.main, 0.14) },
        loss: { color: palette.error.main, background: alpha(palette.error.main, 0.14) },
        draw: { color: palette.text.secondary, background: alpha(palette.text.secondary, 0.14) },
    };
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
                    background: tokens.inputBackground,
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
