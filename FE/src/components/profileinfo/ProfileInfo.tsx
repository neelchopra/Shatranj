import * as React from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import GlassCard from '../../ui/GlassCard';
import AnimatedNumber from '../../ui/AnimatedNumber';
import { tokens } from '../../theme';

interface ProfileInfoProps {
    Username: string,
    Desc: string,
    Rating: number,
    Games: number,
}

const StatTile = ({ label, value }: { label: string; value: number }) => (
    <Box
        sx={{
            padding: '16px 24px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 120,
            textAlign: 'center',
        }}
    >
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
        </Typography>
        <Typography sx={{ fontFamily: tokens.fontDisplay, fontSize: '2rem', fontWeight: 700, color: 'primary.light' }}>
            <AnimatedNumber value={value} />
        </Typography>
    </Box>
);

const ProfileInfo = (props: ProfileInfoProps) => {
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
                background: 'rgba(16,185,129,0.16)',
                color: 'primary.light',
                border: '2px solid rgba(16,185,129,0.4)',
                boxShadow: '0 0 24px rgba(16,185,129,0.2)',
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
        </Box>
    </GlassCard>
  );
};

export default ProfileInfo;
