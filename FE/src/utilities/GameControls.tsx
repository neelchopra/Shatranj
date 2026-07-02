import React from 'react'
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import { styled, Box, Typography, Button } from '@mui/material';
import { setWinner } from '../app-state/features/gameSlice';
import { socket } from '../socket';

const height = window.innerHeight*80*75/10000;

const OuterBox=styled(Box)(({theme})=>({
    width:'415px',
    height:`${height}px`,
    padding:'20px',
    backgroundColor:theme.palette.primary.dark,
    borderRadius:'10px',
}))

const InnerBox=styled(Box)(({theme})=>({
    width:'100%',
    height: '70%',
    backgroundColor:theme.palette.primary.light,
    borderRadius:'10px',
    padding:'15px',
    overflowY:'auto',
}))

type Props = {
    room?: string;
    isOnline: boolean;
}

const GameControls = ({ room, isOnline }: Props) => {
    const pgn = useAppSelector((state)=> state.game.gameState.pgn)
    const opponent = useAppSelector((state)=> state.game.gameState.opponent)
    const isGameOver = useAppSelector((state)=> state.game.gameState.isGameOver)
    const dispatch = useAppDispatch()

    const handleResign = ()=>{
        if (isGameOver) return;
        if (isOnline && room) {
            socket.emit('resign', { room, pgn });
        } else {
            dispatch(setWinner(opponent.color))
        }
    }

    const handleDrawOffer = ()=>{
        if (isGameOver || !isOnline || !room) return;
        socket.emit('offer_draw', { room });
    }

    return (
        <OuterBox>
            <InnerBox>
                <Typography variant='subtitle2'>{pgn}</Typography>
            </InnerBox>
            {isOnline && (
                <Button
                    variant='contained'
                    color='secondary'
                    disabled={isGameOver}
                    onClick={handleDrawOffer}
                    sx={{height:'12%',width:'100%',margin:'3% 0 0 0'}}
                >
                    <Typography variant='h2'>Offer Draw</Typography>
                </Button>
            )}
            <Button
                variant='contained'
                color='secondary'
                disabled={isGameOver}
                onClick={handleResign}
                sx={{height:'12%',width:'100%',margin:'3% 0 0 0'}}
            >
                <Typography variant='h2'>Resign</Typography>
            </Button>
        </OuterBox>
    )
}

export default GameControls
