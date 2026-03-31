import { useState } from 'react'
import { useApp } from '../context/AppContext'
import DateInput from '../components/DateInput'

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const DAY_W = 40
const DAY_W_Y = 8
const ROW_H = 46
const LABEL_W = 230

const STATUS_COLORS = {
  waiting: '#6b7280', planning: '#ca8a04', advance: '#ea580c',
  inprog: '#0891b2', deliver: '#1d4ed8', closed: '#16a34a',
}
const STATUS_LABELS = {
  waiting: 'รอดำเนินการ', planning: 'วางแผนงาน', advance: 'จัดทำ Adv',
  inprog: 'กำลังดำเนินการ', deliver: 'ส่งมอบงาน', closed: 'ปิดโครงการ',
}

const PROJECT_STATUS = [
  { value: 'waiting',  label: 'รอดำเนินการ',     color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { value: 'planning', label: 'วางแผนงาน',        color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { value: 'advance',  label: 'จัดทำ Adv',         color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'inprog',   label: 'กำลังดำเนินการ',   color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { value: 'deliver',  label: 'ส่งมอบงาน',        color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'closed',   label: 'ปิดโครงการ',       color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
]
const INSTALL_TYPES = ['ติดตั้งระบบ', 'เข้า Revisit', 'เข้า Office']

const formatDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${y}`
}
const toDateStr = (d) => d ? String(d).slice(0, 10) : ''

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function dayOfYear(dateStr, year) {
  const d = new Date(dateStr)
  const start = new Date(year, 0, 1)
  return Math.max(1, Math.round((d - start) / 86400000) + 1)
}


// ─── TeamInput (inline for edit modal) ───────────────────────────────────────
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

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewMode, setViewMode] = useState('project') // 'project'|'ติดตั้งระบบ'|'เข้า Revisit'|'เข้า Office'|'person'
  const [timeRange, setTimeRange] = useState('month') // 'month' | 'year'

  const viewBy = viewMode === 'person' ? 'person' : 'project'
  const filterInstallType = INSTALL_TYPES.includes(viewMode) ? viewMode : ''

  // Edit modal
  const [editForm, setEditForm] = useState(null)   // null = closed, object = open

  // ── Plan data ──────────────────────────────────────────────────────────────
  const enrichedPlans = projectPlans
    .filter(p => p.startDate)
    .map(p => ({
      ...p,
      hospitalName: hospitals.find(h => String(h.id) === String(p.hospitalId))?.name || '',
      endDate: p.endDate || p.startDate,
    }))

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevPeriod = () => {
    if (timeRange === 'year') { setViewYear(y => y - 1); return }
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1)
  }
  const nextPeriod = () => {
    if (timeRange === 'year') { setViewYear(y => y + 1); return }
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1)
  }

  // ── Dimensions ────────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthCols = (() => {
    let off = 0
    return Array.from({ length: 12 }, (_, m) => {
      const w = getDaysInMonth(viewYear, m) * DAY_W_Y
      const col = { m, off, w }
      off += w
      return col
    })
  })()
  const totalYearW = monthCols[11].off + monthCols[11].w

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

  // ── Bar helpers ───────────────────────────────────────────────────────────
  const getBarMonth = (s, e) => {
    if (!s) return null
    const sd = new Date(s), ed = new Date(e || s)
    const ms = new Date(viewYear, viewMonth, 1)
    const me = new Date(viewYear, viewMonth, daysInMonth)
    if (sd > me || ed < ms) return null
    const sd2 = sd < ms ? 1 : sd.getDate()
    const ed2 = ed > me ? daysInMonth : ed.getDate()
    return { left: (sd2 - 1) * DAY_W, width: (ed2 - sd2 + 1) * DAY_W - 4 }
  }

  const getBarYear = (s, e) => {
    if (!s) return null
    const sd = new Date(s), ed = new Date(e || s)
    const ys = new Date(viewYear, 0, 1), ye = new Date(viewYear, 11, 31)
    if (sd > ye || ed < ys) return null
    const totalDays = new Date(viewYear, 1, 29).getDate() === 29 ? 366 : 365
    const sDay = sd < ys ? 1 : dayOfYear(s, viewYear)
    const eDay = ed > ye ? totalDays : dayOfYear(e || s, viewYear)
    return { left: (sDay - 1) * DAY_W_Y, width: Math.max(DAY_W_Y, (eDay - sDay + 1) * DAY_W_Y - 2) }
  }

  const getBar = (s, e) => timeRange === 'month' ? getBarMonth(s, e) : getBarYear(s, e)

  const getDow = (d) => new Date(viewYear, viewMonth, d).getDay()
  const isWeekend = (d) => { const dw = getDow(d); return dw === 0 || dw === 6 }
  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  const todayLineLeft = timeRange === 'year' && viewYear === today.getFullYear()
    ? (dayOfYear(today.toISOString().split('T')[0], viewYear) - 1) * DAY_W_Y : null

  const totalW = LABEL_W + (timeRange === 'month' ? daysInMonth * DAY_W : totalYearW)

  // ── Edit modal ────────────────────────────────────────────────────────────
  const openEdit = (plan) => setEditForm({
    ...plan,
    onlineStart: toDateStr(plan.onlineStart), onlineEnd: toDateStr(plan.onlineEnd),
    startDate: toDateStr(plan.startDate), endDate: toDateStr(plan.endDate),
    revisit1: toDateStr(plan.revisit1), revisit2: toDateStr(plan.revisit2),
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

          {/* แสดงแบบ — รวมประเภทการติดตั้ง */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>แสดงแบบ</div>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #1e3a5f', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1e3a5f', background: '#eff6ff', cursor: 'pointer', minWidth: 190 }}
            >
              <option value="project">📋 ตามโครงการ (ทั้งหมด)</option>
              <option value="เข้า Revisit">🔄 เข้า Revisit</option>
              <option value="เข้า Office">🏢 เข้า Office</option>
              <option value="person">👤 ตามรายคน</option>
            </select>
          </div>

          {/* ช่วงเวลา — dropdown */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>ช่วงเวลา</div>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #0891b2', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0891b2', background: '#f0f9ff', cursor: 'pointer', minWidth: 130 }}
            >
              <option value="month">📅 รายเดือน</option>
              <option value="year">📆 รายปี</option>
            </select>
          </div>

          {/* เลือกเดือน (แสดงเมื่อ timeRange = month) */}
          {timeRange === 'month' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>เดือนที่แสดง</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={viewMonth}
                  onChange={e => setViewMonth(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 130 }}
                >
                  {THAI_MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={e => setViewYear(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 100 }}
                >
                  {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>พ.ศ. {y + 543}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* เลือกปี (แสดงเมื่อ timeRange = year) */}
          {timeRange === 'year' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 5, letterSpacing: 0.3 }}>ปีที่แสดง</div>
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 140 }}
              >
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
              ? <>{THAI_MONTHS[viewMonth]} {viewYear + 543}<span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8', marginLeft: 12 }}>{viewYear}</span></>
              : `ปี พ.ศ. ${viewYear + 543}  (ค.ศ. ${viewYear})`
            }
          </div>
          <button onClick={nextPeriod} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 20px', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>›</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: totalW }}>

            {/* Month header */}
            {timeRange === 'month' && (
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
            )}

            {/* Year header */}
            {timeRange === 'year' && (
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 20 }}>
                <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', borderRight: '2px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
                  {viewBy === 'person' ? '👤 ทีมงาน' : '📋 โครงการ / รพ.'}
                </div>
                <div style={{ position: 'relative', height: 46, flex: 1 }}>
                  {monthCols.map(({ m, off, w }) => {
                    const isCur = m === today.getMonth() && viewYear === today.getFullYear()
                    return (
                      <div key={m} style={{
                        position: 'absolute', left: off, width: w, top: 0, height: 46,
                        borderRight: '2px solid #e2e8f0',
                        background: isCur ? '#eff6ff' : m % 2 === 0 ? '#f8fafc' : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: isCur ? '#1e3a5f' : '#374151', whiteSpace: 'nowrap' }}>{THAI_MONTHS_SHORT[m]}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{getDaysInMonth(viewYear, m)} วัน</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section label */}
            {rows.length > 0 && (
              <div style={{
                padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 6,
                background: viewBy === 'person' ? '#eff6ff' : '#f0fdf4',
                borderBottom: `1px solid ${viewBy === 'person' ? '#bfdbfe' : '#bbf7d0'}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: viewBy === 'person' ? '#1d4ed8' : '#15803d' }}>
                  {viewBy === 'person' ? `👥 แสดงตามรายคน (${rows.length} คน)` : `🏥 แสดงตามโครงการ (${rows.length} โครงการ)`}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>คลิกที่ Bar เพื่อแก้ไขแผนงาน</span>
              </div>
            )}

            {/* Rows */}
            {rows.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>ไม่มีแผนงานในช่วงเวลานี้</div>
                <div style={{ fontSize: 13 }}>ลองเปลี่ยนช่วงเวลา หรือเพิ่มแผนงานในเมนูแผนการปฏิบัติงาน</div>
              </div>
            ) : rows.map(row => {
              const nPlans = row.plans.length
              const compactMode = viewBy === 'person' && timeRange === 'year'
              const rowUnit = compactMode ? 35 : 30
              const minH = compactMode ? 38 : ROW_H

              // Lane-packing: assign non-overlapping plans to same lane
              const laneMap = new Map() // plan.id -> lane index
              if (compactMode) {
                const laneEnds = []
                const sorted = [...row.plans].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
                sorted.forEach(plan => {
                  const s = plan.startDate || ''
                  const lane = laneEnds.findIndex(end => s > end)
                  const l = lane === -1 ? laneEnds.length : lane
                  laneEnds[l] = plan.endDate || plan.startDate || ''
                  laneMap.set(plan.id, l)
                })
              } else {
                row.plans.forEach((plan, i) => laneMap.set(plan.id, i))
              }
              const numLanes = compactMode ? Math.max(1, ...[...laneMap.values()].map(l => l + 1)) : nPlans
              const dynamicH = Math.max(minH, numLanes > 1 ? numLanes * rowUnit + 6 : minH)
              return (
                <div key={row.key} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', minHeight: dynamicH, alignItems: 'stretch' }}>
                  {/* Label */}
                  <div style={{ position: 'sticky', left: 0, zIndex: 10, width: LABEL_W, minWidth: LABEL_W, padding: compactMode ? '4px 16px' : '8px 16px', borderRight: '2px solid #e2e8f0', background: viewBy === 'person' ? '#fdfeff' : '#fafffe', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</div>
                    {row.sub1 && <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub1}</div>}
                    {row.sub2 && <div style={{ fontSize: 11, color: '#0891b2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub2}</div>}
                  </div>

                  {/* Bar area */}
                  <div style={{ position: 'relative', flex: 1, minHeight: dynamicH, overflow: 'hidden' }}>
                    {/* Weekend bg */}
                    {timeRange === 'month' && days.map(d => isWeekend(d) && (
                      <div key={d} style={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, width: DAY_W, height: '100%', background: 'rgba(254,243,199,0.4)', pointerEvents: 'none' }} />
                    ))}
                    {/* Month alternating bg */}
                    {timeRange === 'year' && monthCols.map(({ m, off, w }) => (
                      <div key={m} style={{ position: 'absolute', left: off, top: 0, width: w, height: '100%', borderRight: '1px solid #f1f5f9', background: m % 2 === 0 ? 'rgba(248,250,252,0.6)' : 'transparent', pointerEvents: 'none' }} />
                    ))}
                    {/* Today line month */}
                    {timeRange === 'month' && viewMonth === today.getMonth() && viewYear === today.getFullYear() && (
                      <div style={{ position: 'absolute', left: (today.getDate() - 1) * DAY_W + DAY_W / 2, top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.35, pointerEvents: 'none' }} />
                    )}
                    {/* Today line year */}
                    {todayLineLeft !== null && (
                      <div style={{ position: 'absolute', left: todayLineLeft, top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.45, pointerEvents: 'none' }} />
                    )}

                    {/* Bars */}
                    {row.plans.map((plan, pi) => {
                      const sc = STATUS_COLORS[plan.status] || '#059669'
                      const lane = laneMap.get(plan.id) ?? pi
                      const slotH = numLanes > 1 ? rowUnit - 2 : dynamicH - 12
                      const barTop = (compactMode ? 3 : 6) + lane * (numLanes > 1 ? rowUnit : 0)
                      const barH = Math.max(12, slotH - (compactMode ? 3 : 4))

                      const bar = getBar(plan.startDate, plan.endDate)
                      const r1 = plan.revisit1 ? getBar(plan.revisit1, plan.revisit1) : null
                      const r2 = plan.revisit2 ? getBar(plan.revisit2, plan.revisit2) : null

                      const getTeamNicknames = (p) => {
                        const nicks = (p.team || []).map(t => {
                          const m = teamMembers.find(tm => String(tm.id) === String(t.memberId))
                               || teamMembers.find(tm => tm.name === t.name)
                          return m?.nickname || t.name || ''
                        }).filter(Boolean)
                        return nicks.length > 0 ? nicks.join(', ') : p.projectName
                      }

                      const barLabel = viewBy === 'person'
                        ? `${plan.projectName}${plan.hospitalName ? ` (${plan.hospitalName})` : ''}`
                        : (viewMode === 'project' || viewMode === 'เข้า Revisit' || viewMode === 'เข้า Office')
                          ? getTeamNicknames(plan)
                          : `${plan.projectName}${plan.siteOwner ? ` · ${plan.siteOwner}` : ''}`

                      return (
                        <span key={plan.id}>
                          {bar && (
                            <div onClick={() => openEdit(plan)}
                              title={`${plan.projectName}\nรพ.: ${plan.hospitalName}\nเจ้าของไซต์: ${plan.siteOwner || '-'}\n${formatDate(plan.startDate)} → ${formatDate(plan.endDate)}\nสถานะ: ${STATUS_LABELS[plan.status] || ''}\nคลิกเพื่อแก้ไข`}
                              style={{
                                position: 'absolute', left: bar.left + 2, width: bar.width,
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
                              {bar.width > 50 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{barLabel}</span>}
                            </div>
                          )}
                          {r1 && (
                            <div onClick={() => openEdit(plan)} title={`Revisit 1: ${formatDate(plan.revisit1)} — คลิกเพื่อแก้ไข`}
                              style={{ position: 'absolute', left: r1.left + 2, width: Math.max(timeRange === 'year' ? DAY_W_Y * 3 : DAY_W - 6, r1.width), top: barTop, height: barH, background: '#f59e0b', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, zIndex: 6, boxShadow: '0 1px 4px rgba(245,158,11,0.5)' }}>
                              R1
                            </div>
                          )}
                          {r2 && (
                            <div onClick={() => openEdit(plan)} title={`Revisit 2: ${formatDate(plan.revisit2)} — คลิกเพื่อแก้ไข`}
                              style={{ position: 'absolute', left: r2.left + 2, width: Math.max(timeRange === 'year' ? DAY_W_Y * 3 : DAY_W - 6, r2.width), top: barTop, height: barH, background: '#7c3aed', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, zIndex: 6, boxShadow: '0 1px 4px rgba(124,58,237,0.5)' }}>
                              R2
                            </div>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <div style={{ width: 2, height: 14, background: '#dc2626', borderRadius: 1 }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>วันนี้</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ EDIT MODAL (inline, no navigation) ═══ */}
      {editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>

            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg, #1a2d4a, #1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>✏️ แก้ไขแผนงาน</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{editForm.projectName}</div>
              </div>
              <button onClick={() => setEditForm(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
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
                      <select value={editForm.hospitalId} onChange={setEF('hospitalId')} style={IS} required>
                        <option value="">-- เลือกโรงพยาบาล --</option>
                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
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
                      <select value={editForm.status} onChange={setEF('status')} style={{
                        width: '100%', padding: '10px 14px',
                        border: `2px solid ${s.color}`,
                        borderRadius: 8, fontSize: 14, fontWeight: 700,
                        color: s.color, background: s.bg, cursor: 'pointer',
                      }}>
                        {PROJECT_STATUS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
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
