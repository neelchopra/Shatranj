import React, { useCallback, useEffect, useState } from 'react';
import Friends from '../components/friends/Friends';
import Box from '@mui/material/Box/Box';
import { Button, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useAppSelector } from '../app-state/hooks';
import { fadeUp, staggerContainer } from '../ui/motion';

type UserSummary = {
    _id: string,
    username: string,
    rating: number,
    number_of_matches: number,
}

const FriendsPage = ()=>{
    const me = useAppSelector((state) => state.userPreference.user);
    const [friends, setFriends] = useState<UserSummary[]>([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSummary[]>([]);
    const [notice, setNotice] = useState('');

    const loadFriends = useCallback(() => {
        api.get('/users/friends')
            .then((res) => setFriends(res.data))
            .catch(() => setNotice('Could not load friends'));
    }, []);

    useEffect(() => { loadFriends(); }, [loadFriends]);

    const search = () => {
        if (!query.trim()) { setResults([]); return; }
        api.get('/users/search-users', { params: { q: query } })
            .then((res) => setResults(res.data))
            .catch(() => setNotice('Search failed'));
    };

    const addFriend = (friendId: string) => {
        api.post('/users/add-friend', { friend_id: friendId })
            .then(() => {
                setNotice('Friend added!');
                setResults([]);
                setQuery('');
                loadFriends();
            })
            .catch((err) => setNotice(err.response?.data?.message || 'Could not add friend'));
    };

    const friendIds = new Set(friends.map((f) => f._id));

    return(
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <Box sx={{ maxWidth: 720 }}>
                <motion.div variants={fadeUp}>
                    <Typography variant="h2" sx={{ marginBottom: '24px' }}>
                        Friends
                    </Typography>
                </motion.div>
                <motion.div variants={fadeUp}>
                    <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
                        <TextField
                            label="Search players by username"
                            variant="filled"
                            size="small"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
                            sx={{ flexGrow: 1, minWidth: 220 }}
                        />
                        <Button variant="contained" onClick={search}>Search</Button>
                        {notice && <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{notice}</Typography>}
                    </Box>
                </motion.div>

                {results.map((player) => (
                    <motion.div key={player._id} variants={fadeUp}>
                        <Friends
                            name={player.username}
                            desc={`Rating ${player.rating} · ${player.number_of_matches} games`}
                            onAdd={
                                player._id !== me?._id && !friendIds.has(player._id)
                                    ? () => addFriend(player._id)
                                    : undefined
                            }
                        />
                    </motion.div>
                ))}
                {results.length > 0 && (
                    <Typography sx={{ color: 'text.secondary', margin: '4px 0 20px 0', fontSize: '0.85rem' }}>
                        Search results above · your friends below
                    </Typography>
                )}
                {friends.length === 0 && results.length === 0 && (
                    <motion.div variants={fadeUp}>
                        <Typography sx={{ color: 'text.secondary', padding: '12px 0' }}>
                            No friends yet — search for players by username and add them.
                        </Typography>
                    </motion.div>
                )}
                {friends.map((friend) => (
                    <motion.div key={friend._id} variants={fadeUp}>
                        <Friends
                            name={friend.username}
                            desc={`Rating ${friend.rating} · ${friend.number_of_matches} games`}
                        />
                    </motion.div>
                ))}
            </Box>
        </motion.div>
    )
}
export default FriendsPage;
