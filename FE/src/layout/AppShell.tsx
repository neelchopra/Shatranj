import React, { useEffect, useState } from "react";
import {
	AppBar,
	Box,
	Button,
	Chip,
	Drawer,
	IconButton,
	List,
	Modal,
	Toolbar,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Loginmodal from "../utilities/Loginmodal";
import MenuBox from "../components/navbar/MenuBox";
import AnimatedNumber from "../ui/AnimatedNumber";
import SocketNotifications from "../realtime/SocketNotifications";
import { socket } from "../socket";
import { useAppDispatch, useAppSelector } from "../app-state/hooks";
import { logout } from "../app-state/features/userPreferenceSlice";
import { tokens } from "../theme";

const TOPBAR_HEIGHT = 64;
const SIDEBAR_WIDTH = 240;

const navitems = [
	{ label: "Play", route: "/play", icon: <SportsEsportsOutlinedIcon /> },
	{ label: "Leaderboard", route: "/leaderboard", icon: <LeaderboardOutlinedIcon /> },
	{ label: "Friends", route: "/friends", icon: <GroupOutlinedIcon /> },
];

const AppShell = ({ children }: { children: React.ReactNode }) => {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
	const [mobileOpen, setMobileOpen] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.userPreference.user);

	// Connect as soon as someone is logged in — not just when they visit
	// "Play Online" — so friend-request/challenge notifications and presence
	// work from anywhere in the app.
	useEffect(() => {
		if (user) {
			socket.connect();
		} else {
			socket.disconnect();
		}
	}, [user]);

	const handleLogout = () => {
		dispatch(logout());
		navigate("/");
	};

	const sidebarContent = (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				height: "100%",
				paddingTop: `${TOPBAR_HEIGHT + 16}px`,
				paddingBottom: "16px",
			}}
		>
			<List sx={{ padding: "0 12px" }}>
				{navitems.map((item) => {
					const active = location.pathname.startsWith(item.route);
					return (
						<NavLink
							key={item.route}
							to={item.route}
							style={{ textDecoration: "none" }}
							onClick={() => setMobileOpen(false)}
						>
							<Box
								sx={{
									position: "relative",
									display: "flex",
									alignItems: "center",
									gap: "14px",
									padding: "12px 16px",
									marginBottom: "4px",
									borderRadius: "10px",
									color: active ? "primary.light" : "text.secondary",
									transition: "color .2s ease",
									"&:hover": { color: "text.primary" },
								}}
							>
								{active && (
									<motion.div
										layoutId="nav-pill"
										transition={{ type: "spring", stiffness: 400, damping: 32 }}
										style={{
											position: "absolute",
											inset: 0,
											borderRadius: 10,
											background: "rgba(16,185,129,0.12)",
											borderLeft: "3px solid #10B981",
										}}
									/>
								)}
								<Box sx={{ position: "relative", display: "flex", fontSize: 22 }}>
									{item.icon}
								</Box>
								<Typography
									sx={{ position: "relative", fontWeight: 600, fontSize: "1rem" }}
								>
									{item.label}
								</Typography>
							</Box>
						</NavLink>
					);
				})}
			</List>
			<Box sx={{ padding: "0 12px" }}>
				<MenuBox />
			</Box>
		</Box>
	);

	return (
		<Box sx={{ display: "flex", minHeight: "100vh" }}>
			<AppBar
				position="fixed"
				elevation={0}
				sx={{
					height: `${TOPBAR_HEIGHT}px`,
					background: tokens.glassStrong.background,
					backdropFilter: tokens.glassStrong.blur,
					WebkitBackdropFilter: tokens.glassStrong.blur,
					borderBottom: "1px solid rgba(148,163,184,0.12)",
					zIndex: (t) => t.zIndex.drawer + 1,
				}}
			>
				<Toolbar sx={{ height: "100%", minHeight: `${TOPBAR_HEIGHT}px !important`, gap: 1 }}>
					{!isDesktop && (
						<IconButton
							edge="start"
							onClick={() => setMobileOpen(!mobileOpen)}
							aria-label="open navigation"
						>
							<MenuIcon />
						</IconButton>
					)}
					<NavLink to="/" style={{ textDecoration: "none" }}>
						<Typography
							sx={{
								fontFamily: tokens.fontDisplay,
								fontWeight: 700,
								fontSize: "1.5rem",
								letterSpacing: "-0.02em",
								background: "linear-gradient(90deg, #F1F5F9 30%, #34D399)",
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							Shatranj
						</Typography>
					</NavLink>
					<Box sx={{ flexGrow: 1 }} />
					{user ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
							<Chip
								label={
									<Box sx={{ display: "flex", gap: "6px", alignItems: "center" }}>
										<Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
											{user.username}
										</Typography>
										<Typography
											sx={{
												fontWeight: 700,
												fontSize: "0.9rem",
												color: "primary.light",
												fontFamily: tokens.fontDisplay,
											}}
										>
											<AnimatedNumber value={user.rating} />
										</Typography>
									</Box>
								}
								sx={{
									background: "rgba(16,185,129,0.08)",
									border: "1px solid rgba(16,185,129,0.25)",
									height: "36px",
								}}
							/>
							<Button variant="outlined" size="small" onClick={handleLogout}>
								Logout
							</Button>
						</Box>
					) : (
						<Button variant="contained" onClick={() => setLoginOpen(true)}>
							Login
						</Button>
					)}
				</Toolbar>
			</AppBar>

			<Drawer
				variant={isDesktop ? "permanent" : "temporary"}
				open={isDesktop || mobileOpen}
				onClose={() => setMobileOpen(false)}
				ModalProps={{ keepMounted: true }}
				sx={{
					width: { xs: 0, md: SIDEBAR_WIDTH },
					flexShrink: { md: 0 },
					"& .MuiDrawer-paper": {
						width: SIDEBAR_WIDTH,
						background: isDesktop ? "transparent" : tokens.glassStrong.background,
						backdropFilter: tokens.glassStrong.blur,
						WebkitBackdropFilter: tokens.glassStrong.blur,
						borderRight: "1px solid rgba(148,163,184,0.12)",
						boxSizing: "border-box",
					},
				}}
			>
				{sidebarContent}
			</Drawer>

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					paddingTop: `${TOPBAR_HEIGHT}px`,
					minHeight: "100vh",
					minWidth: 0,
				}}
			>
				<Box
					sx={{
						maxWidth: 1200,
						margin: "0 auto",
						padding: { xs: "24px 16px", sm: "32px 24px", md: "40px 40px" },
					}}
				>
					{children}
				</Box>
			</Box>

			<Modal open={loginOpen} onClose={() => setLoginOpen(false)}>
				<Loginmodal onClose={() => setLoginOpen(false)} />
			</Modal>
			{user && <SocketNotifications />}
		</Box>
	);
};

export default AppShell;
