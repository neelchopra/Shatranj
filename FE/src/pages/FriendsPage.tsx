import React, { useCallback, useEffect, useState } from 'react';
import Friends from '../components/friends/Friends';
import Box from '@mui/material/Box/Box';
import { Button, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAppSelector } from '../app-state/hooks';
import { fadeUp, staggerContainer } from '../ui/motion';

type UserSummary = {
    _id: string,
    username: string,
    rating: number,
    number_of_matches: number,
    online?: boolean,
}

type FriendRequest = {
    requestId: string,
    user: { _id: string, username: string, rating: number },
}

const FriendsPage = ()=>{
    const me = useAppSelector((state) => state.userPreference.user);
    const navigate = useNavigate();
    const [friends, setFriends] = useState<UserSummary[]>([]);
    const [incoming, setIncoming] = useState<FriendRequest[]>([]);
    const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSummary[]>([]);
    const [notice, setNotice] = useState('');

    const loadFriends = useCallback(() => {
        api.get('/users/friends')
            .then((res) => setFriends(res.data))
            .catch(() => setNotice('Could not load friends'));
    }, []);

    const loadRequests = useCallback(() => {
        api.get('/users/friend-requests')
            .then((res) => {
                setIncoming(res.data.incoming);
                setOutgoing(res.data.outgoing);
            })
            .catch(() => setNotice('Could not load friend requests'));
    }, []);

    useEffect(() => { loadFriends(); loadRequests(); }, [loadFriends, loadRequests]);

    // Refresh live if a request arrives/gets accepted while this page is open.
    useEffect(() => {
        const refresh = () => { loadFriends(); loadRequests(); };
        socket.on('friend_request_received', refresh);
        socket.on('friend_request_accepted', refresh);
        return () => {
            socket.off('friend_request_received', refresh);
            socket.off('friend_request_accepted', refresh);
        };
    }, [loadFriends, loadRequests]);

    const search = () => {
        if (!query.trim()) { setResults([]); return; }
        api.get('/users/search-users', { params: { q: query } })
            .then((res) => setResults(res.data))
            .catch(() => setNotice('Search failed'));
    };

    const sendRequest = (recipientId: string) => {
        api.post('/users/friend-requests', { recipient_id: recipientId })
            .then(() => {
                setNotice('Friend request sent');
                loadRequests();
            })
            .catch((err) => setNotice(err.response?.data?.message || 'Could not send request'));
    };

    const acceptRequest = (requestId: string) => {
        api.post(`/users/friend-requests/${requestId}/accept`)
            .then(() => { loadFriends(); loadRequests(); })
            .catch(() => setNotice('Could not accept request'));
    };

    const declineRequest = (requestId: string) => {
        api.post(`/users/friend-requests/${requestId}/decline`)
            .then(() => loadRequests())
            .catch(() => setNotice('Could not decline request'));
    };

    const cancelRequest = (requestId: string) => {
        api.delete(`/users/friend-requests/${requestId}`)
            .then(() => loadRequests())
            .catch(() => setNotice('Could not cancel request'));
    };

    const challenge = (friendId: string) => {
        socket.connect();
        socket.emit('challenge_friend', { friendUserId: friendId, time: 10 });
        setNotice('Challenge sent. Waiting for them to accept…');
        navigate('/play/online');
    };

    const friendIds = new Set(friends.map((f) => f._id));
    const outgoingIds = new Set(outgoing.map((r) => r.user._id));

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

                {results.length > 0 && (
                    <>
                        <motion.div variants={fadeUp}>
                            <Typography variant="h3" sx={{ marginBottom: '12px' }}>Search results</Typography>
                        </motion.div>
                        {results.map((player) => {
                            const isMe = player._id === me?._id;
                            const isFriend = friendIds.has(player._id);
                            const alreadySent = outgoingIds.has(player._id);
                            return (
                                <motion.div key={player._id} variants={fadeUp}>
                                    <Friends
                                        name={player.username}
                                        desc={`Rating ${player.rating} · ${player.number_of_matches} games`}
                                        actions={isMe ? [] : [{
                                            label: isFriend ? 'Already friends' : alreadySent ? 'Requested' : 'Send request',
                                            disabled: isFriend || alreadySent,
                                            onClick: () => sendRequest(player._id),
                                        }]}
                                    />
                                </motion.div>
                            );
                        })}
                    </>
                )}

                {incoming.length > 0 && (
                    <>
                        <motion.div variants={fadeUp}>
                            <Typography variant="h3" sx={{ margin: '24px 0 12px 0' }}>Requests</Typography>
                        </motion.div>
                        {incoming.map((req) => (
                            <motion.div key={req.requestId} variants={fadeUp}>
                                <Friends
                                    name={req.user.username}
                                    desc={`Rating ${req.user.rating} · wants to be friends`}
                                    actions={[
                                        { label: 'Accept', variant: 'contained', onClick: () => acceptRequest(req.requestId) },
                                        { label: 'Decline', color: 'error', onClick: () => declineRequest(req.requestId) },
                                    ]}
                                />
                            </motion.div>
                        ))}
                    </>
                )}

                {outgoing.length > 0 && (
                    <>
                        <motion.div variants={fadeUp}>
                            <Typography variant="h3" sx={{ margin: '24px 0 12px 0' }}>Sent requests</Typography>
                        </motion.div>
                        {outgoing.map((req) => (
                            <motion.div key={req.requestId} variants={fadeUp}>
                                <Friends
                                    name={req.user.username}
                                    desc="Waiting for them to respond"
                                    actions={[{ label: 'Cancel', color: 'error', onClick: () => cancelRequest(req.requestId) }]}
                                />
                            </motion.div>
                        ))}
                    </>
                )}

                <motion.div variants={fadeUp}>
                    <Typography variant="h3" sx={{ margin: '24px 0 12px 0' }}>Your friends</Typography>
                </motion.div>
                {friends.length === 0 && (
                    <motion.div variants={fadeUp}>
                        <Typography sx={{ color: 'text.secondary', padding: '12px 0' }}>
                            No friends yet. Search for players by username and send a request.
                        </Typography>
                    </motion.div>
                )}
                {friends.map((friend) => (
                    <motion.div key={friend._id} variants={fadeUp}>
                        <Friends
                            name={friend.username}
                            desc={`Rating ${friend.rating} · ${friend.number_of_matches} games`}
                            online={friend.online}
                            actions={friend.online ? [{ label: 'Challenge', variant: 'contained', onClick: () => challenge(friend._id) }] : []}
                        />
                    </motion.div>
                ))}
            </Box>
        </motion.div>
    )
}
export default FriendsPage;
