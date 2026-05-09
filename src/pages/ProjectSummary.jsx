import { useState } from 'react'
import { useApp } from '../context/AppContext'
import SearchableSelect from '../components/SearchableSelect'

const ADV_STATUS = [
  { value: 'pending',         label: 'ยังไม่ดำเนินการ', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { value: 'waiting_approve', label: 'รออนุมัติ',        color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { value: 'approved',        label: 'อนุมัติแล้ว',      color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'received',        label: 'ได้ Adv แล้ว',     color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { value: 'waiting_clear',   label: 'รอเคลียร์ Adv',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'cleared',         label: 'เคลียร์แล้ว',      color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
]

const PROJECT_STATUS = [
  { value: 'waiting',  label: 'รอดำเนินการ',   color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { value: 'planning', label: 'วางแผนงาน',     color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { value: 'advance',  label: 'จัดทำ Adv',      color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'inprog',   label: 'กำลังดำเนินการ', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { value: 'deliver',  label: 'ส่งมอบงาน',     color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'accounting', label: 'ส่งต่อบัญชี', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { value: 'closed',   label: 'ปิดโครงการ',    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
]

function StatusBadge({ value, statusList, emptyLabel = '-' }) {
  const s = statusList.find(x => x.value === value)
  if (!s) return <span style={{ color: '#94a3b8', fontSize: 12 }}>{emptyLabel}</span>
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}

function ProgressBar({ pct, color = '#0891b2' }) {
  return (
    <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 12, background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
      </div>
    </div>
  )
}

export default function ProjectSummary() {
  const { hospitals, getProgress, advanceRecords, projectPlans } = useApp()
  const [filterProvince, setFilterProvince] = useState('')
  const [filterHospital, setFilterHospital] = useState('')
  const [filterPlanStatus, setFilterPlanStatus] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear() + 543))
  const [limit, setLimit] = useState(30)

  const hospById = (id) => hospitals.find(h => String(h.id) === String(id))

  const provinces = [...new Set(hospitals.map(h => h.province).filter(Boolean))].sort()

  // ดึง ปี พ.ศ. จาก startDate ของ projectPlans
  // รองรับข้อมูลเก่าที่มีทั้ง ค.ศ. และ พ.ศ. ปนกันใน DB
  const toBE = (d) => {
    if (!d) return null
    const y = parseInt(String(d).slice(0, 4), 10)
    if (isNaN(y)) return null
    return y >= 2400 ? y : y + 543
  }
  const availableYears = [...new Set(
    projectPlans.map(p => toBE(p.startDate)).filter(Boolean)
  )].sort((a, b) => b - a)

  // หา advance status ล่าสุดของแต่ละ "โครงการ" (plan)
  const getAdvanceStatusByPlan = (planId) => {
    const recs = advanceRecords.filter(r => String(r.planId) === String(planId))
    if (!recs.length) return null
    return recs.reduce((latest, r) => (r.id > latest.id ? r : latest)).status
  }

  const planYear = (p) => toBE(p.startDate)

  // 1 แถว = 1 โครงการ (project plan)
  const filtered = projectPlans.filter(p => {
    const h = hospById(p.hospitalId)
    if (filterProvince && (!h || h.province !== filterProvince)) return false
    if (filterHospital && String(p.hospitalId) !== String(filterHospital)) return false
    if (filterPlanStatus && p.status !== filterPlanStatus) return false
    if (filterYear) {
      const py = planYear(p)
      if (py != null && String(py) !== String(filterYear)) return false
    }
    return true
  })

  // เรียงตามวันที่เริ่มโครงการน้อย → มาก (โครงการที่ไม่มีวันเริ่ม → ไปท้าย)
  const sorted = [...filtered].sort((a, b) => {
    const sa = a.startDate || '9999-99-99'
    const sb = b.startDate || '9999-99-99'
    if (sa !== sb) return sa.localeCompare(sb)
    return a.id - b.id
  })

  const displayed = sorted.slice(0, limit)

  // นับสถิติตาม "โครงการ"
  const isClosed = (s) => s === 'closed'
  const isInProgress = (s) => ['planning', 'advance', 'inprog', 'deliver', 'accounting'].includes(s)
  const isWaiting = (s) => !s || s === 'waiting'

  const totalProjects = filtered.length
  const closedCount = filtered.filter(p => isClosed(p.status)).length
  const inProgressCount = filtered.filter(p => isInProgress(p.status)).length
  const waitingCount = filtered.filter(p => isWaiting(p.status)).length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📊 ผลสรุปโครงการภาพรวม</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>ติดตามความคืบหน้ารายโครงการ — แสดง 1 แถวต่อ 1 โครงการ</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="📋" label="โครงการทั้งหมด" value={totalProjects} color="#1e3a5f" />
        <StatCard icon="✅" label="ปิดโครงการ" value={closedCount} color="#16a34a" />
        <StatCard icon="🔄" label="กำลังดำเนินการ" value={inProgressCount} color="#d97706" />
        <StatCard icon="⏳" label="รอดำเนินการ" value={waitingCount} color="#64748b" />
      </div>

      {/* Filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>กรองข้อมูล:</span>
        <select value={filterProvince} onChange={e => { setFilterProvince(e.target.value); setFilterHospital('') }} style={{
          padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, background: '#f8fafc', cursor: 'pointer', minWidth: 160,
        }}>
          <option value="">-- ทุกจังหวัด --</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <SearchableSelect value={String(filterHospital || '')} onChange={setFilterHospital}
          options={(filterProvince ? hospitals.filter(h => h.province === filterProvince) : hospitals)
            .map(h => ({ value: String(h.id), label: h.name }))}
          allLabel="-- ทุกโรงพยาบาล --" style={{ minWidth: 220 }} />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{
          padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, background: '#f8fafc', cursor: 'pointer', minWidth: 130,
        }}>
          <option value="">-- ทุกปี พ.ศ. --</option>
          {availableYears.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
        </select>
        <select value={filterPlanStatus} onChange={e => setFilterPlanStatus(e.target.value)} style={{
          padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, background: '#f8fafc', cursor: 'pointer', minWidth: 160,
        }}>
          <option value="">-- ทุกสถานะโครงการ --</option>
          {PROJECT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(filterProvince || filterHospital || filterPlanStatus || filterYear) && (
          <button onClick={() => { setFilterProvince(''); setFilterHospital(''); setFilterPlanStatus(''); setFilterYear('') }} style={{
            padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b', whiteSpace: 'nowrap',
          }}>✕ ล้างตัวกรอง</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>แสดง</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
            {[10, 20, 30, 50, 100, 999].map(n => <option key={n} value={n}>{n === 999 ? 'ทั้งหมด' : n}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>จาก {filtered.length} โครงการ</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'โรงพยาบาล', 'โครงการ', 'Advance', 'แผนปฏิบัติงาน', 'ส่งมอบ', 'ข้อมูลพื้นฐาน', 'แบบฟอร์ม', 'รายงาน'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left', fontSize: 12,
                    fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    ไม่พบโครงการตามตัวกรองที่เลือก
                  </td>
                </tr>
              )}
              {displayed.map((plan, idx) => {
                const hosp = hospById(plan.hospitalId) || { name: '-', type: '', province: '' }
                const b = getProgress('basic', plan.hospitalId)
                const f = getProgress('form', plan.hospitalId)
                const r = getProgress('report', plan.hospitalId)
                const mp = getProgress('masterplan', plan.hospitalId)
                const advStatus = getAdvanceStatusByPlan(plan.id)
                return (
                  <tr key={plan.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px', color: '#94a3b8', fontSize: 13 }}>{idx + 1}</td>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{hosp.name}</td>
                    <td style={{ padding: '14px', color: '#1e293b', fontSize: 13, fontWeight: 500, minWidth: 240 }}>
                      {plan.projectName || <span style={{ color: '#94a3b8' }}>-</span>}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <StatusBadge value={advStatus} statusList={ADV_STATUS} emptyLabel="-" />
                    </td>
                    <td style={{ padding: '14px', minWidth: 110 }}>
                      {mp.total > 0 ? (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{mp.pct}%</div>
                          <ProgressBar pct={mp.pct} color={mp.pct === 100 ? '#16a34a' : mp.pct > 50 ? '#0891b2' : mp.pct > 0 ? '#d97706' : '#e2e8f0'} />
                        </>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <StatusBadge value={plan.status} statusList={PROJECT_STATUS} emptyLabel="-" />
                    </td>
                    {[b, f, r].map((p, i) => (
                      <td key={i} style={{ padding: '14px', minWidth: 100 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{p.pct}%</div>
                        <ProgressBar pct={p.pct} color={p.pct === 100 ? '#16a34a' : p.pct > 50 ? '#0891b2' : p.pct > 0 ? '#d97706' : '#e2e8f0'} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
