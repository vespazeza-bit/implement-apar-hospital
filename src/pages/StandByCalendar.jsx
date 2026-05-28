import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import * as XLSX from 'xlsx'

const API = '/api'

const STATUS = {
  office:  { label: 'Office',    short: 'OFC', bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
  standby: { label: 'Stand By',  short: 'SB',  bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  wfh:     { label: 'WFH',       short: 'WFH', bg: '#dcfce7', color: '#166534', border: '#86efac' },
  off:     { label: 'Off',       short: 'OFF', bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
  holiday: { label: 'Holiday',   short: 'HOL', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}
const STATUS_CYCLE = ['office', 'standby', 'wfh', 'off']

const ROLE_RANK = [
  ['ผู้จัดการ', 'manager', 'pm', 'director'],
  ['หัวหน้า', 'lead', 'leader', 'supervisor', 'chief'],
  ['อาวุโส', 'senior', 'sr.'],
  ['ที่ปรึกษา', 'consultant', 'advisor'],
  ['วิศวกร', 'engineer'],
  ['นักวิชาการ', 'analyst', 'specialist'],
  ['ผู้ดูแล', 'admin', 'support', 'technician'],
]
const roleRank = (role) => {
  const r = (role || '').toLowerCase()
  const idx = ROLE_RANK.findIndex(kws => kws.some(kw => r.includes(kw)))
  return idx >= 0 ? idx : ROLE_RANK.length
}

const THAI_DAYS   = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const toISO = (d) => d ? String(d).slice(0, 10) : ''
const localISO = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}
const fmtShort = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)-1]}`
}
const fmtBE = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)-1]} ${parseInt(y)+543}`
}
const getDatesInRange = (start, end) => {
  if (!start || !end) return []
  const dates = []
  const s = new Date(start), e = new Date(end)
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) dates.push(localISO(d))
  return dates
}
const getMonthGroups = (dates) => {
  const months = {}
  dates.forEach(iso => {
    const key = iso.slice(0, 7)
    if (!months[key]) months[key] = []
    months[key].push(iso)
  })
  return months
}
const sortMembers = (team, teamLeader, siteOwner) =>
  [...team]
    .map(t => ({ memberId: String(t.memberId ?? ''), name: t.name ?? '', role: t.role ?? '' }))
    .sort((a, b) => {
      const ra = a.name === teamLeader ? -2 : a.name === siteOwner ? -1 : roleRank(a.role)
      const rb = b.name === teamLeader ? -2 : b.name === siteOwner ? -1 : roleRank(b.role)
      return ra - rb || (a.name || '').localeCompare(b.name || '', 'th')
    })

// ── Add-Schedule Modal ────────────────────────────────────────────────────────
function AddModal({ plan, plans, hospitals, onSave, onClose }) {
  const [selPlanId, setSelPlanId]       = useState(plan ? String(plan.id) : '')
  const activePlan = plan || (plans?.find(p => String(p.id) === selPlanId) ?? null)
  const hosp = hospitals.find(h => String(h.id) === String(activePlan?.hospitalId))

  const [members, setMembers]             = useState(() => plan?.team ? sortMembers(plan.team, plan.teamLeader, plan.siteOwner) : [])
  const [selectedAll, setSelectedAll]     = useState(true)
  const [selectedNames, setSelectedNames] = useState(() => new Set(plan?.team ? sortMembers(plan.team, plan.teamLeader, plan.siteOwner).map(m => m.name) : []))
  const [startDate, setStartDate]         = useState(() => toISO(plan?.startDate || plan?.onlineStart))
  const [endDate, setEndDate]             = useState(() => toISO(plan?.endDate   || plan?.onlineEnd))
  const [status, setStatus]               = useState('standby')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [holidays, setHolidays]           = useState(new Set())
  const [holidayMap, setHolidayMap]       = useState({})

  // When selected project changes (top-level picker), repopulate form
  useEffect(() => {
    if (!selPlanId || plan) return
    const p = plans?.find(pp => String(pp.id) === selPlanId)
    if (!p) return
    const ps = toISO(p.startDate || p.onlineStart)
    const pe = toISO(p.endDate   || p.onlineEnd)
    setStartDate(ps); setEndDate(pe)
    const mems = p.team ? sortMembers(p.team, p.teamLeader, p.siteOwner) : []
    setMembers(mems)
    setSelectedNames(new Set(mems.map(m => m.name)))
    setSelectedAll(true)
    setError('')
  }, [selPlanId])  // eslint-disable-line

  // Fetch holidays whenever date range changes
  useEffect(() => {
    if (!startDate || !endDate) { setHolidays(new Set()); setHolidayMap({}); return }
    const y1 = parseInt(startDate.slice(0, 4))
    const y2 = parseInt(endDate.slice(0, 4))
    const ce1 = y1 >= 2400 ? y1 - 543 : y1
    const ce2 = y2 >= 2400 ? y2 - 543 : y2
    Promise.all([...new Set([ce1, ce2])].map(yr =>
      fetch(`${API}/holidays?year=${yr}&isActive=Y`).then(r => r.json()).catch(() => [])
    )).then(res => {
      const all = res.flat()
      setHolidays(new Set(all.map(h => toISO(h.holiday_date))))
      const hmap = {}
      all.forEach(h => { hmap[toISO(h.holiday_date)] = h.holiday_name_th })
      setHolidayMap(hmap)
    })
  }, [startDate, endDate])

  const toggleAll = () => {
    if (selectedAll) { setSelectedAll(false); setSelectedNames(new Set()) }
    else { setSelectedAll(true); setSelectedNames(new Set(members.map(m => m.name))) }
  }
  const toggleMember = (name) => {
    const s = new Set(selectedNames)
    s.has(name) ? s.delete(name) : s.add(name)
    setSelectedNames(s)
    setSelectedAll(s.size === members.length)
  }

  const planStart = toISO(activePlan?.startDate || activePlan?.onlineStart)
  const planEnd   = toISO(activePlan?.endDate   || activePlan?.onlineEnd)

  const previewDates        = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate])
  const holidayDatesInRange = useMemo(() => previewDates.filter(d => holidays.has(d)), [previewDates, holidays])
  const workDates           = useMemo(() => previewDates.filter(d => !holidays.has(d)), [previewDates, holidays])
  const totalCells          = selectedNames.size * previewDates.length

  const handleSave = async () => {
    if (!activePlan) return setError('กรุณาเลือกโครงการ')
    if (!startDate || !endDate) return setError('กรุณาระบุช่วงวันที่')
    if (startDate > endDate) return setError('วันเริ่มต้นต้องไม่เกินวันสิ้นสุด')
    if (selectedNames.size === 0) return setError('กรุณาเลือกสมาชิกอย่างน้อย 1 คน')
    setError('')
    setSaving(true)
    const selMembers = members.filter(m => selectedNames.has(m.name))
    const records = selMembers.flatMap(m => [
      ...workDates.map(d => ({ planId: Number(activePlan.id), memberId: m.memberId, memberName: m.name, scheduleDate: d, status })),
      ...holidayDatesInRange.map(d => ({ planId: Number(activePlan.id), memberId: m.memberId, memberName: m.name, scheduleDate: d, status: 'holiday' })),
    ])
    try {
      const res = await fetch(`${API}/standby/batch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ')
      onSave(records.length, activePlan.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>➕ เพิ่มตาราง Stand By</div>
            <div style={{ color: '#7dd3fc', fontSize: 12, marginTop: 2 }}>
              {activePlan ? `${hosp?.name ? `[${hosp.name}] ` : ''}${activePlan.projectName}` : 'เลือกโครงการเพื่อดำเนินการ'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Project selector (when opened from toolbar) */}
          {!plan && plans && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>🏥 เลือกโครงการ *</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {plans.length > 0
                    ? `${plans.length} โครงการที่ยังไม่มีตาราง`
                    : 'ทุกโครงการมีตารางแล้ว'}
                </div>
              </div>
              {plans.length === 0 ? (
                <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#16a34a', textAlign: 'center' }}>
                  ✅ ทุกโครงการในปีนี้มีตาราง Stand By แล้ว
                </div>
              ) : (
                <select value={selPlanId} onChange={e => setSelPlanId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${selPlanId ? '#0891b2' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
                  <option value="">-- เลือกโครงการ --</option>
                  {plans.map(p => {
                    const h = hospitals.find(hh => String(hh.id) === String(p.hospitalId))
                    const s = toISO(p.startDate || p.onlineStart)
                    const e = toISO(p.endDate   || p.onlineEnd)
                    const range = s ? ` (${fmtShort(s)}–${fmtShort(e)})` : ''
                    return <option key={p.id} value={p.id}>{h ? `[${h.name}] ` : ''}{p.projectName}{range}</option>
                  })}
                </select>
              )}
            </div>
          )}

          {activePlan && (
            <>
              {/* Date range */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📅 ช่วงวันที่</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>วันเริ่มต้น</div>
                    <input type="date" value={startDate} min={planStart || undefined} max={planEnd || undefined}
                      onChange={e => setStartDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <span style={{ color: '#94a3b8', fontWeight: 700, paddingTop: 18 }}>—</span>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>วันสิ้นสุด</div>
                    <input type="date" value={endDate} min={startDate || planStart || undefined} max={planEnd || undefined}
                      onChange={e => setEndDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {planStart && <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>ช่วงโครงการ: {fmtBE(planStart)} – {fmtBE(planEnd)}</div>}
              </div>

              {/* Holidays in range */}
              {holidayDatesInRange.length > 0 && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#be123c', marginBottom: 8 }}>
                    🎌 วันหยุดในช่วงนี้ ({holidayDatesInRange.length} วัน) — จะถูกบันทึกเป็น Holiday อัตโนมัติ
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {holidayDatesInRange.map(d => (
                      <span key={d} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                        {fmtBE(d)} · {holidayMap[d] || 'วันหยุด'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  📌 สถานะที่ต้องการบันทึก
                  {holidayDatesInRange.length > 0 && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}> (สำหรับวันทำงาน)</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(STATUS).filter(([k]) => k !== 'holiday').map(([k, s]) => (
                    <label key={k} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                      borderRadius: 8, cursor: 'pointer', border: `2px solid ${status === k ? s.border : '#e2e8f0'}`,
                      background: status === k ? s.bg : '#f8fafc', transition: 'all 0.1s',
                    }}>
                      <input type="radio" name="modal_status" value={k} checked={status === k} onChange={() => setStatus(k)} style={{ accentColor: '#0891b2' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: status === k ? s.color : '#64748b' }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Members */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  👥 สมาชิกทีม
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0891b2' }}>
                    <input type="checkbox" checked={selectedAll} onChange={toggleAll} style={{ accentColor: '#0891b2', width: 14, height: 14 }} />
                    เลือกทุกคน
                  </label>
                </div>
                {members.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 13, padding: '10px 0' }}>ไม่มีสมาชิกในโครงการนี้</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 160, overflowY: 'auto', padding: '2px 0' }}>
                    {members.map(m => (
                      <label key={m.name} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${selectedNames.has(m.name) ? '#0891b2' : '#e2e8f0'}`,
                        background: selectedNames.has(m.name) ? '#eff6ff' : '#fafafa', transition: 'all 0.1s',
                      }}>
                        <input type="checkbox" checked={selectedNames.has(m.name)} onChange={() => toggleMember(m.name)}
                          style={{ accentColor: '#0891b2', width: 14, height: 14, flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {totalCells > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#16a34a' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: holidayDatesInRange.length > 0 ? 5 : 0 }}>
                    <span style={{ fontSize: 15 }}>✅</span>
                    <span>บันทึก <strong>{STATUS[status]?.label}</strong> ให้ <strong>{selectedNames.size} คน × {workDates.length} วัน</strong> = <strong>{selectedNames.size * workDates.length} เซลล์</strong></span>
                  </div>
                  {holidayDatesInRange.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626' }}>
                      <span style={{ fontSize: 15 }}>🎌</span>
                      <span>+ Holiday <strong>{selectedNames.size} คน × {holidayDatesInRange.length} วัน</strong> = <strong>{selectedNames.size * holidayDatesInRange.length} เซลล์</strong></span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: '10px 22px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving || !activePlan || totalCells === 0}
              style={{ padding: '10px 28px', background: saving || !activePlan || totalCells === 0 ? '#e2e8f0' : '#0891b2', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving || !activePlan || totalCells === 0 ? 'not-allowed' : 'pointer', color: saving || !activePlan || totalCells === 0 ? '#94a3b8' : '#fff' }}>
              {saving ? '⏳ กำลังบันทึก...' : `💾 บันทึก${totalCells > 0 ? ` (${totalCells} เซลล์)` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function StandByCalendar() {
  const today = new Date()
  const { projectPlans, hospitals } = useApp()

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView]             = useState('list')
  const [selPlanId, setSelPlanId]   = useState('')

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalPlanId, setModalPlanId] = useState('')
  const [showModal, setShowModal]     = useState(false)

  // ── List-view filters ─────────────────────────────────────────────────────
  const [filterYear, setFilterYear]     = useState(String(today.getFullYear() + 543))
  const [filterSearch, setFilterSearch] = useState('')

  // ── Detail-view state ─────────────────────────────────────────────────────
  const [filterMember, setFilterMember] = useState('')
  const [schedules, setSchedules]       = useState({})
  const [holidays, setHolidays]         = useState(new Set())
  const [holidayMap, setHolidayMap]     = useState({})
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [conflicts, setConflicts]       = useState(new Set())
  const [planSummaries, setPlanSummaries] = useState({})

  const isDragging   = useRef(false)
  const dragStatus   = useRef(null)
  const pendingCells = useRef([])
  const prevSaving   = useRef(false)

  // ── Load summary ──────────────────────────────────────────────────────────
  const loadSummaries = useCallback(() => {
    fetch(`${API}/standby/summary`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const map = {}
        data.forEach(row => {
          map[String(row.plan_id)] = {
            office:  Number(row.office_count)  || 0,
            standby: Number(row.standby_count) || 0,
            wfh:     Number(row.wfh_count)     || 0,
            off:     Number(row.off_count)      || 0,
            total:   Number(row.total_count)    || 0,
            members: Number(row.member_count)   || 0,
          }
        })
        setPlanSummaries(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { loadSummaries() }, [loadSummaries])

  useEffect(() => {
    if (prevSaving.current && !saving) loadSummaries()
    prevSaving.current = saving
  }, [saving, loadSummaries])

  // ── Modal handlers ────────────────────────────────────────────────────────
  const openModal = (planId) => { setModalPlanId(String(planId)); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setModalPlanId('') }

  const handleModalSave = (count, savedPlanId) => {
    closeModal()
    loadSummaries()
    const pid = savedPlanId ? String(savedPlanId) : modalPlanId
    if (pid) {
      setSelPlanId(pid)
      setFilterMember('')
      setView('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Delete all schedules for a plan ──────────────────────────────────────
  const deletePlanSchedules = async (p) => {
    const hosp = hospitals.find(h => String(h.id) === String(p.hospitalId))
    const label = `${hosp?.name ? `[${hosp.name}] ` : ''}${p.projectName}`
    if (!window.confirm(`ลบตาราง Stand By ทั้งหมดของ\n"${label}"\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return
    try {
      await fetch(`${API}/standby/plan/${p.id}`, { method: 'DELETE' })
      loadSummaries()
    } catch { alert('เกิดข้อผิดพลาดในการลบ') }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const openDetail = (planId) => {
    setSelPlanId(String(planId))
    setFilterMember('')
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const backToList = () => { setView('list'); setSelPlanId('') }

  // ── Available BE years ────────────────────────────────────────────────────
  const availYears = useMemo(() => {
    const ys = new Set()
    projectPlans.forEach(p => {
      const s = toISO(p.startDate || p.onlineStart)
      const e = toISO(p.endDate   || p.onlineEnd)
      if (s) ys.add(parseInt(s.slice(0, 4)) + 543)
      if (e) ys.add(parseInt(e.slice(0, 4)) + 543)
    })
    const cy = today.getFullYear() + 543
    ;[cy - 1, cy, cy + 1].forEach(y => ys.add(y))
    return [...ys].sort()
  }, [projectPlans])

  // ── Filtered overview plans ───────────────────────────────────────────────
  const overviewPlans = useMemo(() => {
    let plans = projectPlans
    if (filterYear) {
      const fy = Number(filterYear)
      plans = plans.filter(p => {
        const s = toISO(p.startDate || p.onlineStart)
        const e = toISO(p.endDate   || p.onlineEnd)
        const sy = s ? parseInt(s.slice(0, 4)) + 543 : null
        const ey = e ? parseInt(e.slice(0, 4)) + 543 : null
        if (!sy && !ey) return false
        if (sy && ey) return sy <= fy && fy <= ey
        return sy === fy || ey === fy
      })
    }
    // แสดงเฉพาะโครงการที่มีตาราง Stand By แล้ว
    plans = plans.filter(p => planSummaries[String(p.id)])

    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase()
      plans = plans.filter(p => {
        const hosp = hospitals.find(h => String(h.id) === String(p.hospitalId))
        return (p.projectName || '').toLowerCase().includes(q) || (hosp?.name || '').toLowerCase().includes(q)
      })
    }
    return plans
  }, [projectPlans, filterYear, filterSearch, hospitals, planSummaries])

  // ── Plans available to add stand-by (current year + no schedule yet) ────────
  const addablePlans = useMemo(() => {
    const fy = Number(filterYear) || (today.getFullYear() + 543)
    return projectPlans.filter(p => {
      if (planSummaries[String(p.id)]) return false   // มีตารางแล้ว
      const s = toISO(p.startDate || p.onlineStart)
      const e = toISO(p.endDate   || p.onlineEnd)
      const sy = s ? parseInt(s.slice(0, 4)) + 543 : null
      const ey = e ? parseInt(e.slice(0, 4)) + 543 : null
      if (!sy && !ey) return false
      if (sy && ey) return sy <= fy && fy <= ey
      return sy === fy || ey === fy
    })
  }, [projectPlans, planSummaries, filterYear])

  // ── Derived detail data ───────────────────────────────────────────────────
  const selPlan    = useMemo(() => projectPlans.find(p => String(p.id) === String(selPlanId)), [projectPlans, selPlanId])
  const planStart  = selPlan ? toISO(selPlan.startDate || selPlan.onlineStart) : ''
  const planEnd    = selPlan ? toISO(selPlan.endDate   || selPlan.onlineEnd)   : ''
  const allDates   = useMemo(() => getDatesInRange(planStart, planEnd), [planStart, planEnd])
  const monthGroups = useMemo(() => getMonthGroups(allDates), [allDates])

  const planMembers = useMemo(() => {
    if (!selPlan?.team) return []
    return sortMembers(selPlan.team, selPlan.teamLeader, selPlan.siteOwner)
  }, [selPlan])

  const visibleMembers = useMemo(() => {
    if (!filterMember) return planMembers
    const q = filterMember.toLowerCase()
    return planMembers.filter(m => m.name.toLowerCase().includes(q))
  }, [planMembers, filterMember])

  // ── Load holidays / conflicts ─────────────────────────────────────────────
  const loadHolidays = useCallback(async () => {
    if (!planStart) return
    const y1 = parseInt(planStart.slice(0, 4), 10)
    const y2 = planEnd ? parseInt(planEnd.slice(0, 4), 10) : y1
    const ce1 = y1 >= 2400 ? y1 - 543 : y1
    const ce2 = y2 >= 2400 ? y2 - 543 : y2
    const years = [...new Set([ce1, ce2])]
    const res = await Promise.all(years.map(yr => fetch(`${API}/holidays?year=${yr}&isActive=Y`).then(r => r.json()).catch(() => [])))
    const all = res.flat()
    setHolidays(new Set(all.map(h => toISO(h.holiday_date))))
    const hmap = {}
    all.forEach(h => { hmap[toISO(h.holiday_date)] = h.holiday_name_th })
    setHolidayMap(hmap)
  }, [planStart, planEnd])

  const loadConflicts = useCallback(async () => {
    if (!planStart || !planEnd) return
    try {
      const data = await fetch(`${API}/standby/conflicts?startDate=${planStart}&endDate=${planEnd}`).then(r => r.json())
      setConflicts(new Set(data.map(r => `${toISO(r.schedule_date)}_${r.member_name}`)))
    } catch { setConflicts(new Set()) }
  }, [planStart, planEnd])

  // Load schedules — NO auto-fill
  useEffect(() => {
    if (!selPlanId || !planStart || !planEnd) { setSchedules({}); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetch(`${API}/standby?planId=${selPlanId}&startDate=${planStart}&endDate=${planEnd}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const map = {}
        data.forEach(row => {
          const st = row.status === 'onsite' ? 'office' : row.status
          map[`${toISO(row.schedule_date)}_${row.member_name}`] = st
        })
        setSchedules(map)
      })
      .catch(() => { if (!cancelled) setSchedules({}) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selPlanId, planStart, planEnd])

  // Re-load schedules after batch save (modal)
  const reloadSchedules = useCallback(async () => {
    if (!selPlanId || !planStart || !planEnd) return
    const data = await fetch(`${API}/standby?planId=${selPlanId}&startDate=${planStart}&endDate=${planEnd}`).then(r => r.json()).catch(() => [])
    const map = {}
    data.forEach(row => {
      const st = row.status === 'onsite' ? 'office' : row.status
      map[`${toISO(row.schedule_date)}_${row.member_name}`] = st
    })
    setSchedules(map)
  }, [selPlanId, planStart, planEnd])

  useEffect(() => { loadHolidays() }, [loadHolidays])
  useEffect(() => { loadConflicts() }, [loadConflicts])

  // ── Cell logic ────────────────────────────────────────────────────────────
  const getStatus = (date, memberName) => {
    let st = schedules[`${date}_${memberName}`]
    if (st === 'onsite') st = 'office'
    if (st && STATUS[st]) return st
    if (holidays.has(date)) return 'holiday'
    return null
  }

  const nextStatus = (cur) => {
    if (!cur || cur === 'holiday') return STATUS_CYCLE[0]
    const idx = STATUS_CYCLE.indexOf(cur)
    return idx < 0 ? STATUS_CYCLE[0] : idx < STATUS_CYCLE.length - 1 ? STATUS_CYCLE[idx + 1] : null
  }

  const saveCell = async (planId, memberId, memberName, date, status) => {
    const key = `${date}_${memberName}`
    setSchedules(prev => { if (!status) { const n = { ...prev }; delete n[key]; return n } return { ...prev, [key]: status } })
    try {
      if (!status) {
        await fetch(`${API}/standby`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, memberName, scheduleDate: date }) })
      } else {
        await fetch(`${API}/standby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, memberId, memberName, scheduleDate: date, status }) })
      }
    } catch { }
  }

  const handleCellClick = async (date, member) => {
    if (isDragging.current) return
    await saveCell(selPlanId, member.memberId, member.name, date, nextStatus(getStatus(date, member.name)))
    loadConflicts()
  }

  const handleDragStart = (e, date, member) => {
    e.preventDefault()
    isDragging.current = true
    dragStatus.current = nextStatus(getStatus(date, member.name))
    pendingCells.current = []
    applyDragCell(date, member)
  }
  const applyDragCell = (date, member) => {
    if (pendingCells.current.some(c => c.date === date && c.memberName === member.name)) return
    pendingCells.current.push({ planId: selPlanId, memberId: member.memberId, memberName: member.name, date })
    const key = `${date}_${member.name}`
    setSchedules(prev => { if (!dragStatus.current) { const n = { ...prev }; delete n[key]; return n } return { ...prev, [key]: dragStatus.current } })
  }
  const handleDragEnter = (date, member) => { if (isDragging.current) applyDragCell(date, member) }
  const handleDragEnd = async () => {
    if (!isDragging.current) return
    isDragging.current = false
    setSaving(true)
    try { await Promise.all(pendingCells.current.map(c => saveCell(c.planId, c.memberId, c.memberName, c.date, dragStatus.current))) }
    finally { setSaving(false) }
    pendingCells.current = []
    dragStatus.current = null
    loadConflicts()
  }
  useEffect(() => {
    const up = () => { if (isDragging.current) handleDragEnd() }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // ── Summary helpers ───────────────────────────────────────────────────────
  const getSummary = (memberName) => {
    const cnt = { office: 0, standby: 0, wfh: 0, off: 0, holiday: 0 }
    allDates.forEach(date => { const st = getStatus(date, memberName); if (st && cnt[st] !== undefined) cnt[st]++ })
    return cnt
  }
  const totalWorkDays = allDates.filter(d => !holidays.has(d) && new Date(d).getDay() !== 0 && new Date(d).getDay() !== 6).length

  const cellStyle = (date, status, isConflict) => ({
    width: 38, minWidth: 38, height: 36, cursor: 'pointer', textAlign: 'center',
    fontSize: 10, fontWeight: 700, userSelect: 'none',
    background: status ? STATUS[status]?.bg : new Date(date).getDay() === 0 || new Date(date).getDay() === 6 ? '#f8fafc' : '#fff',
    color: status ? STATUS[status]?.color : '#cbd5e1',
    border: isConflict ? '2px solid #f97316' : `1px solid ${status ? STATUS[status]?.border : '#f1f5f9'}`,
    borderRadius: 4, position: 'relative', lineHeight: '36px',
    boxShadow: isConflict ? '0 0 0 2px #fed7aa' : 'none', transition: 'all 0.08s',
  })

  // ── Export to Excel ───────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!selPlan) return
    const hospName = hospitals.find(h => String(h.id) === String(selPlan.hospitalId))?.name || ''
    const FIXED  = 2   // Name, Role
    const SUM_C  = 6   // OFC SB WFH OFF HOL รวม
    const D_START = FIXED + SUM_C  // col index where dates begin

    const wsData = []
    const merges = []

    // Row 0: info
    wsData.push([
      `โรงพยาบาล: ${hospName}`,
      `โครงการ: ${selPlan.projectName}`,
      `ระยะเวลา: ${fmtBE(planStart)} – ${fmtBE(planEnd)}`,
      `ทีม: ${planMembers.length} คน  |  วันทำงาน: ${totalWorkDays} วัน`,
      `Export: ${new Date().toLocaleDateString('th-TH')}`,
    ])
    wsData.push([])  // blank

    // Row 2: month headers (merged per month) + fixed col labels
    const row2 = ['ชื่อ-นามสกุล', 'บทบาท', 'OFC', 'SB', 'WFH', 'OFF', 'HOL', 'รวมปฏิบัติงาน']
    let mCol = D_START
    Object.entries(monthGroups).forEach(([mKey, mDates]) => {
      const [y, m] = mKey.split('-')
      row2.push(`${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`)
      for (let i = 1; i < mDates.length; i++) row2.push('')
      if (mDates.length > 1) merges.push({ s: { r: 2, c: mCol }, e: { r: 2, c: mCol + mDates.length - 1 } })
      mCol += mDates.length
    })
    wsData.push(row2)

    // Row 3: day-number + day-name sub-headers
    const row3 = ['', '', '', '', '', '', '', '']
    allDates.forEach(date => {
      const dow = new Date(date).getDay()
      const d   = parseInt(date.slice(8))
      row3.push(`${d} ${THAI_DAYS[dow]}${holidays.has(date) ? '\n(หยุด)' : ''}`)
    })
    wsData.push(row3)

    // Row 4+: one row per member
    planMembers.forEach(member => {
      const s = getSummary(member.name)
      const active = (s.office || 0) + (s.standby || 0) + (s.wfh || 0)
      const row = [
        member.name, member.role,
        s.office || 0, s.standby || 0, s.wfh || 0, s.off || 0, s.holiday || 0, active,
      ]
      allDates.forEach(date => {
        const st = getStatus(date, member.name)
        row.push(st ? STATUS[st].short : '')
      })
      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!merges'] = merges
    ws['!cols']   = [
      { wch: 24 }, { wch: 18 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 14 },
      ...allDates.map(() => ({ wch: 7 })),
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stand By')
    const hospShort = hospName.replace(/โรงพยาบาล/g, 'รพ.').slice(0, 18)
    XLSX.writeFile(wb, `StandBy_${hospShort}_${planStart?.slice(0, 7) || 'export'}.xlsx`)
  }

  // ── Modal plan lookup ─────────────────────────────────────────────────────
  const modalPlan = useMemo(() => projectPlans.find(p => String(p.id) === String(modalPlanId)), [projectPlans, modalPlanId])

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div onMouseUp={handleDragEnd}>
      {/* Add Modal */}
      {showModal && (
        <AddModal
          plan={modalPlanId ? modalPlan : null}
          plans={!modalPlanId ? addablePlans : undefined}
          hospitals={hospitals}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#1e3a5f', fontSize: 22, fontWeight: 700 }}>📅 ตาราง Stand By</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>จัดตารางการ Stand By ของทีมงานตามโครงการ</p>
      </div>

      {/* ══ LIST VIEW ════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => { setModalPlanId(''); setShowModal(true) }}
              style={{ padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              ➕ เพิ่ม
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>ปี พ.ศ.</span>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', minWidth: 100 }}>
                <option value="">ทุกปี</option>
                {availYears.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                placeholder="ค้นหาโครงการ / ชื่อโรงพยาบาล..."
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            {filterSearch && (
              <button onClick={() => setFilterSearch('')}
                style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#64748b', whiteSpace: 'nowrap' }}>✕ ล้าง</button>
            )}
            <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              แสดง {overviewPlans.length} จาก {projectPlans.length} โครงการ
            </span>
          </div>

          {/* Overview table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e3a5f' }}>
                    <th style={{ padding: '11px 12px', textAlign: 'left', color: '#94a3b8', fontSize: 12, fontWeight: 700, width: 44 }}>#</th>
                    <th style={{ padding: '11px 12px', textAlign: 'left', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>โรงพยาบาล</th>
                    <th style={{ padding: '11px 12px', textAlign: 'left', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>โครงการ</th>
                    <th style={{ padding: '11px 12px', textAlign: 'center', color: '#e2e8f0', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>ช่วงเวลา</th>
                    <th style={{ padding: '11px 12px', textAlign: 'center', color: '#e2e8f0', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>ทีม</th>
                    {Object.entries(STATUS).filter(([k]) => k !== 'holiday').map(([k, s]) => (
                      <th key={k} style={{ padding: '11px 10px', textAlign: 'center', color: s.color, background: s.bg, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', borderLeft: '1px solid rgba(255,255,255,0.08)', minWidth: 58 }}>
                        {s.short}
                      </th>
                    ))}
                    <th style={{ padding: '11px 10px', textAlign: 'center', color: '#60a5fa', fontSize: 12, fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.1)', minWidth: 60 }}>รวม</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', color: '#e2e8f0', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', width: 150 }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewPlans.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>ยังไม่มีตาราง Stand By</div>
                        <div style={{ fontSize: 13, marginTop: 4, color: '#94a3b8' }}>กด <strong>➕ เพิ่ม</strong> เพื่อสร้างตาราง Stand By ให้โครงการ</div>
                      </td>
                    </tr>
                  ) : overviewPlans.map((p, idx) => {
                    const sum  = planSummaries[String(p.id)]
                    const hosp = hospitals.find(h => String(h.id) === String(p.hospitalId))
                    const start = toISO(p.startDate || p.onlineStart)
                    const end   = toISO(p.endDate   || p.onlineEnd)
                    const activeTotal = sum ? sum.office + sum.standby + sum.wfh : 0
                    return (
                      <tr key={p.id}
                        style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'}>
                        <td style={{ padding: '11px 12px', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ padding: '11px 12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          {hosp?.name || <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#374151', maxWidth: 240 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.projectName}</div>
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {start ? `${fmtShort(start)} – ${fmtShort(end)}` : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>
                          {p.team?.length || 0} คน
                        </td>
                        {sum ? (
                          <>
                            {Object.entries(STATUS).filter(([k]) => k !== 'holiday').map(([k, s]) => (
                              <td key={k} style={{ padding: '11px 8px', textAlign: 'center', fontWeight: sum[k] > 0 ? 700 : 400, color: sum[k] > 0 ? s.color : '#d1d5db', background: sum[k] > 0 ? s.bg : 'transparent', borderLeft: '1px solid #f1f5f9', fontSize: 13 }}>
                                {sum[k] > 0 ? sum[k] : '—'}
                              </td>
                            ))}
                            <td style={{ padding: '11px 8px', textAlign: 'center', fontWeight: 700, color: '#1e3a5f', background: '#eff6ff', borderLeft: '1px solid #f1f5f9' }}>
                              {activeTotal}
                            </td>
                          </>
                        ) : (
                          <td colSpan={5} style={{ padding: '11px 12px', textAlign: 'center' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 6, padding: '3px 10px' }}>
                              ยังไม่มีตาราง
                            </span>
                          </td>
                        )}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => openDetail(p.id)}
                              style={{ padding: '6px 12px', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#1e3a5f', color: '#fff', whiteSpace: 'nowrap' }}
                              title="ดูและแก้ไขตาราง">
                              📋 ดูตาราง
                            </button>
                            {sum && (
                              <button onClick={() => deletePlanSchedules(p)}
                                style={{ padding: '6px 10px', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#fef2f2', color: '#dc2626', whiteSpace: 'nowrap' }}
                                title="ลบตาราง Stand By ทั้งหมดของโครงการนี้">
                                🗑️ ลบ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                มีตาราง Stand By แล้ว <strong style={{ color: '#0891b2' }}>{Object.keys(planSummaries).length}</strong> โครงการ (จากทั้งหมด {projectPlans.length} โครงการ)
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(STATUS).filter(([k]) => k !== 'holiday').map(([k, s]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <span style={{ width: 16, height: 14, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 3, display: 'inline-block' }} />
                    <span style={{ color: '#374151' }}>{s.label} <span style={{ color: '#94a3b8' }}>({s.short})</span></span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL VIEW ══════════════════════════════════════════════════════ */}
      {view === 'detail' && (
        <div onMouseUp={handleDragEnd}>
          {/* Header bar */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', overflow: 'hidden' }}>
            {/* Back button */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>
              <button onClick={backToList}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
                ← กลับ
              </button>
            </div>

            {/* Info fields — expand to fill space */}
            {selPlan && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <div style={{ flex: 1, padding: '10px 16px', borderRight: '1px solid #f1f5f9', minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>โรงพยาบาล</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0891b2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hospitals.find(h => String(h.id) === String(selPlan.hospitalId))?.name || '—'}
                  </div>
                </div>
                <div style={{ flex: 2, padding: '10px 16px', borderRight: '1px solid #f1f5f9', minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>โครงการ</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selPlan.projectName}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '10px 16px', borderRight: '1px solid #f1f5f9', minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>ระยะเวลา</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    {planStart ? `${fmtShort(planStart)} – ${fmtShort(planEnd)}` : '—'}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '10px 16px', borderRight: '1px solid #f1f5f9', minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>ทีม / วันทำงาน</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    {planMembers.length} คน / {totalWorkDays} วัน
                  </div>
                </div>
              </div>
            )}

            {/* Right controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
              <input value={filterMember} onChange={e => setFilterMember(e.target.value)}
                placeholder="ค้นหาชื่อทีม..."
                style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 140 }} />
              <button onClick={() => selPlanId && openModal(selPlanId)}
                style={{ padding: '8px 16px', background: '#0891b2', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap' }}>
                ➕ เพิ่มรายการ
              </button>
              <button onClick={exportToExcel}
                style={{ padding: '8px 16px', background: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap' }}>
                📥 Export Excel
              </button>
              {loading && <span style={{ fontSize: 12, color: '#94a3b8' }}>⏳ โหลด...</span>}
              {saving  && <span style={{ fontSize: 12, color: '#16a34a' }}>💾 บันทึก...</span>}
              {conflicts.size > 0 && (
                <span style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#c2410c' }}>
                  ⚠️ ซ้ำ {conflicts.size} เซลล์
                </span>
              )}
            </div>
          </div>

          {/* Calendar grid */}
          {selPlan && allDates.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 160, minWidth: 160, padding: '8px 12px', background: '#1e3a5f', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.15)', position: 'sticky', left: 0, zIndex: 10 }}>ชื่อทีมงาน</th>
                      <th style={{ width: 120, minWidth: 120, padding: '8px 8px', background: '#1e3a5f', color: '#94a3b8', fontSize: 11, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>สรุป</th>
                      {Object.entries(monthGroups).map(([mKey, mDates]) => (
                        <th key={mKey} colSpan={mDates.length}
                          style={{ padding: '8px 0', background: '#0f2744', color: '#60a5fa', fontSize: 12, fontWeight: 700, textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.2)' }}>
                          {(() => { const [y, m] = mKey.split('-'); return `${THAI_MONTHS[parseInt(m)-1]} ${parseInt(y)+543}` })()}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th style={{ background: '#1e3a5f', position: 'sticky', left: 0, zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.15)' }} />
                      <th style={{ background: '#1e3a5f', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                      {allDates.map(date => {
                        const dow = new Date(date).getDay()
                        const isWeekend = dow === 0 || dow === 6
                        const isHol = holidays.has(date)
                        return (
                          <th key={date} style={{ width: 38, minWidth: 38, padding: '4px 2px', textAlign: 'center', background: isHol ? '#991b1b' : isWeekend ? '#374151' : '#1e3a5f', borderRight: '1px solid rgba(255,255,255,0.07)' }}
                            title={isHol ? holidayMap[date] : ''}>
                            <div style={{ color: isHol ? '#fca5a5' : isWeekend ? '#94a3b8' : '#e2e8f0', fontSize: 10, fontWeight: 700 }}>{parseInt(date.slice(8))}</div>
                            <div style={{ color: isHol ? '#fca5a5' : isWeekend ? '#f87171' : '#64748b', fontSize: 9 }}>{THAI_DAYS[dow]}</div>
                            {isHol && <div style={{ fontSize: 7, color: '#fca5a5' }}>วหย</div>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMembers.length === 0 ? (
                      <tr><td colSpan={allDates.length + 2} style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>ไม่พบสมาชิก</td></tr>
                    ) : visibleMembers.map((member, mi) => {
                      const summary = getSummary(member.name)
                      const rowBg = mi % 2 === 0 ? '#fff' : '#f8fafc'
                      return (
                        <tr key={member.memberId || member.name}>
                          <td style={{ padding: '6px 12px', background: rowBg, borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #e2e8f0', position: 'sticky', left: 0, zIndex: 5, minWidth: 160 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 145 }}>{member.name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 145 }}>{member.role}</div>
                          </td>
                          <td style={{ padding: '4px 6px', background: rowBg, borderBottom: '1px solid #f1f5f9', borderRight: '2px solid #e2e8f0', minWidth: 120 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {Object.entries(STATUS).filter(([k]) => summary[k] > 0).map(([k, s]) => (
                                <span key={k} style={{ fontSize: 10, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
                                  {s.short}:{summary[k]}
                                </span>
                              ))}
                            </div>
                          </td>
                          {allDates.map(date => {
                            const st = getStatus(date, member.name)
                            const isConflict = conflicts.has(`${date}_${member.name}`)
                            const s = st ? STATUS[st] : null
                            return (
                              <td key={date} style={{ padding: 2, background: rowBg, borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                                <div
                                  style={cellStyle(date, st, isConflict)}
                                  onMouseDown={e => handleDragStart(e, date, member)}
                                  onMouseEnter={() => handleDragEnter(date, member)}
                                  onClick={() => handleCellClick(date, member)}
                                  title={`${member.name} | ${date}${s ? ' — '+s.label : ''}${isConflict ? ' ⚠️ ซ้ำ' : ''}${holidays.has(date) ? ' ('+holidayMap[date]+')' : ''}`}
                                >
                                  {st && s ? s.short : ''}
                                  {isConflict && <span style={{ position: 'absolute', top: 0, right: 0, width: 6, height: 6, background: '#f97316', borderRadius: '50%', display: 'block' }} />}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>สถานะ:</span>
                {Object.entries(STATUS).map(([k, s]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <span style={{ width: 20, height: 16, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 3, display: 'inline-block' }} />
                    <span style={{ color: '#374151' }}>{s.label} <span style={{ color: '#94a3b8' }}>({s.short})</span></span>
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>💡 คลิก = เปลี่ยนสถานะ | ลาก = กำหนดหลายวัน</span>
              </div>
            </div>
          ) : selPlan ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px dashed #e2e8f0', color: '#94a3b8', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
              <div>ยังไม่มีช่วงวันที่ของโครงการ กรุณาตั้งค่าวันเริ่ม-วันสิ้นสุดในแผนการปฏิบัติงาน</div>
            </div>
          ) : null}

          {/* Summary table */}
          {selPlan && planMembers.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 15, marginBottom: 14 }}>📊 สรุปวันทำงาน</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>ชื่อ</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>บทบาท</th>
                      {Object.entries(STATUS).map(([k, s]) => (
                        <th key={k} style={{ padding: '8px 10px', textAlign: 'center', color: s.color, background: s.bg, fontWeight: 700, borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{s.label}</th>
                      ))}
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1e3a5f', fontWeight: 700, borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>รวมปฏิบัติงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planMembers.map((member, i) => {
                      const s = getSummary(member.name)
                      const totalActive = (s.office || 0) + (s.standby || 0) + (s.wfh || 0)
                      const hasConflict = [...conflicts].some(k => k.includes(`_${member.name}`))
                      return (
                        <tr key={member.memberId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                            {hasConflict && <span title="มีการทำงานซ้ำ" style={{ marginRight: 4 }}>⚠️</span>}
                            {member.name}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12 }}>{member.role}</td>
                          {Object.entries(STATUS).map(([k, st]) => (
                            <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: st.color, background: s[k] > 0 ? st.bg : 'transparent', borderLeft: '1px solid #f1f5f9', fontWeight: s[k] > 0 ? 700 : 400 }}>
                              {s[k] || '—'}
                            </td>
                          ))}
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#1e3a5f', borderLeft: '1px solid #f1f5f9', background: '#eff6ff' }}>
                            {totalActive}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
