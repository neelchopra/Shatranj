import React from 'react';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import theme from '../theme';
import { NavLink } from 'react-router-dom';

const onlineDesc = 'Play a rated game against a random opponent, or create a private room and invite a friend with a code. 5, 10 and 15 minute time controls.'
const computerDesc = 'Practice against Stockfish at three difficulty levels. No account needed — jump straight into a game.'

const FormatBox =styled(Box)({
    backgroundColor:`${theme.palette.primary.main}`,
    margin:'0px 0 30px 150px',
    padding:'20px',
    borderRadius:'20px',
    border:'solid 1px #5E5E5E87',
    width:'450px',
    height:'180px',
    boxShadow:'0px 2px #5E5E5E40',
    display:'flex',    
    flexDirection:'column',
    alignItems:'start',
    justifyContent:'start',
    textAlign:'start',
    [theme.breakpoints.up('xl')]: {
        margin:'0px 0 30px 150px',
        width:'530px',
        height:'200px',
        padding:'25px',
    },  

    
})
const FormatText =styled(Typography)({
    color:'white',
    fontSize:'32px',
    fontWeight:700, 
    
    [theme.breakpoints.up('xl')]: {
        fontSize:'36x',
    },  
})
const FormatDesc =styled(Typography)({
    color:'white',
    fontSize:'16px',
    fontWeight:700,
    [theme.breakpoints.up('xl')]: {
        fontSize:'18px',
    },  
})
const MainBox=styled(Box)({
    padding:'70px 0 0 40px',[theme.breakpoints.up('xl')]: {padding:'100px'}
})


const Play = ()=>{
    return(
        <MainBox>
            <NavLink
                style={{textDecoration:'none'}}
                to={"/play/online"}
            >
                <FormatBox>
                    <FormatText>Online</FormatText>
                    <FormatDesc>{onlineDesc}</FormatDesc>
                </FormatBox>
            </NavLink>
            <NavLink
                style={{textDecoration:'none'}}
                to={"/play/computer"}
            >
                <FormatBox>
                    <FormatText>vs Computer</FormatText>
                    <FormatDesc>{computerDesc}</FormatDesc>
                </FormatBox>
            </NavLink>
        </MainBox>
    )
}
export default Play;