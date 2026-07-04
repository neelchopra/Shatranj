import React, { forwardRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../app-state/hooks';
import { loginUser, registerUser } from '../app-state/features/userPreferenceSlice';

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

const Loginmodal = forwardRef<HTMLDivElement, { onClose?: () => void }>(
  ({ onClose }, ref) => {
    const { tokens } = useTheme();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');

    const [nameLogin, setNameLogin] = useState('');
    const [passwordLogin, setPasswordLogin] = useState('');
    const [nameRegister, setNameRegister] = useState('');
    const [passwordRegister, setPasswordRegister] = useState('');
    const [confirmPasswordRegister, setConfirmPasswordRegister] = useState('');
    const [emailRegister, setEmailRegister] = useState('');

    const dispatch = useAppDispatch();
    const isloading = useAppSelector((state) => state.userPreference.isloading);
    const serverError = useAppSelector((state) => state.userPreference.error);

    const handleRegister = () => {
      if (!nameRegister || !passwordRegister || !confirmPasswordRegister || !emailRegister) {
        setFormError('All fields are required');
        return;
      }
      if (!isValidEmail(emailRegister)) {
        setFormError('Please enter a valid email');
        return;
      }
      if (passwordRegister !== confirmPasswordRegister) {
        setFormError('Passwords do not match');
        return;
      }
      setFormError('');
      dispatch(registerUser({ username: nameRegister, password: passwordRegister, email: emailRegister }))
        .unwrap()
        .then(() => onClose?.())
        .catch(() => {});
    };

    const handleLogin = () => {
      if (!nameLogin || !passwordLogin) {
        setFormError('Username and password are required');
        return;
      }
      setFormError('');
      dispatch(loginUser({ username: nameLogin, password: passwordLogin }))
        .unwrap()
        .then(() => onClose?.())
        .catch(() => {});
    };

    const displayError = formError || serverError;
    const isLogin = tab === 'login';

    const passwordAdornment = (
      <InputAdornment position="end">
        <IconButton
          aria-label="toggle password visibility"
          onClick={() => setShowPassword((show) => !show)}
          onMouseDown={(e) => e.preventDefault()}
          edge="end"
          size="small"
        >
          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    );

    return (
      <Box
        ref={ref}
        tabIndex={-1}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, calc(100vw - 32px))',
          borderRadius: `${tokens.radius.lg}px`,
          background: tokens.glassStrong.background,
          backdropFilter: tokens.glassStrong.blur,
          WebkitBackdropFilter: tokens.glassStrong.blur,
          border: tokens.glassStrong.border,
          boxShadow: tokens.glowSoft,
          padding: '28px',
          outline: 'none',
        }}
      >
        {/* Tab switcher */}
        <Box
          sx={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            borderRadius: '12px',
            background: tokens.glass.background,
            border: tokens.glass.border,
            marginBottom: '24px',
          }}
        >
          {(['login', 'register'] as const).map((key) => (
            <Box
              key={key}
              onClick={() => setTab(key)}
              sx={{
                position: 'relative',
                flex: 1,
                textAlign: 'center',
                padding: '10px',
                borderRadius: '9px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {tab === key && (
                <motion.div
                  layoutId="auth-tab"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 9,
                    background: `rgba(${tokens.accentRgb},0.16)`,
                    border: `1px solid rgba(${tokens.accentRgb},0.4)`,
                  }}
                />
              )}
              <Typography
                sx={{
                  position: 'relative',
                  fontWeight: 600,
                  color: tab === key ? 'primary.light' : 'text.secondary',
                  textTransform: 'capitalize',
                }}
              >
                {key}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Panels — both stay mounted so field state survives tab switches */}
        <Box sx={{ position: 'relative' }}>
          <motion.div
            animate={{
              opacity: isLogin ? 1 : 0,
              x: isLogin ? 0 : -16,
              pointerEvents: isLogin ? 'auto' : 'none',
            }}
            transition={{ duration: 0.2 }}
            style={{ display: isLogin ? 'block' : 'none' }}
          >
            <TextField
              fullWidth
              variant="filled"
              label="Username"
              value={nameLogin}
              onChange={(e) => setNameLogin(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ marginBottom: '16px' }}
            />
            <TextField
              fullWidth
              variant="filled"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordLogin}
              onChange={(e) => setPasswordLogin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: passwordAdornment,
              }}
            />
          </motion.div>

          <motion.div
            animate={{
              opacity: isLogin ? 0 : 1,
              x: isLogin ? 16 : 0,
              pointerEvents: isLogin ? 'none' : 'auto',
            }}
            transition={{ duration: 0.2 }}
            style={{ display: isLogin ? 'none' : 'block' }}
          >
            <TextField
              fullWidth
              variant="filled"
              label="Username"
              value={nameRegister}
              onChange={(e) => setNameRegister(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ marginBottom: '16px' }}
            />
            <TextField
              fullWidth
              variant="filled"
              label="Email"
              type="email"
              value={emailRegister}
              onChange={(e) => setEmailRegister(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ marginBottom: '16px' }}
            />
            <TextField
              fullWidth
              variant="filled"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordRegister}
              onChange={(e) => setPasswordRegister(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: passwordAdornment,
              }}
              sx={{ marginBottom: '16px' }}
            />
            <TextField
              fullWidth
              variant="filled"
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPasswordRegister}
              onChange={(e) => setConfirmPasswordRegister(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              error={confirmPasswordRegister !== '' && confirmPasswordRegister !== passwordRegister}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>
        </Box>

        {displayError && (
          <Typography sx={{ color: 'error.main', marginTop: '16px', fontSize: '0.9rem' }}>
            {displayError}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isloading}
          onClick={isLogin ? handleLogin : handleRegister}
          sx={{ marginTop: '24px', padding: '12px' }}
        >
          {isloading
            ? isLogin ? 'Logging in…' : 'Registering…'
            : isLogin ? 'Login' : 'Create account'}
        </Button>
      </Box>
    );
  }
);

export default Loginmodal;
