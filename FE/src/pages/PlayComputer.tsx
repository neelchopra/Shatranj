import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { Box, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { fadeUp, staggerContainer } from '../ui/motion';

const difficulties = [
    { label: 'Easy', value: 2, piece: '♙', desc: 'Casual play — the engine looks 2 moves ahead.' },
    { label: 'Medium', value: 5, piece: '♘', desc: 'A solid challenge for club-level players.' },
    { label: 'Hard', value: 8, piece: '♕', desc: 'Deep searches. Bring your best preparation.' },
];

const PlayComputer = () => {
    const [depth, setDepth] = useState(2);

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.div variants={fadeUp}>
                <Typography variant="h2" sx={{ marginBottom: '32px' }}>
                    Play the computer
                </Typography>
            </motion.div>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 3,
                    maxWidth: 900,
                    marginBottom: '32px',
                }}
            >
                {difficulties.map((difficulty) => {
                    const selected = depth === difficulty.value;
                    return (
                        <motion.div key={difficulty.value} variants={fadeUp}>
                            <GlassCard
                                hover
                                onClick={() => setDepth(difficulty.value)}
                                sx={{
                                    padding: '28px',
                                    height: '100%',
                                    textAlign: 'center',
                                    ...(selected && {
                                        borderColor: 'rgba(16,185,129,0.55)',
                                        boxShadow: '0 0 0 1px rgba(16,185,129,0.35), 0 0 24px rgba(16,185,129,0.25)',
                                        background: 'rgba(16,185,129,0.07)',
                                    }),
                                }}
                            >
                                <Typography sx={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: '12px' }}>
                                    {difficulty.piece}
                                </Typography>
                                <Typography variant="h3" sx={{ marginBottom: '8px', color: selected ? 'primary.light' : 'text.primary' }}>
                                    {difficulty.label}
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                                    {difficulty.desc}
                                </Typography>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </Box>
            <motion.div variants={fadeUp}>
                <NavLink to='/play/computer/game' state={depth} style={{ textDecoration: 'none' }}>
                    <Button variant='contained' size='large' sx={{ padding: '12px 40px', fontSize: '1.05rem' }}>
                        Play
                    </Button>
                </NavLink>
            </motion.div>
        </motion.div>
    );
};

export default PlayComputer;
