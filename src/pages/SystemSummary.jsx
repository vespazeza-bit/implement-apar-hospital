import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { loadIssueTypes } from './TrainingSummary'
import SearchableSelect from '../components/SearchableSelect'

const API = import.meta.env.VITE_API_URL || ''

const PRIORITY = [
  { value: 'low', label: 'ต่ำ', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'medium', label: 'ปานกลาง', color: '#d97706', bg: '#fffbeb' },
  { value: 'high', label: 'สูง', color: '#dc2626', bg: '#fef2f2' },
  { value: 'critical', label: 'วิกฤต', color: '#7c3aed', bg: '#f5f3ff' },
]
const STATUS_OPT = [
  { value: 'open', label: 'รอแก้ไข', color: '#dc2626', bg: '#fef2f2' },
  { value: 'inprogress', label: 'กำลังแก้ไข', color: '#d97706', bg: '#fffbeb' },
  { value: 'testing', label: 'ทดสอบ', color: '#0891b2', bg: '#eff6ff' },
  { value: 'closed', label: 'แก้ไขแล้ว', color: '#16a34a', bg: '#f0fdf4' },
]

const EMPTY_FORM = {
  hospKey: '', hospitalId: '', reportDate: '', resolvedDate: '', systemName: '', category: '', description: '',
  priority: 'medium', status: 'open', resolution: '', reportedBy: '',
}

const LAST_HOSP_KEY = 'lastSystemIssueHosp'

const formatDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${y}`
}
const toDateStr = (d) => d ? String(d).slice(0, 10) : ''
const todayStr = () => new Date().toISOString().slice(0, 10)
const getCurrentUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser') || '{}')
    return u.name || u.username || ''
  } catch { return '' }
}

export default function SystemSummary() {
  const { hospitals, teamMembers, projectPlans, systemIssues, addSystemIssue, updateSystemIssue, deleteSystemIssue } = useApp()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filterHosp, setFilterHosp] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [limit, setLimit] = useState(30)

  // Build รพ./โครงการ options (UI only — value carries hospitalId)
  const hospOpts = (() => {
    const opts = []
    hospitals.forEach(h => {
      const plans = projectPlans.filter(p => String(p.hospitalId) === String(h.id))
      if (plans.length === 0) {
        opts.push({ value: `h:${h.id}`, label: h.name, hospitalId: String(h.id) })
      } else {
        plans.forEach(p => {
          const projName = p.projectName || ''
          opts.push({
            value: `p:${p.id}`,
            label: projName ? `${h.name} — ${projName}` : h.name,
            hospitalId: String(h.id),
          })
        })
      }
    })
    return opts
  })()
  const findOpt = (key) => hospOpts.find(o => o.value === key)
  const firstOptForHosp = (hospId) => hospOpts.find(o => o.hospitalId === String(hospId))

  const [systemNames, setSystemNames] = useState([])
  useEffect(() => {
    fetch(`${API}/api/system-names`).then(r => r.json()).then(setSystemNames).catch(() => {})
  }, [])
  // Read shared issue types (managed from TrainingSummary page)
  const [issueTypes] = useState(loadIssueTypes)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.hospitalId) return alert('กรุณาเลือกโรงพยาบาล / โครงการ')
    if (!form.reportDate) return alert('กรุณากรอกวันที่พบปัญหา')
    if (!form.systemName) return alert('กรุณาเลือกระบบงาน')
    if (!form.category) return alert('กรุณาเลือกประเภทปัญหา')
    if (!form.description) return alert('กรุณากรอกรายละเอียดปัญหา')
    if (form.hospKey) localStorage.setItem(LAST_HOSP_KEY, form.hospKey)
    const { hospKey, ...payload } = form
    if (editId) {
      await updateSystemIssue(editId, { ...payload, id: editId })
    } else {
      await addSystemIssue(payload)
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
  }

  const handleEdit = (issue) => {
    const opt = firstOptForHosp(issue.hospitalId)
    setForm({
      ...issue,
      hospKey: opt?.value || '',
      reportDate: toDateStr(issue.reportDate),
      resolvedDate: toDateStr(issue.resolvedDate),
    })
    setEditId(issue.id)
    setShowForm(true)
  }

  const openAddForm = () => {
    setShowForm(true)
    setEditId(null)
    const lastKey = localStorage.getItem(LAST_HOSP_KEY) || ''
    const lastOpt = findOpt(lastKey)
    setForm({
      ...EMPTY_FORM,
      hospKey: lastOpt ? lastKey : '',
      hospitalId: lastOpt?.hospitalId || '',
      reportDate: todayStr(),
      reportedBy: getCurrentUserName(),
    })
  }

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบรายการนี้?'))
      await deleteSystemIssue(id)
  }

  const filtered = systemIssues.filter(i => {
    if (filterHosp && i.hospitalId !== filterHosp) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && i.category !== filterCategory) return false
    const d = i.reportDate ? String(i.reportDate).slice(0, 10) : ''
    if (filterDateFrom && d && d < filterDateFrom) return false
    if (filterDateTo && d && d > filterDateTo) return false
    if ((filterDateFrom || filterDateTo) && !d) return false
    return true
  }).sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''))

  const displayed = filtered.slice(0, limit)

  const getHospName = (id) => hospitals.find(h => String(h.id) === String(id))?.name || id

  const counts = STATUS_OPT.reduce((acc, s) => ({ ...acc, [s.value]: systemIssues.filter(i => i.status === s.value).length }), {})

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>🖥️ สรุปปัญหาการขึ้นระบบ</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>บันทึกและติดตามปัญหาที่พบระหว่างการขึ้นระบบ AP/AR จริง</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 18px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>{systemIssues.length}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</div>
        </div>
        {STATUS_OPT.map(s => (
          <div key={s.value} style={{ background: s.bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{counts[s.value] || 0}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={openAddForm} style={{
          padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>+ รายงานปัญหา</button>
        <SearchableSelect value={filterHosp} onChange={setFilterHosp}
          options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
          allLabel="ทุก รพ." style={{ minWidth: 200 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>พบปัญหา:</span>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            style={{ padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            style={{ padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกสถานะ</option>
          {STATUS_OPT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกประเภทปัญหา</option>
          {issueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterHosp || filterStatus || filterCategory || filterDateFrom || filterDateTo) && (
          <button onClick={() => { setFilterHosp(''); setFilterStatus(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo('') }} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
            ✕ ล้างตัวกรอง
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>แสดง</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
            {[10, 20, 30, 50, 100, 999].map(n => <option key={n} value={n}>{n === 999 ? 'ทั้งหมด' : n}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>จาก {filtered.length} รายการ</span>
        </div>
      </div>

      {/* Issues */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖥️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีปัญหาที่บันทึกไว้</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>คลิก "+ รายงานปัญหา" เพื่อบันทึกปัญหาการขึ้นระบบ</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map(issue => {
            const pri = PRIORITY.find(p => p.value === issue.priority) || PRIORITY[1]
            const sts = STATUS_OPT.find(s => s.value === issue.status) || STATUS_OPT[0]
            return (
              <div key={issue.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${pri.color}33`, padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', borderLeft: `4px solid ${pri.color}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: sts.bg, color: sts.color, fontSize: 12, fontWeight: 600 }}>{sts.label}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: pri.bg, color: pri.color, fontSize: 12, fontWeight: 600 }}>🔥 {pri.label}</span>
                      {issue.category && <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontSize: 12 }}>{issue.category}</span>}
                      {issue.systemName && <span style={{ padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 12 }}>⚙️ {issue.systemName}</span>}
                    </div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 14, marginBottom: 6 }}>🏥 {getHospName(issue.hospitalId)}</div>
                    <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{issue.description}</div>
                    {issue.reportedBy && <div style={{ fontSize: 12, color: '#94a3b8' }}>👤 รายงานโดย: {issue.reportedBy}</div>}
                    {issue.resolution && (
                      <div style={{ fontSize: 13, color: '#16a34a', background: '#f0fdf4', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                        ✅ วิธีแก้ไข: {issue.resolution}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>📅 พบปัญหา: {formatDate(issue.reportDate)}</div>
                    {issue.resolvedDate && <div style={{ fontSize: 12, color: '#16a34a', marginBottom: 8 }}>✅ แก้ไข: {formatDate(issue.resolvedDate)}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleEdit(issue)} style={{ padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#1d4ed8' }}>แก้ไข</button>
                      <button onClick={() => handleDelete(issue.id)} style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>ลบ</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, color: '#1e3a5f', fontSize: 18 }}>🖥️ {editId ? 'แก้ไข' : 'รายงาน'}ปัญหาขึ้นระบบ</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'โรงพยาบาล / โครงการ *', key: 'hospKey', type: 'hospSearch' },
                  { label: 'วันที่พบปัญหา *', key: 'reportDate', type: 'date' },
                  { label: 'วันที่แก้ไข', key: 'resolvedDate', type: 'date' },
                  { label: 'ผู้รายงาน', key: 'reportedBy', type: 'select', options: (() => {
                    const opts = teamMembers.map(m => ({ value: m.name, label: m.name + (m.position ? ` (${m.position})` : '') }))
                    const me = getCurrentUserName()
                    if (me && !opts.some(o => o.value === me)) opts.unshift({ value: me, label: `${me} (ฉัน)` })
                    return opts
                  })(), nullable: true },
                  { label: 'ระบบงาน *', key: 'systemName', type: 'select', options: systemNames.map(s => ({ value: s, label: s })), nullable: true },
                  { label: 'ประเภทปัญหา *', key: 'category', type: 'select', options: issueTypes.map(t => ({ value: t, label: t })), nullable: true },
                  { label: 'ความสำคัญ', key: 'priority', type: 'select', options: PRIORITY.map(p => ({ value: p.value, label: p.label })) },
                  { label: 'สถานะ', key: 'status', type: 'select', options: STATUS_OPT.map(s => ({ value: s.value, label: s.label })) },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.key === 'hospKey' || f.key === 'status' ? 'span 2' : 'span 1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{f.label}</label>
                    {f.type === 'hospSearch' ? (
                      <SearchableSelect value={String(form.hospKey || '')}
                        onChange={v => {
                          const opt = findOpt(v)
                          setForm(p => ({ ...p, hospKey: v, hospitalId: opt?.hospitalId || '' }))
                        }}
                        options={hospOpts}
                        placeholder="-- เลือก รพ. / โครงการ --"
                        style={{ width: '100%' }} />
                    ) : f.type === 'select' ? (
                      <select value={form[f.key]} onChange={set(f.key)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                        {f.nullable && <option value="">-- เลือก --</option>}
                        {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>รายละเอียดปัญหา *</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="อธิบายปัญหาที่พบ..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>วิธีแก้ไข / ผลการดำเนินการ</label>
                <textarea value={form.resolution} onChange={set('resolution')} rows={2} placeholder="กรอกวิธีแก้ไข..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {editId ? 'บันทึกการแก้ไข' : 'รายงานปัญหา'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
