import { Switch, inputCls } from './ui'

/** "This offering includes volunteer or work exchange", with a line on what the work is. Used when creating and editing offerings. */
export function VolunteerFields({ on, details, onChange }: { on: boolean; details: string; onChange: (on: boolean, details: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-surface-2 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ink">Volunteer or work exchange</span>
          <span className="text-xs text-subtle">Guests give some hours (garden, kitchen, building, teaching) in exchange for part or all of the stay</span>
        </div>
        <Switch on={on} onChange={(v) => onChange(v, details)} label="Includes volunteer or work exchange" />
      </div>
      {on && (
        <textarea rows={3} value={details} onChange={(e) => onChange(true, e.target.value)} aria-label="What the volunteer work involves"
          placeholder="e.g. 4 hours a day in the garden, 5 days a week, in exchange for a shared room and meals"
          className={`${inputCls} resize-none py-3 leading-relaxed`} />
      )}
    </div>
  )
}
