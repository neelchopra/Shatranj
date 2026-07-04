import React, { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square, Piece } from 'react-chessboard/dist/chessboard/types';
import { motion, useAnimationControls } from 'framer-motion';
import { useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app-state/hooks';
import { setGameState } from '../../app-state/features/gameSlice';
import { Chess } from 'chess.js';
import Engine from '../../Engine';
import { evaluateGame } from '../../utilities/chessResult';
import { playIllegalSound, soundForMove } from '../../utilities/sounds';
import { limitsForRating } from '../../utilities/botStrength';
import { isPromotionMove, PromotionPiece } from '../../utilities/promotion';
import PromotionPicker from './PromotionPicker';

type Props = {
    rating: number;
    color: string; // the human always plays white against the bot
    boardWidth: number;
    /** When set, shows this position read-only instead of the live game (viewing a past move from the move list). */
    reviewPosition?: string;
}

type Premove = { from: string; to: string; promotion?: string };

const StandardBotBoard = (props: Props)=>{
    const { tokens } = useTheme();
    const dispatch = useAppDispatch();
    const position = useAppSelector((state)=> state.game.gameState.position)
    const [optionSquares,setOptionSquares]=useState({})
    const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
    const [premove, setPremove] = useState<Premove | null>(null);
    const isReviewing = !!props.reviewPosition;

    const chessRef = useRef<Chess | null>(null);
    if (!chessRef.current) chessRef.current = new Chess();
    const engineRef = useRef<Engine | null>(null);
    const sourceSquareRef = useRef<string>('');
    const shakeControls = useAnimationControls();
    const premoveRef = useRef(premove);
    premoveRef.current = premove;

    const shakeBoard = () => {
        playIllegalSound();
        shakeControls.start({ x: [0, -8, 8, -8, 0], transition: { duration: 0.3 } });
    };

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

    const playerMove = (moveInput: {from:string,to:string,promotion?:string}) => {
        const chess = chessRef.current!;
        const move = chess.move(moveInput); // throws on illegal moves
        soundForMove(chess.inCheck(), move);
        publishPosition();
        requestEngineMove();
        return move;
    };

    // A queued premove is only ever checked for legality once it's actually
    // our turn — anything staged earlier can't be validated against a
    // position that hasn't happened yet. If the engine's reply invalidated
    // it, it's just silently dropped rather than played wrong.
    const tryPremove = () => {
        const pm = premoveRef.current;
        if (!pm) return;
        setPremove(null);
        try {
            playerMove(pm);
        } catch {
            // No longer legal — discard quietly.
        }
    };

    useEffect(() => {
        const engine = new Engine();
        engineRef.current = engine;
        engine.setOption('Skill Level', limitsForRating(props.rating).skillLevel);
        // Single persistent listener — the engine replies whenever we ask for a move.
        engine.onMessage(({ bestMove }) => {
            if (!bestMove) return;
            const chess = chessRef.current!;
            if (chess.isGameOver() || chess.turn() !== 'b') return;
            try {
                const engineMove = chess.move({
                    from: bestMove.substring(0, 2),
                    to: bestMove.substring(2, 4),
                    promotion: bestMove.substring(4, 5) || 'q',
                });
                soundForMove(chess.inCheck(), engineMove);
                publishPosition();
                tryPremove();
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
        const limits = limitsForRating(props.rating);
        setTimeout(() => {
            engineRef.current?.findMove(chess.fen(), limits);
        }, 500);
    };

    const myTurn = () => chessRef.current!.turn() === 'w';

    const handleDrop = (source:Square,target:Square,piece:Piece)=>{
        setOptionSquares({})
        if (isReviewing) return false;
        if (chessRef.current!.isGameOver()) { shakeBoard(); return false; }
        if (!myTurn()) {
            if (piece[0] !== 'w') { shakeBoard(); return false; }
            setPremove({ from: source, to: target, promotion: piece[1]?.toLowerCase() });
            return false;
        }
        try{
            playerMove({from:source,to:target,promotion:piece[1]?.toLowerCase() ?? 'q'});
            return true;
        }catch(e){
            shakeBoard();
            return false;
        }
    }

    const handleClick = (square:Square)=>{
        const chess = chessRef.current!;
        if (isReviewing || chess.isGameOver()) { setOptionSquares({}); return false; }

        if (!myTurn()) {
            if (premove && (square === premove.from || square === premove.to)) {
                setPremove(null);
                setOptionSquares({});
                sourceSquareRef.current = '';
                return false;
            }
            const from = sourceSquareRef.current;
            if (from) {
                sourceSquareRef.current = '';
                setOptionSquares({});
                if (from !== square) setPremove({ from, to: square, promotion: 'q' });
                return false;
            }
            const piece = chess.get(square as Square);
            if (piece?.color === 'w') {
                sourceSquareRef.current = square;
                setOptionSquares({ [square]: { background: `rgba(${tokens.accentRgb},0.3)` } });
            }
            return false;
        }

        const from = sourceSquareRef.current;
        if (from) {
            const legal = chess.moves({ square: from as Square, verbose: true });
            if (legal.some((m) => m.to === square) && isPromotionMove(chess, from, square)) {
                sourceSquareRef.current = '';
                setOptionSquares({});
                setPendingPromotion({ from, to: square });
                return false;
            }
            try{
                playerMove({from,to:square,promotion:'q'});
                sourceSquareRef.current = '';
                setOptionSquares({})
                return true;
            }catch(e){
                // Not a legal move from the stored source — treat as selecting a piece.
            }
        }
        sourceSquareRef.current = square;
        const moves = chess.moves({square:square,verbose:true});
        if (moves.length===0){setOptionSquares({}); return false}
        let newSquares = {};
        moves.forEach((move)=>{
            const key = move.to
            newSquares = {...newSquares, [key]:{background: chess.get(key) ? tokens.board.hintCapture : tokens.board.hintMove}}
        })
        setOptionSquares(newSquares)
        return false;
    }

    const confirmPromotion = (piece: PromotionPiece) => {
        if (!pendingPromotion) return;
        try {
            playerMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
        } catch (e) {
            shakeBoard();
        }
        setPendingPromotion(null);
    };

    const premoveSquares = premove
        ? {
            [premove.from]: { background: `rgba(${tokens.accentRgb},0.35)` },
            [premove.to]: { background: `rgba(${tokens.accentRgb},0.35)` },
        }
        : {};

    return(
        <motion.div animate={shakeControls}>
            <Chessboard
                position={props.reviewPosition ?? position}
                onPieceDrop={handleDrop}
                boardWidth={props.boardWidth}
                arePiecesDraggable={!isReviewing}
                onSquareClick={handleClick}
                customDarkSquareStyle={{backgroundColor:tokens.board.dark}}
                customLightSquareStyle={{backgroundColor:tokens.board.light}}
                customSquareStyles={{...optionSquares, ...premoveSquares}}
                animationDuration={100}
                arePremovesAllowed={true}
            />
            <PromotionPicker
                open={!!pendingPromotion}
                color="w"
                onSelect={confirmPromotion}
                onCancel={() => setPendingPromotion(null)}
            />
        </motion.div>
    )
}

export default StandardBotBoard;
