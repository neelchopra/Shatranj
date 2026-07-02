import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api";
import { socket } from "../../socket";

export type User = {
	_id: string;
	username: string;
	email: string;
	rating: number;
	number_of_matches: number;
	puzzle_rating: number;
	puzzle_streak: number;
	best_streak: number;
};

type AuthResponse = {
	token: string;
	user: User;
};

interface UserPreferences {
	isloading: boolean;
	user: User | null;
	error: string;
}

const storedUser = localStorage.getItem("user");

const initialState: UserPreferences = {
	isloading: false,
	error: "",
	user: storedUser ? JSON.parse(storedUser) : null,
};

const persistAuth = (payload: AuthResponse) => {
	localStorage.setItem("token", payload.token);
	localStorage.setItem("user", JSON.stringify(payload.user));
};

const extractError = (err: any) =>
	err.response?.data?.message || "Something went wrong, please try again";

export const registerUser = createAsyncThunk<
	AuthResponse,
	{ username: string; password: string; email: string },
	{ rejectValue: string }
>("auth/registerUser", async (details, { rejectWithValue }) => {
	try {
		const response = await api.post("/users/register", details);
		return response.data;
	} catch (err: any) {
		return rejectWithValue(extractError(err));
	}
});

export const loginUser = createAsyncThunk<
	AuthResponse,
	{ username: string; password: string },
	{ rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
	try {
		const response = await api.post("/users/login", credentials);
		return response.data;
	} catch (err: any) {
		return rejectWithValue(extractError(err));
	}
});

const userPreferenceSlice = createSlice({
	name: "userPreference",
	initialState,
	reducers: {
		logout(state) {
			state.user = null;
			state.error = "";
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			socket.disconnect();
		},
		updateRating(state, action) {
			if (state.user) {
				state.user.rating = action.payload;
				localStorage.setItem("user", JSON.stringify(state.user));
			}
		},
		updatePuzzleStats(state, action: { payload: { puzzle_rating: number; puzzle_streak: number; best_streak: number } }) {
			if (state.user) {
				state.user.puzzle_rating = action.payload.puzzle_rating;
				state.user.puzzle_streak = action.payload.puzzle_streak;
				state.user.best_streak = action.payload.best_streak;
				localStorage.setItem("user", JSON.stringify(state.user));
			}
		},
	},
	extraReducers(builder) {
		builder
			.addCase(registerUser.pending, (state) => {
				state.isloading = true;
				state.error = "";
			})
			.addCase(registerUser.fulfilled, (state, action) => {
				state.isloading = false;
				state.user = action.payload.user;
				state.error = "";
				persistAuth(action.payload);
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.isloading = false;
				state.error = action.payload || "Registration failed";
			})
			.addCase(loginUser.pending, (state) => {
				state.isloading = true;
				state.error = "";
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.isloading = false;
				state.user = action.payload.user;
				state.error = "";
				persistAuth(action.payload);
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.isloading = false;
				state.error = action.payload || "Login failed";
			});
	},
});

export const { logout, updateRating, updatePuzzleStats } = userPreferenceSlice.actions;

export default userPreferenceSlice.reducer;
