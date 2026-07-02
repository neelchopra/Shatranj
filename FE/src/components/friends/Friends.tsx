import React from 'react';
import Box from '@mui/material/Box/Box';
import theme from '../../theme';
import styled from '@emotion/styled';
import { Avatar, IconButton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const MainBox=styled(Box)({
    color:'white',
    backgroundColor:`${theme.palette.primary.main}`,
    display:'flex',
    alignItems:'center',
    width:'100%',
    height:'96px',
    borderRadius:'10px',
    padding:'0 2% 0 1%',
    margin:'0 0 20px 0',
    [theme.breakpoints.up('xl')]: {
      height:'125px',
  },
})

const FriendText  =styled(Box)({
  backgroundColor:`${theme.palette.primary.main}`,
  margin:' 0 0 0 30px',
  height:'100%',
  display:'flex',
  justifyContent:'center',
  alignItems:'flex-start',
  flexDirection:'column',
  flexGrow:1,
})
const Nametext  =styled(Typography)({
  fontSize:'32px',
  fontWeight:700,
  [theme.breakpoints.up('xl')]: {
   fontSize:'40px'
  },
})

const Desctext  =styled(Typography)({
  fontSize:'16px',
  fontWeight:700,
  [theme.breakpoints.up('xl')]: {
    fontSize:'20px'
   },
})

const AddFriendIcon =styled(PersonAddIcon)({
  fontSize:'40px',
  color:grey[100]
})

export interface FriendsProps {
  name: string,
  desc: string,
  onAdd?: () => void,
}

const Friends=(props:FriendsProps)=>{
  return(
    <MainBox>
            <Avatar sx={{height:'70px',width:'70px',fontSize:'32px'}}>
              {props.name[0]?.toUpperCase()}
            </Avatar>
              <FriendText>
                <Nametext>{props.name}</Nametext>
                <Desctext>{props.desc}</Desctext>
              </FriendText>
              {props.onAdd && (
                <IconButton onClick={props.onAdd} title="Add friend"><AddFriendIcon/></IconButton>
              )}
            </MainBox>
  )
}

export default Friends
