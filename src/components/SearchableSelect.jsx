import { useState, useRef, useEffect } from 'react'

/**
 * SearchableSelect — dropdown with search/filter
 * Props:
 *   value       : string (current selected value)
 *   onChange    : (value: string) => void
 *   options     : [{ value, label }]
 *   allLabel    : label for empty/"all" option e.g. "ทุก รพ."
 *   placeholder : shown when nothing selected (no allLabel)
 *   style       : extra style on wrapper div
 *   inputStyle  : extra style on trigger button
 *   disabled    : boolean
 */
export default function SearchableSelect({
  value = '',
  onChange,
  options = [],
  allLabel = '',
  placeholder = '-- เลือก --',
  style = {},
  inputStyle = {},
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef()
  const inputRef = useRef()

  const selected = options.find(o => String(o.value) === String(value))
  const isEmpty = value === '' || value === null || value === undefined
  const displayLabel = !isEmpty && selected ? selected.label : (allLabel || placeholder)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (val) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 30px 8px 12px', border: '1.5px solid #e2e8f0',
          borderRadius: 8, fontSize: 13, background: disabled ? '#f8fafc' : '#fff',
          color: isEmpty ? '#94a3b8' : '#1e293b', cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
          boxSizing: 'border-box', outline: 'none', whiteSpace: 'nowrap',
          overflow: 'hidden', position: 'relative', minWidth: 0,
          ...inputStyle,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayLabel}</span>
        <span style={{ position: 'absolute', right: 10, fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          minWidth: '100%', width: 'max-content', maxWidth: 360,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.13)', zIndex: 9999, overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 ค้นหาชื่อ รพ. ..."
              style={{
                width: '100%', padding: '6px 10px', border: '1.5px solid #3b82f6',
                borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {allLabel && (
              <div
                onClick={() => select('')}
                style={{
                  padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                  background: isEmpty ? '#eff6ff' : '#fff',
                  color: isEmpty ? '#1d4ed8' : '#64748b',
                  fontWeight: isEmpty ? 600 : 400,
                  borderBottom: '1px solid #f8fafc',
                }}
                onMouseEnter={e => { if (!isEmpty) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!isEmpty) e.currentTarget.style.background = '#fff' }}
              >
                {allLabel}
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                ไม่พบ รพ. ที่ค้นหา
              </div>
            ) : filtered.map(o => {
              const isSel = String(o.value) === String(value)
              return (
                <div
                  key={o.value}
                  onClick={() => select(String(o.value))}
                  style={{
                    padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                    background: isSel ? '#eff6ff' : '#fff',
                    color: isSel ? '#1d4ed8' : '#1e293b',
                    fontWeight: isSel ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? '#eff6ff' : '#fff' }}
                >
                  {o.label}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
