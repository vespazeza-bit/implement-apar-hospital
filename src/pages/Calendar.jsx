import { useState } from 'react'
import { useApp } from '../context/AppContext'
import SearchableSelect from '../components/SearchableSelect'
import DateInput from '../components/DateInput'

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const DAY_W = 40   // month view: pixels per day
const ROW_H = 46
const YEAR_ROW_H = 72   // year view project: tall card rows
const YEAR_ROW_H_P = 44  // year view person: compact rows
const LABEL_W = 230

const QUARTER_COLORS = ['#eff6ff', '#f0fdf4', '#fefce8', '#fff7ed']

const STATUS_COLORS = {
  waiting: '#6b7280', planning: '#ca8a04', advance: '#ea580c',
  inprog: '#0891b2', deliver: '#1d4ed8', revisit: '#db2777',
  accounting: '#7c3aed', closed: '#16a34a',
}
const STATUS_LABELS = {
  waiting: 'รอดำเนินการ', planning: 'วางแผนงาน', advance: 'จัดทำ Adv',
  inprog: 'กำลังดำเนินการ', deliver: 'ส่งมอบงาน', revisit: 'Revisit',
  accounting: 'ส่งต่อบัญชี', closed: 'ปิดโครงการ',
}

const PROJECT_STATUS = [
  { value: 'waiting',    label: 'รอดำเนินการ',       color: '#6b7280', bg: '#f3f4f6',  border: '#d1d5db' },
  { value: 'planning',   label: 'วางแผนงาน',          color: '#ca8a04', bg: '#fefce8',  border: '#fde047' },
  { value: 'advance',    label: 'จัดทำ Adv',           color: '#ea580c', bg: '#fff7ed',  border: '#fdba74' },
  { value: 'inprog',     label: 'กำลังดำเนินการ',     color: '#0891b2', bg: '#ecfeff',  border: '#67e8f9' },
  { value: 'deliver',    label: 'ส่งมอบงาน',          color: '#1d4ed8', bg: '#eff6ff',  border: '#93c5fd' },
  { value: 'revisit',    label: 'Revisit',             color: '#db2777', bg: '#fdf2f8',  border: '#f9a8d4' },
  { value: 'accounting', label: 'ส่งต่อบัญชี',       color: '#7c3aed', bg: '#f5f3ff',  border: '#c4b5fd' },
  { value: 'closed',     label: 'ปิดโครงการ',         color: '#16a34a', bg: '#f0fdf4',  border: '#86efac' },
]
const INSTALL_TYPES = ['ติดตั้งระบบ', 'เข้า Revisit', 'เข้า Office']

const formatDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  const numY = parseInt(y, 10)
  // แสดงเป็น พ.ศ. เสมอ (บวก 543 ถ้าเป็น ค.ศ.)
  const beYear = numY < 2400 ? numY + 543 : numY
  return `${day}/${m}/${beYear}`
}
const toDateStr = (d) => d ? String(d).slice(0, 10) : ''

const toCEDateStr = (d) => {
  if (!d) return ''
  const s = String(d).slice(0, 10)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return s
  const y = parseInt(m[1], 10)
  return y >= 2400 ? `${y - 543}-${m[2]}-${m[3]}` : s
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function dayOfYear(dateStr, year) {
  const d = new Date(dateStr)
  const start = new Date(year, 0, 1)
  return Math.max(1, Math.round((d - start) / 86400000) + 1)
}

// ─── TeamInput ────────────────────────────────────────────────────────────────
function TeamInput({ team, onChange }) {
  const allMembers = (() => {
    try { return JSON.parse(localStorage.getItem('teamMembers') || '[]') } catch { return [] }
  })()
  const [selected, setSelected] = useState('')
  const available = allMembers.filter(m => !team.some(t => String(t.memberId) === String(m.id)))

  const addMember = () => {
    const member = allMembers.find(m => String(m.id) === selected)
    if (!member || team.some(t => String(t.memberId) === selected)) return
    onChange([...team, { id: Date.now(), memberId: String(member.id), name: member.name, role: member.position || '' }])
    setSelected('')
  }
  const remove = (id) => onChange(team.filter(m => m.id !== id))
  const updateRole = (id, role) => onChange(team.map(m => m.id === id ? { ...m, role } : m))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">-- เลือกทีมงาน --</option>
          {available.map(m => <option key={m.id} value={m.id}>{m.name}{m.position ? ` (${m.position})` : ''}</option>)}
        </select>
        <button type="button" onClick={addMember} disabled={!selected}
          style={{ padding: '8px 16px', background: selected ? '#0891b2' : '#e2e8f0', color: selected ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'default' }}>
          + เพิ่ม
        </button>
      </div>
      {team.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {team.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ width: 22, height: 22, background: '#1e3a5f', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
              <input value={m.role} onChange={e => updateRole(m.id, e.target.value)} placeholder="บทบาท"
                style={{ width: 140, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
              <button type="button" onClick={() => remove(m.id)}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 12 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FormSection ─────────────────────────────────────────────────────────────
function FormSection({ num, title, children }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 14, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #eff6ff', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: '#1e3a5f', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{num}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

const LS = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const IS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const { hospitals, projectPlans, teamMembers, updatePlan } = useApp()
  const today = new Date()

  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewMode, setViewMode]   = useState('project')
  const [timeRange, setTimeRange] = useState('month')

  const viewBy = viewMode === 'person' ? 'person' : 'project'
  const filterInstallType = INSTALL_TYPES.includes(viewMode) ? viewMode : ''

  const [editForm, setEditForm] = useState(null)
  const [tooltip, setTooltip] = useState(null) // { plan, x, y }

  const showTooltip = (plan, e) => setTooltip({ plan, x: e.clientX, y: e.clientY })
  const moveTooltip = (e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
  const hideTooltip = () => setTooltip(null)

  // ── Normalize plan dates ──────────────────────────────────────────────────
  const enrichedPlans = projectPlans
    .filter(p => p.startDate)
    .map(p => {
      const startDate = toCEDateStr(p.startDate)
      const endDate   = toCEDateStr(p.endDate) || startDate
      return {
        ...p,
        hospitalName: hospitals.find(h => String(h.id) === String(p.hospitalId))?.name || '',
        startDate,
        endDate,
        revisit1: toCEDateStr(p.revisit1),
        revisit2: toCEDateStr(p.revisit2),
      }
    })

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevPeriod = () => {
    if (timeRange === 'year') { setViewYear(y => y - 1); return }
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1)
  }
  const nextPeriod = () => {
    if (timeRange === 'year') { setViewYear(y => y + 1); return }
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1)
  }

  // ── Month view dimensions ─────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // ── Year view — percentage-based (responsive, all 12 months always visible) ─
  const totalDaysInYear = Array.from({ length: 12 }, (_, m) => getDaysInMonth(viewYear, m))
    .reduce((a, b) => a + b, 0)

  const monthColsPct = (() => {
    let offDays = 0
    return Array.from({ length: 12 }, (_, m) => {
      const d = getDaysInMonth(viewYear, m)
      const col = {
        m,
        leftPct:  offDays / totalDaysInYear * 100,
        widthPct: d / totalDaysInYear * 100,
        daysInM:  d,
      }
      offDays += d
      return col
    })
  })()

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  // ── Filter plans ──────────────────────────────────────────────────────────
  const visiblePlans = enrichedPlans.filter(p => {
    if (filterInstallType && p.installType !== filterInstallType) return false
    if (timeRange === 'month') {
      return p.startDate.substring(0, 7) <= monthStr && p.endDate.substring(0, 7) >= monthStr
    }
    return p.startDate.substring(0, 4) <= String(viewYear) && p.endDate.substring(0, 4) >= String(viewYear)
  })

  // ── Build rows ────────────────────────────────────────────────────────────
  let rows = []
  if (viewBy === 'project') {
    rows = visiblePlans.map(p => ({
      key: `proj_${p.id}`,
      label: p.hospitalName || p.projectName,
      sub1: p.hospitalName && p.projectName !== p.hospitalName ? `📋 ${p.projectName}` : '',
      sub2: p.siteOwner ? `👤 ${p.siteOwner}` : '',
      plans: [p],
    }))
  } else {
    const pmap = new Map()
    visiblePlans.forEach(plan => {
      const add = (name, role) => {
        if (!pmap.has(name)) pmap.set(name, { name, role, plans: [] })
        pmap.get(name).plans.push(plan)
      }
      if (plan.siteOwner) add(plan.siteOwner, 'เจ้าของไซต์')
      plan.team?.forEach(m => m.name && add(m.name, m.role || ''))
    })
    rows = Array.from(pmap.values()).map(person => ({
      key: `person_${person.name}`,
      label: person.name,
      sub1: person.role,
      sub2: `${person.plans.length} โครงการ`,
      plans: person.plans,
    }))
  }

  // ── Bar helpers — month view (pixels) ─────────────────────────────────────
  const getBarMonth = (s, e) => {
    if (!s) return null
    const sd = new Date(s), ed = new Date(e || s)
    const ms = new Date(viewYear, viewMonth, 1)
    const me = new Date(viewYear, viewMonth, daysInMonth)
    if (sd > me || ed < ms) return null
    const sd2 = sd < ms ? 1 : sd.getDate()
    const ed2 = ed > me ? daysInMonth : ed.getDate()
    return { left: (sd2 - 1) * DAY_W, width: (ed2 - sd2 + 1) * DAY_W - 4, isPct: false }
  }

  // ── Bar helpers — year view (percentage) ──────────────────────────────────
  const getBarYear = (s, e) => {
    if (!s) return null
    const sd = new Date(s), ed = new Date(e || s)
    const ys = new Date(viewYear, 0, 1), ye = new Date(viewYear, 11, 31)
    if (sd > ye || ed < ys) return null
    const sDay = sd < ys ? 0 : dayOfYear(s, viewYear) - 1
    const eDay = ed > ye ? totalDaysInYear : dayOfYear(e || s, viewYear)
    const leftPct  = sDay / totalDaysInYear * 100
    const widthPct = Math.max(0.4, (eDay - sDay) / totalDaysInYear * 100)
    return { leftPct, widthPct, isPct: true }
  }

  const getBar = (s, e) => timeRange === 'month' ? getBarMonth(s, e) : getBarYear(s, e)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getDow    = (d) => new Date(viewYear, viewMonth, d).getDay()
  const isWeekend = (d) => { const dw = getDow(d); return dw === 0 || dw === 6 }
  const isToday   = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  // Today line position
  const todayLinePx  = timeRange === 'month' && viewMonth === today.getMonth() && viewYear === today.getFullYear()
    ? (today.getDate() - 1) * DAY_W + DAY_W / 2 : null
  const todayLinePct = timeRange === 'year' && viewYear === today.getFullYear()
    ? (dayOfYear(today.toISOString().split('T')[0], viewYear) - 1) / totalDaysInYear * 100 : null

  // Width for horizontal scroll container
  const totalW = LABEL_W + (timeRange === 'month' ? daysInMonth * DAY_W : 0)

  // ── Edit modal ────────────────────────────────────────────────────────────
  const openEdit = (plan) => setEditForm({
    ...plan,
    onlineStart: toDateStr(plan.onlineStart), onlineEnd: toDateStr(plan.onlineEnd),
    startDate:   toDateStr(plan.startDate),   endDate:   toDateStr(plan.endDate),
    revisit1:    toDateStr(plan.revisit1),    revisit2:  toDateStr(plan.revisit2),
  })
  const setEF = (k) => (e) => setEditForm(p => ({ ...p, [k]: e.target.value }))

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.projectName || !editForm.hospitalId) return alert('กรุณากรอกชื่อโครงการและเลือกโรงพยาบาล')
    await updatePlan(editForm.id, editForm)
    setEditForm(null)
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📅 ปฏิทินปฏิบัติงาน</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>แสดงแผนการดำเนินงานในรูปแบบไทม์ไลน์ตามโครงการหรือรายคน</p>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>แสดงแบบ</div>
            <select value={viewMode} onChange={e => setViewMode(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #1e3a5f', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1e3a5f', background: '#eff6ff', cursor: 'pointer', minWidth: 190 }}>
              <option value="project">📋 ตามโครงการ (ทั้งหมด)</option>
              <option value="เข้า Revisit">🔄 เข้า Revisit</option>
              <option value="เข้า Office">🏢 เข้า Office</option>
              <option value="person">👤 ตามรายคน</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>ช่วงเวลา</div>
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #0891b2', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0891b2', background: '#f0f9ff', cursor: 'pointer', minWidth: 130 }}>
              <option value="month">📅 รายเดือน</option>
              <option value="year">📆 รายปี</option>
            </select>
          </div>

          {timeRange === 'month' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>เดือนที่แสดง</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 130 }}>
                  {THAI_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 100 }}>
                  {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>พ.ศ. {y + 543}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {timeRange === 'year' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>ปีที่แสดง</div>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
                style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 140 }}>
                {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>พ.ศ. {y + 543}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, alignSelf: 'flex-end' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>🏥 ทั้งหมด <strong style={{ color: '#059669' }}>{enrichedPlans.length}</strong> โครงการ</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>แสดง <strong style={{ color: '#1e3a5f' }}>{rows.length}</strong> {viewBy === 'person' ? 'คน' : 'โครงการ'}</div>
          </div>
        </div>
      </div>

      {/* Timeline card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Period nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(135deg, #1e3a5f 0%, #1a2d4a 100%)', borderBottom: '2px solid #0891b2' }}>
          <button onClick={prevPeriod} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 20px', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>‹</button>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>
            {timeRange === 'month'
              ? <>{THAI_MONTHS[viewMonth]} พ.ศ. {viewYear + 543}</>

              : `ปี พ.ศ. ${viewYear + 543}`}
          </div>
          <button onClick={nextPeriod} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 20px', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>›</button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MONTH VIEW — pixel-based, horizontal scroll
        ════════════════════════════════════════════════════════════════════ */}
        {timeRange === 'month' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: totalW }}>

              {/* Month header */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 20 }}>
                <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', borderRight: '2px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
                  {viewBy === 'person' ? '👤 ทีมงาน' : '📋 โครงการ / รพ.'}
                </div>
                <div style={{ display: 'flex' }}>
                  {days.map(d => {
                    const dow = getDow(d)
                    return (
                      <div key={d} style={{
                        width: DAY_W, minWidth: DAY_W, textAlign: 'center', padding: '6px 0',
                        borderRight: '1px solid #e2e8f0',
                        background: isToday(d) ? '#1e3a5f' : isWeekend(d) ? '#fef9ec' : 'transparent',
                        color: isToday(d) ? '#fff' : dow === 0 ? '#dc2626' : dow === 6 ? '#0891b2' : '#374151',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d}</div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>{THAI_DAYS_SHORT[dow]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section label */}
              {rows.length > 0 && <SectionLabel viewBy={viewBy} count={rows.length} />}

              {/* Rows */}
              {rows.length === 0 ? <EmptyState /> : rows.map(row => {
                const nPlans = row.plans.length
                const dynamicH = Math.max(ROW_H, nPlans > 1 ? nPlans * 30 + 10 : ROW_H)
                return (
                  <div key={row.key} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', minHeight: dynamicH, alignItems: 'stretch' }}>
                    <RowLabel row={row} viewBy={viewBy} compact={false} />
                    <div style={{ position: 'relative', flex: 1, minHeight: dynamicH, overflow: 'hidden' }}>
                      {/* Weekend bg */}
                      {days.map(d => isWeekend(d) && (
                        <div key={d} style={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, width: DAY_W, height: '100%', background: 'rgba(254,243,199,0.4)', pointerEvents: 'none' }} />
                      ))}
                      {/* Today line */}
                      {todayLinePx !== null && (
                        <div style={{ position: 'absolute', left: todayLinePx, top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.35, pointerEvents: 'none' }} />
                      )}
                      {row.plans.map((plan, pi) => {
                        const bar = getBarMonth(plan.startDate, plan.endDate)
                        const r1  = plan.revisit1 ? getBarMonth(plan.revisit1, plan.revisit1) : null
                        const r2  = plan.revisit2 ? getBarMonth(plan.revisit2, plan.revisit2) : null
                        const sc  = STATUS_COLORS[plan.status] || '#059669'
                        const barTop = 6 + pi * (nPlans > 1 ? 30 : 0)
                        const barH   = Math.max(12, (nPlans > 1 ? 26 : dynamicH - 12))
                        const lbl    = getBarLabel(plan, viewBy, viewMode, teamMembers)
                        return (
                          <span key={plan.id}>
                            {bar && (
                              <BarDiv bar={{ left: bar.left + 2, width: bar.width }} barTop={barTop} barH={barH} sc={sc} label={lbl} plan={plan} onClick={() => openEdit(plan)} />
                            )}
                            {r1 && <RevisitDot style={{ left: r1.left + 2 }} barTop={barTop} barH={barH} label="R1" color="#f59e0b" plan={plan} onClick={() => openEdit(plan)} />}
                            {r2 && <RevisitDot style={{ left: r2.left + 2 }} barTop={barTop} barH={barH} label="R2" color="#7c3aed" plan={plan} onClick={() => openEdit(plan)} />}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            YEAR VIEW — PROJECT/INSTALL MODE: เดือนเป็นแถว, โครงการเป็นการ์ด
        ════════════════════════════════════════════════════════════════════ */}
        {timeRange === 'year' && viewBy !== 'person' && (() => {
          const CARD_H = 74
          const CARD_GAP = 6
          const MON_LABEL_W = 160
          const Q_COLORS = ['#6366f1','#0891b2','#f59e0b','#16a34a']
          return (
            <div>
              {/* Section info */}
              <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                📋 แสดงตามเดือน — {visiblePlans.length} โครงการ ในปี พ.ศ. {viewYear + 543} • คลิก Bar เพื่อแก้ไขแผนงาน
              </div>
              {THAI_MONTHS.map((monthName, mIdx) => {
                const monthStart = new Date(viewYear, mIdx, 1)
                const monthEnd   = new Date(viewYear, mIdx + 1, 0)
                const daysInM    = getDaysInMonth(viewYear, mIdx)
                const isCurMonth = mIdx === today.getMonth() && viewYear === today.getFullYear()
                const q          = Math.floor(mIdx / 3)
                const qColor     = Q_COLORS[q]

                // โครงการที่ทับซ้อนกับเดือนนี้
                const monthPlans = visiblePlans.filter(p => {
                  if (!p.startDate) return false
                  const s = new Date(p.startDate)
                  const e = new Date(p.endDate || p.startDate)
                  return s <= monthEnd && e >= monthStart
                })

                // Lane-pack ภายในเดือน
                const laneMap  = new Map()
                const laneEnds = []
                const sorted = [...monthPlans].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
                sorted.forEach(plan => {
                  const s      = new Date(plan.startDate)
                  const e      = new Date(plan.endDate || plan.startDate)
                  const effS   = s < monthStart ? monthStart : s
                  const effE   = e > monthEnd   ? monthEnd   : e
                  const startD = effS.getDate()
                  const endD   = effE.getDate()
                  const lane   = laneEnds.findIndex(ed => startD > ed)
                  const l      = lane === -1 ? laneEnds.length : lane
                  laneEnds[l]  = endD
                  laneMap.set(plan.id, l)
                })

                const numLanes = monthPlans.length === 0 ? 0 : Math.max(1, ...[...laneMap.values()].map(l => l + 1))
                const rowH     = numLanes === 0 ? 46 : numLanes * (CARD_H + CARD_GAP) + 14

                return (
                  <div key={mIdx} style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', minHeight: rowH, alignItems: 'stretch' }}>

                    {/* ชื่อเดือน */}
                    <div style={{
                      width: MON_LABEL_W, minWidth: MON_LABEL_W, flexShrink: 0,
                      padding: '10px 14px',
                      background: isCurMonth ? '#dbeafe' : QUARTER_COLORS[q],
                      borderRight: '2px solid #e2e8f0',
                      borderLeft: `4px solid ${isCurMonth ? '#0891b2' : qColor}`,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isCurMonth ? '#1e3a5f' : '#374151' }}>{monthName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{daysInM} วัน</div>
                      {monthPlans.length > 0 && (
                        <div style={{ fontSize: 11, color: qColor, fontWeight: 600 }}>{monthPlans.length} โครงการ</div>
                      )}
                    </div>

                    {/* พื้นที่การ์ด */}
                    <div style={{ position: 'relative', flex: 1, minHeight: rowH, background: isCurMonth ? '#f0f9ff55' : mIdx % 2 === 0 ? `${QUARTER_COLORS[q]}44` : '#fff' }}>

                      {/* เส้นแบ่งสัปดาห์ (วันที่ 7, 14, 21, 28) */}
                      {[7, 14, 21, 28].map(d => d <= daysInM && (
                        <div key={d} style={{ position: 'absolute', left: `${(d - 0.5) / daysInM * 100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.07)', pointerEvents: 'none' }} />
                      ))}

                      {/* เส้นวันนี้ */}
                      {isCurMonth && (
                        <div style={{ position: 'absolute', left: `${(today.getDate() - 1) / daysInM * 100}%`, top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.5, zIndex: 4, pointerEvents: 'none' }} />
                      )}

                      {/* การ์ดโครงการ */}
                      {monthPlans.map(plan => {
                        const sc      = STATUS_COLORS[plan.status] || '#059669'
                        const s       = new Date(plan.startDate)
                        const e       = new Date(plan.endDate || plan.startDate)
                        const effS    = s < monthStart ? monthStart : s
                        const effE    = e > monthEnd   ? monthEnd   : e
                        const startD  = effS.getDate()
                        const endD    = effE.getDate()
                        const leftPct = (startD - 1) / daysInM * 100
                        const wPct    = Math.max(1.5, (endD - startD + 1) / daysInM * 100)
                        const lane    = laneMap.get(plan.id) ?? 0
                        const cardTop = 7 + lane * (CARD_H + CARD_GAP)
                        const team    = (plan.team || []).map(m => m.name?.split(' ')[0] || m.name).filter(Boolean)

                        return (
                          <div
                            key={plan.id}
                            onClick={() => openEdit(plan)}
                            onMouseEnter={ev => { ev.currentTarget.style.boxShadow = `0 4px 16px ${sc}88`; showTooltip(plan, ev) }}
                            onMouseMove={moveTooltip}
                            onMouseLeave={ev => { ev.currentTarget.style.boxShadow = `0 2px 8px ${sc}44`; hideTooltip() }}
                            style={{
                              position: 'absolute',
                              left:  `calc(${leftPct}% + 2px)`,
                              width: `calc(${wPct}%  - 4px)`,
                              minWidth: 10,
                              top: cardTop, height: CARD_H,
                              background: `linear-gradient(135deg, ${sc}f0 0%, ${sc}bb 100%)`,
                              borderRadius: 6, cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', justifyContent: 'center',
                              padding: '5px 8px', overflow: 'hidden', color: '#fff',
                              boxShadow: `0 2px 8px ${sc}44`,
                              borderLeft: `4px solid ${sc}`,
                              zIndex: 5, transition: 'box-shadow 0.15s',
                            }}>
                            <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                              🏥 {plan.hospitalName || plan.projectName}
                            </div>
                            {wPct > 3 && plan.projectName && plan.projectName !== plan.hospitalName && (
                              <div style={{ fontSize: 10, opacity: 0.92, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.35, marginTop: 1 }}>
                                📋 {plan.projectName}
                              </div>
                            )}
                            <div style={{ fontSize: 9, opacity: 0.88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, marginTop: 2 }}>
                              📅 {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                            </div>
                            {team.length > 0 && (
                              <div style={{ fontSize: 9, opacity: 0.88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, marginTop: 1 }}>
                                👥 {team.join(', ')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            YEAR VIEW — PERSON MODE: บุคคลเป็นแถว, เดือนเป็นคอลัมน์ (Gantt)
        ════════════════════════════════════════════════════════════════════ */}
        {timeRange === 'year' && viewBy === 'person' && (
          <div>
            {/* Quarter + Month header */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 20 }}>
              <div style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', borderRight: '2px solid #e2e8f0', background: '#f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                <div>👤 ทีมงาน</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>ทั้งปี พ.ศ. {viewYear + 543}</div>
              </div>
              <div style={{ flex: 1, display: 'flex' }}>
                {monthColsPct.map(({ m, widthPct, daysInM }) => {
                  const isCur = m === today.getMonth() && viewYear === today.getFullYear()
                  const q = Math.floor(m / 3)
                  return (
                    <div key={m} style={{
                      flex: `${widthPct} 0 0`, minWidth: 0,
                      borderRight: '1px solid #e2e8f0',
                      background: isCur ? '#dbeafe' : QUARTER_COLORS[q],
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '4px 2px',
                      borderTop: `3px solid ${isCur ? '#0891b2' : ['#6366f1','#0891b2','#f59e0b','#16a34a'][q]}`,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: isCur ? '#1e3a5f' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
                        {THAI_MONTHS_SHORT[m]}
                      </div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>{daysInM} วัน</div>
                      <div style={{ fontSize: 9, color: ['#6366f1','#0891b2','#f59e0b','#16a34a'][q], fontWeight: 700, marginTop: 1 }}>Q{q + 1}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section label */}
            {rows.length > 0 && <SectionLabel viewBy={viewBy} count={rows.length} />}

            {/* Person rows */}
            {rows.length === 0 ? <EmptyState /> : rows.map(row => {
              const rowUnit = 40
              const laneMap = new Map()
              const laneEnds = []
              const sorted = [...row.plans].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
              sorted.forEach(plan => {
                const s = plan.startDate || ''
                const lane = laneEnds.findIndex(end => s > end)
                const l = lane === -1 ? laneEnds.length : lane
                laneEnds[l] = plan.endDate || plan.startDate || ''
                laneMap.set(plan.id, l)
              })
              const numLanes = Math.max(1, ...[...laneMap.values()].map(l => l + 1))
              const dynamicH = Math.max(YEAR_ROW_H_P, numLanes > 1 ? numLanes * rowUnit + 10 : YEAR_ROW_H_P)

              return (
                <div key={row.key} style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', minHeight: dynamicH, alignItems: 'stretch' }}>
                  <RowLabel row={row} viewBy={viewBy} compact={true} />
                  <div style={{ position: 'relative', flex: 1, minHeight: dynamicH, overflow: 'hidden' }}>
                    {monthColsPct.map(({ m, leftPct, widthPct }) => {
                      const q = Math.floor(m / 3)
                      return (
                        <div key={m} style={{ position: 'absolute', left: `${leftPct}%`, top: 0, width: `${widthPct}%`, height: '100%', background: m % 2 === 0 ? `${QUARTER_COLORS[q]}55` : 'transparent', borderRight: '1px solid #e8ecf0', pointerEvents: 'none' }} />
                      )
                    })}
                    {todayLinePct !== null && (
                      <div style={{ position: 'absolute', left: `${todayLinePct}%`, top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.5, pointerEvents: 'none', zIndex: 4 }} />
                    )}
                    {row.plans.map((plan, pi) => {
                      const sc    = STATUS_COLORS[plan.status] || '#059669'
                      const bar   = getBarYear(plan.startDate, plan.endDate)
                      const r1    = plan.revisit1 ? getBarYear(plan.revisit1, plan.revisit1) : null
                      const r2    = plan.revisit2 ? getBarYear(plan.revisit2, plan.revisit2) : null
                      const lbl   = getBarLabel(plan, viewBy, viewMode, teamMembers)
                      const lane  = laneMap.get(plan.id) ?? pi
                      const slotH = numLanes > 1 ? rowUnit - 4 : dynamicH - 10
                      const barTop = 5 + lane * (numLanes > 1 ? rowUnit : 0)
                      const barH  = Math.max(16, slotH - 4)
                      return (
                        <span key={plan.id}>
                          {bar && (
                            <div
                              onClick={() => openEdit(plan)}
                              onMouseEnter={ev => { ev.currentTarget.style.opacity='0.85'; showTooltip(plan, ev) }}
                              onMouseMove={moveTooltip}
                              onMouseLeave={ev => { ev.currentTarget.style.opacity='1'; hideTooltip() }}
                              style={{
                                position: 'absolute',
                                left: `calc(${bar.leftPct}% + 2px)`, width: `calc(${bar.widthPct}% - 4px)`, minWidth: 8,
                                top: barTop, height: barH,
                                background: `linear-gradient(135deg, ${sc}ee, ${sc}aa)`,
                                borderRadius: 4, cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2px 6px',
                                overflow: 'hidden', color: '#fff', fontSize: 10, fontWeight: 600,
                                boxShadow: `0 1px 4px ${sc}44`, borderLeft: `3px solid ${sc}`, zIndex: 5, transition: 'opacity 0.15s',
                              }}>
                              {bar.widthPct > 1.5 && (
                                <>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{lbl}</span>
                                  {barH > 28 && <span style={{ fontSize: 8, opacity: 0.8, whiteSpace: 'nowrap' }}>{formatDate(plan.startDate)}</span>}
                                </>
                              )}
                            </div>
                          )}
                          {r1 && (
                            <div onClick={() => openEdit(plan)} onMouseEnter={ev => showTooltip(plan, ev)} onMouseMove={moveTooltip} onMouseLeave={hideTooltip}
                              style={{ position: 'absolute', left: `${r1.leftPct}%`, width: `max(${r1.widthPct}%, 14px)`, minWidth: 14, top: barTop, height: barH, background: '#f59e0b', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 800, zIndex: 6 }}>R1</div>
                          )}
                          {r2 && (
                            <div onClick={() => openEdit(plan)} onMouseEnter={ev => showTooltip(plan, ev)} onMouseMove={moveTooltip} onMouseLeave={hideTooltip}
                              style={{ position: 'absolute', left: `${r2.leftPct}%`, width: `max(${r2.widthPct}%, 14px)`, minWidth: 14, top: barTop, height: barH, background: '#7c3aed', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 800, zIndex: 6 }}>R2</div>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, padding: '10px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>สถานะ:</span>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: STATUS_COLORS[k] }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>R1 Revisit 1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#7c3aed' }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>R2 Revisit 2</span>
          </div>
          {timeRange === 'year' && (
            <>
              {[['#6366f1','Q1 ม.ค.–มี.ค.'],['#0891b2','Q2 เม.ย.–มิ.ย.'],['#f59e0b','Q3 ก.ค.–ก.ย.'],['#16a34a','Q4 ต.ค.–ธ.ค.']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <div style={{ width: 2, height: 14, background: '#dc2626', borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>วันนี้</span>
          </div>
        </div>

      </div>

      {/* ═══ TEAM TOOLTIP CARD ═══ */}
      {tooltip && (() => {
        const p = tooltip.plan
        const sc = STATUS_COLORS[p.status] || '#059669'
        const sl = STATUS_LABELS[p.status] || p.status || ''
        const members = (p.team || [])
        // ตรวจสอบให้ tooltip อยู่ในหน้าจอ
        const tx = tooltip.x + 16
        const ty = tooltip.y - 10
        return (
          <div style={{
            position: 'fixed', left: tx, top: ty,
            background: '#1e293b', color: '#fff',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 12, zIndex: 9999,
            maxWidth: 300, minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            border: `2px solid ${sc}`,
          }}>
            {/* สถานะ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: sc, fontWeight: 700 }}>{sl}</span>
            </div>
            {/* ชื่อ รพ. / โครงการ */}
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#f1f5f9' }}>{p.hospitalName || p.projectName}</div>
            {p.projectName && p.projectName !== p.hospitalName && (
              <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>📋 {p.projectName}</div>
            )}
            {/* วันที่ */}
            <div style={{ color: '#7dd3fc', fontSize: 11, marginBottom: 6 }}>
              📅 {formatDate(p.startDate)} → {formatDate(p.endDate)}
            </div>
            {/* เจ้าของไซต์ */}
            {p.siteOwner && (
              <div style={{ color: '#86efac', fontSize: 11, marginBottom: 6 }}>👤 {p.siteOwner}</div>
            )}
            {/* ทีมงาน */}
            {members.length > 0 && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 4, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
                  👥 ทีมงาน ({members.length} คน)
                </div>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 18, height: 18, background: '#0891b2', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#f1f5f9' }}>{m.name}</span>
                    {m.role && <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.role}</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
              คลิกเพื่อแก้ไขแผนงาน
            </div>
          </div>
        )
      })()}

      {/* ═══ EDIT MODAL ═══ */}
      {editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2d4a, #1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>✏️ แก้ไขแผนงาน</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{editForm.projectName}</div>
              </div>
              <button onClick={() => setEditForm(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <FormSection num={1} title="ข้อมูลโครงการ">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={LS}>ชื่อโครงการ *</label>
                      <input value={editForm.projectName} onChange={setEF('projectName')} placeholder="ระบุชื่อโครงการ" style={IS} required />
                    </div>
                    <div>
                      <label style={LS}>โรงพยาบาล *</label>
                      <SearchableSelect value={String(editForm.hospitalId || '')}
                        onChange={v => setEditForm(p => ({ ...p, hospitalId: v }))}
                        options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
                        placeholder="-- เลือกโรงพยาบาล --" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={LS}>เจ้าของไซต์</label>
                      <select value={editForm.siteOwner} onChange={setEF('siteOwner')} style={IS}>
                        <option value="">-- เลือกเจ้าของไซต์ --</option>
                        {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}{m.position ? ` (${m.position})` : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LS}>ประเภทการติดตั้ง</label>
                      <select value={editForm.installType} onChange={setEF('installType')} style={IS}>
                        <option value="">-- เลือกประเภท --</option>
                        {INSTALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LS}>งบประมาณ (บาท)</label>
                      <input type="number" value={editForm.budget} onChange={setEF('budget')} placeholder="0.00" style={IS} min={0} />
                    </div>
                  </div>
                </FormSection>
                <FormSection num={2} title="ระยะเวลาโครงการ">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={LS}>📡 ช่วงวันที่ Online</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>วันที่เริ่มต้น Online</div>
                          <DateInput value={editForm.onlineStart || ''} onChange={v => setEditForm(p => ({ ...p, onlineStart: v }))} style={IS} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>วันที่สิ้นสุด Online</div>
                          <DateInput value={editForm.onlineEnd || ''} onChange={v => setEditForm(p => ({ ...p, onlineEnd: v }))} style={IS} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={LS}>วันที่เริ่มโครงการ</label>
                      <DateInput value={editForm.startDate || ''} onChange={v => setEditForm(p => ({ ...p, startDate: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่สิ้นสุดโครงการ</label>
                      <DateInput value={editForm.endDate || ''} onChange={v => setEditForm(p => ({ ...p, endDate: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่ Revisit ครั้งที่ 1</label>
                      <DateInput value={editForm.revisit1 || ''} onChange={v => setEditForm(p => ({ ...p, revisit1: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่ Revisit ครั้งที่ 2</label>
                      <DateInput value={editForm.revisit2 || ''} onChange={v => setEditForm(p => ({ ...p, revisit2: v }))} style={IS} />
                    </div>
                  </div>
                </FormSection>
                <FormSection num={3} title="สถานะดำเนินการโครงการ">
                  {(() => {
                    const s = PROJECT_STATUS.find(p => p.value === editForm.status) || PROJECT_STATUS[0]
                    return (
                      <select value={editForm.status} onChange={setEF('status')} style={{ width: '100%', padding: '10px 14px', border: `2px solid ${s.color}`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: s.color, background: s.bg, cursor: 'pointer' }}>
                        {PROJECT_STATUS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    )
                  })()}
                </FormSection>
                <FormSection num={4} title="ทีมงานร่วมโครงการ">
                  <TeamInput team={editForm.team || []} onChange={(team) => setEditForm(p => ({ ...p, team }))} />
                </FormSection>
                <div>
                  <label style={LS}>หมายเหตุ</label>
                  <textarea value={editForm.note || ''} onChange={setEF('note')} rows={2} placeholder="รายละเอียดเพิ่มเติม..."
                    style={{ ...IS, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  💾 บันทึกการแก้ไข
                </button>
                <button type="button" onClick={() => setEditForm(null)}
                  style={{ padding: '12px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Small shared components ─────────────────────────────────────────────────

function SectionLabel({ viewBy, count }) {
  return (
    <div style={{ padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 6, background: viewBy === 'person' ? '#eff6ff' : '#f0fdf4', borderBottom: `1px solid ${viewBy === 'person' ? '#bfdbfe' : '#bbf7d0'}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: viewBy === 'person' ? '#1d4ed8' : '#15803d' }}>
        {viewBy === 'person' ? `👥 แสดงตามรายคน (${count} คน)` : `🏥 แสดงตามโครงการ (${count} โครงการ)`}
      </span>
      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>คลิกที่ Bar เพื่อแก้ไขแผนงาน</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '56px 0', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>📅</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>ไม่มีแผนงานในช่วงเวลานี้</div>
      <div style={{ fontSize: 13 }}>ลองเปลี่ยนช่วงเวลา หรือเพิ่มแผนงานในเมนูแผนการปฏิบัติงาน</div>
    </div>
  )
}

function RowLabel({ row, viewBy, compact }) {
  return (
    <div style={{ position: 'sticky', left: 0, zIndex: 10, width: LABEL_W, minWidth: LABEL_W, padding: compact ? '4px 16px' : '8px 16px', borderRight: '2px solid #e2e8f0', background: viewBy === 'person' ? '#fdfeff' : '#fafffe', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</div>
      {row.sub1 && <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub1}</div>}
      {row.sub2 && <div style={{ fontSize: 11, color: '#0891b2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub2}</div>}
    </div>
  )
}

function BarDiv({ bar, barTop, barH, sc, label, plan, onClick }) {
  return (
    <div onClick={onClick}
      title={`${plan.projectName}\nรพ.: ${plan.hospitalName}\n${formatDate(plan.startDate)} → ${formatDate(plan.endDate)}`}
      style={{
        position: 'absolute', left: bar.left, width: bar.width,
        top: barTop, height: barH,
        background: `linear-gradient(135deg, ${sc}ee, ${sc}99)`,
        borderRadius: 5, cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: '0 7px',
        overflow: 'hidden', color: '#fff', fontSize: 11, fontWeight: 600,
        whiteSpace: 'nowrap', boxShadow: `0 2px 6px ${sc}55`,
        borderLeft: `3px solid ${sc}`, zIndex: 5, transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {bar.width > 50 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </div>
  )
}

function RevisitDot({ style, barTop, barH, label, color, plan, onClick }) {
  return (
    <div onClick={onClick}
      title={`${label === 'R1' ? 'Revisit 1' : 'Revisit 2'}: ${plan[label === 'R1' ? 'revisit1' : 'revisit2']}`}
      style={{ position: 'absolute', ...style, width: 24, top: barTop, height: barH, background: color, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, zIndex: 6, boxShadow: `0 1px 4px ${color}88` }}>
      {label}
    </div>
  )
}

function getBarLabel(plan, viewBy, viewMode, teamMembers) {
  if (viewBy === 'person') {
    return `${plan.projectName}${plan.hospitalName ? ` (${plan.hospitalName})` : ''}`
  }
  const nicks = (plan.team || []).map(t => {
    const m = teamMembers.find(tm => String(tm.id) === String(t.memberId))
           || teamMembers.find(tm => tm.name === t.name)
    return m?.nickname || t.name || ''
  }).filter(Boolean)
  return nicks.length > 0 ? nicks.join(', ') : plan.projectName
}
