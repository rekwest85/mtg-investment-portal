"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface CardPopoverProps {
  cardName: string;
  setCode: string;
  foilPrice: number;
  foilPriceCad?: number;
  reasons?: string[];
  typeLine?: string;
  rarity?: string;
  score?: number;
  children: React.ReactNode;
}

export default function CardPopover({
  cardName,
  setCode,
  foilPrice,
  foilPriceCad,
  reasons,
  typeLine,
  rarity,
  score,
  children,
}: CardPopoverProps) {
  const [show, setShow] = useState(false);
  const [imgError, setImgError] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const imageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    cardName
  )}&set=${setCode}&format=image&version=large`;

  // Recalculate position when show changes
  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position above the trigger, centered
      setPos({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [show]);

  const handleClick = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 10, left: rect.left + rect.width / 2 });
    }
    setShow((v) => !v);
  };

  const popoverContent = (
    <>
      {/* Backdrop (mobile) */}
      {show && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 sm:hidden"
          onClick={() => setShow(false)}
        />
      )}
      {/* Popover — portal to body, positioned fixed */}
      {show && createPortal(
        <div
          className="fixed z-[99999] pointer-events-auto"
          style={{
            top: Math.min(pos.top - 8, window.innerHeight - 400),
            left: Math.max(16, Math.min(pos.left, window.innerWidth - 250)),
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl w-56 sm:w-64 backdrop-blur-xl">
            {/* Card Image */}
            {!imgError ? (
              <img
                src={imageUrl}
                alt={cardName}
                className="w-full h-auto cursor-pointer"
                onClick={() => setShow(false)}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-36 sm:h-40 bg-gradient-to-br from-purple-900/50 to-slate-800 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-3xl mb-1">🃏</div>
                  <div className="text-xs">{cardName}</div>
                </div>
              </div>
            )}

            {/* Card Info */}
            <div className="p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs sm:text-sm">{cardName}</span>
                <span className="text-[10px] text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                  {setCode}
                </span>
              </div>

              {typeLine && (
                <div className="text-[11px] text-slate-400">{typeLine}</div>
              )}

              {rarity && (
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {rarity} · Early Foil
                </div>
              )}

              {/* Price + Score */}
              <div className="flex gap-3 pt-1">
                <div>
                  <div className="text-[10px] text-slate-500">Target (CAD)</div>
                  <div className="text-sm font-bold text-emerald-400">
                    ${(foilPriceCad || foilPrice).toFixed(2)}
                  </div>
                </div>
                {score && (
                  <div>
                    <div className="text-[10px] text-slate-500">Score</div>
                    <div className="text-sm font-bold text-purple-400">
                      {score.toFixed(0)}
                    </div>
                  </div>
                )}
              </div>

              {/* Reasons */}
              {reasons && reasons.length > 0 && (
                <div className="pt-0.5">
                  <div className="text-[10px] text-slate-500 mb-0.5">Why Invest</div>
                  <ul className="text-[10px] text-slate-400 space-y-0.5">
                    {reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex gap-1">
                        <span className="text-cyan-500">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scryfall */}
              <a
                href={`https://scryfall.com/search?q=!%22${encodeURIComponent(cardName)}%22+set%3A${setCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-slate-600 hover:text-blue-400 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                View on Scryfall ↗
              </a>

              {/* Close hint */}
              <div className="text-[9px] text-slate-700 text-center mt-1 sm:hidden">
                Tap to close
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );

  return (
    <div
      ref={triggerRef}
      className="inline-block cursor-pointer"
      onMouseEnter={() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setPos({ top: rect.top - 10, left: rect.left + rect.width / 2 });
        }
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
      onClick={handleClick}
    >
      {children}
      {popoverContent}
    </div>
  );
}
