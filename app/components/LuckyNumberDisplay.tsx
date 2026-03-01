import React from 'react';

type CharityId = "children" | "animal" | "water" | "climate";

interface LuckyNumberDisplayProps {
  showNumbers: boolean;
  luckyNumbers: number[];
  paymentStatus: "idle" | "success" | "error";
  getSelectedCharityName: () => string;
}

export const LuckyNumberDisplay: React.FC<LuckyNumberDisplayProps> = ({
  showNumbers,
  luckyNumbers,
  paymentStatus,
  getSelectedCharityName,
}) => {
  if (!showNumbers && paymentStatus !== "success") return null;

  return (
    <div className="mt-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p className="text-xl text-green-400 font-medium">Donation Successful!</p>
        <p className="text-gray-400 text-sm mt-1">
          You supported <span className="text-white font-bold">{getSelectedCharityName()}</span>.
        </p>
      </div>
      <div className="flex flex-col items-center">
        <p className="text-green-500 text-xs font-mono uppercase tracking-widest mb-4">
          Your Lucky Sequence
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {luckyNumbers.map((num, idx) => (
            <div
              key={idx}
              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-2 border-green-500/50 bg-gradient-to-b from-green-900/50 to-black text-2xl md:text-3xl font-mono font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-in zoom-in spin-in-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
