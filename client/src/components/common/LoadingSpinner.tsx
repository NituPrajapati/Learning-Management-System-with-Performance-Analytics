export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#141413]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#08A696] border-t-transparent" />
      {label ? <span>{label}</span> : null}
    </div>
  )
}


