import React from 'react';
import Box from '@mui/material/Box/Box';
import theme from '../../theme';
import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';

export interface RecentGameProps {
    variant: string,
    me: string,
    opponent: string,
    outcome: 'win' | 'loss' | 'draw',
    color: string,
    date: string,
}

const StyledGameBox =styled(Box)({
    height:'80px',
    background:`${theme.palette.primary.light}`,
    margin:'20px  0 0 10px',
    borderRadius:'10px',
    display:'block',
    [theme.breakpoints.up('laptop')]: {
        height:'96px',
        margin:'30px 15px 0px 15px',
    },
})

const Gameformat=styled(Box)({
    padding:'25px 0 0 0',
    width:'150px',
    [theme.breakpoints.up('laptop')]: {
        padding:'38px 0 0 0',
        width:'200px',
    },
})

const Playertext=styled(Box)({
    padding:'5px 0 0 0px',
    width:'250px',
    [theme.breakpoints.up('laptop')]: {
        padding:'16px 0 0 0',
        width:'300px',
    },
})

const Outcometext=styled(Box)({
    padding:'25px 0 0 0',
    width:'150px',
    [theme.breakpoints.up('laptop')]: {
        padding:'38px 0 0 0',
        width:'200px',
    },
})

const Datetext=styled(Box)({
    padding:'25px',
    width:'200px',
    [theme.breakpoints.up('laptop')]: {
        padding:'38px 0 0 0',
        width:'250px',
    },
})
const Rowtext=styled(Typography)({
    display:'flex',
    fontSize:'20px',
    justifyContent:'center',
    alignItems:'center',
})

const outcomeColor = (outcome: string) =>
    outcome === 'win' ? '#66bb6a' : outcome === 'loss' ? '#f44336' : '#9e9e9e';

const RecentGames=(props:RecentGameProps)=>{
    return(
        <StyledGameBox>

        <Box sx={{display:'inline-flex',color:'white'}}>

            <Gameformat><Rowtext>{props.variant}</Rowtext></Gameformat>
            <Box>
                <Playertext><Rowtext>{props.me} ({props.color})</Rowtext></Playertext>
                <Playertext><Rowtext>{props.opponent}</Rowtext></Playertext>
            </Box>
            <Outcometext>
                <Rowtext sx={{color: outcomeColor(props.outcome), fontWeight: 700, textTransform: 'capitalize'}}>
                    {props.outcome}
                </Rowtext>
            </Outcometext>
            <Datetext><Rowtext>{props.date}</Rowtext></Datetext>
            </Box>

        </StyledGameBox>
    )
}


export default RecentGames
