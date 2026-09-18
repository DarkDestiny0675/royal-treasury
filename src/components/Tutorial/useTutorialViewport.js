import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const HEADER_OFFSET = 98;

export function useTutorialViewport(step) {
  const [targetRect, setTargetRect] = useState(null);

  const locateTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }

    const target =
      document.querySelector(step.target) ||
      (step.fallbackTarget
        ? document.querySelector(step.fallbackTarget)
        : null);
    const scrollTarget = step.scrollTarget
      ? document.querySelector(step.scrollTarget)
      : target;

    if (!target || !scrollTarget) {
      setTargetRect(null);
      return;
    }

    const scrollRect = scrollTarget.getBoundingClientRect();
    const absoluteTop = window.scrollY + scrollRect.top;
    const targetTop = step.scrollAnchor === "top"
      ? Math.max(0, absoluteTop - HEADER_OFFSET)
      : Math.max(
          0,
          absoluteTop - window.innerHeight / 2 + scrollRect.height / 2,
        );

    window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });

    window.requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const top = Math.max(HEADER_OFFSET, rect.top - 8);
      setTargetRect({
        top,
        left: Math.max(8, rect.left - 8),
        width: Math.min(window.innerWidth - 16, rect.width + 16),
        height: Math.min(window.innerHeight - top - 8, rect.height + 16),
      });
    });
  }, [
    step.fallbackTarget,
    step.scrollAnchor,
    step.scrollTarget,
    step.target,
  ]);

  useLayoutEffect(() => {
    locateTarget();
    window.addEventListener("resize", locateTarget);
    return () => window.removeEventListener("resize", locateTarget);
  }, [locateTarget]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    function blockInteraction(event) {
      const tutorialControl = event.target.closest?.(
        ".tutorial-guide-card button",
      );
      if (!tutorialControl) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function blockKeys(event) {
      const allowedControl = document.activeElement?.closest?.(
        ".tutorial-guide-card button",
      );
      const blockedKeys = [
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "PageUp", "PageDown", "Home", "End", " ",
      ];
      if (blockedKeys.includes(event.key) && !allowedControl) {
        event.preventDefault();
      }
    }

    window.addEventListener("wheel", blockInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", blockInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener("pointerdown", blockInteraction, true);
    window.addEventListener("keydown", blockKeys, true);

    return () => {
      window.removeEventListener("wheel", blockInteraction, true);
      window.removeEventListener("touchmove", blockInteraction, true);
      window.removeEventListener("pointerdown", blockInteraction, true);
      window.removeEventListener("keydown", blockKeys, true);
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
    };
  }, []);

  return targetRect;
}

export function getGuidePosition(rect, preferred = "auto") {
  if (!rect) return undefined;
  const margin = 18;
  const cardWidth = Math.min(480, window.innerWidth - 32);
  const cardHeight = 300;
  const space = {
    left: rect.left - margin,
    right: window.innerWidth - rect.left - rect.width - margin,
    below: window.innerHeight - rect.top - rect.height - margin,
  };

  if (preferred === "topFixed") {
    return {
      top: HEADER_OFFSET,
      left: Math.max(16, window.innerWidth - cardWidth - 28),
      width: cardWidth,
    };
  }

  let placement = preferred;
  if (placement === "auto") {
    if (space.right >= cardWidth) placement = "right";
    else if (space.left >= cardWidth) placement = "left";
    else if (space.below >= cardHeight) placement = "below";
    else placement = "above";
  }

  if (placement === "right" && space.right >= cardWidth) {
    return {
      top: Math.min(window.innerHeight - cardHeight - 16, Math.max(16, rect.top)),
      left: rect.left + rect.width + margin,
      width: cardWidth,
    };
  }
  if (placement === "left" && space.left >= cardWidth) {
    return {
      top: Math.min(window.innerHeight - cardHeight - 16, Math.max(16, rect.top)),
      left: rect.left - cardWidth - margin,
      width: cardWidth,
    };
  }
  if (placement === "below" && space.below >= cardHeight) {
    return centered(rect, cardWidth, rect.top + rect.height + margin);
  }
  return centered(rect, cardWidth, Math.max(16, rect.top - cardHeight - margin));
}

function centered(rect, width, top) {
  return {
    top,
    left: Math.min(
      window.innerWidth - width - 16,
      Math.max(16, rect.left + rect.width / 2 - width / 2),
    ),
    width,
  };
}
