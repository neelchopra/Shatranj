import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuList from '@mui/material/MenuList';
import { Link, useNavigate } from 'react-router-dom';
import { Popper } from '@mui/material';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Box from '@mui/material/Box/Box';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import { useAppDispatch, useAppSelector } from '../../app-state/hooks';
import { logout } from '../../app-state/features/userPreferenceSlice';
import { tokens } from '../../theme';

const MenuBox = () => {
  const user = useAppSelector((state) => state.userPreference.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }
    prevOpen.current = open;
  }, [open]);

  const handleLogout = (event: Event | React.SyntheticEvent) => {
    handleClose(event);
    dispatch(logout());
    navigate('/');
  };

  if (!user) return null;

  return (
    <div>
      <Button
        ref={anchorRef}
        id="composition-button"
        aria-controls={open ? 'composition-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          padding: '10px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          '&:hover': { background: 'rgba(255,255,255,0.06)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Avatar
            sx={{
              height: 40,
              width: 40,
              background: 'rgba(16,185,129,0.2)',
              color: 'primary.light',
              fontWeight: 700,
            }}
          >
            {user.username[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: 'left', minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.username}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Rating {user.rating}
            </Typography>
          </Box>
        </Box>
      </Button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="top-start"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'left top' : 'left bottom',
            }}
          >
            <Paper
              sx={{
                background: tokens.glassStrong.background,
                backdropFilter: tokens.glassStrong.blur,
                border: tokens.glassStrong.border,
                borderRadius: '12px',
                boxShadow: tokens.glowSoft,
                minWidth: 200,
                marginBottom: '8px',
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem onClick={handleClose}>
                    <Link to='/my-account' style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                      My account
                    </Link>
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    Logout
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default MenuBox;
