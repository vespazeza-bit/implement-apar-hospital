import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import DateInput from '../components/DateInput'

const ADV_STATUS = [
  { value: 'pending',         label: 'ยังไม่ดำเนินการ', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { value: 'waiting_approve', label: 'รออนุมัติ',        color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { value: 'approved',        label: 'อนุมัติแล้ว',      color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'received',        label: 'ได้ Adv แล้ว',     color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { value: 'waiting_clear',   label: 'รอเคลียร์ Adv',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'cleared',         label: 'เคลียร์แล้ว',      color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
]

const DEFAULT_DOCS = [
  'Master Plan',
  'ประมาณการค่าใช้จ่าย',
  'ไฟล์สรุปปัญหา',
  'หนังสือแจ้ง Rev',
  'หาที่พัก',
]

const EMPTY_FORM = {
  planId: '', objective: '', documents: DEFAULT_DOCS.map(label => ({ label, checked: false })),
  amount: '', advDate: '', clearDate: '', actualAmount: '', status: 'pending', note: '',
}

const formatDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${y}`
}
const toDateStr = (d) => d ? String(d).slice(0, 10) : ''


function StatusBadge({ value }) {
  const s = ADV_STATUS.find(x => x.value === value) || ADV_STATUS[0]
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

const LS = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const IS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }

export default function Advance() {
  const { hospitals, projectPlans, updatePlan } = useApp()
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [newDoc, setNewDoc] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterInstallType, setFilterInstallType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [limit, setLimit] = useState(30)

  // โหลดข้อมูลจาก API
  useEffect(() => {
    api.get('/advance-records').then(setRecords).catch(() => {})
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  // เมื่อเลือกโครงการ → auto-fill objective
  const handleSelectPlan = (e) => {
    const planId = e.target.value
    const plan = projectPlans.find(p => String(p.id) === planId)
    setForm(prev => ({ ...prev, planId, objective: plan?.installType || '' }))
  }

  // Toggle document checked
  const toggleDoc = (idx) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.map((d, i) => i === idx ? { ...d, checked: !d.checked } : d),
    }))
  }

  // แก้ไขชื่อเอกสาร
  const editDocLabel = (idx, label) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.map((d, i) => i === idx ? { ...d, label } : d),
    }))
  }

  // เพิ่มเอกสาร
  const addDoc = () => {
    if (!newDoc.trim()) return
    setForm(prev => ({ ...prev, documents: [...prev.documents, { label: newDoc.trim(), checked: false }] }))
    setNewDoc('')
  }

  // ลบเอกสาร
  const removeDoc = (idx) => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))
  }

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (rec) => {
    setForm({
      ...rec,
      advDate: toDateStr(rec.advDate), clearDate: toDateStr(rec.clearDate),
      documents: rec.documents?.length ? rec.documents : DEFAULT_DOCS.map(label => ({ label, checked: false })),
    })
    setEditId(rec.id); setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.planId) return alert('กรุณาเลือกโครงการ')
    if (editId) {
      const res = await api.put(`/advance-records/${editId}`, form)
      setRecords(prev => prev.map(r => r.id === editId ? res : r))
    } else {
      const res = await api.post('/advance-records', form)
      setRecords(prev => [res, ...prev])
      // อัปเดตสถานะโครงการเป็น "จัดทำ Adv" อัตโนมัติ ถ้าสถานะยังไม่ถึงขั้นนั้น
      const plan = projectPlans.find(p => String(p.id) === String(form.planId))
      if (plan && ['waiting', 'planning'].includes(plan.status)) {
        await updatePlan(plan.id, { ...plan, status: 'advance' })
      }
    }
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันการลบรายการนี้?')) return
    await api.del(`/advance-records/${id}`)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const getPlanName = (planId) => {
    const plan = projectPlans.find(p => String(p.id) === String(planId))
    if (!plan) return '-'
    const hosp = hospitals.find(h => String(h.id) === String(plan.hospitalId))
    return `${plan.projectName}${hosp ? ` (${hosp.name})` : ''}`
  }

  const getDiff = (amount, actual) => {
    const a = Number(amount) || 0
    const b = Number(actual) || 0
    return a - b
  }

  // ปุ่มอนุมัติ — เปลี่ยนสถานะเป็น 'approved'
  const handleApprove = async (rec) => {
    if (!window.confirm(`ยืนยันการอนุมัติรายการ:\n${getPlanName(rec.planId)}`)) return
    const updated = { ...rec, status: 'approved' }
    const res = await api.put(`/advance-records/${rec.id}`, updated)
    setRecords(prev => prev.map(r => r.id === rec.id ? res : r))
  }

  // หาประเภทการติดตั้งที่มีในรายการ
  const installTypes = [...new Set(
    records.map(r => projectPlans.find(p => String(p.id) === String(r.planId))?.installType).filter(Boolean)
  )]

  const getInstallType = (planId) =>
    projectPlans.find(p => String(p.id) === String(planId))?.installType || ''

  const filtered = records
    .filter(r => {
      if (filterStatus && r.status !== filterStatus) return false
      if (filterInstallType && getInstallType(r.planId) !== filterInstallType) return false
      if (filterDateFrom && r.advDate && r.advDate < filterDateFrom) return false
      if (filterDateTo && r.advDate && r.advDate > filterDateTo) return false
      return true
    })
    .sort((a, b) => (b.advDate || '').localeCompare(a.advDate || ''))

  const totalAmount = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const totalActual = filtered.reduce((s, r) => s + (Number(r.actualAmount) || 0), 0)
  const displayed = filtered.slice(0, limit)

  const selectedPlan = projectPlans.find(p => String(p.id) === form.planId)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>⚙️ บันทึก Advance</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>จัดการการเบิกจ่าย Advance ตามโครงการ</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 18px', border: '1px solid #bfdbfe', minWidth: 120 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f' }}>{records.length}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>รายการทั้งหมด</div>
        </div>
        {ADV_STATUS.map(s => {
          const cnt = records.filter(r => r.status === s.value).length
          if (!cnt) return null
          return (
            <div key={s.value} style={{ background: s.bg, borderRadius: 10, padding: '12px 18px', border: `1px solid ${s.border}`, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{cnt}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <button onClick={openAdd} style={{ padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + เพิ่มรายการ Advance
          </button>

          {/* 1. กรองประเภทการติดตั้ง */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ประเภทการติดตั้ง</div>
            <select value={filterInstallType} onChange={e => setFilterInstallType(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 160 }}>
              <option value="">ทั้งหมด</option>
              {installTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 2. กรองช่วงวันที่ advDate */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>วันที่ Adv ตั้งแต่</div>
            <DateInput value={filterDateFrom} onChange={v => setFilterDateFrom(v)}
              style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ถึงวันที่</div>
            <DateInput value={filterDateTo} onChange={v => setFilterDateTo(v)}
              style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
          </div>

          {/* 3. กรองสถานะ */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>สถานะ</div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
              <option value="">ทุกสถานะ</option>
              {ADV_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {(filterStatus || filterInstallType || filterDateFrom || filterDateTo) && (
            <button onClick={() => { setFilterStatus(''); setFilterInstallType(''); setFilterDateFrom(''); setFilterDateTo('') }}
              style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#dc2626', alignSelf: 'flex-end' }}>
              ✕ ล้างตัวกรอง
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>แสดง</span>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
              {[10, 20, 30, 50, 100, 999].map(n => <option key={n} value={n}>{n === 999 ? 'ทั้งหมด' : n}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>จาก {filtered.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีรายการ Advance</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>คลิก "+ เพิ่มรายการ Advance" เพื่อเริ่มต้น</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e3a5f' }}>
                  {['#', 'โครงการ', 'วัตถุประสงค์', 'เอกสาร', 'ขอเบิก (฿)', 'วันที่ Adv', 'วันที่เคลียร์', 'จ่ายจริง (฿)', 'ส่วนต่าง (฿)', 'สถานะ', ''].map(h => (
                    <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((rec, idx) => {
                  const diff = getDiff(rec.amount, rec.actualAmount)
                  const checkedDocs = (rec.documents || []).filter(d => d.checked).length
                  const totalDocs = (rec.documents || []).length
                  return (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ padding: '12px', minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{getPlanName(rec.planId)}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{rec.objective || '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: checkedDocs === totalDocs && totalDocs > 0 ? '#16a34a' : '#64748b' }}>
                          {checkedDocs}/{totalDocs}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#1e3a5f', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {rec.amount ? Number(rec.amount).toLocaleString('th-TH') : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(rec.advDate)}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(rec.clearDate)}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                        {rec.actualAmount ? Number(rec.actualAmount).toLocaleString('th-TH') : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                        color: diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b' }}>
                        {rec.amount || rec.actualAmount ? (diff >= 0 ? '+' : '') + diff.toLocaleString('th-TH') : '-'}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}><StatusBadge value={rec.status} /></td>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {rec.status !== 'approved' && rec.status !== 'received' && rec.status !== 'waiting_clear' && rec.status !== 'cleared' && (
                            <button onClick={() => handleApprove(rec)}
                              style={{ padding: '5px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#16a34a', fontWeight: 700 }}>
                              ✅ อนุมัติ
                            </button>
                          )}
                          <button onClick={() => openEdit(rec)} style={{ padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#1d4ed8', fontWeight: 600 }}>แก้ไข</button>
                          <button onClick={() => handleDelete(rec.id)} style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div style={{ display: 'flex', gap: 32, padding: '12px 20px', background: '#1e3a5f', borderTop: '2px solid #0891b2', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>รวมขอเบิก: <strong style={{ color: '#38bdf8' }}>{totalAmount.toLocaleString('th-TH')} ฿</strong></div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>รวมจ่ายจริง: <strong style={{ color: '#34d399' }}>{totalActual.toLocaleString('th-TH')} ฿</strong></div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>ส่วนต่างรวม: <strong style={{ color: (totalAmount - totalActual) >= 0 ? '#fbbf24' : '#f87171' }}>{(totalAmount - totalActual).toLocaleString('th-TH')} ฿</strong></div>
          </div>
        </div>
      )}

      {/* ═══ ADD/EDIT MODAL ═══ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1a2d4a,#1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>⚙️ {editId ? 'แก้ไขรายการ Advance' : 'เพิ่มรายการ Advance'}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>กรอกรายละเอียดการเบิกจ่าย</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* 1. โครงการ */}
                <div>
                  <label style={LS}>1. โครงการ <span style={{ color: '#dc2626' }}>*</span></label>
                  <select value={form.planId} onChange={handleSelectPlan} style={IS} required>
                    <option value="">-- เลือกโครงการ --</option>
                    {projectPlans.filter(p => p.status !== 'deliver' && p.status !== 'closed').map(p => {
                      const hosp = hospitals.find(h => String(h.id) === String(p.hospitalId))
                      return <option key={p.id} value={p.id}>{p.projectName}{hosp ? ` – ${hosp.name}` : ''}</option>
                    })}
                  </select>
                </div>

                {/* 2. วัตถุประสงค์ */}
                <div>
                  <label style={LS}>2. วัตถุประสงค์</label>
                  <input value={form.objective} onChange={set('objective')} placeholder="ระบุวัตถุประสงค์ (auto-fill จากประเภทการติดตั้ง)" style={IS} />
                  {selectedPlan?.installType && (
                    <div style={{ fontSize: 11, color: '#0891b2', marginTop: 4 }}>
                      📌 ประเภทการติดตั้ง: {selectedPlan.installType}
                    </div>
                  )}
                </div>

                {/* 3. รายละเอียดเอกสาร */}
                <div>
                  <label style={LS}>3. รายละเอียดเอกสาร</label>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    {form.documents.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: idx < form.documents.length - 1 ? '1px solid #f1f5f9' : 'none', background: doc.checked ? '#f0fdf4' : '#fff' }}>
                        <input type="checkbox" checked={doc.checked} onChange={() => toggleDoc(idx)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }} />
                        <input value={doc.label} onChange={e => editDocLabel(idx, e.target.value)}
                          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: doc.checked ? '#15803d' : '#374151', fontWeight: doc.checked ? 600 : 400 }} />
                        <button type="button" onClick={() => removeDoc(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: '2px 4px' }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#f8fafc', borderTop: '1px dashed #e2e8f0' }}>
                      <input value={newDoc} onChange={e => setNewDoc(e.target.value)} placeholder="เพิ่มเอกสารใหม่..."
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDoc())}
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
                      <button type="button" onClick={addDoc} style={{ padding: '6px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ เพิ่ม</button>
                    </div>
                  </div>
                </div>

                {/* 4-8. ตัวเลข */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={LS}>4. จำนวนเงินที่ขอเบิก (฿)</label>
                    <input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" style={IS} min={0} />
                  </div>
                  <div>
                    <label style={LS}>7. จำนวนเงินที่จ่ายจริง (฿)</label>
                    <input type="number" value={form.actualAmount} onChange={set('actualAmount')} placeholder="0.00" style={IS} min={0} />
                  </div>
                  <div>
                    <label style={LS}>5. วันที่จัดทำ Adv</label>
                    <DateInput value={form.advDate} onChange={v => setForm(p => ({ ...p, advDate: v }))} style={IS} />
                  </div>
                  <div>
                    <label style={LS}>6. วันที่เคลียร์ Adv</label>
                    <DateInput value={form.clearDate} onChange={v => setForm(p => ({ ...p, clearDate: v }))} style={IS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={LS}>8. ยอดเงินส่วนต่าง (ขอเบิก – จ่ายจริง)</label>
                    {(() => {
                      const diff = getDiff(form.amount, form.actualAmount)
                      const hasDiff = form.amount || form.actualAmount
                      return (
                        <div style={{ padding: '10px 14px', borderRadius: 8, fontWeight: 700, fontSize: 16, border: '1.5px solid', background: !hasDiff ? '#f8fafc' : diff > 0 ? '#f0fdf4' : diff < 0 ? '#fef2f2' : '#f8fafc', borderColor: !hasDiff ? '#e2e8f0' : diff > 0 ? '#86efac' : diff < 0 ? '#fecaca' : '#e2e8f0', color: !hasDiff ? '#94a3b8' : diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b' }}>
                          {!hasDiff ? '–' : (diff >= 0 ? '+' : '') + diff.toLocaleString('th-TH') + ' ฿'}
                          {hasDiff && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8 }}>
                            {diff > 0 ? '(คงเหลือ)' : diff < 0 ? '(จ่ายเกิน)' : '(เท่ากัน)'}
                          </span>}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* 9. สถานะ */}
                <div>
                  <label style={LS}>9. สถานะดำเนินการ</label>
                  {(() => {
                    const s = ADV_STATUS.find(x => x.value === form.status) || ADV_STATUS[0]
                    return (
                      <select value={form.status} onChange={set('status')} style={{ ...IS, color: s.color, background: s.bg, border: `2px solid ${s.color}`, fontWeight: 700 }}>
                        {ADV_STATUS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </select>
                    )
                  })()}
                </div>

                {/* หมายเหตุ */}
                <div>
                  <label style={LS}>หมายเหตุ</label>
                  <textarea value={form.note} onChange={set('note')} rows={2} placeholder="รายละเอียดเพิ่มเติม..." style={{ ...IS, resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#1e3a5f,#0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', minWidth: 140 }}>
                  {editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึกรายการ'}
                </button>
                {!['approved', 'received', 'waiting_clear', 'cleared'].includes(form.status) && (
                  <button type="button" onClick={async () => {
                    if (!form.planId) return alert('กรุณาเลือกโครงการก่อนอนุมัติ')
                    if (!window.confirm('ยืนยันการอนุมัติรายการนี้?\nสถานะจะเปลี่ยนเป็น "อนุมัติแล้ว"')) return
                    const updated = { ...form, status: 'approved' }
                    if (editId) {
                      const res = await api.put(`/advance-records/${editId}`, updated)
                      setRecords(prev => prev.map(r => r.id === editId ? res : r))
                    } else {
                      const res = await api.post('/advance-records', updated)
                      setRecords(prev => [res, ...prev])
                    }
                    setShowForm(false)
                  }} style={{ padding: '12px 20px', background: 'linear-gradient(135deg,#15803d,#16a34a)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ✅ อนุมัติ
                  </button>
                )}
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}