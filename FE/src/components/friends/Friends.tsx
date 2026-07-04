import React from 'react';
import { Avatar, Button, Typography, Box, Tooltip, useTheme } from '@mui/material';
import GlassCard from '../../ui/GlassCard';

export type FriendAction = {
  label: string;
  onClick: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'error' | 'inherit';
  disabled?: boolean;
};

export interface FriendsProps {
  name: string;
  desc: string;
  online?: boolean;
  actions?: FriendAction[];
}

const Friends = (props: FriendsProps) => {
  const { tokens, palette } = useTheme();
  return (
    <GlassCard
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        padding: '16px 20px',
        marginBottom: '14px',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          sx={{
            height: 52,
            width: 52,
            fontSize: '1.4rem',
            fontWeight: 700,
            background: `rgba(${tokens.accentRgb},0.16)`,
            color: 'primary.light',
          }}
        >
          {props.name[0]?.toUpperCase()}
        </Avatar>
        {props.online !== undefined && (
          <Tooltip title={props.online ? 'Online' : 'Offline'}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: `2px solid ${palette.background.paper}`,
                background: props.online ? palette.success.main : palette.secondary.main,
              }}
            />
          </Tooltip>
        )}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="h4" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.name}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          {props.desc}
        </Typography>
      </Box>
      {props.actions && props.actions.length > 0 && (
        <Box sx={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {props.actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || 'outlined'}
              color={action.color || 'primary'}
              size="small"
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </GlassCard>
  );
};

export default Friends;
