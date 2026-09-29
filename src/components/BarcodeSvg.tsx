import React from 'react';

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  width = 220,
  height = 54,
  showText = true,
  className = '',
}) => {
  // Deterministic pseudo-code 128 bar pattern generator from string characters
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const unitWidth = 2;

  // Start guard bars
  bars.push({ x: currentX, w: unitWidth * 2 });
  currentX += unitWidth * 3;
  bars.push({ x: currentX, w: unitWidth });
  currentX += unitWidth * 2;

  // Character bar encodings
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const pattern = [
      (code % 3) + 1,
      ((code >> 1) % 2) + 1,
      ((code >> 2) % 3) + 1,
      ((code >> 3) % 2) + 1,
    ];

    for (let p = 0; p < pattern.length; p++) {
      const barW = pattern[p] * unitWidth;
      if (p % 2 === 0) {
        bars.push({ x: currentX, w: barW });
      }
      currentX += barW + unitWidth;
    }
  }

  // End guard bars
  bars.push({ x: currentX, w: unitWidth * 2 });
  currentX += unitWidth * 3;
  bars.push({ x: currentX, w: unitWidth * 3 });
  currentX += unitWidth * 4;

  const totalWidth = Math.max(width, currentX + 10);
  const barHeight = showText ? height - 16 : height;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-1.5 rounded border border-gray-200 ${className}`}>
      <svg
        width="100%"
        height={barHeight}
        viewBox={`0 0 ${totalWidth} ${barHeight}`}
        className="max-w-full overflow-hidden"
      >
        <rect width={totalWidth} height={barHeight} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={2}
            width={bar.w}
            height={barHeight - 4}
            fill="#111827"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-gray-800 font-bold mt-1 uppercase">
          {value}
        </span>
      )}
    </div>
  );
};

export const QrCodePlaceholder: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 64,
  className = '',
}) => {
  // Deterministic SVG QR-like pattern matrix
  const matrixSize = 13;
  const cellSize = size / matrixSize;
  const hash = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const cells: { r: number; c: number }[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Corner locator boxes
      const isTopLeft = r < 3 && c < 3;
      const isTopRight = r < 3 && c >= matrixSize - 3;
      const isBottomLeft = r >= matrixSize - 3 && c < 3;

      if (isTopLeft || isTopRight || isBottomLeft) {
        if (
          r === 0 ||
          r === 2 ||
          c === 0 ||
          c === 2 ||
          r === matrixSize - 1 ||
          r === matrixSize - 3 ||
          c === matrixSize - 1 ||
          c === matrixSize - 3 ||
          (r === 1 && c === 1) ||
          (r === 1 && c === matrixSize - 2) ||
          (r === matrixSize - 2 && c === 1)
        ) {
          cells.push({ r, c });
        }
      } else {
        // Inner data pattern
        if ((r * 7 + c * 13 + hash) % 3 === 0 || (r + c + hash) % 4 === 1) {
          cells.push({ r, c });
        }
      }
    }
  }

  return (
    <div className={`inline-block bg-white p-1 rounded border border-gray-300 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#ffffff" />
        {cells.map((cell, idx) => (
          <rect
            key={idx}
            x={cell.c * cellSize}
            y={cell.r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#111827"
          />
        ))}
      </svg>
    </div>
  );
};
