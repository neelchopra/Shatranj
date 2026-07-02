import React from "react";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import styled from "@emotion/styled";
import { Modal, useTheme, Box } from "@mui/material";
import Loginmodal from "../../utilities/Loginmodal";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app-state/hooks";
import { logout } from "../../app-state/features/userPreferenceSlice";

const Appbar = () => {
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const user = useAppSelector((state) => state.userPreference.user);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleLogout = () => {
		dispatch(logout());
		navigate("/");
	};

	const theme = useTheme();

	const Topbar = styled(AppBar)({
		zIndex: 3,
		boxShadow: "none",
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		height: "90px",
		padding: "32px 30px",
		[theme.breakpoints.up("xl")]: {
			height: "120px",
			padding: "32px 40px",
		},
	});

	const TopbarText = styled(Typography)({
		fontWeight: 700,
		fontSize: "30px",
		lineHeight: "47px",
		[theme.breakpoints.up("xl")]: {
			fontSize: "40px",
		},
	});

	const Login = styled(Button)({
		border: "solid white 1px",
		width: "100px",
		height: "42px",
	});

	const NavLink = styled(Link)({
		textDecoration: "none",
		underline: "none",
		color: "white",
	});

	return (
		<div>
			<Topbar position="fixed">
				<NavLink to="/">
					<TopbarText>Shatranj</TopbarText>
				</NavLink>
				{user ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
						<Typography sx={{ fontSize: "18px" }}>
							{user.username} ({user.rating})
						</Typography>
						<Login variant="contained" color="secondary" onClick={handleLogout}>
							Logout
						</Login>
					</Box>
				) : (
					<Login variant="contained" color="secondary" onClick={handleOpen}>
						Login
					</Login>
				)}
			</Topbar>
			<Modal
				open={open}
				onClose={handleClose}
			>
				<Loginmodal onClose={handleClose} />
			</Modal>
		</div>
	);
};

export default Appbar;
