import React from 'react';
import { Avatar, Button, Typography, Box } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import GlassCard from '../../ui/GlassCard';

export interface FriendsProps {
  name: string,
  desc: string,
  onAdd?: () => void,
}

const Friends = (props: FriendsProps) => {
  return (
    <GlassCard
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        padding: '16px 20px',
        marginBottom: '14px',
      }}
    >
      <Avatar
        sx={{
          height: 52,
          width: 52,
          fontSize: '1.4rem',
          fontWeight: 700,
          background: 'rgba(16,185,129,0.16)',
          color: 'primary.light',
        }}
      >
        {props.name[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="h4" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.name}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          {props.desc}
        </Typography>
      </Box>
      {props.onAdd && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddOutlinedIcon />}
          onClick={props.onAdd}
        >
          Add
        </Button>
      )}
    </GlassCard>
  );
};

export default Friends;
