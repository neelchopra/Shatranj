import React from 'react';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GlassCard from '../ui/GlassCard';
import { fadeUp, staggerContainer } from '../ui/motion';

const modes = [
    {
        title: 'Online',
        desc: 'Play a rated game against a random opponent, or create a private room and invite a friend with a code. 5, 10 and 15 minute time controls.',
        to: '/play/online',
        icon: <PublicOutlinedIcon sx={{ fontSize: 30 }} />,
    },
    {
        title: 'vs Computer',
        desc: 'Practice against Stockfish at three difficulty levels. No account needed — jump straight into a game.',
        to: '/play/computer',
        icon: <SmartToyOutlinedIcon sx={{ fontSize: 30 }} />,
    },
];

const Play = () => {
    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.div variants={fadeUp}>
                <Typography variant="h2" sx={{ marginBottom: '32px' }}>
                    Choose your game
                </Typography>
            </motion.div>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    maxWidth: 900,
                }}
            >
                {modes.map((mode) => (
                    <motion.div key={mode.to} variants={fadeUp}>
                        <NavLink to={mode.to} style={{ textDecoration: 'none' }}>
                            <GlassCard hover sx={{ padding: '32px', height: '100%' }}>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(16,185,129,0.12)',
                                        color: 'primary.light',
                                        marginBottom: '20px',
                                    }}
                                >
                                    {mode.icon}
                                </Box>
                                <Typography variant="h3" sx={{ marginBottom: '12px' }}>
                                    {mode.title}
                                </Typography>
                                <Typography
                                    sx={{ color: 'text.secondary', lineHeight: 1.6, marginBottom: '20px' }}
                                >
                                    {mode.desc}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'primary.light',
                                        fontWeight: 600,
                                    }}
                                >
                                    Play <ArrowForwardIcon sx={{ fontSize: 18 }} />
                                </Box>
                            </GlassCard>
                        </NavLink>
                    </motion.div>
                ))}
            </Box>
        </motion.div>
    );
};

export default Play;
