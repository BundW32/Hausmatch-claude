import React, { useEffect, useId, useRef, useState } from 'react';
import { loadPlaces, Place, stateName, suggestPlaces } from '../../services/places';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Wird aufgerufen, wenn ein Vorschlag gewählt wurde (liefert den amtlichen Ortsnamen). */
  onPick?: (place: Place) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  name?: string;
}

/**
 * Stadtfeld mit Vorschlägen aus dem Ortsverzeichnis. Akzeptiert Ortsnamen und Postleitzahlen.
 * Die eigentliche Prüfung (gibt es den Ort?) macht der Aufrufer mit findPlace() beim Absenden.
 */
export const CityInput: React.FC<Props> = ({ id, value, onChange, onPick, placeholder, className = 'input', invalid, describedBy, name = 'city' }) => {
  const listId = useId();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const ensureLoaded = () => {
    if (!places) loadPlaces().then(setPlaces).catch(() => undefined);
  };
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const suggestions = places && open ? suggestPlaces(places, value) : [];
  const showList = open && suggestions.length > 0;

  const pick = (p: Place) => {
    onChange(p.name);
    onPick?.(p);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        maxLength={80}
        className={className}
        placeholder={placeholder}
        value={value}
        onFocus={() => {
          ensureLoaded();
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onChange={e => {
          ensureLoaded();
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 sm:right-auto sm:min-w-full sm:w-[24rem] max-w-[calc(100vw-2rem)] top-full mt-1.5 bg-white text-ink border border-slate-200 rounded-xl shadow-[0_24px_48px_-20px_rgba(10,31,99,0.45)] overflow-hidden text-left">
          {suggestions.map((p, i) => (
            <li
              key={`${p.name}-${p.state}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={e => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-4 py-2.5 flex items-baseline justify-between gap-3 cursor-pointer ${i === active ? 'bg-tint' : ''}`}
            >
              <span className="font-medium truncate">{p.name}</span>
              <span className="text-sm text-slate-500 shrink-0">{p.plz.length === 1 ? `${p.plz[0]} · ` : ''}{stateName(p.state)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Hinweistext, wenn ein Ort nicht gefunden wurde – mit bis zu drei Vorschlägen. */
export const cityErrorText = (input: string, suggestions: Place[]) =>
  suggestions.length > 0
    ? `„${input.trim()}“ kennen wir nicht. Meinten Sie ${suggestions.slice(0, 3).map(s => s.name).join(', ')}?`
    : `„${input.trim()}“ kennen wir nicht. Bitte geben Sie einen Ort in Deutschland oder eine Postleitzahl ein.`;
