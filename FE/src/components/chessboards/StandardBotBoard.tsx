import React, { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square, Piece } from 'react-chessboard/dist/chessboard/types';
import { useAppDispatch, useAppSelector } from '../../app-state/hooks';
import { setGameState } from '../../app-state/features/gameSlice';
import { Chess } from 'chess.js';
import Engine from '../../Engine';
import { evaluateGame } from '../../utilities/chessResult';

const boardWidth = window.innerHeight*80*75/10000;

type Props = {
    depth: number;
    color: string; // the human always plays white against the bot
}

const StandardBotBoard = (props: Props)=>{
    const dispatch = useAppDispatch();
    const position = useAppSelector((state)=> state.game.gameState.position)
    const [optionSquares,setOptionSquares]=useState({})

    const chessRef = useRef<Chess | null>(null);
    if (!chessRef.current) chessRef.current = new Chess();
    const engineRef = useRef<Engine | null>(null);
    const sourceSquareRef = useRef<string>('');

    const publishPosition = () => {
        const chess = chessRef.current!;
        const { isGameOver, result } = evaluateGame(chess);
        dispatch(setGameState({
            position: chess.fen(),
            pgn: chess.pgn(),
            isGameOver,
            result,
        }));
    };

    useEffect(() => {
        const engine = new Engine();
        engineRef.current = engine;
        // Single persistent listener — the engine replies whenever we ask for a move.
        engine.onMessage(({ bestMove }) => {
            if (!bestMove) return;
            const chess = chessRef.current!;
            if (chess.isGameOver() || chess.turn() !== 'b') return;
            try {
                chess.move({
                    from: bestMove.substring(0, 2),
                    to: bestMove.substring(2, 4),
                    promotion: bestMove.substring(4, 5) || 'q',
                });
                publishPosition();
            } catch (e) {
                console.error('Engine suggested an invalid move:', bestMove);
            }
        });
        return () => {
            engine.terminate();
            engineRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestEngineMove = () => {
        const chess = chessRef.current!;
        if (chess.isGameOver()) return;
        setTimeout(() => {
            engineRef.current?.evaluatePosition(chess.fen(), props.depth);
        }, 500);
    };

    const playerMove = (moveInput: {from:string,to:string,promotion?:string}) => {
        const chess = chessRef.current!;
        const move = chess.move(moveInput); // throws on illegal moves
        publishPosition();
        requestEngineMove();
        return move;
    };

    const myTurn = () => chessRef.current!.turn() === 'w';

    const handleDrop = (source:Square,target:Square,piece:Piece)=>{
        setOptionSquares({})
        if (!myTurn() || chessRef.current!.isGameOver()) return false;
        try{
            playerMove({from:source,to:target,promotion:piece[1]?.toLowerCase() ?? 'q'});
            return true;
        }catch(e){
            return false;
        }
    }

    const handleClick = (square:Square)=>{
        const chess = chessRef.current!;
        if (!myTurn() || chess.isGameOver()) { setOptionSquares({}); return false; }
        try{
            playerMove({from:sourceSquareRef.current,to:square,promotion:'q'});
            setOptionSquares({})
            return true;
        }catch(e){
            // Not a legal move from the stored source — treat as selecting a piece.
        }
        sourceSquareRef.current = square;
        const moves = chess.moves({square:square,verbose:true});
        if (moves.length===0){setOptionSquares({}); return false}
        let newSquares = {};
        moves.forEach((move)=>{
            const key = move.to
            newSquares = {...newSquares, [key]:{background: chess.get(key)
                ? "radial-gradient(closest-side, #97aef3 80%, transparent 40%)"
                : "radial-gradient(closest-side, #97aef3 30%, transparent 40%)"}}
        })
        setOptionSquares(newSquares)
    }

    return(
        <Chessboard
            position={position}
            onPieceDrop={handleDrop}
            boardWidth={boardWidth}
            onSquareClick={handleClick}
            customDarkSquareStyle={{backgroundColor:'#B7C0D8'}}
            customLightSquareStyle={{backgroundColor:'#E8EDF9'}}
            customSquareStyles={{...optionSquares}}
            animationDuration={100}
            arePremovesAllowed={false}
        />
    )
}

export default StandardBotBoard;
