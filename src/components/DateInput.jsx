import { useState, useEffect, useRef } from 'react'

/**
 * DateInput — แสดงผลเป็น dd/mm/พ.ศ., รับ/ส่งค่าเป็น yyyy-mm-dd (ค.ศ.)
 * ผู้ใช้พิมพ์ปีเป็น พ.ศ. (เช่น 2569) หรือ ค.ศ. (เช่น 2026) ก็รองรับทั้งคู่
 */
export default function DateInput({ value = '', onChange, style, placeholder = 'dd/mm/ปปปป', disabled, required }) {
  const pickerRef = useRef(null)
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  // ค.ศ. ISO → dd/mm/พ.ศ.
  const toDisplay = (iso) => {
    if (!iso || !String(iso).includes('-')) return ''
    const s = String(iso).slice(0, 10)
    const [y, m, d] = s.split('-')
    if (!y || !m || !d) return ''
    const numY = parseInt(y, 10)
    // ปี ค.ศ. < 2400 → บวก 543 ให้เป็น พ.ศ.
    const beYear = numY < 2400 ? numY + 543 : numY
    return `${d}/${m}/${beYear}`
  }

  // dd/mm/ปปปป (พ.ศ. หรือ ค.ศ.) → yyyy-mm-dd (ค.ศ.)
  const toISO = (display) => {
    if (!display) return ''
    const parts = display.replace(/[^\d/]/g, '').split('/')
    if (parts.length !== 3) return ''
    const [d, m, y] = parts
    if (!d || !m || !y || y.length !== 4) return ''
    const numY = parseInt(y, 10)
    // ถ้าปี >= 2400 ถือว่าเป็น พ.ศ. → แปลงเป็น ค.ศ.
    const ceYear = numY >= 2400 ? numY - 543 : numY
    const iso = `${ceYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    const dt = new Date(iso)
    if (isNaN(dt.getTime())) return ''
    return iso
  }

  // sync display เมื่อ value เปลี่ยนจากภายนอก (ไม่ใช่ขณะพิมพ์)
  useEffect(() => {
    if (!focused) setText(toDisplay(value))
  }, [value, focused])

  const handleTextChange = (e) => {
    let raw = e.target.value
    if (!focused) return
    const prev = text
    // auto-insert / ที่ตำแหน่ง 2 และ 5
    if (raw.length === 2 && prev.length === 1 && !raw.includes('/')) raw = raw + '/'
    if (raw.length === 5 && prev.length === 4 && raw.split('/').length === 2) raw = raw + '/'
    setText(raw)
    const iso = toISO(raw)
    if (iso) onChange?.(iso)
    else if (!raw) onChange?.('')
  }

  const handleBlur = () => {
    setFocused(false)
    const iso = toISO(text)
    if (iso) { onChange?.(iso); setText(toDisplay(iso)) }
    else if (!text) { onChange?.(''); setText('') }
    else setText(toDisplay(value)) // revert ถ้า invalid
  }

  const openPicker = () => {
    try { pickerRef.current?.showPicker?.() } catch { pickerRef.current?.click?.() }
  }

  const baseStyle = {
    padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 6,
    fontSize: 13, outline: 'none', background: disabled ? '#f8fafc' : '#fff',
    color: disabled ? '#94a3b8' : '#1e293b', cursor: disabled ? 'default' : 'text',
    ...style,
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: style?.width || '100%' }}>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onFocus={() => { setFocused(true); setText(toDisplay(value) || text) }}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        required={required}
        style={{ ...baseStyle, paddingRight: 28, flex: 1, width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 4, background: 'none', border: 'none',
          cursor: disabled ? 'default' : 'pointer', padding: 0, lineHeight: 1,
          fontSize: 14, color: '#94a3b8',
        }}
      >📅</button>
      {/* hidden native date picker — ใช้ ค.ศ. เพื่อให้ browser เข้าใจ */}
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        onChange={e => {
          onChange?.(e.target.value)
          setText(toDisplay(e.target.value))
        }}
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none', top: 0, left: 0 }}
      />
    </div>
  )
}
