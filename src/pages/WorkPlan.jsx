import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import DateInput from '../components/DateInput'
import SearchableSelect from '../components/SearchableSelect'


const PROJECT_STATUS = [
  { value: 'waiting',  label: 'รอดำเนินการ',     color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { value: 'planning', label: 'วางแผนงาน',        color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { value: 'advance',  label: 'จัดทำ Adv',         color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'inprog',   label: 'กำลังดำเนินการ',   color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { value: 'deliver',  label: 'ส่งมอบงาน',        color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'accounting', label: 'ส่งต่อบัญชี',   color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
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

const EMPTY_PLAN = {
  hospitalId: '', projectName: '', siteOwner: '', installType: '',
  budget: '', onlineStart: '', onlineEnd: '',
  startDate: '', endDate: '', revisit1: '', revisit2: '',
  status: 'waiting', team: [], note: '',
}

// ─── Team member input ────────────────────────────────────────────────────────

function TeamInput({ team, onChange, allMembers = [] }) {

  const [selected, setSelected] = useState('')

  const addMember = () => {
    const member = allMembers.find(m => String(m.id) === selected)
    if (!member) return
    if (team.some(t => String(t.memberId) === selected)) return
    onChange([...team, { id: Date.now(), memberId: String(member.id), name: member.name, role: member.position || '' }])
    setSelected('')
  }

  const remove = (id) => onChange(team.filter(m => m.id !== id))
  const updateRole = (id, role) => onChange(team.map(m => m.id === id ? { ...m, role } : m))

  const available = allMembers.filter(m => !team.some(t => String(t.memberId) === String(m.id)))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">-- เลือกทีมงาน --</option>
          {available.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}{m.position ? ` (${m.position})` : ''}
            </option>
          ))}
        </select>
        <button type="button" onClick={addMember} disabled={!selected}
          style={{ padding: '8px 18px', background: selected ? '#0891b2' : '#e2e8f0', color: selected ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
          + เพิ่ม
        </button>
      </div>
      {allMembers.length === 0 && (
        <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8 }}>
          ⚠️ ยังไม่มีข้อมูลทีมงาน กรุณาเพิ่มทีมงานในเมนู "ทีมงาน" ก่อน
        </div>
      )}
      {team.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {team.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ width: 22, height: 22, background: '#1e3a5f', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.name}</span>
              <input value={m.role} onChange={e => updateRole(m.id, e.target.value)} placeholder="ตำแหน่ง / บทบาท"
                style={{ width: 150, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
              <button type="button" onClick={() => remove(m.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 12, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ value }) {
  const s = PROJECT_STATUS.find(p => p.value === value) || PROJECT_STATUS[0]
  return (
    <span style={{ padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkPlan() {
  const { hospitals, teamMembers, projectPlans: plans, addPlan, updatePlan, deletePlan, advanceRecords, refreshMasterplanSummary } = useApp()
  const location = useLocation()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_PLAN)
  const [editId, setEditId] = useState(null)
  const [viewPlan, setViewPlan] = useState(null)
  const [showMasterPlan, setShowMasterPlan] = useState(false)
  const [masterPlanInitId, setMasterPlanInitId] = useState('')

  // เปิด modal แก้ไขอัตโนมัติเมื่อมาจากปฏิทิน
  useEffect(() => {
    const id = location.state?.editPlanId
    if (!id) return
    const found = plans.find(p => p.id === id)
    if (found) { setForm(found); setEditId(found.id); setShowForm(true) }
    // ล้าง state เพื่อไม่ให้เปิดซ้ำเมื่อ re-render
    window.history.replaceState({}, '')
  }, [location.state])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterHosp, setFilterHosp] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear() + 543))
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(30)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY_PLAN); setEditId(null); setShowForm(true) }
  const openEdit = (plan) => {
    setForm({
      ...plan,
      onlineStart: toDateStr(plan.onlineStart), onlineEnd: toDateStr(plan.onlineEnd),
      startDate: toDateStr(plan.startDate), endDate: toDateStr(plan.endDate),
      revisit1: toDateStr(plan.revisit1), revisit2: toDateStr(plan.revisit2),
    })
    setEditId(plan.id); setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.projectName || !form.hospitalId) return alert('กรุณากรอกชื่อโครงการและเลือกโรงพยาบาล')
    if (editId) {
      await updatePlan(editId, { ...form, id: editId })
    } else {
      await addPlan(form)
    }
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบแผนงานนี้?')) await deletePlan(id)
  }

  const getHospName = (id) => hospitals.find(h => String(h.id) === String(id))?.name || id

  const THAI_MON_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const fmtD = (d) => {
    if (!d) return ''
    const s = String(d).slice(0, 10)
    if (!s.includes('-')) return ''
    const [y, m, day] = s.split('-')
    return `${parseInt(day,10)} ${THAI_MON_SHORT[parseInt(m,10)-1]} ${parseInt(y,10)+543}`
  }

  const exportCSV = () => {
    const headers = ['#', 'โครงการ', 'เจ้าของไซต์', 'โรงพยาบาล', 'ประเภท', 'งบประมาณ', 'Online เริ่มต้น', 'Online สิ้นสุด', 'วันเริ่ม', 'วันสิ้นสุด', 'Revisit 1', 'Revisit 2', 'สถานะ', 'หมายเหตุ']
    const rows = filtered.map((p, i) => [
      i + 1,
      p.projectName || '',
      p.siteOwner || '',
      getHospName(p.hospitalId),
      p.installType || '',
      p.budget ? Number(p.budget).toLocaleString('th-TH') : '',
      fmtD(p.onlineStart),
      fmtD(p.onlineEnd),
      fmtD(p.startDate),
      fmtD(p.endDate),
      fmtD(p.revisit1),
      fmtD(p.revisit2),
      PROJECT_STATUS.find(s => s.value === p.status)?.label || p.status || '',
      p.note || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `แผนปฏิบัติงาน_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ดึงปี พ.ศ. จากวันที่เริ่มโครงการ (ใช้ startDate หรือ onlineStart)
  const getPlanYear = (p) => {
    const d = p.startDate || p.onlineStart
    if (!d) return null
    const adYear = parseInt(d.slice(0, 4), 10)
    return isNaN(adYear) ? null : adYear + 543
  }
  const availableYears = [...new Set(plans.map(getPlanYear).filter(Boolean))].sort((a, b) => b - a)

  const filtered = plans
    .filter(p => {
      if (filterStatus && p.status !== filterStatus) return false
      if (filterHosp && p.hospitalId !== filterHosp) return false
      if (filterYear && getPlanYear(p) !== Number(filterYear)) return false
      if (search && !p.projectName.includes(search) && !getHospName(p.hospitalId).includes(search)) return false
      return true
    })
    .sort((a, b) => {
      const sa = a.onlineStart || '9999-99-99'
      const sb = b.onlineStart || '9999-99-99'
      return sa.localeCompare(sb)
    })

  const statusCounts = PROJECT_STATUS.reduce((acc, s) => ({ ...acc, [s.value]: filtered.filter(p => p.status === s.value).length }), {})
  const displayed = filtered.slice(0, limit)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📋 แผนการปฏิบัติงาน</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>จัดการแผนงานโครงการและติดตามสถานะการดำเนินงาน</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 18px', border: '1px solid #bfdbfe', minWidth: 100 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>โครงการทั้งหมด</div>
        </div>
        {PROJECT_STATUS.map(s => (
          <div key={s.value} style={{ background: s.bg, borderRadius: 10, padding: '12px 18px', border: `1px solid ${s.border}`, minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{statusCounts[s.value] || 0}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={openAdd} style={{ padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + เพิ่มแผนงาน
        </button>
        <button onClick={exportCSV} style={{ padding: '9px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ⬇ Export Excel
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อโครงการ / รพ."
          style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 200 }} />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกปี</option>
          {availableYears.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
        </select>
        <SearchableSelect value={String(filterHosp || '')} onChange={setFilterHosp}
          options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
          allLabel="ทุก รพ." style={{ minWidth: 200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกสถานะ</option>
          {PROJECT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(filterStatus || filterHosp || filterYear || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterHosp(''); setFilterYear(''); setSearch('') }} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>✕ ล้าง</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>แสดง</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
            {[10, 20, 30, 50, 100, 999].map(n => <option key={n} value={n}>{n === 999 ? 'ทั้งหมด' : n}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>จาก {filtered.length} โครงการ</span>
        </div>
      </div>

      {/* Registry Table */}
      {displayed.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีแผนงาน</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>คลิก "+ เพิ่มแผนงาน" เพื่อสร้างแผนงานโครงการแรก</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e3a5f' }}>
                  {['#', 'โครงการ', 'โรงพยาบาล', 'ประเภท', 'งบประมาณ', 'Online เริ่มต้น', 'Online สิ้นสุด', 'วันเริ่ม', 'วันสิ้นสุด', 'Revisit 1', 'Revisit 2', 'สถานะ', ''].map(h => (
                    <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((plan, idx) => (
                  <tr key={plan.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: 13 }}>{idx + 1}</td>
                    <td style={{ padding: '12px', minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{plan.projectName}</div>
                      {plan.siteOwner && <div style={{ fontSize: 11, color: '#64748b' }}>👤 {plan.siteOwner}</div>}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{getHospName(plan.hospitalId)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{plan.installType || '-'}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      {plan.budget ? Number(plan.budget).toLocaleString('th-TH') + ' ฿' : '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#0891b2', whiteSpace: 'nowrap' }}>{formatDate(plan.onlineStart)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#0891b2', whiteSpace: 'nowrap' }}>{formatDate(plan.onlineEnd)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(plan.startDate)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(plan.endDate)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#0891b2', whiteSpace: 'nowrap' }}>{formatDate(plan.revisit1)}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#0891b2', whiteSpace: 'nowrap' }}>{formatDate(plan.revisit2)}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}><StatusBadge value={plan.status} /></td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setViewPlan(plan)} style={btn('#f8fafc', '#e2e8f0', '#374151')}>รายละเอียด</button>
                        <button onClick={() => openEdit(plan)} style={btn('#eff6ff', '#bfdbfe', '#1d4ed8')}>แก้ไข</button>
                        <button onClick={() => handleDelete(plan.id)} style={btn('#fef2f2', '#fecaca', '#dc2626')}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Budget summary footer */}
          {(() => {
            const totalBudget = filtered.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
            const countWithBudget = filtered.filter(p => Number(p.budget) > 0).length
            // ต้นทุน = รวม actualAmount จาก advanceRecords ของโครงการที่อยู่ใน filtered
            const filteredPlanIds = new Set(filtered.map(p => String(p.id)))
            const totalCost = (advanceRecords || [])
              .filter(r => filteredPlanIds.has(String(r.planId)))
              .reduce((sum, r) => sum + (Number(r.actualAmount) || 0), 0)
            const diff = totalBudget - totalCost
            return (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                gap: 24, padding: '12px 20px', flexWrap: 'wrap',
                background: '#1e3a5f', borderTop: '2px solid #0891b2',
              }}>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  แสดง <strong style={{ color: '#fff' }}>{filtered.length}</strong> โครงการ
                  {countWithBudget < filtered.length && (
                    <span style={{ marginLeft: 6 }}>
                      (มีงบประมาณ <strong style={{ color: '#38bdf8' }}>{countWithBudget}</strong> โครงการ)
                    </span>
                  )}
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>รวมงบประมาณ</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>
                    {totalBudget.toLocaleString('th-TH')}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>บาท</span>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>ต้นทุน (จ่ายจริง)</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>
                    {totalCost.toLocaleString('th-TH')}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>บาท</span>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>คงเหลือ</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: diff >= 0 ? '#4ade80' : '#f87171' }}>
                    {diff.toLocaleString('th-TH')}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>บาท</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ═══ MASTERPLAN MODAL ═══ */}
      {showMasterPlan && (
        <MasterPlanModal
          onClose={() => setShowMasterPlan(false)}
          plans={plans}
          teamMembers={teamMembers}
          hospitals={hospitals}
          onSaved={refreshMasterplanSummary}
          defaultPlanId={masterPlanInitId}
        />
      )}

      {/* ═══ ADD/EDIT FORM MODAL ═══ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2d4a, #1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>📋 {editId ? 'แก้ไขแผนงาน' : 'เพิ่มแผนงานใหม่'}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>กรอกรายละเอียดแผนการปฏิบัติงาน</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => { setMasterPlanInitId(editId ? String(editId) : ''); setShowMasterPlan(true) }} style={{ background: '#0891b2', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🗓️ MasterPlan
                </button>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                <FormSection num={1} title="ข้อมูลโครงการ">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={LS}>ชื่อโครงการ *</label>
                      <input value={form.projectName} onChange={set('projectName')} placeholder="ระบุชื่อโครงการ" style={IS} required />
                    </div>
                    <div>
                      <label style={LS}>โรงพยาบาล *</label>
                      <SearchableSelect value={String(form.hospitalId || '')}
                        onChange={v => setForm(p => ({ ...p, hospitalId: v }))}
                        options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
                        placeholder="-- เลือกโรงพยาบาล --" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={LS}>เจ้าของไซต์</label>
                      <select value={form.siteOwner} onChange={set('siteOwner')} style={IS}>
                        <option value="">-- เลือกเจ้าของไซต์ --</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name}{m.position ? ` (${m.position})` : ''}
                          </option>
                        ))}
                      </select>
                      {teamMembers.length === 0 && (
                        <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                          ⚠️ ยังไม่มีข้อมูลทีมงาน กรุณาเพิ่มทีมงานในเมนู "ทีมงาน" ก่อน
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={LS}>ประเภทการติดตั้ง</label>
                      <select value={form.installType} onChange={set('installType')} style={IS}>
                        <option value="">-- เลือกประเภท --</option>
                        {INSTALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LS}>งบประมาณ (บาท)</label>
                      <input type="number" value={form.budget} onChange={set('budget')} placeholder="0.00" style={IS} min={0} />
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
                          <DateInput value={form.onlineStart} onChange={v => setForm(p => ({ ...p, onlineStart: v }))} style={IS} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>วันที่สิ้นสุด Online</div>
                          <DateInput value={form.onlineEnd} onChange={v => setForm(p => ({ ...p, onlineEnd: v }))} style={IS} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={LS}>วันที่เริ่มโครงการ</label>
                      <DateInput value={form.startDate} onChange={v => setForm(p => ({ ...p, startDate: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่สิ้นสุดโครงการ</label>
                      <DateInput value={form.endDate} onChange={v => setForm(p => ({ ...p, endDate: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่ Revisit ครั้งที่ 1</label>
                      <DateInput value={form.revisit1} onChange={v => setForm(p => ({ ...p, revisit1: v }))} style={IS} />
                    </div>
                    <div>
                      <label style={LS}>วันที่ Revisit ครั้งที่ 2</label>
                      <DateInput value={form.revisit2} onChange={v => setForm(p => ({ ...p, revisit2: v }))} style={IS} />
                    </div>
                  </div>
                </FormSection>

                <FormSection num={3} title="สถานะดำเนินการโครงการ">
                  {(() => {
                    const s = PROJECT_STATUS.find(p => p.value === form.status) || PROJECT_STATUS[0]
                    return (
                      <select value={form.status} onChange={set('status')} style={{
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
                  <TeamInput team={form.team || []} onChange={(team) => setForm(p => ({ ...p, team }))} allMembers={teamMembers} />
                </FormSection>

                <div>
                  <label style={LS}>หมายเหตุ</label>
                  <textarea value={form.note} onChange={set('note')} rows={2} placeholder="รายละเอียดเพิ่มเติม..."
                    style={{ ...IS, resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  {editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึกแผนงาน'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DETAIL VIEW MODAL ═══ */}
      {viewPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2d4a, #1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>📋 รายละเอียดแผนงาน</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{viewPlan.projectName}</div>
              </div>
              <button onClick={() => setViewPlan(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 16 }}><StatusBadge value={viewPlan.status} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'โรงพยาบาล', value: getHospName(viewPlan.hospitalId) },
                  { label: 'เจ้าของไซต์', value: viewPlan.siteOwner || '-' },
                  { label: 'ประเภทการติดตั้ง', value: viewPlan.installType || '-' },
                  { label: 'งบประมาณ', value: viewPlan.budget ? Number(viewPlan.budget).toLocaleString('th-TH') + ' บาท' : '-' },
                  { label: 'วันที่เริ่ม', value: formatDate(viewPlan.startDate) },
                  { label: 'วันที่สิ้นสุด', value: formatDate(viewPlan.endDate) },
                  { label: 'Revisit ครั้งที่ 1', value: formatDate(viewPlan.revisit1) },
                  { label: 'Revisit ครั้งที่ 2', value: formatDate(viewPlan.revisit2) },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {viewPlan.team?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 13, marginBottom: 8 }}>👥 ทีมงานร่วมโครงการ</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {viewPlan.team.map((m, i) => (
                      <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
                        <span style={{ width: 24, height: 24, background: '#1e3a5f', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                        {m.role && <span style={{ fontSize: 12, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 20 }}>{m.role}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewPlan.note && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 2 }}>หมายเหตุ</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{viewPlan.note}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { setViewPlan(null); openEdit(viewPlan) }} style={{ flex: 1, padding: '10px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>แก้ไข</button>
                <button onClick={() => setViewPlan(null)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ITEM_STATUS = [
  { value: 'pending',     label: 'รอดำเนินการ',      color: '#6b7280', bg: '#f3f4f6' },
  { value: 'in_progress', label: 'กำลังดำเนินการ',   color: '#0891b2', bg: '#ecfeff' },
  { value: 'done',        label: 'ดำเนินการแล้ว',    color: '#16a34a', bg: '#f0fdf4' },
]

// ─── TimePicker (HH:MM) ───────────────────────────────────────────────────────
function TimePicker({ value, onChange, style }) {
  const parts = (value || '').split(':')
  const hh = parts[0] ? parts[0].padStart(2, '0') : '00'
  const mm = parts[1] ? parts[1].padStart(2, '0') : '00'

  const setH = (raw) => {
    const v = Math.min(23, Math.max(0, parseInt(raw) || 0))
    onChange(`${String(v).padStart(2, '0')}:${mm}`)
  }
  const setM = (raw) => {
    const v = Math.min(59, Math.max(0, parseInt(raw) || 0))
    onChange(`${hh}:${String(v).padStart(2, '0')}`)
  }
  const spinStyle = {
    width: 42, textAlign: 'center', border: 'none', outline: 'none',
    padding: '4px 2px', fontSize: 13, background: 'transparent',
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', overflow: 'hidden', ...style }}>
      <input type="number" min={0} max={23} value={parseInt(hh)}
        onChange={e => setH(e.target.value)}
        style={spinStyle} />
      <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 14, userSelect: 'none' }}>:</span>
      <input type="number" min={0} max={59} value={parseInt(mm)}
        onChange={e => setM(e.target.value)}
        style={spinStyle} />
    </div>
  )
}

// ─── MultiSelect (ผู้รับผิดชอบหลายคน) ────────────────────────────────────────
function MultiSelect({ value, onChange, options, placeholder = '-- เลือก --' }) {
  const [open, setOpen] = useState(false)
  const ref = useState(() => ({ current: null }))[0]
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const toggle = (name) => {
    const next = selected.includes(name)
      ? selected.filter(s => s !== name)
      : [...selected, name]
    onChange(next.join(', '))
  }

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, ref])

  return (
    <div ref={el => { ref.current = el }} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 6,
        fontSize: 12, cursor: 'pointer', background: '#fff', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
        height: 30, overflow: 'hidden',
      }}>
        {selected.length === 0 ? (
          <span style={{ color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{placeholder}</span>
        ) : selected.length === 1 ? (
          <span style={{ flex: 1, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected[0]}</span>
        ) : (
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
            <span style={{ background: '#0891b2', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{selected.length} คน</span>
            <span style={{ color: '#64748b', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected[0]}…</span>
          </span>
        )}
        <span style={{ color: '#94a3b8', fontSize: 10, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 999, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 200, maxHeight: 220, overflowY: 'auto', marginTop: 2,
        }}>
          {options.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>ไม่มีข้อมูลทีมงาน</div>
          )}
          {options.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              cursor: 'pointer', fontSize: 13, color: '#1e293b',
              background: selected.includes(m.name) ? '#eff6ff' : '#fff',
            }}
              onMouseEnter={e => { if (!selected.includes(m.name)) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { e.currentTarget.style.background = selected.includes(m.name) ? '#eff6ff' : '#fff' }}
            >
              <input type="checkbox" checked={selected.includes(m.name)} onChange={() => toggle(m.name)}
                style={{ accentColor: '#0891b2', width: 14, height: 14, flexShrink: 0 }} />
              <span>{m.name}{m.position ? ` (${m.position})` : ''}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <div style={{ padding: '6px 12px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => { onChange(''); setOpen(false) }}
                style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ✕ ล้างการเลือก
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MasterPlan Modal ──────────────────────────────────────────────────────────
function MasterPlanModal({ onClose, plans, teamMembers, hospitals, onSaved, defaultPlanId = '' }) {
  const [tab, setTab] = useState(defaultPlanId ? 1 : 0)
  // Tab 0: กำหนดหัวข้อการปฏิบัติงาน
  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState('')
  const [editTopicId, setEditTopicId] = useState(null)
  const [editTopicTitle, setEditTopicTitle] = useState('')
  // Tab 1: บันทึก MasterPlan
  const [selPlanId, setSelPlanId] = useState(defaultPlanId)
  const [items, setItems] = useState([])
  const [editRows, setEditRows] = useState({}) // id → changed fields
  const [saving, setSaving] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [hoverInsert, setHoverInsert] = useState(null) // index ของ gap ที่ hover
  const [dragRow, setDragRow] = useState(null)
  const [dragOverRow, setDragOverRow] = useState(null)
  const [reordered, setReordered] = useState(false)

  const loadTopics = useCallback(async () => {
    try { setTopics(await api.get('/masterplan-topics')) } catch { /**/ }
  }, [])

  const loadItems = useCallback(async (planId) => {
    if (!planId) { setItems([]); return }
    setLoadingItems(true)
    try {
      const data = await api.get(`/masterplan-items?planId=${planId}`)
      setItems([...data].sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0)))
    } catch { /**/ }
    finally { setLoadingItems(false) }
  }, [])

  useEffect(() => { loadTopics() }, [loadTopics])
  useEffect(() => { loadItems(selPlanId) }, [selPlanId, loadItems])

  // ── Topics CRUD ──
  const addTopic = async () => {
    if (!newTopic.trim()) return
    const r = await api.post('/masterplan-topics', { title: newTopic.trim(), sortOrder: topics.length })
    setTopics(prev => [...prev, r])
    setNewTopic('')
  }
  const saveTopic = async (id) => {
    if (!editTopicTitle.trim()) return
    await api.put(`/masterplan-topics/${id}`, { title: editTopicTitle.trim() })
    setTopics(prev => prev.map(t => t.id === id ? { ...t, title: editTopicTitle.trim() } : t))
    setEditTopicId(null)
  }
  const deleteTopic = async (id) => {
    if (!window.confirm('ลบหัวข้อนี้?')) return
    await api.del(`/masterplan-topics/${id}`)
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  // ── Items ──
  const savedItemCount = items.filter(r => !String(r.id).startsWith('new_')).length

  const importFromTopics = () => {
    if (!selPlanId) return alert('กรุณาเลือกโครงการก่อน')
    if (topics.length === 0) return alert('ยังไม่มีหัวข้อการปฏิบัติงาน กรุณาเพิ่มในแถบ "กำหนดหัวข้อ"')
    if (savedItemCount > 0 && !window.confirm(`มีข้อมูลที่บันทึกไว้แล้ว ${savedItemCount} รายการ\nต้องการเพิ่มหัวข้อจาก Template ต่อท้ายหรือไม่?`)) return
    const selPlan = plans.find(p => String(p.id) === String(selPlanId))
    const onlineStart = toDateStr(selPlan?.onlineStart)
    const onlineEnd   = toDateStr(selPlan?.onlineEnd)
    const projStart   = toDateStr(selPlan?.startDate)
    const projEnd     = toDateStr(selPlan?.endDate)

    const sorted = [...topics].sort((a, b) => a.id - b.id)
    const newRows = sorted.map((t, i) => {
      // ลำดับที่ 1–3 (index 0–2): ใช้ช่วงวัน Online
      // ลำดับที่ 4–21 (index 3–20): ใช้ช่วงวันโครงการ
      const useOnline = i < 3
      return {
        id: `new_${Date.now()}_${i}`, isNew: true,
        planId: selPlanId, topicTitle: t.title,
        startDate: useOnline ? onlineStart : projStart,
        endDate:   useOnline ? onlineEnd   : projEnd,
        startTime: '', endTime: '',
        taskDetail: '', responsible: '', hospitalResponsible: '', preparation: '', sortOrder: i, status: 'pending',
      }
    })
    setItems(prev => [...prev, ...newRows])
  }

  const onDragStart = (id) => setDragRow(id)
  const onDragOver = (e, id) => { e.preventDefault(); setDragOverRow(id) }
  const onDrop = (id) => {
    if (dragRow == null || dragRow === id) return
    setItems(prev => {
      const next = [...prev]
      const from = next.findIndex(r => r.id === dragRow)
      const to   = next.findIndex(r => r.id === id)
      if (from < 0 || to < 0) return prev
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setReordered(true)
    setDragRow(null)
    setDragOverRow(null)
  }
  const onDragEnd = () => { setDragRow(null); setDragOverRow(null) }

  const insertRowAt = (idx) => {
    if (!selPlanId) return
    const newRow = {
      id: `new_${Date.now()}`, isNew: true, planId: selPlanId,
      topicTitle: '', startDate: '', endDate: '', startTime: '', endTime: '',
      taskDetail: '', responsible: '', hospitalResponsible: '', preparation: '', sortOrder: idx, status: 'pending',
    }
    setItems(prev => {
      const next = [...prev]
      next.splice(idx, 0, newRow)
      return next
    })
  }

  const updateItem = (id, field, val) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
    if (!String(id).startsWith('new_')) {
      setEditRows(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }))
    }
  }

  const deleteItem = async (id) => {
    if (!window.confirm('ลบรายการนี้?')) return
    if (!String(id).startsWith('new_')) {
      await api.del(`/masterplan-items/${id}`)
    }
    setItems(prev => prev.filter(r => r.id !== id))
    setEditRows(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const saveAll = async () => {
    if (!selPlanId) return
    setSaving(true)
    try {
      const updatedItems = [...items]
      for (let i = 0; i < updatedItems.length; i++) {
        const row = updatedItems[i]
        if (String(row.id).startsWith('new_')) {
          const r = await api.post('/masterplan-items', {
            planId: row.planId, topicTitle: row.topicTitle,
            startDate: row.startDate || null, endDate: row.endDate || null,
            startTime: row.startTime, endTime: row.endTime,
            taskDetail: row.taskDetail, responsible: row.responsible,
            hospitalResponsible: row.hospitalResponsible, preparation: row.preparation,
            sortOrder: i, status: row.status || 'pending',
          })
          updatedItems[i] = { ...row, id: r.id, isNew: false }
        } else {
          await api.put(`/masterplan-items/${row.id}`, {
            topicTitle: row.topicTitle, startDate: row.startDate || null, endDate: row.endDate || null,
            startTime: row.startTime, endTime: row.endTime, taskDetail: row.taskDetail,
            responsible: row.responsible, hospitalResponsible: row.hospitalResponsible,
            preparation: row.preparation, sortOrder: i, status: row.status || 'pending',
          })
        }
      }
      setItems(updatedItems)
      setEditRows({})
      setReordered(false)
      await loadItems(selPlanId)
      if (onSaved) onSaved()
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  const hasUnsaved = items.length > 0 || Object.keys(editRows).length > 0 || reordered

  const exportCSV = () => {
    const saved = items.filter(r => !String(r.id).startsWith('new_'))
    if (saved.length === 0) return
    const selPlan = plans.find(p => String(p.id) === String(selPlanId))
    const hospName = selPlan ? (hospitals.find(h => String(h.id) === String(selPlan.hospitalId))?.name || '') : ''
    const projectName = selPlan?.projectName || ''

    const THAI_MON_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    const fmtD = (d) => {
      if (!d) return ''
      const s = String(d).slice(0, 10)
      if (!s.includes('-')) return ''
      const [y, m, day] = s.split('-')
      return `${day} ${THAI_MON_SHORT[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`
    }
    const fmtDateRow = (row) => {
      if (!row.startDate) return ''
      const d1 = fmtD(row.startDate)
      const d2 = row.endDate && row.endDate !== row.startDate ? fmtD(row.endDate) : ''
      return d2 ? `${d1} – ${d2}` : d1
    }
    const buildTime = (row) => row.startTime
      ? row.startTime + (row.endTime ? ` – ${row.endTime} น.` : ' น.')
      : ''
    const buildTopic = (row) => {
      const topic = row.topicTitle || ''
      const detail = (row.taskDetail || '').trim()
      return [topic, detail].filter(Boolean).join('\n')
    }
    const buildResponsible = (val) =>
      (val || '').split(',').map(s => s.trim()).filter(Boolean).map(s => `คุณ${s}`).join('\n')

    const headers = ['วันที่ / เวลา', 'รายละเอียดงาน', 'ผู้รับผิดชอบ BMS', 'ผู้รับผิดชอบ รพ.', 'การเตรียมความพร้อม']

    // กลุ่มตามวันที่: แถว date header แยก + แถวเวลา/รายละเอียด
    const allRows = []
    let lastDateKey = null
    saved.forEach(row => {
      const dateKey = row.startDate || ''
      const dateLabel = fmtDateRow(row)
      if (dateLabel && dateKey !== lastDateKey) {
        allRows.push([dateLabel, '', '', '', ''])
        lastDateKey = dateKey
      }
      allRows.push([
        buildTime(row),
        buildTopic(row),
        buildResponsible(row.responsible),
        row.hospitalResponsible || '',
        row.preparation || '',
      ])
    })

    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...allRows].map(r => r.map(escape).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.href = url
    a.download = `MasterPlan_${projectName}_${hospName}_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const th = { padding: '10px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', background: '#1e3a5f', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)' }
  const td = { padding: '6px 6px', fontSize: 12, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }
  const inp = { width: '100%', padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 400, padding: '12px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', marginBottom: 12 }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f2744, #1e3a5f)', padding: '18px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>🗓️ MasterPlan</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>กำหนดแผนปฏิบัติงานตามโครงการ</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>
          {['⚙️ กำหนดหัวข้อการปฏิบัติงาน', '📅 บันทึก MasterPlan'].map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '12px 24px', border: 'none', background: tab === i ? '#fff' : '#f8fafc',
              borderBottom: tab === i ? '3px solid #0891b2' : '3px solid transparent',
              color: tab === i ? '#0891b2' : '#64748b', fontWeight: tab === i ? 700 : 500,
              fontSize: 14, cursor: 'pointer', marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* ── Tab 0: กำหนดหัวข้อ ── */}
          {tab === 0 && (
            <div>
              <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 16 }}>หัวข้อการปฏิบัติงาน (Template)</div>
              {/* Add new topic */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTopic()}
                  placeholder="พิมพ์หัวข้อการปฏิบัติงาน..."
                  style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                <button onClick={addTopic} disabled={!newTopic.trim()} style={{ padding: '9px 20px', background: newTopic.trim() ? '#1e3a5f' : '#e2e8f0', color: newTopic.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: newTopic.trim() ? 'pointer' : 'default' }}>+ เพิ่ม</button>
              </div>
              {topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                  <div>ยังไม่มีหัวข้อ กรุณาเพิ่มหัวข้อการปฏิบัติงาน</div>
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  {topics.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < topics.length - 1 ? '1px solid #f1f5f9' : 'none', background: '#fff' }}>
                      <span style={{ width: 26, height: 26, background: '#1e3a5f', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      {editTopicId === t.id ? (
                        <>
                          <input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveTopic(t.id); if (e.key === 'Escape') setEditTopicId(null) }}
                            style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #0891b2', borderRadius: 6, fontSize: 13 }} autoFocus />
                          <button onClick={() => saveTopic(t.id)} style={{ padding: '5px 12px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>บันทึก</button>
                          <button onClick={() => setEditTopicId(null)} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 14, color: '#1e293b' }}>{t.title}</span>
                          <button onClick={() => { setEditTopicId(t.id); setEditTopicTitle(t.title) }} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>แก้ไข</button>
                          <button onClick={() => deleteTopic(t.id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>ลบ</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 1: บันทึก MasterPlan ── */}
          {tab === 1 && (
            <div>
              {/* Project selector */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>เลือกโครงการ:</label>
                <select value={selPlanId} onChange={e => setSelPlanId(e.target.value)}
                  style={{ flex: 1, minWidth: 250, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                  <option value="">-- เลือกโครงการ --</option>
                  {plans.filter(p => p.status !== 'deliver' && p.status !== 'closed').map(p => {
                    const hosp = hospitals.find(h => String(h.id) === String(p.hospitalId))
                    return <option key={p.id} value={p.id}>{p.projectName}{hosp ? ` — ${hosp.name}` : ''}</option>
                  })}
                </select>
                {loadingItems ? (
                  <span style={{ fontSize: 13, color: '#94a3b8', padding: '8px 4px' }}>⏳ กำลังโหลด...</span>
                ) : savedItemCount > 0 ? (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, padding: '6px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, whiteSpace: 'nowrap' }}>
                    ✅ โหลดข้อมูลที่บันทึกไว้ {savedItemCount} รายการ
                  </span>
                ) : (
                  <button onClick={importFromTopics} disabled={!selPlanId}
                    style={{ padding: '8px 16px', background: selPlanId ? '#0891b2' : '#e2e8f0', color: selPlanId ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selPlanId ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                    📥 นำ Template มา
                  </button>
                )}
                <button onClick={() => insertRowAt(items.length)} disabled={!selPlanId}
                  style={{ padding: '8px 16px', background: selPlanId ? '#f0fdf4' : '#e2e8f0', color: selPlanId ? '#16a34a' : '#94a3b8', border: selPlanId ? '1px solid #86efac' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selPlanId ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                  + เพิ่มท้ายสุด
                </button>
                {hasUnsaved && (
                  <button onClick={saveAll} disabled={saving}
                    style={{ padding: '8px 20px', background: saving ? '#e2e8f0' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                    {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกทั้งหมด'}
                  </button>
                )}
              </div>

              {/* Items table - editable */}
              {items.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, width: 28, textAlign: 'center' }}>⠿</th>
                        <th style={th}>#</th>
                        <th style={{ ...th, minWidth: 160 }}>หัวข้อ</th>
                        <th style={{ ...th, minWidth: 120 }}>วันที่เริ่มต้น</th>
                        <th style={{ ...th, minWidth: 120 }}>วันที่สิ้นสุด</th>
                        <th style={{ ...th, minWidth: 90 }}>เวลาเริ่ม</th>
                        <th style={{ ...th, minWidth: 90 }}>เวลาสิ้นสุด</th>
                        <th style={{ ...th, minWidth: 180 }}>รายละเอียดงาน</th>
                        <th style={{ ...th, minWidth: 130 }}>ผู้รับผิดชอบ</th>
                        <th style={{ ...th, minWidth: 130 }}>ผู้รับผิดชอบ รพ.</th>
                        <th style={{ ...th, minWidth: 150 }}>การเตรียมความพร้อม</th>
                        <th style={{ ...th, minWidth: 130 }}>สถานะดำเนินการ</th>
                        <th style={th}>ลบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* insert row ก่อนแถวแรก */}
                      <tr style={{ height: hoverInsert === 0 ? 28 : 4, transition: 'height 0.15s' }}
                        onMouseEnter={() => setHoverInsert(0)} onMouseLeave={() => setHoverInsert(null)}>
                        <td colSpan={13} style={{ padding: 0, textAlign: 'center' }}>
                          {hoverInsert === 0 && (
                            <button onClick={() => insertRowAt(0)} style={{ fontSize: 11, color: '#0891b2', background: '#eff6ff', border: '1px dashed #0891b2', borderRadius: 6, padding: '2px 12px', cursor: 'pointer' }}>
                              ➕ แทรกบรรทัดที่ 1
                            </button>
                          )}
                        </td>
                      </tr>
                      {items.map((row, idx) => (
                        <>
                          <tr key={row.id}
                            style={{ background: String(row.id).startsWith('new_') ? '#f0fdf4' : '#fff', outline: dragOverRow === row.id ? '2px solid #0891b2' : 'none', opacity: dragRow === row.id ? 0.4 : 1 }}
                            onDragOver={(e) => onDragOver(e, row.id)}
                            onDrop={() => onDrop(row.id)}
                            onDragEnd={onDragEnd}
                          >
                            <td style={{ ...td, cursor: 'grab', textAlign: 'center', color: '#94a3b8', fontSize: 18, width: 28, userSelect: 'none' }}
                              draggable={true}
                              onDragStart={() => onDragStart(row.id)}
                            >⠿</td>
                            <td style={{ ...td, color: '#94a3b8', textAlign: 'center', width: 32 }}>{idx + 1}</td>
                            <td style={td}><input value={row.topicTitle} onChange={e => updateItem(row.id, 'topicTitle', e.target.value)} style={inp} /></td>
                            <td style={td}><DateInput value={row.startDate} onChange={v => updateItem(row.id, 'startDate', v)} style={{ ...inp, width: '100%' }} /></td>
                            <td style={td}><DateInput value={row.endDate} onChange={v => updateItem(row.id, 'endDate', v)} style={{ ...inp, width: '100%' }} /></td>
                            <td style={td}><TimePicker value={row.startTime} onChange={val => updateItem(row.id, 'startTime', val)} style={{ width: '100%' }} /></td>
                            <td style={td}><TimePicker value={row.endTime} onChange={val => updateItem(row.id, 'endTime', val)} style={{ width: '100%' }} /></td>
                            <td style={td}><textarea value={row.taskDetail} onChange={e => updateItem(row.id, 'taskDetail', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} /></td>
                            <td style={td}>
                              <MultiSelect
                                value={row.responsible}
                                onChange={val => updateItem(row.id, 'responsible', val)}
                                options={teamMembers}
                                placeholder="-- เลือก --"
                              />
                            </td>
                            <td style={td}><input value={row.hospitalResponsible} onChange={e => updateItem(row.id, 'hospitalResponsible', e.target.value)} style={inp} /></td>
                            <td style={td}><input value={row.preparation} onChange={e => updateItem(row.id, 'preparation', e.target.value)} style={inp} /></td>
                            <td style={td}>
                              {(() => {
                                const s = ITEM_STATUS.find(x => x.value === (row.status || 'pending')) || ITEM_STATUS[0]
                                return (
                                  <select value={row.status || 'pending'} onChange={e => updateItem(row.id, 'status', e.target.value)}
                                    style={{ ...inp, color: s.color, background: s.bg, fontWeight: 600, border: `1px solid ${s.color}40` }}>
                                    {ITEM_STATUS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                                  </select>
                                )
                              })()}
                            </td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              <button onClick={() => deleteItem(row.id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>ลบ</button>
                            </td>
                          </tr>
                          {/* insert row หลังแต่ละแถว */}
                          <tr style={{ height: hoverInsert === idx + 1 ? 28 : 4, transition: 'height 0.15s' }}
                            onMouseEnter={() => setHoverInsert(idx + 1)} onMouseLeave={() => setHoverInsert(null)}>
                            <td colSpan={13} style={{ padding: 0, textAlign: 'center' }}>
                              {hoverInsert === idx + 1 && (
                                <button onClick={() => insertRowAt(idx + 1)} style={{ fontSize: 11, color: '#0891b2', background: '#eff6ff', border: '1px dashed #0891b2', borderRadius: 6, padding: '2px 12px', cursor: 'pointer' }}>
                                  ➕ แทรกบรรทัดที่ {idx + 2}
                                </button>
                              )}
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selPlanId ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div>ยังไม่มีรายการ กด "นำ Template มา" หรือ "+ เพิ่มแถวว่าง"</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
                  <div>กรุณาเลือกโครงการก่อน</div>
                </div>
              )}

              {/* Summary table sorted by date */}
              {items.filter(r => !String(r.id).startsWith('new_')).length > 0 && (
                <div style={{ marginTop: 28 }}>
                  {(() => {
                    const saved = items.filter(r => !String(r.id).startsWith('new_'))
                    const doneCnt = saved.filter(r => r.status === 'done').length
                    const pct = saved.length > 0 ? Math.round((doneCnt / saved.length) * 100) : 0
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 14 }}>📊 สรุป MasterPlan</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>เรียงตามลำดับที่บันทึกไว้</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{saved.length} รายการ | ดำเนินการแล้ว {doneCnt} รายการ</span>
                        <span style={{ fontWeight: 700, color: '#0891b2', fontSize: 13 }}>ความคืบหน้า</span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: pct === 100 ? '#16a34a' : pct > 0 ? '#0891b2' : '#94a3b8' }}>{pct}%</span>
                        <div style={{ width: 80, background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#0891b2', height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <button onClick={exportCSV} style={{ marginLeft: 'auto', padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          📥 Export Excel
                        </button>
                      </div>
                    )
                  })()}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#1e3a5f' }}>
                          {['#', 'วันที่ / เวลา', 'หัวข้อ', 'รายละเอียดงาน', 'ผู้รับผิดชอบ', 'ผู้รับผิดชอบ รพ.', 'การเตรียมความพร้อม'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.filter(r => !String(r.id).startsWith('new_'))
                          .map((row, idx) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{idx + 1}</td>
                              <td style={{ padding: '10px 12px', fontSize: 12, whiteSpace: 'nowrap', color: '#0891b2' }}>
                                {row.startDate ? (
                                  <>
                                    <div>{formatDate(row.startDate)}{row.endDate && row.endDate !== row.startDate ? ` – ${formatDate(row.endDate)}` : ''}</div>
                                    {(row.startTime || row.endTime) && (
                                      <div style={{ color: '#64748b', fontSize: 11 }}>{row.startTime}{row.endTime ? ` – ${row.endTime}` : ''} น.</div>
                                    )}
                                  </>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#1e293b', minWidth: 150 }}>{row.topicTitle || '-'}</td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151', minWidth: 180 }}>{row.taskDetail || '-'}</td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>
                                {row.responsible
                                  ? row.responsible.split(',').map(s => s.trim()).filter(Boolean).map((name, i) => (
                                      <div key={i} style={{ whiteSpace: 'nowrap' }}>{name}</div>
                                    ))
                                  : '-'}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{row.hospitalResponsible || '-'}</td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{row.preparation || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FormSection({ num, title, children }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 14, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #eff6ff', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: '#1e3a5f', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{num}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

const btn = (bg, border, color) => ({ padding: '5px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', color, whiteSpace: 'nowrap' })
const LS = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const IS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }
