import React, { useCallback, useEffect, useState } from 'react';
import Friends from '../components/friends/Friends'
import Box from '@mui/material/Box/Box';
import theme from '../theme';
import styled from '@emotion/styled';
import { Button, TextField, Typography } from '@mui/material';
import { api } from '../api';
import { useAppSelector } from '../app-state/hooks';

type UserSummary = {
    _id: string,
    username: string,
    rating: number,
    number_of_matches: number,
}

const OuterBox = styled(Box)({
    borderRadius: "0 10px 10px 10px",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: 'stretch',
    backgroundColor:`${theme.palette.primary.main}`,
    position:'relative',
    width: "1000px",
    height:'600px',
    padding: "20px 20px 0px 30px",
    margin:'90px 0 0 0',
    flexDirection:'column',

    [theme.breakpoints.up('xl')]: {
        width: "1078px",
        height:'741px',
    },
  });

const HeaderBox = styled(Box)({
    top:'-35px',
    height:'35px',
    position:'absolute',
    backgroundColor:`${theme.palette.primary.main}`,
    width:'120px',
    borderRadius:'10px 10px 0 0 ',
    left:'0px',
    display: "flex",
    justifyContent: "center",
    alignItems: 'center',
    [theme.breakpoints.up('xl')]: {
        width: "150px",
    },
})
const HeaderText =styled(Typography)({
    fontSize:'19px',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    color:'white',
})
const ScrollBox =styled(Box)({
  width:'100%',
  overflowY:'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
          },
  '&::-webkit-scrollbar-thumb': {
    background:`${theme.palette.primary.light}`,
    borderRadius: '100px',
  },
})

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
        <Box sx={{display:'flex',alignItems:'center',flexDirection:'column'}}>
        <OuterBox>
            <HeaderBox>
               <HeaderText>Friends</HeaderText>
            </HeaderBox>

            <Box sx={{display:'flex',gap:'12px',alignItems:'center',margin:'0 0 20px 0'}}>
                <TextField
                    label="Search players by username"
                    variant="filled"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
                    sx={{minWidth:'320px'}}
                />
                <Button color="secondary" variant="contained" onClick={search}>Search</Button>
                {notice && <Typography sx={{color:'white',opacity:0.8}}>{notice}</Typography>}
            </Box>

            <ScrollBox>
                {results.map((player) => (
                    <Friends
                        key={player._id}
                        name={player.username}
                        desc={`Rating: ${player.rating} · ${player.number_of_matches} games`}
                        onAdd={
                            player._id !== me?._id && !friendIds.has(player._id)
                                ? () => addFriend(player._id)
                                : undefined
                        }
                    />
                ))}
                {results.length > 0 && (
                    <Typography sx={{color:'white',opacity:0.6,margin:'0 0 20px 0'}}>
                        — search results above, your friends below —
                    </Typography>
                )}
                {friends.length === 0 && results.length === 0 && (
                    <Typography sx={{color:'white',opacity:0.8,padding:'20px'}}>
                        No friends yet — search for players by username and add them.
                    </Typography>
                )}
                {friends.map((friend) => (
                    <Friends
                        key={friend._id}
                        name={friend.username}
                        desc={`Rating: ${friend.rating} · ${friend.number_of_matches} games`}
                    />
                ))}
            </ScrollBox>

        </OuterBox>
    </Box>
    )
}
export default FriendsPage;
