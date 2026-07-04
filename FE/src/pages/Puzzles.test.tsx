import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "../app-state/store";
import { api } from "../api";
import Puzzles from "./Puzzles";

jest.mock("../api", () => ({
	api: { get: jest.fn(), post: jest.fn() },
}));
const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };

jest.mock("../components/chessboards/PuzzleBoard", () => ({
	__esModule: true,
	default: ({ puzzle, onResult }: any) => (
		<div data-testid="puzzle-board" data-puzzle-id={puzzle._id}>
			<button onClick={() => onResult({ solved: true, solutionSan: [], solutionPgn: "" })}>solve</button>
		</div>
	),
}));

jest.mock("../components/chessboards/ReviewBoard", () => ({
	__esModule: true,
	default: () => <div data-testid="review-board" />,
	ReviewControls: () => <div data-testid="review-controls-placeholder" />,
}));

// jsdom never lays out real boxes, so the real hook would measure 0 and the
// board area would never render at all.
jest.mock("../hooks/useBoardWidth", () => ({
	__esModule: true,
	default: () => 320,
}));

const puzzleA = { _id: "puzzle-a", fen: "8/8/8/8/8/8/8/8 w - - 0 1", moves: ["e2e4"], rating: 1200 };
const puzzleB = { _id: "puzzle-b", fen: "8/8/8/8/8/8/8/8 w - - 0 1", moves: ["d2d4"], rating: 1300 };

const renderPage = () =>
	render(
		<Provider store={store}>
			<MemoryRouter>
				<Puzzles />
			</MemoryRouter>
		</Provider>
	);

test("does not remount the stale solved puzzle while the next one is loading", async () => {
	let resolveNext: (value: any) => void;
	mockedApi.get
		.mockResolvedValueOnce({ data: puzzleA })
		.mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));

	renderPage();

	const board = await screen.findByTestId("puzzle-board");
	expect(board).toHaveAttribute("data-puzzle-id", "puzzle-a");

	fireEvent.click(screen.getByText("solve"));
	expect(await screen.findByTestId("review-board")).toBeInTheDocument();

	fireEvent.click(screen.getAllByText("Next puzzle")[0]);

	// While puzzle B is still in flight, the page must keep showing puzzle A's
	// solved review board — not remount PuzzleBoard with puzzle A's stale data.
	await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(2));
	expect(screen.getByTestId("review-board")).toBeInTheDocument();
	expect(screen.queryByTestId("puzzle-board")).not.toBeInTheDocument();

	resolveNext!({ data: puzzleB });

	const nextBoard = await screen.findByTestId("puzzle-board");
	expect(nextBoard).toHaveAttribute("data-puzzle-id", "puzzle-b");
});
