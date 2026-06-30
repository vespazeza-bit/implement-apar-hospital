import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
const EMPTY_FORM = { systemName: '', itemName: '', detail: '', sortOrder: '' }
const SYS_KEY = 'basicSystemNames'
const toISO = (d) => d ? String(d).slice(0, 10) : ''
const CUR_BE = new Date().getFullYear() + 543
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const fmtShort = (iso) => { if (!iso) return ''; const [,m,d] = iso.split('-'); return `${parseInt(d)} ${THAI_MONTHS[parseInt(m)-1]}` }

const STATUS_OPTS = [
  { value: 'waiting',    label: 'รอข้อมูล',          color: '#d97706', bg: '#fffbeb' },
  { value: 'inprogress', label: 'กำลังดำเนินการ',    color: '#0891b2', bg: '#eff6ff' },
  { value: 'done',       label: 'ดำเนินการแล้ว',     color: '#16a34a', bg: '#f0fdf4' },
]
const statusMeta = (v) => STATUS_OPTS.find(s => s.value === v) || STATUS_OPTS[0]

const loadSystems = (masterItems) => {
  try {
    const saved = localStorage.getItem(SYS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return [...new Set(masterItems.map(i => i.systemName).filter(Boolean))]
}
const saveSystems = (list) => localStorage.setItem(SYS_KEY, JSON.stringify(list))

export default function ChecklistBasic() {
  const { hospitals, basicMasterItems, projectPlans, addBasicMaster, updateBasicMaster, deleteBasicMaster, refreshBasicSummary } = useApp()
  const [activeTab, setActiveTab] = useState('checklist')

  // ── System management ──────────────────────────────────────────────────────
  const [systems, setSystems] = useState([])
  const [showSysMgr, setShowSysMgr] = useState(false)
  const [newSys, setNewSys] = useState('')
  const [editSysIdx, setEditSysIdx] = useState(null)
  const [editSysVal, setEditSysVal] = useState('')

  // ── Master item management ─────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [filterSystem, setFilterSystem] = useState('')

  // ── Checklist tab ──────────────────────────────────────────────────────────
  const [checkHosp, setCheckHosp] = useState('')
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importHosp, setImportHosp] = useState('')
  const [importRows, setImportRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [clView, setClView] = useState('list') // 'list' | 'detail'
  const [hospSummaries, setHospSummaries] = useState([])
  const [clSearch, setClSearch] = useState('')
  const [clYear, setClYear] = useState(String(CUR_BE))

  useEffect(() => {
    if (basicMasterItems.length > 0 && !localStorage.getItem(SYS_KEY)) {
      const derived = [...new Set(basicMasterItems.map(i => i.systemName).filter(Boolean))]
      setSystems(derived); saveSystems(derived)
    } else {
      setSystems(loadSystems(basicMasterItems))
    }
  }, [basicMasterItems])

  // โหลด entries เมื่อเลือก รพ.
  const loadEntries = useCallback(async (hospId) => {
    if (!hospId) { setEntries([]); return }
    setLoadingEntries(true)
    try {
      const data = await api.get(`/basic-entries?hospitalId=${hospId}`)
      setEntries(Array.isArray(data) ? data : [])
    } catch { setEntries([]) }
    setLoadingEntries(false)
  }, [])

  useEffect(() => { loadEntries(checkHosp) }, [checkHosp, loadEntries])

  const loadHospSummaries = useCallback(async () => {
    try {
      const data = await api.get('/basic-entries/summary')
      setHospSummaries(Array.isArray(data) ? data : [])
    } catch { setHospSummaries([]) }
  }, [])

  useEffect(() => { loadHospSummaries() }, [loadHospSummaries])

  // ── System CRUD ─────────────────────────────────────────────────────────────
  const addSystem = () => {
    const t = newSys.trim()
    if (!t) return
    if (systems.includes(t)) return alert('ระบบงานนี้มีอยู่แล้ว')
    const updated = [...systems, t]
    setSystems(updated); saveSystems(updated); setNewSys('')
  }
  const deleteSystem = (idx) => {
    const name = systems[idx]
    const inUse = basicMasterItems.some(i => i.systemName === name)
    if (!window.confirm(`${inUse ? `ระบบงาน "${name}" มีข้อมูลพื้นฐานใช้งานอยู่\n` : ''}ลบระบบงาน "${name}" ?`)) return
    const updated = systems.filter((_, i) => i !== idx)
    setSystems(updated); saveSystems(updated)
  }
  const startEditSys = (idx) => { setEditSysIdx(idx); setEditSysVal(systems[idx]) }
  const saveEditSys = () => {
    const t = editSysVal.trim()
    if (!t) return
    if (systems.includes(t) && systems[editSysIdx] !== t) return alert('ระบบงานนี้มีอยู่แล้ว')
    const updated = systems.map((s, i) => i === editSysIdx ? t : s)
    setSystems(updated); saveSystems(updated)
    setEditSysIdx(null); setEditSysVal('')
  }

  // ── Master item CRUD ────────────────────────────────────────────────────────
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (item) => {
    setForm({ systemName: item.systemName, itemName: item.itemName, detail: item.detail, sortOrder: item.sortOrder })
    setEditId(item.id); setShowForm(true)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.systemName || !form.itemName.trim()) return alert('กรุณาเลือกระบบงานและกรอกข้อมูลพื้นฐาน')
    if (editId) await updateBasicMaster(editId, { ...form, sortOrder: Number(form.sortOrder) || 0 })
    else await addBasicMaster({ ...form, sortOrder: Number(form.sortOrder) || basicMasterItems.length + 1 })
    setShowForm(false); setEditId(null); setForm(EMPTY_FORM)
  }
  const handleDelete = async (id, name) => {
    if (!window.confirm(`ลบ "${name}" ?`)) return
    await deleteBasicMaster(id)
  }

  // ── Import / เพิ่ม checklist ────────────────────────────────────────────────
  const openImport = () => {
    setImportHosp(clView === 'detail' ? (checkHosp || '') : '')
    const rows = basicMasterItems.map(m => {
      const existing = entries.find(e => e.masterId === m.id)
      return { entryId: existing?.id || null, masterId: m.id, systemName: m.systemName, itemName: m.itemName, detail: m.detail, status: existing?.status || 'waiting' }
    })
    setImportRows(rows)
    setShowImport(true)
  }

  const loadImportRows = (hospId) => {
    api.get(`/basic-entries?hospitalId=${hospId}`).then(existingEntries => {
      const rows = basicMasterItems.map(m => {
        const existing = existingEntries.find(e => e.masterId === m.id)
        return { entryId: existing?.id || null, masterId: m.id, systemName: m.systemName, itemName: m.itemName, detail: m.detail, status: existing?.status || 'waiting' }
      })
      setImportRows(rows)
    })
  }

  const handleImportHospChange = (hospId) => {
    setImportHosp(hospId)
    if (hospId) loadImportRows(hospId)
    else setImportRows(basicMasterItems.map(m => ({ entryId: null, masterId: m.id, systemName: m.systemName, itemName: m.itemName, detail: m.detail, status: 'waiting' })))
  }

  const deleteImportRow = async (idx) => {
    const row = importRows[idx]
    if (!window.confirm(`ลบ "${row.itemName}" ?`)) return
    if (row.entryId) {
      await api.del(`/basic-entries/${row.entryId}`)
      setEntries(prev => prev.filter(e => e.id !== row.entryId))
      refreshBasicSummary()
      loadHospSummaries()
    }
    setImportRows(prev => prev.filter((_, i) => i !== idx))
  }

  const setRowStatus = (idx, status) => {
    setImportRows(prev => prev.map((r, i) => i === idx ? { ...r, status } : r))
  }

  const handleImportSave = async () => {
    if (!importHosp) return alert('กรุณาเลือกโรงพยาบาล')
    if (!importRows.length) return alert('ไม่มีรายการจากกำหนดข้อมูลพื้นฐาน')
    setSaving(true)
    try {
      await api.post('/basic-entries/import', { hospitalId: importHosp, items: importRows })
      setShowImport(false)
      await loadHospSummaries()
      setCheckHosp(importHosp)
      setClView('detail')
      await loadEntries(importHosp)
      refreshBasicSummary()
      window.scrollTo({ top: 0 })
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  // ลบ entry ออกจาก DB
  const deleteEntry = async (entryId, itemName) => {
    if (!window.confirm(`ลบ "${itemName}" ออกจาก check list ?`)) return
    await api.del(`/basic-entries/${entryId}`)
    setEntries(prev => prev.filter(e => e.id !== entryId))
    refreshBasicSummary()
    loadHospSummaries()
  }

  // อัปเดต status inline
  const updateEntryStatus = async (entryId, status) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status } : e))
    await api.put(`/basic-entries/${entryId}`, { status, note: entry.note || '' })
    refreshBasicSummary()
    loadHospSummaries()
  }

  const openEditModal = (entry) => { setEditingEntry({ ...entry }); setShowEditModal(true) }
  const handleEditSave = async () => {
    if (!editingEntry) return
    setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...editingEntry } : e))
    await api.put(`/basic-entries/${editingEntry.id}`, { status: editingEntry.status, note: editingEntry.note || '' })
    refreshBasicSummary()
    loadHospSummaries()
    setShowEditModal(false)
    setEditingEntry(null)
  }

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

  // ── Group entries by systemName ─────────────────────────────────────────────
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.systemName || 'ไม่ระบุระบบ'
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})
  const systemOrder = basicMasterItems
    .map(m => m.systemName)
    .filter((v, i, a) => v && a.indexOf(v) === i)
  const sortedSystems = [
    ...systemOrder.filter(s => groupedEntries[s]),
    ...Object.keys(groupedEntries).filter(s => !systemOrder.includes(s)),
  ]

  const filtered = filterSystem ? basicMasterItems.filter(i => i.systemName === filterSystem) : basicMasterItems

  const thS = { padding: '10px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }
  const tdS = { padding: '10px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>🗂️ Check List ข้อมูลพื้นฐาน</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>ตรวจสอบความครบถ้วนของข้อมูลพื้นฐานที่จำเป็นสำหรับการใช้งานระบบ AP/AR</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'checklist', label: '🗂️ Check List' },
          { key: 'master',    label: '⚙️ กำหนดข้อมูลพื้นฐาน' },
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
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={openImport} style={{
                  padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>+ นำเข้า / เพิ่ม Check List</button>
                <select value={clYear} onChange={e => setClYear(e.target.value)} style={{
                  padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                  background: '#fff', cursor: 'pointer', fontWeight: clYear ? 600 : 400, color: clYear ? '#1e3a5f' : '#64748b',
                }}>
                  <option value="">ทุกปี</option>
                  {availableYears.map(y => (
                    <option key={y} value={String(y)}>ปี พ.ศ. {y}</option>
                  ))}
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
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{clSearch ? 'ไม่พบโรงพยาบาลที่ค้นหา' : 'ยังไม่มีข้อมูล Check List'}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>กด "+ นำเข้า / เพิ่ม Check List" เพื่อเริ่มต้น</div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thS, width: 50, textAlign: 'center' }}>#</th>
                        <th style={thS}>โรงพยาบาล</th>
                        <th style={{ ...thS, textAlign: 'center' }}>รายการทั้งหมด</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#fffbeb', color: '#d97706' }}>รอข้อมูล</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#eff6ff', color: '#0891b2' }}>กำลังดำเนินการ</th>
                        <th style={{ ...thS, textAlign: 'center', background: '#f0fdf4', color: '#16a34a' }}>ดำเนินการแล้ว</th>
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
                                ? <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fffbeb', color: '#d97706', fontSize: 13, fontWeight: 700 }}>{s.waiting}</span>
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
              const inprogress = entries.filter(e => e.status === 'inprogress').length
              const waiting = entries.filter(e => e.status === 'waiting').length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div>
                  {/* Header bar */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 0, alignItems: 'stretch' }}>
                    <div style={{ paddingRight: 16, borderRight: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => { setClView('list'); loadHospSummaries() }}
                        style={{ padding: '7px 16px', background: '#f8fafc', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >← กลับ</button>
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
                      <div style={{ fontSize: 11, color: '#d97706', marginBottom: 2 }}>รอข้อมูล</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{waiting}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#0891b2', marginBottom: 2 }}>กำลังดำเนินการ</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0891b2' }}>{inprogress}</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>ดำเนินการแล้ว</div>
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
                    }}>+ นำเข้า / เพิ่ม Check List</button>
                  </div>

                  {loadingEntries ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>กำลังโหลด...</div>
                  ) : entries.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มี check list</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>กด "+ นำเข้า / เพิ่ม Check List" เพื่อเริ่มต้น</div>
                    </div>
                  ) : (
                    <>
                      {/* Overview */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #1e3a5f 0%, #0891b2 100%)',
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
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>ภาพรวมการดำเนินการข้อมูลพื้นฐาน</div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 12 }}>
                              <div style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#38bdf8', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>ดำเนินการแล้ว <strong>{done}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#38bdf8', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>กำลังดำเนินการ <strong>{inprogress}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>รอข้อมูล <strong>{waiting}</strong></span>
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
                            const sInprog = sItems.filter(e => e.status === 'inprogress').length
                            const sPct = sItems.length > 0 ? Math.round((sDone / sItems.length) * 100) : 0
                            return (
                              <div key={sysName} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sysName}>{sysName}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                                  {sDone}/{sItems.length} รายการ{sInprog > 0 ? ` · กำลังทำ ${sInprog}` : ''}
                                </div>
                                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 4 }}>
                                  <div style={{ width: `${sPct}%`, background: sPct === 100 ? '#16a34a' : '#0891b2', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: sPct === 100 ? '#16a34a' : sPct > 0 ? '#0891b2' : '#94a3b8' }}>{sPct}%</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Checklist Table */}
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>รายการ Check List</div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>{total} รายการ</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...thS, width: '24%' }}>ระบบงาน</th>
                              <th style={{ ...thS, width: '38%' }}>ข้อมูลพื้นฐาน</th>
                              <th style={{ ...thS, width: '22%' }}>สถานะ</th>
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
                                      background: '#f0f7ff', borderRight: '2px solid #bfdbfe',
                                      verticalAlign: 'middle',
                                    }}>
                                      <span style={{ display: 'block', padding: '4px 0' }}>{sysName}</span>
                                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{items.length} รายการ</span>
                                    </td>
                                  )}
                                  <td style={tdS}>{entry.itemName}</td>
                                  <td style={tdS}>
                                    <select
                                      value={entry.status}
                                      onChange={e => updateEntryStatus(entry.id, e.target.value)}
                                      style={{
                                        padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        border: `1.5px solid ${statusMeta(entry.status).color}44`,
                                        background: statusMeta(entry.status).bg,
                                        color: statusMeta(entry.status).color, cursor: 'pointer',
                                        outline: 'none',
                                      }}
                                    >
                                      {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ ...tdS, textAlign: 'center' }}>
                                    <button
                                      onClick={() => deleteEntry(entry.id, entry.itemName)}
                                      style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                                    >ลบ</button>
                                  </td>
                                </tr>
                              ))
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* ════ Tab: Master Management ════ */}
      {activeTab === 'master' && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 20px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>{basicMasterItems.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>รายการข้อมูลพื้นฐาน</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 20px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#15803d' }}>{systems.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>ระบบงาน</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={openAdd} style={{ padding: '9px 20px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่มรายการ</button>
            <button onClick={() => { setShowSysMgr(true); setEditSysIdx(null) }} style={{ padding: '9px 16px', background: '#f8fafc', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>⚙️ จัดการระบบงาน</button>
            <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
              <option value="">ทุกระบบงาน</option>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {filterSystem && <button onClick={() => setFilterSystem('')} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>✕ ล้าง</button>}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>แสดง {filtered.length} รายการ</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thS, width: 50, textAlign: 'center' }}>#</th>
                  <th style={thS}>ระบบงาน</th>
                  <th style={thS}>ข้อมูลพื้นฐาน</th>
                  <th style={thS}>รายละเอียด</th>
                  <th style={{ ...thS, width: 130, textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 40 }}>ยังไม่มีรายการ</td></tr>
                ) : filtered.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>{item.systemName}</span></td>
                    <td style={{ ...tdS, fontWeight: 600, color: '#1e293b' }}>{item.itemName}</td>
                    <td style={{ ...tdS, color: '#64748b', maxWidth: 260 }}>{item.detail || '–'}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(item)} style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>แก้ไข</button>
                        <button onClick={() => handleDelete(item.id, item.itemName)} style={{ padding: '4px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ Import Modal ════ */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 2 }}>🗂️ เพิ่ม / นำเข้ารายการ Check List</h3>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>เลือกโรงพยาบาลและกำหนดสถานะสำหรับแต่ละรายการ</p>
              </div>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Hospital select */}
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

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
              {importRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  {basicMasterItems.length === 0 ? 'ยังไม่มีรายการจากกำหนดข้อมูลพื้นฐาน' : 'เลือกโรงพยาบาลเพื่อโหลดรายการ'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thS, width: 36, textAlign: 'center' }}>#</th>
                      <th style={thS}>ระบบงาน</th>
                      <th style={thS}>ข้อมูลพื้นฐาน</th>
                      <th style={{ ...thS, width: 180 }}>สถานะการดำเนินการ</th>
                      <th style={{ ...thS, width: 60, textAlign: 'center' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, idx) => (
                      <tr key={row.masterId} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                        <td style={tdS}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600 }}>{row.systemName}</span>
                        </td>
                        <td style={{ ...tdS, fontWeight: 500 }}>{row.itemName}</td>
                        <td style={tdS}>
                          <select
                            value={row.status}
                            onChange={e => setRowStatus(idx, e.target.value)}
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              border: `1.5px solid ${statusMeta(row.status).color}55`,
                              background: statusMeta(row.status).bg,
                              color: statusMeta(row.status).color, cursor: 'pointer',
                            }}
                          >
                            {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <button
                            onClick={() => deleteImportRow(idx)}
                            style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImport(false)} style={{ padding: '10px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleImportSave} disabled={saving || !importHosp || !importRows.length} style={{
                padding: '10px 28px', background: saving ? '#94a3b8' : '#1e3a5f', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Edit Entry Modal ════ */}
      {showEditModal && editingEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 450, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: 17, marginBottom: 2 }}>✏️ แก้ไข Check List</h3>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>อัพเดทสถานะและบันทึกหมายเหตุ</div>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingEntry(null) }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>ระบบงาน</div>
                <span style={{ padding: '3px 12px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 600 }}>{editingEntry.systemName}</span>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, marginBottom: 4 }}>ข้อมูลพื้นฐาน</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{editingEntry.itemName}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>สถานะการดำเนินการ</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {STATUS_OPTS.map(s => (
                    <button key={s.value} onClick={() => setEditingEntry(prev => ({ ...prev, status: s.value }))} style={{
                      flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: editingEntry.status === s.value ? `2px solid ${s.color}` : '1.5px solid #e2e8f0',
                      background: editingEntry.status === s.value ? s.bg : '#fff',
                      color: editingEntry.status === s.value ? s.color : '#94a3b8',
                      transition: 'all 0.15s',
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>บันทึกหมายเหตุ</label>
                <textarea
                  value={editingEntry.note || ''}
                  onChange={e => setEditingEntry(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowEditModal(false); setEditingEntry(null) }} style={{ flex: 1, padding: 11, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
                <button onClick={handleEditSave} style={{ flex: 2, padding: 11, background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>💾 บันทึกการแก้ไข</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ System Manager Modal ════ */}
      {showSysMgr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ color: '#1e3a5f', fontSize: 17 }}>⚙️ จัดการระบบงาน</h3>
              <button onClick={() => { setShowSysMgr(false); setEditSysIdx(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>ระบบงานที่กำหนดจะใช้เป็นตัวเลือกเมื่อเพิ่ม/แก้ไขข้อมูลพื้นฐาน</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={newSys} onChange={e => setNewSys(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSystem() } }}
                placeholder="ชื่อระบบงานใหม่..."
                style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #3b82f6', borderRadius: 8, fontSize: 13 }} />
              <button onClick={addSystem} style={{ padding: '9px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ เพิ่ม</button>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thS, width: 36, textAlign: 'center' }}>#</th>
                    <th style={thS}>ชื่อระบบงาน</th>
                    <th style={{ ...thS, width: 55, textAlign: 'center' }}>ใช้งาน</th>
                    <th style={{ ...thS, width: 145, textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.length === 0 ? (
                    <tr><td colSpan={4} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>ยังไม่มีระบบงาน</td></tr>
                  ) : systems.map((sys, idx) => {
                    const cnt = basicMasterItems.filter(i => i.systemName === sys).length
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...tdS, textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={tdS}>
                          {editSysIdx === idx ? (
                            <input value={editSysVal} onChange={e => setEditSysVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEditSys(); if (e.key === 'Escape') setEditSysIdx(null) }}
                              autoFocus style={{ width: '100%', padding: '4px 8px', border: '1.5px solid #3b82f6', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                          ) : <span style={{ fontWeight: 500 }}>{sys}</span>}
                        </td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, background: cnt > 0 ? '#f0fdf4' : '#f8fafc', color: cnt > 0 ? '#15803d' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>{cnt}</span>
                        </td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          {editSysIdx === idx ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={saveEditSys} style={{ padding: '4px 10px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>บันทึก</button>
                              <button onClick={() => setEditSysIdx(null)} style={{ padding: '4px 10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>ยกเลิก</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => startEditSys(idx)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>แก้ไข</button>
                              <button onClick={() => deleteSystem(idx)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>ลบ</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowSysMgr(false); setEditSysIdx(null) }} style={{ padding: '9px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Item Form Modal ════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, color: '#1e3a5f', fontSize: 18 }}>🗂️ {editId ? 'แก้ไข' : 'เพิ่ม'}รายการข้อมูลพื้นฐาน</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>ระบบงาน *</label>
                  <button type="button" onClick={() => setShowSysMgr(true)} style={{ fontSize: 11, color: '#0891b2', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>⚙️ จัดการระบบงาน</button>
                </div>
                <select value={form.systemName} onChange={set('systemName')} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                  <option value="">-- เลือกระบบงาน --</option>
                  {systems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>ข้อมูลพื้นฐาน *</label>
                <input value={form.itemName} onChange={set('itemName')} placeholder="เช่น ข้อมูลผู้ขาย (Vendor Master)"
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>รายละเอียด</label>
                <textarea value={form.detail} onChange={set('detail')} rows={3} placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{editId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
