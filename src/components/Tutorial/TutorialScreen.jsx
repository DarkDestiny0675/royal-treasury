import { useState } from "react";
import GameBoard from "../GameBoard/GameBoard";
import { getGuidePosition, useTutorialViewport } from "./useTutorialViewport";
import "./TutorialScreen.css";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Royal Treasury",
    body: "This guided tour introduces the board, the resources, and the decisions that shape every match.",
  },
  {
    id: "treasury",
    target: ".players-section",
    title: "Player Treasury",
    body: "Track every contender here. Review points, tokens, permanent discounts, purchased cards, reserved cards, Nobles, and the active turn.",
  },
  {
    id: "status",
    target: ".treasury-status-message",
    title: "Turn Status",
    body: "This message always identifies the active player and explains important turn activity. A completed match announces the winner here.",
  },
  {
    id: "confirm",
    target: ".treasury-confirm-turn",
    title: "Confirm Turn",
    body: "After selecting a legal set of gems, use Confirm Turn to commit the selection and advance play.",
  },
  {
    id: "vault",
    target: ".gem-vault",
    title: "Gem Vault",
    body: "Collect resources from the Gem Vault. Take three different gems or two matching gems when the supply permits. Your Treasury may hold no more than ten total tokens at the end of a turn.",
    placement: "below",
  },
  {
    id: "gold",
    target: ".gem-vault .vault-gem-gold",
    title: "Gold Coins Are Wild",
    body: "Gold can substitute for any colored gem when purchasing a card. Reserving a card awards one gold coin when one is available, and a player may hold no more than three gold coins total.",
    placement: "left",
  },
  {
    id: "nobles",
    target: ".noble-gallery",
    title: "Noble Gallery",
    body: "Nobles award points automatically when your permanent discounts satisfy a patron's requirements.",
  },
  {
    id: "tier3",
    target: ".card-market:nth-of-type(4)",
    fallbackTarget: ".card-market",
    title: "Tier 3 Market",
    body: "Tier 3 cards are expensive, powerful, and usually worth the most victory points.",
  },
  {
    id: "tier2",
    target: ".card-market:nth-of-type(5)",
    fallbackTarget: ".card-market",
    title: "Tier 2 Market",
    body: "Tier 2 cards bridge early discounts and late-game scoring. These cards often define a developing strategy.",
  },
  {
    id: "tier1",
    target: ".card-market:nth-of-type(6)",
    fallbackTarget: ".card-market",
    title: "Tier 1 Market",
    body: "Tier 1 cards are the foundation of your engine. Buy these cards to build permanent discounts and reduce future costs.",
  },
  {
    id: "reserve",
    target: ".card-market .card-row > :nth-child(2)",
    fallbackTarget: ".card-market",
    title: "Reserve a Development Card",
    body: "Reserve a market card when you want to protect it for a later purchase. Reserving ends the turn, may award one available gold coin, and a player may hold no more than three reserved cards at one time.",
    placement: "topFixed",
    scrollAnchor: "top",
    scrollTarget: ".card-market",
  },
  {
    id: "undo-selection",
    target: ".players-section .active-player",
    fallbackTarget: ".players-section",
    title: "Return a Selected Token",
    body: "Before confirming a gem selection, selected tokens appear in the active Player Treasury. Select a displayed token to return that token to the Gem Vault and change the selection.",
    placement: "topFixed",
    scrollAnchor: "top",
    scrollTarget: ".players-section",
  },
  {
    id: "exchange-turn",
    target: ".players-section .active-player",
    fallbackTarget: ".players-section",
    title: "Exchange at the Ten-Token Limit",
    body: "When holding ten tokens, a player may select a new token and return a token from the Treasury. Confirming that exchange completes the entire turn, so no card may be purchased or reserved afterward.",
    placement: "topFixed",
    scrollAnchor: "top",
    scrollTarget: ".players-section",
  },
  {
    id: "complete",
    title: "Ready for the Royal Court",
    body: "Build discounts, claim Nobles, reach the victory target, and finish the final round with the strongest treasury.",
  },
];

function TutorialScreen({ gameState, actions, onExit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const targetRect = useTutorialViewport(step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;



  function next() {
    if (isLast) onExit();
    else setStepIndex((index) => index + 1);
  }

  return (
    <section className="tutorial-experience">
      <div className="tutorial-board" aria-hidden="true">
        <GameBoard gameState={gameState} actions={actions} />
      </div>

      <TutorialSpotlight rect={targetRect} />
      <div className="tutorial-input-lock" aria-hidden="true" />

      <article
        className={`tutorial-guide-card ${targetRect ? "targeted" : "centered"}`}
        style={getGuidePosition(targetRect, step.placement)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="tutorial-progress">
          <span>Royal Treasury Tutorial</span>
          <strong>{stepIndex + 1} / {STEPS.length}</strong>
        </div>
        <h1 id="tutorial-title">{step.title}</h1>
        <p>{step.body}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span key={item.id} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} />
          ))}
        </div>
        <div className="tutorial-actions">
          <button type="button" className="tutorial-exit" onClick={onExit}>Exit Tutorial</button>
          <div>
            <button type="button" disabled={isFirst} onClick={() => setStepIndex((index) => Math.max(0, index - 1))}>Back</button>
            <button type="button" className="tutorial-next" onClick={next}>{isLast ? "Finish Tutorial" : "Continue"}</button>
          </div>
        </div>
      </article>
    </section>
  );
}

function TutorialSpotlight({ rect }) {
  if (!rect) return <div className="tutorial-full-shade" />;
  const right = Math.max(0, window.innerWidth - rect.left - rect.width);
  const bottom = Math.max(0, window.innerHeight - rect.top - rect.height);
  return (
    <div className="tutorial-shade-layer" aria-hidden="true">
      <div className="tutorial-shade top" style={{ height: rect.top }} />
      <div className="tutorial-shade left" style={{ top: rect.top, width: rect.left, height: rect.height }} />
      <div className="tutorial-shade right" style={{ top: rect.top, width: right, height: rect.height }} />
      <div className="tutorial-shade bottom" style={{ height: bottom }} />
      <div className="tutorial-focus-ring" style={rect} />
    </div>
  );
}



export default TutorialScreen;
