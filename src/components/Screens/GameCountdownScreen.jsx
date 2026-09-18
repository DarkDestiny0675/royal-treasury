import { useEffect, useRef, useState } from "react";
import { playSound } from "../../audio/soundEngine";
import "./GameCountdownScreen.css";
const COUNTDOWN=[5,4,3,2,1]; const COUNTDOWN_DELAY=1000; const BEGIN_HOLD_DELAY=3000;
function GameCountdownScreen({ firstPlayer,onComplete }) { const [step,setStep]=useState(0); const lastSound=useRef(-1); const showingNumber=step<COUNTDOWN.length; const countdownValue=COUNTDOWN[step];
useEffect(()=>{ if(lastSound.current===step)return; lastSound.current=step; playSound(showingNumber?"countdown":"begin"); },[showingNumber,step]);
useEffect(()=>{ const delay=showingNumber?COUNTDOWN_DELAY:BEGIN_HOLD_DELAY; const timer=setTimeout(()=>{ if(showingNumber)setStep(current=>current+1); else onComplete(); },delay); return()=>clearTimeout(timer); },[onComplete,showingNumber,step]);
return <section className="game-countdown-screen" aria-live="assertive"><div className="countdown-radiance" aria-hidden="true"/><div className="countdown-crown" aria-hidden="true">♛</div>{showingNumber?<div className="countdown-number-stage" key={countdownValue}><p>The Royal Court Is Ready</p><strong>{countdownValue}</strong><span>Prepare for the first turn</span></div>:<div className="countdown-begin-stage"><p>Royal Treasury</p><h1>Let the Game Begin!</h1><strong>{firstPlayer?.name||"Seat 1"} takes the first turn</strong></div>}</section>; }
export default GameCountdownScreen;
