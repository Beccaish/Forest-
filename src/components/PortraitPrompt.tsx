import React from 'react';

interface PortraitPromptProps {
  visible: boolean;
  onContinueAnyway: () => void;
}

export const PortraitPrompt: React.FC<PortraitPromptProps> = ({
  visible,
  onContinueAnyway,
}) => {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-title"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#040c13]/94 px-6 text-center"
    >
      {/* Bespoke Inline SVG Rotating Phone Graphic */}
      <div className="mb-6 text-[#7cfce7]" aria-hidden="true">
        <svg
          width="76"
          height="76"
          viewBox="0 0 76 76"
          fill="none"
          className="mx-auto"
        >
          {/* Target Landscape Frame */}
          <rect
            x="10"
            y="24"
            width="56"
            height="34"
            rx="6"
            stroke="#7cfce7"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />
          {/* Portrait Phone Frame */}
          <rect
            x="23"
            y="10"
            width="28"
            height="48"
            rx="5"
            fill="#091d27"
            stroke="#8cf8e8"
            strokeWidth="2.2"
          />
          <line
            x1="33"
            y1="52"
            x2="41"
            y2="52"
            stroke="#8cf8e8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Curved Rotate Arrow */}
          <path
            d="M54 14 C64 18, 68 27, 65 36"
            stroke="#ffe194"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M61 32 L65 37 L69 32"
            stroke="#ffe194"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        id="rotate-title"
        className="font-display text-2xl font-semibold text-[#eafbf8] mb-2"
      >
        Turn Your Phone Landscape
      </h2>
      <p className="max-w-xs text-sm leading-relaxed text-[#b6ddd7] mb-8">
        Rotate your device sideways to explore the full forest vista and use two-thumb landscape controls.
      </p>

      <button
        type="button"
        onClick={onContinueAnyway}
        className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 px-5 py-2.5 text-xs font-medium text-[#cbeae5] transition-colors hover:border-[#7cfce7]/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
      >
        Continue in Portrait
      </button>
    </div>
  );
};
