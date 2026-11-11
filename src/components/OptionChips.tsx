'use client';

import { TONES, LENGTHS, type Tone, type Length } from '@/lib/generator';

interface OptionChipsProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  label: string;
}

function OptionChips<T extends string>({ options, selected, onSelect, label }: OptionChipsProps<T>) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2 font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 scale-105'
                  : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ToneSelector({ selected, onSelect }: { selected: Tone; onSelect: (t: Tone) => void }) {
  return <OptionChips options={TONES} selected={selected} onSelect={onSelect} label="لحن متن" />;
}

export function LengthSelector({ selected, onSelect }: { selected: Length; onSelect: (l: Length) => void }) {
  return <OptionChips options={LENGTHS} selected={selected} onSelect={onSelect} label="طول متن" />;
}
