import * as React from 'react';
import { Box, Avatar } from '@mui/material';
import styled from '@emotion/styled';
import Typography from '@mui/material/Typography'
import theme from '../../theme';

interface profileinfotypes {
    Username: string,
    Desc: string,
    Rating: number,
    Games: number,
}

const ProfileInfoBox = styled(Box)({
    height:'220px',
    width:'700px',
    display:'flex',
    backgroundColor:' #171719',
    marginTop:'30px',    
    borderRadius:'20px',
    [theme.breakpoints.up('xl')]: {
        height:'277px',
        width:'817px',
        marginTop:'44px',  
    },
})

const ProfileInfoImage=styled(Box)({
    height:'180px',
    width:'180px',
    margin:'20px',
    borderRadius:'10px',
    backgroundColor:' #222226', 
    [theme.breakpoints.up('xl')]: {
        height:'190px',
        width:'217px',         
        margin:'30px',

    },
})


const ProfileInfoHeader=styled(Typography)({
    fontSize:'45px',
    fontWeight:700,
    color:'white',
    padding:'20px 0 0 5px',
    [theme.breakpoints.up('xl')]: {
        fontSize:'45px',
        fontWeight:700,
        padding:'30px 0 0 30px',
    },

})

const ProfileInfoDesc=styled(Typography)({
    fontSize:'18px',
    fontWeight:700,
    color:'#69696E',
    padding:'45px 0 0 10px',
    [theme.breakpoints.up('xl')]: {
        fontSize:'20px',
        fontWeight:700,
        padding:'68px 0 0 18px',
    },
    
})

const RatingdisplayBox=styled(Box)({
    padding:'10px',
    backgroundColor:'#222226',
    margin:'15px  20px 0 0',
    borderRadius:'20px',
    height:'100px',
    width:'140px',
    color:'white',
    [theme.breakpoints.up('xl')]: {
        margin:'17px 0 30px 0',
        height:'130px',
        width:'159px',
        
    },

})


interface props {
    format:string,
    rating:string | number

}
const Ratingdisplay=({format,rating}:props)=>{
    return(
    
        <RatingdisplayBox>   
            <Typography sx={{fontSize:'20px',display:'flex',justifyContent:'center'}}>
                {format}
            </Typography>
            <Typography sx={{fontSize:'40px',display:'flex',justifyContent:'center'}}>
                {rating}
            </Typography>  
        </RatingdisplayBox>      
   
    )
}


const ProfileInfo = (props:profileinfotypes) => {
  return (
    <ProfileInfoBox>
        < Box  sx={{display:'flex'}}>

                <ProfileInfoImage sx={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Avatar sx={{height:'120px',width:'120px',fontSize:'60px'}}>
                        {props.Username[0]?.toUpperCase()}
                    </Avatar>
                </ProfileInfoImage>
                <Box>
                    <Box sx={{display:'flex',position:'relative'}}>
                        <ProfileInfoHeader>{props.Username}</ProfileInfoHeader>
                        <ProfileInfoDesc>{props.Desc}</ProfileInfoDesc>
                    </Box>
                    <Box sx={{display:'flex',gap:'20px'}}>
                            <Ratingdisplay format='Rating' rating={props.Rating}></Ratingdisplay>
                            <Ratingdisplay format='Games' rating={props.Games}></Ratingdisplay>
                    </Box>

                </Box>

              </Box>


    </ProfileInfoBox>

  )
}

export default ProfileInfo