interface Props {
  loaded: number
  total: number
}

export function LoadingOverlay({ loaded, total }: Props) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-[9999] bg-dash-950/95 flex flex-col items-center justify-center gap-6">
      <span className="text-white font-bold text-xl">InPost</span>

      <div className="w-80 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Pobieranie sieci paczkomatów…</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-2 bg-dash-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-inpost-yellow rounded-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${pct}%` }}
          >
            <span className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        {total > 0 && (
          <p className="text-xs text-gray-500 text-center font-mono">
            {loaded.toLocaleString('pl-PL')} / {total.toLocaleString('pl-PL')} punktów
          </p>
        )}
      </div>
    </div>
  )
}
