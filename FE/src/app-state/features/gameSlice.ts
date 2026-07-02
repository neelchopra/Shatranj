import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface game {
    isLoading: boolean;
    gameState:{
        opponent:{name:string,rating:number,color:string},
        room: string,
        position: string;
        pgn: string;
        isBlackTimerRunning: boolean,
        isWhiteTimerRunning: boolean,
        isGameOver: boolean,
        result:string,
    }
}
const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const initialState:game = {
    isLoading: false,
    gameState:{
        opponent:{
            name:'',
            rating:400,
            color:'',
        },
        room: '',
        position: startPosition,
        pgn: '',
        isBlackTimerRunning: false,
        isWhiteTimerRunning: true,
        isGameOver: false,
        result: '' // 'white' | 'black' | 'draw' | 'abort' once the game ends
  }
};

const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        // Reset everything and store who we are playing — dispatched when a game mounts.
        initGame(state, action: PayloadAction<{opponent:{name:string,rating:number,color:string}, room?:string}>){
            const fresh = JSON.parse(JSON.stringify(initialState)) as game;
            fresh.gameState.opponent = action.payload.opponent;
            fresh.gameState.room = action.payload.room || '';
            return fresh;
        },
        setGameState(state, action: PayloadAction<{position:string,pgn:string,isGameOver:boolean,result:string}>){
            state.gameState.position=action.payload.position;
            state.gameState.pgn=action.payload.pgn;
            state.gameState.result=action.payload.result;
            state.gameState.isGameOver=action.payload.isGameOver;

            if(action.payload.isGameOver){
                state.gameState.isBlackTimerRunning=false;
                state.gameState.isWhiteTimerRunning=false;
            }
            else{
                state.gameState.isBlackTimerRunning=!state.gameState.isBlackTimerRunning;
                state.gameState.isWhiteTimerRunning=!state.gameState.isWhiteTimerRunning;
            }
        },
        setWinner(state, action: PayloadAction<string>){
            state.gameState.result=action.payload
            state.gameState.isGameOver=true;
            state.gameState.isBlackTimerRunning=false;
            state.gameState.isWhiteTimerRunning=false;
        },
        closeModal(state){
            state.gameState.isGameOver=false;
        },
        resetState(){
            return initialState;
        }
    }
})

export const { initGame, setGameState, setWinner, closeModal, resetState } = gameSlice.actions;

export default gameSlice.reducer;
