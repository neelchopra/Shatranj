import * as React from 'react';
import { Box, Avatar, Typography, useTheme } from '@mui/material';
import GlassCard from '../../ui/GlassCard';
import AnimatedNumber from '../../ui/AnimatedNumber';

interface ProfileInfoProps {
    Username: string,
    Desc: string,
    Rating: number,
    Games: number,
    PuzzleRating: number,
}

const StatTile = ({ label, value }: { label: string; value: number }) => {
    const { tokens } = useTheme();
    return (
        <Box
            sx={{
                padding: '16px 24px',
                borderRadius: '14px',
                background: tokens.glass.background,
                border: tokens.glass.border,
                minWidth: 120,
                textAlign: 'center',
            }}
        >
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </Typography>
            <Typography sx={{ fontFamily: tokens.fontMono, fontSize: '2rem', fontWeight: 700, color: 'primary.light' }}>
                <AnimatedNumber value={value} />
            </Typography>
        </Box>
    );
};

const ProfileInfo = (props: ProfileInfoProps) => {
  const { tokens } = useTheme();
  return (
    <GlassCard
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '20px', sm: '32px' },
            padding: { xs: '24px', sm: '32px' },
            flexWrap: 'wrap',
        }}
    >
        <Avatar
            sx={{
                height: { xs: 80, sm: 110 },
                width: { xs: 80, sm: 110 },
                fontSize: { xs: '2rem', sm: '2.8rem' },
                fontWeight: 700,
                background: `rgba(${tokens.accentRgb},0.16)`,
                color: 'primary.light',
                border: `2px solid rgba(${tokens.accentRgb},0.4)`,
                boxShadow: `0 0 24px rgba(${tokens.accentRgb},0.2)`,
            }}
        >
            {props.Username[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 180 }}>
            <Typography variant="h2">{props.Username}</Typography>
            <Typography sx={{ color: 'text.secondary' }}>{props.Desc}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <StatTile label="Rating" value={props.Rating} />
            <StatTile label="Games" value={props.Games} />
            <StatTile label="Puzzles" value={props.PuzzleRating} />
        </Box>
    </GlassCard>
  );
};

export default ProfileInfo;
