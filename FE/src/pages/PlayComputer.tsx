import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Slider, TextField, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { fadeUp, staggerContainer } from '../ui/motion';
import { clampRating, MAX_BOT_RATING, MIN_BOT_RATING } from '../utilities/botStrength';

const presets = [
    { label: 'Easy', rating: 800, piece: '♙', desc: 'Relaxed play around 800 — great for learning.' },
    { label: 'Medium', rating: 1500, piece: '♘', desc: 'A solid ~1500 club-level challenge.' },
    { label: 'Hard', rating: 2200, piece: '♕', desc: 'Around 2200. Bring your best preparation.' },
];

const PlayComputer = () => {
    const { tokens } = useTheme();
    const navigate = useNavigate();
    const [rating, setRating] = useState(800);
    const [customOpen, setCustomOpen] = useState(false);
    const [customRating, setCustomRating] = useState(1200);
    const isPreset = presets.some((p) => p.rating === rating);

    const startGame = () => navigate('/play/computer/game', { state: { rating } });

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
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    maxWidth: 1100,
                    marginBottom: '32px',
                }}
            >
                {presets.map((preset) => {
                    const selected = rating === preset.rating;
                    return (
                        <motion.div key={preset.rating} variants={fadeUp}>
                            <GlassCard
                                hover
                                onClick={() => setRating(preset.rating)}
                                sx={{
                                    padding: '28px',
                                    height: '100%',
                                    textAlign: 'center',
                                    ...(selected && {
                                        borderColor: `rgba(${tokens.accentRgb},0.55)`,
                                        boxShadow: tokens.glowAccent,
                                        background: `rgba(${tokens.accentRgb},0.07)`,
                                    }),
                                }}
                            >
                                <Typography sx={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: '12px' }}>
                                    {preset.piece}
                                </Typography>
                                <Typography variant="h3" sx={{ marginBottom: '8px', color: selected ? 'primary.light' : 'text.primary' }}>
                                    {preset.label}
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                                    {preset.desc}
                                </Typography>
                            </GlassCard>
                        </motion.div>
                    );
                })}
                <motion.div variants={fadeUp}>
                    <GlassCard
                        hover
                        onClick={() => { setCustomRating(isPreset ? 1200 : rating); setCustomOpen(true); }}
                        sx={{
                            padding: '28px',
                            height: '100%',
                            textAlign: 'center',
                            ...(!isPreset && {
                                borderColor: `rgba(${tokens.accentRgb},0.55)`,
                                boxShadow: tokens.glowAccent,
                                background: `rgba(${tokens.accentRgb},0.07)`,
                            }),
                        }}
                    >
                        <Typography sx={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: '12px' }}>♔</Typography>
                        <Typography variant="h3" sx={{ marginBottom: '8px', color: !isPreset ? 'primary.light' : 'text.primary' }}>
                            {isPreset ? 'Custom' : `Custom · ${rating}`}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                            Pick any strength from {MIN_BOT_RATING} to {MAX_BOT_RATING}.
                        </Typography>
                    </GlassCard>
                </motion.div>
            </Box>
            <motion.div variants={fadeUp}>
                <Button variant='contained' size='large' onClick={startGame} sx={{ padding: '12px 40px', fontSize: '1.05rem' }}>
                    Play at ~{rating}
                </Button>
            </motion.div>

            <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Custom bot strength</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', marginBottom: '24px', fontSize: '0.9rem' }}>
                        The bot plays at roughly this rating.
                    </Typography>
                    <Slider
                        value={customRating}
                        min={MIN_BOT_RATING}
                        max={MAX_BOT_RATING}
                        step={50}
                        valueLabelDisplay="on"
                        onChange={(_, value) => setCustomRating(value as number)}
                        sx={{ marginTop: '20px' }}
                    />
                    <TextField
                        label="Rating"
                        type="number"
                        size="small"
                        fullWidth
                        value={customRating}
                        onChange={(e) => setCustomRating(Number(e.target.value) || MIN_BOT_RATING)}
                        inputProps={{ min: MIN_BOT_RATING, max: MAX_BOT_RATING, step: 50 }}
                        sx={{ marginTop: '16px' }}
                    />
                </DialogContent>
                <DialogActions sx={{ padding: '0 24px 20px' }}>
                    <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => { setRating(clampRating(customRating)); setCustomOpen(false); }}
                    >
                        Select
                    </Button>
                </DialogActions>
            </Dialog>
        </motion.div>
    );
};

export default PlayComputer;
