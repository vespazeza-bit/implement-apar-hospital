import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import * as XLSX from 'xlsx'
const SYS_KEY = 'basicSystemNames'
const PAPER_SIZES = ['A4', 'A5']
const EMPTY_MASTER = { systemName: '', formName: '', printName: '', paperSize: 'A4', parameter: '', condition: '', sortOrder: '' }
const toISO = (d) => d ? String(d).slice(0, 10) : ''
const CUR_BE = new Date().getFullYear() + 543
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const fmtShort = (iso) => { if (!iso) return ''; const [,m,d] = iso.split('-'); return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)-1]}` }

const STATUS_OPTS = [
  { value: 'waiting_form',   label: 'รอแบบฟอร์ม',     color: '#9333ea', bg: '#faf5ff' },
  { value: 'drawn',          label: 'วาดแล้ว',          color: '#0891b2', bg: '#eff6ff' },
  { value: 'waiting_code',   label: 'รอลง code',        color: '#d97706', bg: '#fffbeb' },
  { value: 'waiting_review', label: 'รอตรวจสอบ',       color: '#2563eb', bg: '#eff6ff' },
  { value: 'revision',       label: 'ปรับแก้ไข',        color: '#dc2626', bg: '#fef2f2' },
  { value: 'done',           label: 'เรียบร้อย',         color: '#16a34a', bg: '#f0fdf4' },
]
const statusMeta = (v) => STATUS_OPTS.find(s => s.value === v) || STATUS_OPTS[0]

const loadSystems = () => {
  try {
    const saved = localStorage.getItem(SYS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

const thS = { padding: '10px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }
const tdS = { padding: '10px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }

export default function ChecklistForm() {
  const { hospitals, teamMembers, projectPlans, formMasterItems, addFormMaster, updateFormMaster, deleteFormMaster } = useApp()
  const [activeTab, setActiveTab] = useState('checklist')
  const systems = loadSystems()

  // ── Check List tab state ──────────────────────────────────────────────────
  const [checkHosp, setCheckHosp] = useState('')
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importHosp, setImportHosp] = useState('')
  const [importRows, setImportRows] = useState([])
  const [selectedMasterIds, setSelectedMasterIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [clView, setClView] = useState('list')
  const [hospSummaries, setHospSummaries] = useState([])
  const [clSearch, setClSearch] = useState('')
  const [clYear, setClYear] = useState(String(CUR_BE))

  // ── Master tab state ──────────────────────────────────────────────────────
  const [showMasterForm, setShowMasterForm] = useState(false)
  const [masterForm, setMasterForm] = useState(EMPTY_MASTER)
  const [editId, setEditId] = useState(null)
  const [filterSystem, setFilterSystem] = useState('')

  // ── Load entries ──────────────────────────────────────────────────────────
  const loadEntries = useCallback(async (hospId) => {
    if (!hospId) { setEntries([]); return }
    setLoadingEntries(true)
    try {
      const data = await api.get(`/form-entries?hospitalId=${hospId}`)
      setEntries(Array.isArray(data) ? data : [])
    } catch { setEntries([]) }
    setLoadingEntries(false)
  }, [])

  useEffect(() => { loadEntries(checkHosp) }, [checkHosp, loadEntries])

  const loadHospSummaries = useCallback(async () => {
    try {
      const data = await api.get('/form-entries/summary')
      setHospSummaries(Array.isArray(data) ? data : [])
    } catch { setHospSummaries([]) }
  }, [])

  useEffect(() => { loadHospSummaries() }, [loadHospSummaries])

  // ── Derived year list & filtered summaries ────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set([CUR_BE])
    projectPlans.forEach(p => {
      const s = toISO(p.startDate || p.onlineStart)
      const e = toISO(p.endDate   || p.onlineEnd)
      if (s) years.add(parseInt(s.slice(0,4)) + 543)
      if (e) years.add(parseInt(e.slice(0,4)) + 543)
    })
    return [...years].sort((a, b) => b - a)
  }, [projectPlans])

  const filteredSummaries = useMemo(() => {
    const q = clSearch.trim().toLowerCase()
    const fy = Number(clYear) || 0
    const hospIdsInYear = fy ? new Set(
      projectPlans
        .filter(p => {
          const s = toISO(p.startDate || p.onlineStart)
          const e = toISO(p.endDate   || p.onlineEnd)
          const sy = s ? parseInt(s.slice(0,4)) + 543 : null
          const ey = e ? parseInt(e.slice(0,4)) + 543 : null
          if (!sy && !ey) return false
          if (sy && ey) return sy <= fy && fy <= ey
          return sy === fy || ey === fy
        })
        .map(p => String(p.hospitalId))
    ) : null
    return hospSummaries
      .map(s => ({ ...s, hosp: hospitals.find(h => String(h.id) === String(s.hospitalId)) }))
      .filter(s => {
        if (!s.hosp) return false
        if (hospIdsInYear && !hospIdsInYear.has(String(s.hospitalId))) return false
        if (q && !s.hosp.name.toLowerCase().includes(q)) return false
        return true
      })
  }, [hospSummaries, hospitals, clSearch, clYear, projectPlans])

  // ── Import flow ───────────────────────────────────────────────────────────
  const openImport = () => {
    setImportHosp(clView === 'detail' ? (checkHosp || '') : '')
    const rows = formMasterItems.map(m => {
      const existing = entries.find(e => e.masterId === m.id)
      return { masterId: m.id, systemName: m.systemName, formName: m.formName, printName: m.printName, status: existing?.status || 'waiting_form', assignedTo: existing?.assignedTo || '' }
    })
    setImportRows(rows)
    setSelectedMasterIds(new Set(rows.map(r => r.masterId)))
    setShowImport(true)
  }

  const loadImportRows = (hospId) => {
    api.get(`/form-entries?hospitalId=${hospId}`).then(existing => {
      const rows = formMasterItems.map(m => {
        const ex = existing.find(e => e.masterId === m.id)
        return { masterId: m.id, systemName: m.systemName, formName: m.formName, printName: m.printName, status: ex?.status || 'waiting_form', assignedTo: ex?.assignedTo || '' }
      })
      setImportRows(rows)
      setSelectedMasterIds(new Set(rows.map(r => r.masterId)))
    })
  }

  const handleImportHospChange = (hospId) => {
    setImportHosp(hospId)
    if (hospId) loadImportRows(hospId)
    else {
      const rows = formMasterItems.map(m => ({ masterId: m.id, systemName: m.systemName, formName: m.formName, printName: m.printName, status: 'waiting_form', assignedTo: '' }))
      setImportRows(rows)
      setSelectedMasterIds(new Set(rows.map(r => r.masterId)))
    }
  }

  const toggleSelectMaster = (masterId) => {
    setSelectedMasterIds(prev => {
      const next = new Set(prev)
      if (next.has(masterId)) next.delete(masterId)
      else next.add(masterId)
      return next
    })
  }

  const setRowField = (idx, field, value) => {
    setImportRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const handleImportSave = async () => {
    if (!importHosp) return alert('กรุณาเลือกโรงพยาบาล')
    const selectedRows = importRows.filter(r => selectedMasterIds.has(r.masterId))
    if (!selectedRows.length) return alert('กรุณาเลือกอย่างน้อย 1 รายการ')
    setSaving(true)
    try {
      await api.post('/form-entries/import', { hospitalId: importHosp, items: selectedRows })
      setShowImport(false)
      await loadHospSummaries()
      setCheckHosp(importHosp)
      setClView('detail')
      await loadEntries(importHosp)
      window.scrollTo({ top: 0 })
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  // ── Inline update ─────────────────────────────────────────────────────────
  const updateEntry = async (entryId, field, value) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return
    const updated = { ...entry, [field]: value }
    setEntries(prev => prev.map(e => e.id === entryId ? updated : e))
    await api.put(`/form-entries/${entryId}`, { status: updated.status, assignedTo: updated.assignedTo, note: updated.note || '' })
    if (field === 'status') loadHospSummaries()
  }

  const deleteEntry = async (entryId, formName) => {
    if (!window.confirm(`ลบ "${formName}" ออกจาก check list ?`)) return
    await api.del(`/form-entries/${entryId}`)
    setEntries(prev => prev.filter(e => e.id !== entryId))
    loadHospSummaries()
  }

  // ── Group entries by systemName ───────────────────────────────────────────
  const groupedEntries = entries.reduce((acc, e) => {
    const key = e.systemName || 'ไม่ระบุระบบ'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})
  const sysOrder = formMasterItems.map(m => m.systemName).filter((v, i, a) => v && a.indexOf(v) === i)
  const sortedSystems = [...sysOrder.filter(s => groupedEntries[s]), ...Object.keys(groupedEntries).filter(s => !sysOrder.includes(s))]

  // ── Master CRUD ───────────────────────────────────────────────────────────
  const setF = k => e => setMasterForm(p => ({ ...p, [k]: e.target.value }))
  const openAddMaster = () => { setMasterForm(EMPTY_MASTER); setEditId(null); setShowMasterForm(true) }
  const openEditMaster = (item) => {
    setMasterForm({ systemName: item.systemName, formName: item.formName, printName: item.printName, paperSize: item.paperSize, parameter: item.parameter, condition: item.condition || '', sortOrder: item.sortOrder })
    setEditId(item.id); setShowMasterForm(true)
  }
  const handleMasterSubmit = async (e) => {
    e.preventDefault()
    if (!masterForm.formName.trim()) return alert('กรุณากรอกชื่อแบบฟอร์ม')
    const payload = { ...masterForm, sortOrder: Number(masterForm.sortOrder) || 0 }
    if (editId) await updateFormMaster(editId, payload)
    else await addFormMaster({ ...payload, sortOrder: Number(masterForm.sortOrder) || formMasterItems.length + 1 })
    setShowMasterForm(false); setEditId(null); setMasterForm(EMPTY_MASTER)
  }
  const handleMasterDelete = async (id, name) => {
    if (!window.confirm(`ลบ "${name}" ?`)) return
    await deleteFormMaster(id)
  }
  const filteredMaster = filterSystem ? formMasterItems.filter(i => i.systemName === filterSystem) : formMasterItems

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const hospObj = hospitals.find(h => String(h.id) === String(checkHosp))
    const hospName = hospObj?.name || `รพ. #${checkHosp}`
    const title = `ตาราง Check List แบบฟอร์ม AP/AR - ${hospName}`
    const headers = ['ลำดับ', 'ระบบงาน', 'ชื่อแบบฟอร์ม', 'ชื่อพิมพ์', 'ขนาดกระดาษ', 'ผู้รับผิดชอบ', 'สถานะ']
    const rows = []
    let seq = 1
    sortedSystems.forEach(sysName => {
      const items = groupedEntries[sysName] || []
      items.forEach(entry => {
        rows.push([
          seq++,
          entry.systemName || '',
          entry.formName || '',
          entry.printName || '',
          entry.paperSize || '',
          entry.assignedTo || '',
          statusMeta(entry.status).label,
        ])
      })
    })
    const ws = XLSX.utils.aoa_to_sheet([[title], [], headers, ...rows])
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 28 }, { wch: 28 }, { wch: 12 }, { wch: 22 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Check List แบบฟอร์ม')
    XLSX.writeFile(wb, `checklist_form_${hospName}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📄 Check List แบบฟอร์ม</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>ตรวจสอบความพร้อมของแบบฟอร์มต่างๆ ที่ใช้ในระบบบัญชีเจ้าหนี้–ลูกหนี้</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'checklist', label: '📄 Check List' },
          { key: 'master',    label: '⚙️ กำหนดข้อมูลแบบฟอร์ม' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: activeTab === tab.key ? '#0891b2' : '#64748b',
            borderBottom: activeTab === tab.key ? '3px solid #0891b2' : '3px solid transparent',
            marginBottom: -2,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ════ Tab: Check List ════ */}
      {activeTab === 'checklist' && (
        <div>
          {clView === 'list' ? (
            /* ── List View ── */
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={openImport} style={{
                  padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>+ เพิ่ม / นำเข้ารายการ</button>
                <select value={clYear} onChange={e => setClYear(e.target.value)} style={{
                  padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                  background: '#fff', cursor: 'pointer', fontWeight: clYear ? 600 : 400, color: clYear ? '#1e3a5f' : '#64748b',
                }}>
                  <option value="">ทุกปี</option>
                  {availableYears.map(y => <option key={y} value={String(y)}>ปี พ.ศ. {y}</option>)}
                </select>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <input value={clSearch} onChange={e => setClSearch(e.target.value)}
                    placeholder="ค้นหาโรงพยาบาล..."
                    style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  {clSearch && (
                    <button onClick={() => setClSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0 }}>✕</button>
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{filteredSummaries.length} โรงพยาบาล</span>
              </div>

              {filteredSummaries.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{clSearch ? 'ไม่พบโรงพยาบาลที่ค้นหา' : 'ยังไม่มีข้อมูล Check List แบบฟอร์ม'}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>กด "+ เพิ่ม / นำเข้ารายการ" เพื่อเริ่มต้น</div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thS, width: 50, textAlign: 'center' }}>#</th>
                        <th style={thS}>โรงพยาบาล</th>
                        <th style={{ ...thS, textAlign: 'center' }}>รายการทั้งหมด</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#faf5ff', color: '#9333ea' }}>รอแบบฟอร์ม</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#eff6ff', color: '#0891b2' }}>กำลังดำเนินการ</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#f0fdf4', color: '#16a34a' }}>เรียบร้อย</th>
                        <th style={{ ...thS, minWidth: 160 }}>ความคืบหน้า</th>
                        <th style={{ ...thS, width: 120, textAlign: 'center' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummaries.map((s, idx) => {
                        const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
                        return (
                          <tr key={s.hospitalId} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ ...tdS, fontWeight: 600, color: '#1e293b' }}>{s.hosp?.name || `รพ. #${s.hospitalId}`}</td>
                            <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: '#374151' }}>{s.total}</td>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              {s.waiting > 0
                                ? <span style={{ padding: '2px 10px', borderRadius: 20, background: '#faf5ff', color: '#9333ea', fontSize: 13, fontWeight: 700 }}>{s.waiting}</span>
                                : <span style={{ color: '#cbd5e1' }}>–</span>}
                            </td>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              {s.inprogress > 0
                                ? <span style={{ padding: '2px 10px', borderRadius: 20, background: '#eff6ff', color: '#0891b2', fontSize: 13, fontWeight: 700 }}>{s.inprogress}</span>
                                : <span style={{ color: '#cbd5e1' }}>–</span>}
                            </td>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              {s.done > 0
                                ? <span style={{ padding: '2px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 700 }}>{s.done}</span>
                                : <span style={{ color: '#cbd5e1' }}>–</span>}
                            </td>
                            <td style={tdS}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#0891b2', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#16a34a' : pct > 0 ? '#0891b2' : '#94a3b8', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                              </div>
                            </td>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              <button
                                onClick={() => { setCheckHosp(s.hospitalId); setClView('detail'); window.scrollTo({ top: 0 }) }}
                                style={{ padding: '5px 14px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >ดูรายละเอียด</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ── Detail View ── */
            (() => {
              const hospObj = hospitals.find(h => String(h.id) === String(checkHosp))
              const total = entries.length
              const done = entries.filter(e => e.status === 'done').length
              const inprogress = entries.filter(e => ['drawn','waiting_code','waiting_review','revision'].includes(e.status)).length
              const waiting = entries.filter(e => e.status === 'waiting_form').length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div>
                  {/* Header bar */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 0, alignItems: 'stretch' }}>
                    <div style={{ paddingRight: 16, borderRight: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => { setClView('list'); loadHospSummaries() }}
                        style={{ padding: '7px 16px', background: '#f8fafc', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        ← กลับ
                      </button>
                    </div>
                    <div style={{ flex: 2, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>โรงพยาบาล</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>{hospObj?.name || `รพ. #${checkHosp}`}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>รายการทั้งหมด</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#1e3a5f' }}>{total}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#9333ea', marginBottom: 2 }}>รอแบบฟอร์ม</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#9333ea' }}>{waiting}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#0891b2', marginBottom: 2 }}>กำลังดำเนินการ</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0891b2' }}>{inprogress}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>เรียบร้อย</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{done}</div>
                    </div>
                    <div style={{ flex: 1, paddingLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>ความคืบหน้า</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: pct === 100 ? '#16a34a' : '#0891b2' }}>{pct}%</div>
                    </div>
                  </div>

                  {/* Detail Toolbar */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                    <button onClick={openImport} style={{
                      padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none',
                      borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}>+ เพิ่ม / นำเข้ารายการ</button>
                    {entries.length > 0 && (
                      <button onClick={exportToExcel} style={{
                        padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none',
                        borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      }}>📥 Export Excel</button>
                    )}
                  </div>

                  {loadingEntries ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>กำลังโหลด...</div>
                  ) : entries.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มี check list</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>กด "+ เพิ่ม / นำเข้ารายการ" เพื่อเริ่มต้น</div>
                    </div>
                  ) : (
                    <>
                      {/* Overview */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)',
                          borderRadius: 16, padding: '24px 28px', marginBottom: 14,
                          display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap',
                        }}>
                          <div style={{ textAlign: 'center', minWidth: 90 }}>
                            <div style={{ fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                              {pct}<span style={{ fontSize: 26 }}>%</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>ภาพรวม</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>ภาพรวมการดำเนินการแบบฟอร์ม</div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 12 }}>
                              <div style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#a5b4fc', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>เรียบร้อย <strong>{done}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#a5b4fc', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>กำลังดำเนินการ <strong>{inprogress}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>รอแบบฟอร์ม <strong>{waiting}</strong></span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px' }}>
                            <div style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>{total}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>รายการทั้งหมด</div>
                          </div>
                        </div>

                        {/* Per-system mini cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                          {sortedSystems.map(sysName => {
                            const sItems = groupedEntries[sysName] || []
                            const sDone = sItems.filter(e => e.status === 'done').length
                            const sInprog = sItems.filter(e => ['drawn','waiting_code','waiting_review','revision'].includes(e.status)).length
                            const sPct = sItems.length > 0 ? Math.round((sDone / sItems.length) * 100) : 0
                            return (
                              <div key={sysName} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sysName}>{sysName}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                                  {sDone}/{sItems.length} รายการ{sInprog > 0 ? ` · ดำเนินการ ${sInprog}` : ''}
                                </div>
                                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 4 }}>
                                  <div style={{ width: `${sPct}%`, background: sPct === 100 ? '#16a34a' : '#7c3aed', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: sPct === 100 ? '#16a34a' : sPct > 0 ? '#7c3aed' : '#94a3b8' }}>{sPct}%</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Checklist Table */}
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>รายการ Check List แบบฟอร์ม</div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>{total} รายการ</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ ...thS, width: '16%' }}>ระบบงาน</th>
                                <th style={{ ...thS, width: '20%' }}>ชื่อแบบฟอร์ม</th>
                                <th style={{ ...thS, width: '18%' }}>ชื่อพิมพ์</th>
                                <th style={{ ...thS, width: '18%' }}>ผู้รับผิดชอบ</th>
                                <th style={{ ...thS, width: '20%' }}>สถานะ</th>
                                <th style={{ ...thS, width: 80, textAlign: 'center' }}>จัดการ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedSystems.map(sysName => {
                                const items = groupedEntries[sysName] || []
                                return items.map((entry, idx) => (
                                  <tr key={entry.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    {idx === 0 && (
                                      <td rowSpan={items.length} style={{
                                        ...tdS, fontWeight: 700, color: '#1e3a5f', fontSize: 13,
                                        background: '#f0f7ff', borderRight: '2px solid #bfdbfe', verticalAlign: 'middle',
                                      }}>
                                        <span style={{ display: 'block', padding: '4px 0' }}>{sysName}</span>
                                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{items.length} รายการ</span>
                                      </td>
                                    )}
                                    <td style={{ ...tdS, fontWeight: 600, color: '#1e293b' }}>{entry.formName}</td>
                                    <td style={{ ...tdS, color: '#64748b' }}>{entry.printName || '–'}</td>
                                    <td style={tdS}>
                                      <select value={entry.assignedTo} onChange={e => updateEntry(entry.id, 'assignedTo', e.target.value)}
                                        style={{ width: '100%', padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#f8fafc', cursor: 'pointer' }}>
                                        <option value="">-- เลือก --</option>
                                        {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}{m.position ? ` (${m.position})` : ''}</option>)}
                                      </select>
                                    </td>
                                    <td style={tdS}>
                                      <select value={entry.status} onChange={e => updateEntry(entry.id, 'status', e.target.value)}
                                        style={{
                                          width: '100%', padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                          border: `1.5px solid ${statusMeta(entry.status).color}44`,
                                          background: statusMeta(entry.status).bg,
                                          color: statusMeta(entry.status).color, cursor: 'pointer', outline: 'none',
                                        }}>
                                        {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                      </select>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'center' }}>
                                      <button onClick={() => deleteEntry(entry.id, entry.formName)}
                                        style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                                        ลบ
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* ════ Tab: กำหนดข้อมูลแบบฟอร์ม ════ */}
      {activeTab === 'master' && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 20px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>{formMasterItems.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>รายการแบบฟอร์ม</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 20px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#15803d' }}>{systems.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>ระบบงาน</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={openAddMaster} style={{ padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่มรายการ</button>
            <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
              <option value="">ทุกระบบงาน</option>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {filterSystem && <button onClick={() => setFilterSystem('')} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>✕ ล้าง</button>}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>แสดง {filteredMaster.length} รายการ</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thS, width: 46, textAlign: 'center' }}>#</th>
                    <th style={thS}>ระบบงาน</th>
                    <th style={thS}>ชื่อแบบฟอร์ม</th>
                    <th style={thS}>ชื่อพิมพ์</th>
                    <th style={{ ...thS, width: 80, textAlign: 'center' }}>ขนาดกระดาษ</th>
                    <th style={thS}>Parameter</th>
                    <th style={thS}>เงื่อนไข</th>
                    <th style={{ ...thS, width: 130, textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaster.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 40 }}>ยังไม่มีรายการ</td></tr>
                  ) : filteredMaster.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={tdS}>
                        {item.systemName
                          ? <span style={{ padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>{item.systemName}</span>
                          : <span style={{ color: '#94a3b8', fontSize: 12 }}>–</span>}
                      </td>
                      <td style={{ ...tdS, fontWeight: 600, color: '#1e293b' }}>{item.formName}</td>
                      <td style={{ ...tdS, color: '#64748b' }}>{item.printName || '–'}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 12, background: item.paperSize === 'A4' ? '#f0fdf4' : '#fef9c3', color: item.paperSize === 'A4' ? '#15803d' : '#854d0e', fontSize: 12, fontWeight: 700 }}>{item.paperSize}</span>
                      </td>
                      <td style={{ ...tdS, color: '#64748b', maxWidth: 160 }}>{item.parameter || '–'}</td>
                      <td style={{ ...tdS, color: '#64748b', maxWidth: 160 }}>{item.condition || '–'}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => openEditMaster(item)} style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>แก้ไข</button>
                          <button onClick={() => handleMasterDelete(item.id, item.formName)} style={{ padding: '4px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ Import Modal ════ */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 820, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 2 }}>📄 เพิ่ม / นำเข้ารายการ Check List แบบฟอร์ม</h3>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>เลือกโรงพยาบาล กำหนดสถานะและผู้รับผิดชอบสำหรับแต่ละรายการ</p>
              </div>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>เลือกโครงการ *</label>
              <select value={String(importHosp || '')} onChange={e => handleImportHospChange(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: `1.5px solid ${importHosp ? '#0891b2' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
                <option value="">-- เลือกโครงการ --</option>
                {projectPlans.map(p => {
                  const h = hospitals.find(hh => String(hh.id) === String(p.hospitalId))
                  const s = toISO(p.startDate || p.onlineStart)
                  const e = toISO(p.endDate   || p.onlineEnd)
                  const range = s ? ` (${fmtShort(s)}–${fmtShort(e)})` : ''
                  return <option key={p.id} value={String(p.hospitalId)}>{h ? `[${h.name}] ` : ''}{p.projectName}{range}</option>
                })}
              </select>
              {importHosp && (
                <button type="button" onClick={() => handleImportHospChange(importHosp)} style={{ padding: '8px 14px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  🔄 โหลดรายการ
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
              {importRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  {formMasterItems.length === 0 ? 'ยังไม่มีรายการจากกำหนดข้อมูลแบบฟอร์ม' : 'เลือกโรงพยาบาลเพื่อโหลดรายการ'}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 8px' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      เลือกแล้ว{' '}
                      <strong style={{ color: selectedMasterIds.size > 0 ? '#0891b2' : '#94a3b8' }}>{selectedMasterIds.size}</strong>
                      {' '}จาก <strong>{importRows.length}</strong> รายการ
                    </span>
                    {selectedMasterIds.size > 0 && selectedMasterIds.size < importRows.length && (
                      <button onClick={() => setSelectedMasterIds(new Set(importRows.map(r => r.masterId)))}
                        style={{ padding: '3px 10px', background: '#eff6ff', color: '#0891b2', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                        เลือกทั้งหมด
                      </button>
                    )}
                    {selectedMasterIds.size > 0 && (
                      <button onClick={() => setSelectedMasterIds(new Set())}
                        style={{ padding: '3px 10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                        ยกเลิกทั้งหมด
                      </button>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thS, width: 42, textAlign: 'center' }}>
                          <input type="checkbox"
                            checked={importRows.length > 0 && selectedMasterIds.size === importRows.length}
                            ref={el => { if (el) el.indeterminate = selectedMasterIds.size > 0 && selectedMasterIds.size < importRows.length }}
                            onChange={e => setSelectedMasterIds(e.target.checked ? new Set(importRows.map(r => r.masterId)) : new Set())}
                            style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#0891b2' }} />
                        </th>
                        <th style={{ ...thS, width: 36, textAlign: 'center' }}>#</th>
                        <th style={thS}>ระบบงาน</th>
                        <th style={thS}>ชื่อแบบฟอร์ม</th>
                        <th style={thS}>ชื่อพิมพ์</th>
                        <th style={{ ...thS, width: 180 }}>ผู้รับผิดชอบ</th>
                        <th style={{ ...thS, width: 180 }}>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, idx) => {
                        const checked = selectedMasterIds.has(row.masterId)
                        return (
                          <tr key={row.masterId} style={{ background: checked ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#f8fafc', opacity: checked ? 1 : 0.45 }}>
                            <td style={{ ...tdS, textAlign: 'center' }}>
                              <input type="checkbox" checked={checked} onChange={() => toggleSelectMaster(row.masterId)}
                                style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#0891b2' }} />
                            </td>
                            <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                            <td style={tdS}>
                              <span style={{ padding: '2px 8px', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600 }}>{row.systemName || '–'}</span>
                            </td>
                            <td style={{ ...tdS, fontWeight: 500 }}>{row.formName}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{row.printName || '–'}</td>
                            <td style={tdS}>
                              <select value={row.assignedTo} onChange={e => setRowField(idx, 'assignedTo', e.target.value)} disabled={!checked}
                                style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#f8fafc' }}>
                                <option value="">-- เลือก --</option>
                                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}{m.position ? ` (${m.position})` : ''}</option>)}
                              </select>
                            </td>
                            <td style={tdS}>
                              <select value={row.status} onChange={e => setRowField(idx, 'status', e.target.value)} disabled={!checked}
                                style={{
                                  width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                  border: `1.5px solid ${statusMeta(row.status).color}55`,
                                  background: statusMeta(row.status).bg,
                                  color: statusMeta(row.status).color, cursor: checked ? 'pointer' : 'default',
                                }}>
                                {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
              {selectedMasterIds.size > 0 && importRows.length > 0 && (
                <span style={{ fontSize: 13, color: '#64748b', marginRight: 'auto' }}>
                  จะบันทึก <strong style={{ color: '#0891b2' }}>{selectedMasterIds.size}</strong> รายการ
                </span>
              )}
              <button onClick={() => setShowImport(false)} style={{ padding: '10px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleImportSave} disabled={saving || !importHosp || selectedMasterIds.size === 0} style={{
                padding: '10px 28px', background: (saving || !importHosp || selectedMasterIds.size === 0) ? '#94a3b8' : '#1e3a5f', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: (saving || !importHosp || selectedMasterIds.size === 0) ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'กำลังบันทึก...' : `💾 บันทึก${selectedMasterIds.size > 0 ? ` (${selectedMasterIds.size})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Master Form Modal ════ */}
      {showMasterForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, color: '#1e3a5f', fontSize: 18 }}>📄 {editId ? 'แก้ไข' : 'เพิ่ม'}รายการแบบฟอร์ม</h3>
            <form onSubmit={handleMasterSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>ระบบงาน</label>
                <select value={masterForm.systemName} onChange={setF('systemName')} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                  <option value="">-- เลือกระบบงาน --</option>
                  {systems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {systems.length === 0 && <p style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>⚠️ ยังไม่มีระบบงาน — กรุณาเพิ่มที่เมนู Check List ข้อมูลพื้นฐาน → ⚙️ จัดการระบบงาน</p>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>ชื่อแบบฟอร์ม *</label>
                <input value={masterForm.formName} onChange={setF('formName')} placeholder="เช่น ใบสำคัญจ่าย"
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>ชื่อพิมพ์</label>
                <input value={masterForm.printName} onChange={setF('printName')} placeholder="เช่น Payment Voucher"
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>ขนาดกระดาษ</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {PAPER_SIZES.map(size => (
                    <label key={size} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${masterForm.paperSize === size ? '#0891b2' : '#e2e8f0'}`, background: masterForm.paperSize === size ? '#eff6ff' : '#f8fafc', fontSize: 13, fontWeight: 600, color: masterForm.paperSize === size ? '#0891b2' : '#64748b' }}>
                      <input type="radio" name="paperSize" value={size} checked={masterForm.paperSize === size} onChange={setF('paperSize')} style={{ accentColor: '#0891b2' }} />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Parameter</label>
                <textarea value={masterForm.parameter} onChange={setF('parameter')} rows={2} placeholder="ระบุ parameter การพิมพ์เพิ่มเติม..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>เงื่อนไข</label>
                <textarea value={masterForm.condition} onChange={setF('condition')} rows={2} placeholder="ระบุเงื่อนไขการใช้งานแบบฟอร์ม..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 11, background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{editId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}</button>
                <button type="button" onClick={() => { setShowMasterForm(false); setEditId(null) }} style={{ flex: 1, padding: 11, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
