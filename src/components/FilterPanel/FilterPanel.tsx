import { memo, useEffect, useRef, useState } from 'react'
import type { AdvancedFilter } from '../../types/inpost'
import { DEFAULT_ADVANCED_FILTER } from '../../types/inpost'
import type { PhysicalType } from '../../types/inpost'
import { PHYSICAL_TYPE_LABELS, PROVINCE_POPULATION } from '../../utils/constants'

interface Props {
  filter: AdvancedFilter
  onChange: (f: AdvancedFilter) => void
  totalFiltered: number
  totalAll: number
  zones: string[]
  agencies: string[]
  cities: string[]
}

const PROVINCES = Object.keys(PROVINCE_POPULATION).sort((a, b) => a.localeCompare(b, 'pl'))

function countActive(f: AdvancedFilter): number {
  return (
    (f.physicalTypes.length > 0 ? 1 : 0) +
    (f.status !== '' ? 1 : 0) +
    (f.city.trim() ? 1 : 0) +
    (f.province ? 1 : 0) +
    (f.zone.trim() ? 1 : 0) +
    (f.agency.trim() ? 1 : 0)
  )
}

function toggleItem<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

const ZoneAutocomplete = memo(function ZoneAutocomplete({
  value,
  zones,
  onChange,
  showGroupOption = false,
}: {
  value: string
  zones: string[]
  onChange: (v: string) => void
  showGroupOption?: boolean
}) {
  const [inputValue, setInputValue] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // sync local input when external value resets (e.g. clear filters)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setInputValue(value) }, [value])

  const suggestions =
    inputValue.trim().length >= 2
      ? zones.filter((z) => z.toLowerCase().includes(inputValue.trim().toLowerCase())).slice(0, 50)
      : []

  function handleBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true) }}
          onFocus={() => { if (inputValue.trim().length >= 2) setOpen(true) }}
          placeholder="wpisz 2 litery…"
          className="w-full px-3 py-2 rounded-lg bg-dash-800 border border-dash-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-inpost-yellow/50 transition pr-7"
        />
        {inputValue && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setInputValue(''); onChange('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition text-xs"
          >
            ✕
          </button>
        )}
      </div>
      {open && (showGroupOption ? suggestions.length > 0 || inputValue.trim().length >= 2 : suggestions.length > 0) && (
        <ul className="absolute z-[500] top-full left-0 right-0 mt-1 bg-dash-800 border border-dash-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {showGroupOption && inputValue.trim().length >= 2 && (
            <li key="__group__">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(inputValue.trim()); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 text-inpost-yellow hover:bg-inpost-yellow/10 border-b border-dash-700"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <span>Cała strefa „{inputValue.trim()}"</span>
              </button>
            </li>
          )}
          {suggestions.map((z) => (
            <li key={z}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setInputValue(z); onChange(z); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition font-mono ${
                  z === value ? 'bg-inpost-yellow/10 text-inpost-yellow' : 'text-gray-300 hover:bg-dash-700 hover:text-white'
                }`}
              >
                {z}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export function FilterPanel({ filter, onChange, totalFiltered, totalAll, zones, agencies, cities }: Props) {
  const [open, setOpen] = useState(false)
  const active = countActive(filter)

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
            open || active > 0
              ? 'bg-dash-800 border-inpost-yellow/40 text-white'
              : 'bg-dash-900 border-dash-700 text-gray-400 hover:text-white hover:border-dash-600'
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
          </svg>
          Filtry
          {active > 0 && (
            <span className="bg-inpost-yellow text-inpost-black text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {active}
            </span>
          )}
          <svg
            viewBox="0 0 20 20" fill="currentColor"
            className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {active > 0 && (
          <>
            <span className="text-xs text-gray-500 font-mono">
              {totalFiltered.toLocaleString('pl-PL')} / {totalAll.toLocaleString('pl-PL')} punktów
            </span>
            <button
              onClick={() => onChange(DEFAULT_ADVANCED_FILTER)}
              className="text-xs text-gray-500 hover:text-red-400 transition underline underline-offset-2"
            >
              wyczyść filtry
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="mt-2 w-72 bg-dash-900 border border-dash-700 rounded-xl p-5 shadow-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="space-y-5">
            {/* Typ modelu */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Typ modelu</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {(Object.entries(PHYSICAL_TYPE_LABELS) as [PhysicalType, string][]).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filter.physicalTypes.includes(val)}
                      onChange={() => onChange({ ...filter, physicalTypes: toggleItem(filter.physicalTypes, val) })}
                      className="w-4 h-4 rounded border-dash-600 bg-dash-800 accent-inpost-yellow cursor-pointer shrink-0"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Status</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(['', 'Operating', 'non_operating'] as const).map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status-filter"
                      checked={filter.status === val}
                      onChange={() => onChange({ ...filter, status: val })}
                      className="w-4 h-4 border-dash-600 bg-dash-800 accent-inpost-yellow cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">
                      {val === '' ? 'Wszystkie' : val === 'Operating' ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Miasto */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Miasto</p>
              <ZoneAutocomplete
                value={filter.city}
                zones={cities}
                onChange={(v) => onChange({ ...filter, city: v })}
              />
            </div>

            {/* Województwo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Województwo</p>
              <select
                value={filter.province}
                onChange={(e) => onChange({ ...filter, province: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dash-800 border border-dash-700 text-sm text-white focus:outline-none focus:border-inpost-yellow/50 transition cursor-pointer"
              >
                <option value="">Wszystkie</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Strefa */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Strefa doręczeń</p>
              <ZoneAutocomplete
                value={filter.zone}
                zones={zones}
                onChange={(v) => onChange({ ...filter, zone: v })}
                showGroupOption
              />
            </div>

            {/* Agencja */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Agencja</p>
              <ZoneAutocomplete
                value={filter.agency}
                zones={agencies}
                onChange={(v) => onChange({ ...filter, agency: v })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-dash-700">
            <button
              onClick={() => onChange(DEFAULT_ADVANCED_FILTER)}
              className="px-4 py-2 bg-dash-800 border border-dash-700 text-gray-400 text-sm rounded-lg hover:text-white transition"
            >
              Wyczyść
            </button>
            <span className="ml-auto text-xs text-gray-600 font-mono">
              {totalFiltered.toLocaleString('pl-PL')} / {totalAll.toLocaleString('pl-PL')} punktów
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
