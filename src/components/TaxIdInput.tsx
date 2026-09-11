import React, { useRef } from 'react';

interface TaxIdInputProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export const TaxIdInput: React.FC<TaxIdInputProps> = ({ value, onChange, readOnly = false, compact = true }) => {
  // Ensure we have 13 digits padded
  const cleanDigits = (value || '').replace(/\D/g, '').slice(0, 13);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, char: string) => {
    const digit = char.slice(-1).replace(/\D/g, '');
    const chars = cleanDigits.padEnd(13, ' ').split('');
    chars[index] = digit || ' ';
    const newValue = chars.join('').trimEnd();
    onChange(newValue);

    if (digit && index < 12) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cleanDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 12) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 13);
    onChange(pasted);
  };

  // Grouping 1 - 4 - 5 - 2 - 1 for Thai Tax ID
  const groups = [
    { start: 0, end: 1 },
    { start: 1, end: 5 },
    { start: 5, end: 10 },
    { start: 10, end: 12 },
    { start: 12, end: 13 },
  ];

  const boxSize = compact
    ? 'w-4 h-5 text-[11px]'
    : 'w-5 h-6 text-xs';

  return (
    <div className="inline-flex items-center gap-1" onPaste={handlePaste}>
      {groups.map((grp, gIdx) => (
        <React.Fragment key={gIdx}>
          <div className="inline-flex">
            {Array.from({ length: grp.end - grp.start }).map((_, i) => {
              const digitIdx = grp.start + i;
              const char = cleanDigits[digitIdx] || '';
              return (
                <input
                  key={digitIdx}
                  ref={(el) => { inputsRef.current[digitIdx] = el; }}
                  type="text"
                  maxLength={1}
                  value={char}
                  disabled={readOnly}
                  onChange={(e) => handleDigitChange(digitIdx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(digitIdx, e)}
                  onFocus={(e) => e.target.select()}
                  className={`${boxSize} text-center font-mono font-semibold border border-slate-300 first:rounded-l-xs last:rounded-r-xs -ml-[1px] first:ml-0 bg-white focus:bg-orange-50 focus:border-orange-500 focus:z-10 focus:outline-none transition-colors print:border-slate-400 print:text-black print:h-4.5 print:w-3.5 print:text-[10px]`}
                  title={`หลักที่ ${digitIdx + 1}`}
                />
              );
            })}
          </div>
          {gIdx < groups.length - 1 && (
            <span className="text-slate-400 font-bold text-[10px] select-none print:text-slate-600">-</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
