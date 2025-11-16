export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="filterbar bg-white rounded-lg border border-neutral-200 p-3 md:p-4 lg:p-5 flex flex-wrap items-end gap-3 md:gap-4 shadow-md">
      {children}
    </div>
  )
}


