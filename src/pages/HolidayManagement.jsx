import { useState, useEffect, useMemo } from 'react'
import DateInput from '../components/DateInput'

const API = '/api'

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const THAI_DAYS_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส']

const toISO = (d) => d ? String(d).slice(0, 10) : ''
const toDisplayDate = (iso) => {
  if (!iso) return '-'
  const [y, m, day] = String(iso).slice(0, 10).split('-')
  return `${day}/${m}/${parseInt(y, 10) + 543}`
}
const toDisplayYear = (iso) => {
  if (!iso) return '-'
  return parseInt(String(iso).slice(0, 4), 10) + 543
}

const EMPTY_FORM = {
  holidayDate: '', holidayEndDate: '', holidayNameTh: '', holidayNameEn: '',
  holidayTypeId: '', isCompensate: 'N', isAllOrg: 'Y', colorCode: '', isActive: 'Y', note: '',
}

const LS = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const IS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }
const btn = (bg, border, color) => ({ padding: '5px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', color, fontWeight: 600 })

export default function HolidayManagement() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState('list')
  const [holidays, setHolidays] = useState([])
  const [holidayTypes, setHolidayTypes] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterYear, setFilterYear] = useState(String(today.getFullYear()))
  const [filterType, setFilterType] = useState('')
  const [filterActive, setFilterActive] = useState('Y')

  // Calendar
  const [calView, setCalView] = useState('month')
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  // Form modal
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  // Type manager
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [typeForm, setTypeForm] = useState({ code: '', typeName: '', colorCode: '#6b7280', isActive: 'Y' })
  const [editTypeId, setEditTypeId] = useState(null)

  // Bulk select
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Import
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState(null)

  // Generate
  const [genYear, setGenYear] = useState(String(today.getFullYear()))
  const [genResult, setGenResult] = useState(null)

  // Holiday Rules
  const [rules, setRules] = useState([])
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleForm, setRuleForm] = useState({ ruleName:'', ruleNameEn:'', ruleType:'weekend', dayOfWeek:'', fixMonth:'', fixDay:'', fixEndMonth:'', fixEndDay:'', nthWeek:'', nthMonth:'', holidayTypeId:'', colorCode:'', isActive:'Y', note:'' })
  const [editRuleId, setEditRuleId] = useState(null)
  const [applyYear, setApplyYear] = useState(String(today.getFullYear()))
  const [applyResult, setApplyResult] = useState(null)
  const [rulesLoading, setRulesLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setT = k => e => setTypeForm(p => ({ ...p, [k]: e.target.value }))

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterYear) params.set('year', filterYear)
      if (filterType) params.set('typeId', filterType)
      if (filterActive) params.set('isActive', filterActive)
      const [h, ht] = await Promise.all([
        fetch(`${API}/holidays?${params}`).then(r => r.json()),
        fetch(`${API}/holiday-types`).then(r => r.json()),
      ])
      setHolidays(Array.isArray(h) ? h : [])
      setHolidayTypes(Array.isArray(ht) ? ht : [])
    } catch { setHolidays([]); setHolidayTypes([]) }
    setLoading(false)
  }

  const loadRules = async () => {
    setRulesLoading(true)
    try {
      const data = await fetch(`${API}/holiday-rules`).then(r => r.json())
      setRules(Array.isArray(data) ? data : [])
    } catch { setRules([]) }
    setRulesLoading(false)
  }

  useEffect(() => { load(); setSelectedIds(new Set()) }, [filterYear, filterType, filterActive])
  useEffect(() => { if (activeTab === 'rules') loadRules() }, [activeTab])

  // ── CRUD Holidays ────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (h) => {
    setForm({
      holidayDate: toISO(h.holiday_date), holidayEndDate: toISO(h.holiday_end_date),
      holidayNameTh: h.holiday_name_th || '', holidayNameEn: h.holiday_name_en || '',
      holidayTypeId: h.holiday_type_id ? String(h.holiday_type_id) : '',
      isCompensate: h.is_compensate || 'N', isAllOrg: h.is_all_org || 'Y',
      colorCode: h.color_code || '', isActive: h.is_active || 'Y', note: h.note || '',
    })
    setEditId(h.id); setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.holidayDate) return alert('กรุณาระบุวันที่')
    if (!form.holidayNameTh) return alert('กรุณาระบุชื่อวันหยุด')
    if (!form.holidayTypeId) return alert('กรุณาเลือกประเภทวันหยุด')
    const url = editId ? `${API}/holidays/${editId}` : `${API}/holidays`
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) return alert(data.error || 'บันทึกไม่สำเร็จ')
    setShowForm(false)
    load()
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`ลบ "${name}" ?`)) return
    await fetch(`${API}/holidays/${id}`, { method: 'DELETE' })
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    load()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`ยืนยันลบ ${selectedIds.size} รายการที่เลือก?`)) return
    await Promise.all([...selectedIds].map(id => fetch(`${API}/holidays/${id}`, { method: 'DELETE' })))
    setSelectedIds(new Set())
    load()
  }

  const toggleSelect = (id) => setSelectedIds(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(h => h.id)))
    }
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['วันที่', 'ชื่อวันหยุด (TH)', 'ชื่อวันหยุด (EN)', 'ประเภท', 'ชดเชย', 'ทั้งองค์กร', 'Active', 'หมายเหตุ']
    const rows = filtered.map(h => [
      toDisplayDate(h.holiday_date), h.holiday_name_th, h.holiday_name_en || '',
      h.type_name || '', h.is_compensate, h.is_all_org, h.is_active, h.note || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `holidays_${filterYear || 'all'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Auto Generate ────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genYear) return alert('กรุณาระบุปี (ค.ศ.)')
    const ceYear = parseInt(genYear, 10) >= 2400 ? parseInt(genYear, 10) - 543 : parseInt(genYear, 10)
    if (!window.confirm(`Generate วันหยุดราชการปี พ.ศ. ${ceYear + 543} (ค.ศ. ${ceYear}) ?`)) return
    const res = await fetch(`${API}/holidays/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year: ceYear }) })
    const data = await res.json()
    setGenResult(data)
    load()
  }

  // ── Import ───────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    // Format: วันที่ (dd/mm/พ.ศ. หรือ yyyy-mm-dd), ชื่อ TH, ประเภท code (optional)
    const lines = importText.trim().split('\n').filter(l => l.trim())
    const rows = lines.map(line => {
      const parts = line.split(',').map(s => s.trim())
      let dateStr = parts[0] || ''
      // แปลง dd/mm/yyyy หรือ dd/mm/BE → ISO
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/')
        const ceY = parseInt(y, 10) >= 2400 ? parseInt(y, 10) - 543 : parseInt(y, 10)
        dateStr = `${ceY}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
      }
      const typeCode = parts[2] || ''
      const ht = holidayTypes.find(t => t.code === typeCode.toUpperCase())
      return { holidayDate: dateStr, holidayNameTh: parts[1] || '', holidayTypeId: ht?.id || holidayTypes[0]?.id || '' }
    })
    const res = await fetch(`${API}/holidays/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
    const data = await res.json()
    setImportResult(data)
    load()
  }

  // ── Holiday Rules CRUD ───────────────────────────────────────────────────────
  const EMPTY_RULE = { ruleName:'', ruleNameEn:'', ruleType:'weekend', dayOfWeek:'', fixMonth:'', fixDay:'', fixEndMonth:'', fixEndDay:'', nthWeek:'1', nthMonth:'', holidayTypeId:'', colorCode:'', isActive:'Y', note:'' }

  const openAddRule = () => { setRuleForm(EMPTY_RULE); setEditRuleId(null); setShowRuleForm(true) }
  const openEditRule = (r) => {
    setRuleForm({
      ruleName: r.rule_name||'', ruleNameEn: r.rule_name_en||'',
      ruleType: r.rule_type||'weekend',
      dayOfWeek: r.day_of_week!=null ? String(r.day_of_week) : '',
      fixMonth: r.fix_month||'', fixDay: r.fix_day||'',
      fixEndMonth: r.fix_end_month||'', fixEndDay: r.fix_end_day||'',
      nthWeek: r.nth_week||'1', nthMonth: r.nth_month||'',
      holidayTypeId: r.holiday_type_id ? String(r.holiday_type_id) : '',
      colorCode: r.color_code||'', isActive: r.is_active||'Y', note: r.note||'',
    })
    setEditRuleId(r.id); setShowRuleForm(true)
  }

  const handleSaveRule = async (e) => {
    e.preventDefault()
    if (!ruleForm.ruleName) return alert('กรุณาระบุชื่อเงื่อนไข')
    if (ruleForm.ruleType === 'weekday' && ruleForm.dayOfWeek === '') return alert('กรุณาเลือกวันในสัปดาห์')
    if (ruleForm.ruleType === 'fixed_date' && (!ruleForm.fixMonth || !ruleForm.fixDay)) return alert('กรุณาระบุเดือนและวันที่')
    if (ruleForm.ruleType === 'fixed_date_range' && (!ruleForm.fixMonth || !ruleForm.fixDay || !ruleForm.fixEndMonth || !ruleForm.fixEndDay)) return alert('กรุณาระบุวันเริ่มต้นและวันสิ้นสุด')
    if (ruleForm.ruleType === 'nth_weekday' && (ruleForm.dayOfWeek === '' || !ruleForm.nthWeek)) return alert('กรุณาระบุครั้งที่และวันในสัปดาห์')
    const url = editRuleId ? `${API}/holiday-rules/${editRuleId}` : `${API}/holiday-rules`
    const method = editRuleId ? 'PUT' : 'POST'
    const body = {
      ...ruleForm,
      dayOfWeek: ruleForm.dayOfWeek !== '' ? Number(ruleForm.dayOfWeek) : null,
      fixMonth: ruleForm.fixMonth || null,
      fixDay: ruleForm.fixDay || null,
      fixEndMonth: ruleForm.fixEndMonth || null,
      fixEndDay: ruleForm.fixEndDay || null,
      nthWeek: ruleForm.nthWeek || null,
      nthMonth: ruleForm.nthMonth || null,
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) return alert('บันทึกไม่สำเร็จ')
    setShowRuleForm(false)
    loadRules()
  }

  const handleDeleteRule = async (id, name) => {
    if (!window.confirm(`ลบเงื่อนไข "${name}" ?`)) return
    await fetch(`${API}/holiday-rules/${id}`, { method: 'DELETE' })
    loadRules()
  }

  const handleApplyRules = async () => {
    if (!applyYear) return alert('กรุณาระบุปี')
    if (!window.confirm(`Apply เงื่อนไขวันหยุดทั้งหมดสำหรับปี พ.ศ. ${Number(applyYear) + 543} ?`)) return
    const res = await fetch(`${API}/holiday-rules/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year: Number(applyYear) }) })
    const data = await res.json()
    setApplyResult(data)
    load()
  }

  // ── Type CRUD ────────────────────────────────────────────────────────────────
  const saveType = async (e) => {
    e.preventDefault()
    const url = editTypeId ? `${API}/holiday-types/${editTypeId}` : `${API}/holiday-types`
    const method = editTypeId ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(typeForm) })
    setShowTypeForm(false); setEditTypeId(null)
    load()
  }

  const deleteType = async (id, name) => {
    if (!window.confirm(`ลบประเภท "${name}" ?`)) return
    await fetch(`${API}/holiday-types/${id}`, { method: 'DELETE' })
    load()
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  const filtered = holidays  // already filtered by API

  // ── Available years ──────────────────────────────────────────────────────────
  const availYears = useMemo(() => {
    const base = today.getFullYear()
    return Array.from({ length: 11 }, (_, i) => base - 3 + i)
  }, [])

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const holidayMap = useMemo(() => {
    const m = new Map()
    holidays.forEach(h => {
      const key = toISO(h.holiday_date)
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(h)
    })
    return m
  }, [holidays])

  const getHolidayColor = (h) => h.color_code || h.type_color || '#6b7280'

  // ── Calendar: Month view ─────────────────────────────────────────────────────
  const renderMonthView = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInM  = new Date(calYear, calMonth + 1, 0).getDate()
    const cells    = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInM; d++) cells.push(d)

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
          {THAI_DAYS_SHORT.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 13, fontWeight: 700, padding: '8px 0',
              color: i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#000000',
              borderBottom: '2px solid #e2e8f0',
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const iso = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const hs = holidayMap.get(iso) || []
            const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
            const dow = new Date(calYear, calMonth, d).getDay()
            const isSun = dow === 0
            const isSat = dow === 6
            return (
              <div key={i} style={{
                minHeight: 90, background: hs.length ? '#fef9ec' : isToday ? '#eff6ff' : '#fff',
                border: `1px solid ${isToday ? '#0891b2' : '#e2e8f0'}`,
                borderRadius: 8, padding: '6px 8px', position: 'relative',
                borderTop: isToday ? '3px solid #0891b2' : hs.length ? `3px solid ${getHolidayColor(hs[0])}` : '1px solid #e2e8f0',
                boxShadow: isToday ? '0 0 0 1px #0891b240' : 'none',
              }}>
                <div style={{
                  fontSize: 15, fontWeight: isToday ? 800 : 600,
                  color: isToday ? '#0891b2' : isSun ? '#dc2626' : isSat ? '#2563eb' : '#000000',
                  marginBottom: 4,
                }}>{d}</div>
                {hs.slice(0, 3).map((h, hi) => {
                  const hc = getHolidayColor(h)
                  return (
                    <div key={hi} style={{
                      fontSize: 11, borderRadius: 4, padding: '2px 6px', marginBottom: 2,
                      background: hc, color: '#fff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontWeight: 600, lineHeight: 1.4,
                    }} title={h.holiday_name_th}>
                      {h.holiday_name_th}
                    </div>
                  )
                })}
                {hs.length > 3 && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>+{hs.length - 3} รายการ</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Calendar: Year view ──────────────────────────────────────────────────────
  const renderYearView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
      {Array.from({ length: 12 }, (_, mIdx) => {
        const firstDay = new Date(calYear, mIdx, 1).getDay()
        const daysInM  = new Date(calYear, mIdx + 1, 0).getDate()
        const cells    = []
        for (let i = 0; i < firstDay; i++) cells.push(null)
        for (let d = 1; d <= daysInM; d++) cells.push(d)
        const monthHolidays = holidays.filter(h => {
          const hd = toISO(h.holiday_date)
          return hd.startsWith(`${calYear}-${String(mIdx + 1).padStart(2,'0')}`)
        })
        const isCurrentMonth = mIdx === today.getMonth() && calYear === today.getFullYear()
        return (
          <div key={mIdx} style={{
            background: '#fff', borderRadius: 12,
            border: `2px solid ${isCurrentMonth ? '#0891b2' : '#e2e8f0'}`,
            padding: '12px 14px',
            boxShadow: isCurrentMonth ? '0 0 0 3px #0891b220' : 'none',
          }}>
            <div style={{
              fontWeight: 700, fontSize: 15, marginBottom: 10, textAlign: 'center',
              color: isCurrentMonth ? '#0891b2' : '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {THAI_MONTHS[mIdx]}
              {monthHolidays.length > 0 && (
                <span style={{ fontSize: 12, background: '#fef9ec', color: '#d97706', borderRadius: 10, padding: '1px 8px', fontWeight: 700, border: '1px solid #fcd34d' }}>
                  {monthHolidays.length} วัน
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 4 }}>
              {THAI_DAYS_SHORT.map((d, di) => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 700, paddingBottom: 4,
                  color: di === 0 ? '#dc2626' : di === 6 ? '#2563eb' : '#000000',
                }}>{d}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />
                const iso = `${calYear}-${String(mIdx + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const hs  = holidayMap.get(iso) || []
                const isToday = d === today.getDate() && mIdx === today.getMonth() && calYear === today.getFullYear()
                const dow = new Date(calYear, mIdx, d).getDay()
                return (
                  <div key={i} title={hs.map(h => h.holiday_name_th).join(', ')} style={{
                    textAlign: 'center', fontSize: 12, borderRadius: 4, padding: '3px 0',
                    cursor: hs.length ? 'pointer' : 'default',
                    background: hs.length ? getHolidayColor(hs[0]) : isToday ? '#0891b2' : 'transparent',
                    color: hs.length || isToday ? '#fff' : dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#000000',
                    fontWeight: isToday || hs.length ? 700 : 400,
                  }}>{d}</div>
                )
              })}
            </div>
            {monthHolidays.length > 0 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {monthHolidays.slice(0, 4).map((h, hi) => {
                  const hc = getHolidayColor(h)
                  const day = toISO(h.holiday_date).slice(8, 10)
                  return (
                    <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: hc, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{parseInt(day, 10)}</div>
                      <span style={{ fontSize: 11, color: '#000000', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.holiday_name_th}>{h.holiday_name_th}</span>
                    </div>
                  )
                })}
                {monthHolidays.length > 4 && <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 25, fontWeight: 600 }}>+{monthHolidays.length - 4} รายการ</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const typeMap = useMemo(() => {
    const m = {}; holidayTypes.forEach(t => { m[t.id] = t }); return m
  }, [holidayTypes])

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📅 จัดการวันหยุด</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Holiday Management — วันหยุดราชการ / องค์กร / ชดเชย</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'list',     label: '📋 รายการวันหยุด' },
          { key: 'calendar', label: '📆 ปฏิทินวันหยุด' },
          { key: 'rules',    label: '🔧 เงื่อนไขวันหยุด' },
          { key: 'import',   label: '📥 นำเข้าวันหยุด' },
          { key: 'settings', label: '⚙️ ตั้งค่าประเภท' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            background: 'none', color: activeTab === t.key ? '#0891b2' : '#64748b',
            borderBottom: `3px solid ${activeTab === t.key ? '#0891b2' : 'transparent'}`, marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ TAB: รายการวันหยุด ══════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div>
          {/* Filter + Actions */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* ปุ่มหลัก */}
              <button onClick={openAdd} style={{ padding: '9px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                ➕ เพิ่มวันหยุด
              </button>
              <button onClick={exportCSV} style={{ padding: '9px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                📤 Export Excel
              </button>
              <button onClick={() => setActiveTab('import')} style={{ padding: '9px 16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                📥 Import Excel
              </button>

              {/* Filters */}
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ปี</div>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 120 }}>
                  <option value="">ทุกปี</option>
                  {availYears.map(y => <option key={y} value={y}>พ.ศ. {y + 543}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ประเภท</div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 160 }}>
                  <option value="">ทุกประเภท</option>
                  {holidayTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>สถานะ</div>
                <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                  <option value="">ทั้งหมด</option>
                  <option value="Y">Active</option>
                  <option value="N">Inactive</option>
                </select>
              </div>

              {/* Generate */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ปี (ค.ศ.)</div>
                  <input value={genYear} onChange={e => setGenYear(e.target.value)} placeholder="2026"
                    style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 80 }} />
                </div>
                <button onClick={handleGenerate} style={{ padding: '9px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  🔄 Generate
                </button>
              </div>
            </div>
            {genResult && (
              <div style={{ marginTop: 10, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#16a34a', border: '1px solid #86efac' }}>
                ✅ เพิ่มแล้ว {genResult.inserted} วัน | ข้ามซ้ำ {genResult.skipped} วัน
                <button onClick={() => setGenResult(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>
            )}
            {selectedIds.size > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>เลือกแล้ว {selectedIds.size} รายการ</span>
                <button onClick={handleBulkDelete} style={{ padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🗑️ ลบที่เลือก
                </button>
                <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
                  ยกเลิกเลือก
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>⏳ กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีรายการวันหยุด</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>คลิก "➕ เพิ่มวันหยุด" หรือ "🔄 Generate" เพื่อเริ่มต้น</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e3a5f' }}>
                      <th style={{ padding: '12px 10px', width: 40, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <input type="checkbox"
                          checked={filtered.length > 0 && selectedIds.size === filtered.length}
                          ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length }}
                          onChange={toggleSelectAll}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0891b2' }} />
                      </th>
                      {['#', 'วันที่', 'ชื่อวันหยุด (TH)', 'ชื่อวันหยุด (EN)', 'ประเภท', 'ชดเชย', 'ทั้งองค์กร', 'Active', ''].map(h => (
                        <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h, idx) => {
                      const color = getHolidayColor(h)
                      const isSelected = selectedIds.has(h.id)
                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#eff6ff' : '' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '' }}>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(h.id)}
                              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0891b2' }} />
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 13 }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, whiteSpace: 'nowrap', fontWeight: 600, color: '#1e293b' }}>
                            {toDisplayDate(h.holiday_date)}
                            {h.holiday_end_date && h.holiday_end_date !== h.holiday_date &&
                              <span style={{ color: '#64748b', fontWeight: 400 }}> – {toDisplayDate(h.holiday_end_date)}</span>}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: '#1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              {h.holiday_name_th}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{h.holiday_name_en || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {h.type_name ? (
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}66`, whiteSpace: 'nowrap' }}>
                                {h.type_name}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13 }}>
                            {h.is_compensate === 'Y' ? <span style={{ color: '#d97706', fontWeight: 700 }}>✓ ชดเชย</span> : '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13 }}>
                            {h.is_all_org === 'Y' ? <span style={{ color: '#0891b2' }}>ทั้งองค์กร</span> : <span style={{ color: '#64748b' }}>เฉพาะบางส่วน</span>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: h.is_active === 'Y' ? '#f0fdf4' : '#fef2f2', color: h.is_active === 'Y' ? '#16a34a' : '#dc2626', border: `1px solid ${h.is_active === 'Y' ? '#86efac' : '#fecaca'}` }}>
                              {h.is_active === 'Y' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button onClick={() => openEdit(h)} style={btn('#eff6ff', '#bfdbfe', '#1d4ed8')}>แก้ไข</button>
                              <button onClick={() => handleDelete(h.id, h.holiday_name_th)} style={btn('#fef2f2', '#fecaca', '#dc2626')}>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ padding: '10px 16px', background: '#1e3a5f', borderTop: '2px solid #0891b2', textAlign: 'right', fontSize: 13, color: '#94a3b8' }}>
                  รวม <strong style={{ color: '#fff' }}>{filtered.length}</strong> วันหยุด
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: ปฏิทินวันหยุด ══════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <div>
          {/* Calendar toolbar */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>มุมมอง</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ key: 'month', label: 'รายเดือน' }, { key: 'year', label: 'รายปี' }].map(v => (
                  <button key={v.key} onClick={() => setCalView(v.key)} style={{
                    padding: '7px 16px', border: `1.5px solid ${calView === v.key ? '#0891b2' : '#e2e8f0'}`,
                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: calView === v.key ? '#eff6ff' : '#fff', color: calView === v.key ? '#0891b2' : '#64748b',
                  }}>{v.label}</button>
                ))}
              </div>
            </div>
            {calView === 'month' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                  style={{ padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 15, minWidth: 160, textAlign: 'center', color: '#1e3a5f' }}>
                  {THAI_MONTHS[calMonth]} พ.ศ. {calYear + 543}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                  style={{ padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>›</button>
              </div>
            )}
            {calView === 'year' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setCalYear(y => y - 1)}
                  style={{ padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 15, minWidth: 120, textAlign: 'center', color: '#1e3a5f' }}>พ.ศ. {calYear + 543}</span>
                <button onClick={() => setCalYear(y => y + 1)}
                  style={{ padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>›</button>
              </div>
            )}
            {/* Legend */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {holidayTypes.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color_code }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{t.type_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar body */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            {calView === 'month' ? renderMonthView() : renderYearView()}
          </div>
        </div>
      )}

      {/* ══ TAB: เงื่อนไขวันหยุด ════════════════════════════════════════════════ */}
      {activeTab === 'rules' && (() => {
        const DOW_OPTIONS = [
          { v:'0', l:'วันอาทิตย์ (อา)' }, { v:'1', l:'วันจันทร์ (จ)' }, { v:'2', l:'วันอังคาร (อ)' },
          { v:'3', l:'วันพุธ (พ)' }, { v:'4', l:'วันพฤหัสบดี (พฤ)' }, { v:'5', l:'วันศุกร์ (ศ)' }, { v:'6', l:'วันเสาร์ (ส)' },
        ]
        const MONTH_OPTIONS = [
          { v:'1',l:'มกราคม' },{ v:'2',l:'กุมภาพันธ์' },{ v:'3',l:'มีนาคม' },{ v:'4',l:'เมษายน' },
          { v:'5',l:'พฤษภาคม' },{ v:'6',l:'มิถุนายน' },{ v:'7',l:'กรกฎาคม' },{ v:'8',l:'สิงหาคม' },
          { v:'9',l:'กันยายน' },{ v:'10',l:'ตุลาคม' },{ v:'11',l:'พฤศจิกายน' },{ v:'12',l:'ธันวาคม' },
        ]
        const RULE_TYPE_LABELS = {
          weekend: '📅 เสาร์-อาทิตย์ (ทุกสัปดาห์)',
          weekday: '📆 วันในสัปดาห์ (ทุกสัปดาห์)',
          fixed_date: '🗓️ วันที่คงที่ (ทุกปี)',
          fixed_date_range: '📆 ช่วงวันที่ (ทุกปี)',
          nth_weekday: '🔢 วันที่ N ของเดือน',
        }
        const getRuleSummary = (r) => {
          if (r.rule_type === 'weekend') return 'ทุกวันเสาร์และอาทิตย์'
          if (r.rule_type === 'weekday') return `ทุก${DOW_OPTIONS[r.day_of_week]?.l || ''} ตลอดปี`
          if (r.rule_type === 'fixed_date') return `${r.fix_day}/${r.fix_month} ของทุกปี`
          if (r.rule_type === 'fixed_date_range') return `${r.fix_day}/${r.fix_month} – ${r.fix_end_day}/${r.fix_end_month} ของทุกปี`
          if (r.rule_type === 'nth_weekday') {
            const dow = DOW_OPTIONS[r.day_of_week]?.l || ''
            const mo = r.nth_month ? MONTH_OPTIONS[r.nth_month - 1]?.l : 'ทุกเดือน'
            return `${r.nth_week === 1 ? '1st' : r.nth_week === 2 ? '2nd' : r.nth_week === 3 ? '3rd' : r.nth_week + 'th'} ${dow} ของ ${mo}`
          }
          return ''
        }
        return (
          <div>
            {/* Toolbar */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <button onClick={openAddRule} style={{ padding: '9px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ➕ เพิ่มเงื่อนไข
                </button>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>คำอธิบาย</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                    กำหนดเงื่อนไขวันหยุดซ้ำ แล้วคลิก <strong>Apply</strong> เพื่อ Generate วันหยุดทั้งหมดในปีที่ต้องการ
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>ปี (ค.ศ.)</div>
                    <input value={applyYear} onChange={e => setApplyYear(e.target.value)} placeholder="2026"
                      style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 80 }} />
                  </div>
                  <button onClick={handleApplyRules} style={{ padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ▶ Apply ทุกเงื่อนไข
                  </button>
                </div>
              </div>
              {applyResult && (
                <div style={{ marginTop: 10, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#16a34a', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✅ ปี ค.ศ. {applyResult.year} — เพิ่มแล้ว <strong>{applyResult.inserted}</strong> วัน | ข้ามซ้ำ <strong>{applyResult.skipped}</strong> วัน
                  <button onClick={() => setApplyResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginLeft: 4 }}>✕</button>
                </div>
              )}
            </div>

            {/* Rules list */}
            {rulesLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>⏳ กำลังโหลด...</div>
            ) : rules.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีเงื่อนไขวันหยุด</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>คลิก "➕ เพิ่มเงื่อนไข" เพื่อตั้งกฎวันหยุดซ้ำ เช่น เสาร์-อาทิตย์</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rules.map(r => {
                  const color = r.color_code || r.type_color || '#6b7280'
                  return (
                    <div key={r.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${r.is_active==='Y' ? color+'44' : '#e2e8f0'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {r.rule_type === 'weekend' ? '📅' : r.rule_type === 'weekday' ? '📆' : r.rule_type === 'fixed_date' ? '🗓️' : r.rule_type === 'fixed_date_range' ? '📆' : '🔢'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{r.rule_name}</span>
                          {r.rule_name_en && <span style={{ fontSize: 12, color: '#64748b' }}>({r.rule_name_en})</span>}
                          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: r.is_active==='Y' ? '#f0fdf4' : '#fef2f2', color: r.is_active==='Y' ? '#16a34a' : '#dc2626', border: `1px solid ${r.is_active==='Y' ? '#86efac' : '#fecaca'}` }}>
                            {r.is_active === 'Y' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            <span style={{ background: color+'15', color, padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11 }}>{RULE_TYPE_LABELS[r.rule_type]}</span>
                          </span>
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{getRuleSummary(r)}</span>
                          {r.type_name && <span style={{ fontSize: 11, color: '#64748b' }}>ประเภท: {r.type_name}</span>}
                          {r.note && <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.note}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEditRule(r)} style={btn('#eff6ff','#bfdbfe','#1d4ed8')}>แก้ไข</button>
                        <button onClick={() => handleDeleteRule(r.id, r.rule_name)} style={btn('#fef2f2','#fecaca','#dc2626')}>ลบ</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ══ TAB: นำเข้าวันหยุด ══════════════════════════════════════════════════ */}
      {activeTab === 'import' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ color: '#1e3a5f', fontSize: 16, marginBottom: 16 }}>📥 นำเข้าข้อมูลวันหยุด</h3>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, color: '#64748b', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>รูปแบบข้อมูล (CSV — 1 วันต่อ 1 บรรทัด):</div>
              <code style={{ display: 'block', fontFamily: 'monospace', fontSize: 11 }}>
                วันที่, ชื่อวันหยุด TH, ประเภท (code)<br />
                01/01/2569, วันขึ้นปีใหม่, GOV<br />
                06/04/2569, วันจักรี, GOV<br />
                2026-05-01, วันแรงงาน, GOV
              </code>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LS}>วางข้อมูล CSV ที่นี่ <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={10}
                placeholder="01/01/2569, วันขึ้นปีใหม่, GOV&#10;06/04/2569, วันจักรี, GOV"
                style={{ ...IS, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            </div>
            <button onClick={handleImport} disabled={!importText.trim()}
              style={{ padding: '10px 24px', background: importText.trim() ? '#0891b2' : '#e2e8f0', color: importText.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: importText.trim() ? 'pointer' : 'default' }}>
              📥 นำเข้าข้อมูล
            </button>
            {importResult && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, border: '1px solid #86efac', color: '#16a34a' }}>
                ✅ นำเข้าสำเร็จ {importResult.inserted} รายการ | ข้ามซ้ำ {importResult.skipped} รายการ
              </div>
            )}
          </div>

          {/* Template download */}
          <div style={{ flex: '1 1 280px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ color: '#1e3a5f', fontSize: 16, marginBottom: 16 }}>📄 ตัวอย่าง Template</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {holidayTypes.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color_code, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.type_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Code: {t.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: ตั้งค่าประเภท ══════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: '#1e3a5f', fontSize: 16 }}>⚙️ ประเภทวันหยุด</h3>
            <button onClick={() => { setTypeForm({ code: '', typeName: '', colorCode: '#6b7280', isActive: 'Y' }); setEditTypeId(null); setShowTypeForm(true) }}
              style={{ padding: '8px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ➕ เพิ่มประเภท
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
            {holidayTypes.map(t => (
              <div key={t.id} style={{ border: `2px solid ${t.color_code}44`, borderRadius: 10, padding: '14px 16px', background: t.color_code + '0d', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.color_code, flexShrink: 0 }} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{t.type_name}</div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Code: <strong>{t.code}</strong></div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                  สถานะ: <span style={{ color: t.is_active === 'Y' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{t.is_active === 'Y' ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setTypeForm({ code: t.code, typeName: t.type_name, colorCode: t.color_code, isActive: t.is_active }); setEditTypeId(t.id); setShowTypeForm(true) }}
                    style={btn('#eff6ff', '#bfdbfe', '#1d4ed8')}>แก้ไข</button>
                  <button onClick={() => deleteType(t.id, t.type_name)} style={btn('#fef2f2', '#fecaca', '#dc2626')}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MODAL: เพิ่ม/แก้ไขวันหยุด ══════════════════════════════════════════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg,#1a2d4a,#1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>📅 {editId ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LS}>วันที่เริ่ม <span style={{ color: '#dc2626' }}>*</span></label>
                  <DateInput value={form.holidayDate} onChange={v => setForm(p => ({ ...p, holidayDate: v }))} style={IS} required />
                </div>
                <div>
                  <label style={LS}>วันที่สิ้นสุด</label>
                  <DateInput value={form.holidayEndDate} onChange={v => setForm(p => ({ ...p, holidayEndDate: v }))} style={IS} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={LS}>ชื่อวันหยุด (TH) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.holidayNameTh} onChange={set('holidayNameTh')} placeholder="เช่น วันขึ้นปีใหม่" style={IS} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={LS}>ชื่อวันหยุด (EN)</label>
                  <input value={form.holidayNameEn} onChange={set('holidayNameEn')} placeholder="e.g. New Year's Day" style={IS} />
                </div>
                <div>
                  <label style={LS}>ประเภทวันหยุด <span style={{ color: '#dc2626' }}>*</span></label>
                  <select value={form.holidayTypeId} onChange={set('holidayTypeId')} style={IS} required>
                    <option value="">-- เลือกประเภท --</option>
                    {holidayTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>สีบน Calendar</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={form.colorCode || (typeMap[form.holidayTypeId]?.color_code || '#6b7280')}
                      onChange={set('colorCode')}
                      style={{ width: 44, height: 38, border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', padding: 3 }} />
                    <input value={form.colorCode} onChange={set('colorCode')} placeholder="ใช้สีจากประเภท" style={{ ...IS, flex: 1 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, gridColumn: 'span 2', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    <input type="checkbox" checked={form.isCompensate === 'Y'} onChange={e => setForm(p => ({ ...p, isCompensate: e.target.checked ? 'Y' : 'N' }))}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#d97706' }} />
                    เป็นวันหยุดชดเชย
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    <input type="checkbox" checked={form.isAllOrg === 'Y'} onChange={e => setForm(p => ({ ...p, isAllOrg: e.target.checked ? 'Y' : 'N' }))}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0891b2' }} />
                    ใช้ทั้งองค์กร
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    <input type="checkbox" checked={form.isActive === 'Y'} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked ? 'Y' : 'N' }))}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }} />
                    Active
                  </label>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={LS}>หมายเหตุ</label>
                  <textarea value={form.note} onChange={set('note')} rows={2} placeholder="รายละเอียดเพิ่มเติม..."
                    style={{ ...IS, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#1e3a5f,#0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  {editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึก'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: เงื่อนไขวันหยุด ══════════════════════════════════════════════ */}
      {showRuleForm && (() => {
        const setR = k => e => setRuleForm(p => ({ ...p, [k]: e.target.value }))
        const DOW_OPT = [
          { v:'0',l:'อาทิตย์' },{ v:'1',l:'จันทร์' },{ v:'2',l:'อังคาร' },
          { v:'3',l:'พุธ' },{ v:'4',l:'พฤหัสบดี' },{ v:'5',l:'ศุกร์' },{ v:'6',l:'เสาร์' },
        ]
        const MON_OPT = [
          { v:'1',l:'มกราคม' },{ v:'2',l:'กุมภาพันธ์' },{ v:'3',l:'มีนาคม' },{ v:'4',l:'เมษายน' },
          { v:'5',l:'พฤษภาคม' },{ v:'6',l:'มิถุนายน' },{ v:'7',l:'กรกฎาคม' },{ v:'8',l:'สิงหาคม' },
          { v:'9',l:'กันยายน' },{ v:'10',l:'ตุลาคม' },{ v:'11',l:'พฤศจิกายน' },{ v:'12',l:'ธันวาคม' },
        ]
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:300, padding:'24px 16px', overflowY:'auto' }}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', marginBottom:24 }}>
              <div style={{ background:'linear-gradient(135deg,#1a2d4a,#1e3a5f)', padding:'20px 28px', borderRadius:'16px 16px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>🔧 {editRuleId ? 'แก้ไขเงื่อนไขวันหยุด' : 'เพิ่มเงื่อนไขวันหยุด'}</div>
                <button onClick={() => setShowRuleForm(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', fontSize:18, cursor:'pointer' }}>✕</button>
              </div>
              <form onSubmit={handleSaveRule}>
                <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>

                  {/* ประเภทเงื่อนไข */}
                  <div>
                    <label style={LS}>ประเภทเงื่อนไข <span style={{ color:'#dc2626' }}>*</span></label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { v:'weekend',    icon:'📅', l:'เสาร์-อาทิตย์', d:'Generate ทุกวันเสาร์และอาทิตย์' },
                        { v:'weekday',    icon:'📆', l:'วันในสัปดาห์', d:'Generate ทุกสัปดาห์ในวันที่กำหนด' },
                        { v:'fixed_date', icon:'🗓️', l:'วันที่คงที่', d:'วัน/เดือน เดิมทุกปี เช่น 1 ม.ค.' },
                        { v:'fixed_date_range', icon:'📆', l:'ช่วงวันที่', d:'วันเริ่ม–วันสิ้นสุด ทุกปี เช่น 13–15 เม.ย.' },
                        { v:'nth_weekday',icon:'🔢', l:'วันที่ N ของเดือน', d:'เช่น จันทร์ที่ 2 ของทุกเดือน' },
                      ].map(opt => (
                        <label key={opt.v} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', borderRadius:8, border:`2px solid ${ruleForm.ruleType===opt.v ? '#0891b2' : '#e2e8f0'}`, background:ruleForm.ruleType===opt.v ? '#eff6ff' : '#fff', cursor:'pointer' }}>
                          <input type="radio" name="ruleType" value={opt.v} checked={ruleForm.ruleType===opt.v} onChange={setR('ruleType')} style={{ marginTop:2 }} />
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:ruleForm.ruleType===opt.v ? '#0891b2' : '#374151' }}>{opt.icon} {opt.l}</div>
                            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{opt.d}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ฟิลด์ตามประเภท */}
                  {ruleForm.ruleType === 'weekday' && (
                    <div>
                      <label style={LS}>วันในสัปดาห์ <span style={{ color:'#dc2626' }}>*</span></label>
                      <select value={ruleForm.dayOfWeek} onChange={setR('dayOfWeek')} style={IS} required>
                        <option value="">-- เลือกวัน --</option>
                        {DOW_OPT.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                      </select>
                    </div>
                  )}
                  {ruleForm.ruleType === 'fixed_date' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={LS}>เดือน <span style={{ color:'#dc2626' }}>*</span></label>
                        <select value={ruleForm.fixMonth} onChange={setR('fixMonth')} style={IS} required>
                          <option value="">-- เดือน --</option>
                          {MON_OPT.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={LS}>วันที่ <span style={{ color:'#dc2626' }}>*</span></label>
                        <input type="number" min={1} max={31} value={ruleForm.fixDay} onChange={setR('fixDay')} placeholder="1-31" style={IS} required />
                      </div>
                    </div>
                  )}
                  {ruleForm.ruleType === 'fixed_date_range' && (
                    <div>
                      <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>กำหนดวันเริ่มต้นและวันสิ้นสุด (เดือน/วัน) — ระบบจะสร้างวันหยุดทุกวันในช่วงนี้ของทุกปี</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:10, alignItems:'end' }}>
                        <div>
                          <label style={LS}>วันเริ่มต้น <span style={{ color:'#dc2626' }}>*</span></label>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <select value={ruleForm.fixMonth} onChange={setR('fixMonth')} style={IS} required>
                              <option value="">-- เดือน --</option>
                              {MON_OPT.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                            </select>
                            <input type="number" min={1} max={31} value={ruleForm.fixDay} onChange={setR('fixDay')} placeholder="วันที่" style={IS} required />
                          </div>
                        </div>
                        <div style={{ paddingBottom:10, fontSize:18, color:'#94a3b8', textAlign:'center' }}>→</div>
                        <div>
                          <label style={LS}>วันสิ้นสุด <span style={{ color:'#dc2626' }}>*</span></label>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <select value={ruleForm.fixEndMonth} onChange={setR('fixEndMonth')} style={IS} required>
                              <option value="">-- เดือน --</option>
                              {MON_OPT.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                            </select>
                            <input type="number" min={1} max={31} value={ruleForm.fixEndDay} onChange={setR('fixEndDay')} placeholder="วันที่" style={IS} required />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {ruleForm.ruleType === 'nth_weekday' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                      <div>
                        <label style={LS}>ครั้งที่ <span style={{ color:'#dc2626' }}>*</span></label>
                        <select value={ruleForm.nthWeek} onChange={setR('nthWeek')} style={IS} required>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={LS}>วันในสัปดาห์ <span style={{ color:'#dc2626' }}>*</span></label>
                        <select value={ruleForm.dayOfWeek} onChange={setR('dayOfWeek')} style={IS} required>
                          <option value="">-- วัน --</option>
                          {DOW_OPT.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={LS}>เดือน</label>
                        <select value={ruleForm.nthMonth} onChange={setR('nthMonth')} style={IS}>
                          <option value="">ทุกเดือน</option>
                          {MON_OPT.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ชื่อ */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={LS}>ชื่อ (TH) <span style={{ color:'#dc2626' }}>*</span></label>
                      <input value={ruleForm.ruleName} onChange={setR('ruleName')} placeholder="วันหยุดสุดสัปดาห์" style={IS} required />
                    </div>
                    <div>
                      <label style={LS}>ชื่อ (EN)</label>
                      <input value={ruleForm.ruleNameEn} onChange={setR('ruleNameEn')} placeholder="Weekend" style={IS} />
                    </div>
                  </div>

                  {/* ประเภทวันหยุด + สี */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={LS}>ประเภทวันหยุด</label>
                      <select value={ruleForm.holidayTypeId} onChange={setR('holidayTypeId')} style={IS}>
                        <option value="">-- เลือกประเภท --</option>
                        {holidayTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LS}>สี</label>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <input type="color" value={ruleForm.colorCode || '#6b7280'} onChange={setR('colorCode')}
                          style={{ width:44, height:38, border:'1.5px solid #e2e8f0', borderRadius:8, cursor:'pointer', padding:3 }} />
                        <input value={ruleForm.colorCode} onChange={setR('colorCode')} placeholder="ใช้สีจากประเภท" style={{ ...IS, flex:1 }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
                      <input type="checkbox" checked={ruleForm.isActive==='Y'} onChange={e => setRuleForm(p => ({ ...p, isActive: e.target.checked ? 'Y' : 'N' }))}
                        style={{ width:16, height:16, cursor:'pointer', accentColor:'#16a34a' }} />
                      Active
                    </label>
                  </div>
                  <div>
                    <label style={LS}>หมายเหตุ</label>
                    <input value={ruleForm.note} onChange={setR('note')} placeholder="รายละเอียดเพิ่มเติม" style={IS} />
                  </div>
                </div>
                <div style={{ padding:'16px 28px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10 }}>
                  <button type="submit" style={{ flex:1, padding:12, background:'linear-gradient(135deg,#1e3a5f,#0891b2)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
                    {editRuleId ? '💾 บันทึกการแก้ไข' : '✅ บันทึกเงื่อนไข'}
                  </button>
                  <button type="button" onClick={() => setShowRuleForm(false)} style={{ padding:'12px 24px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:10, fontSize:15, cursor:'pointer' }}>ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ══ MODAL: ประเภทวันหยุด ════════════════════════════════════════════════ */}
      {showTypeForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a2d4a,#1e3a5f)', padding: '18px 24px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>⚙️ {editTypeId ? 'แก้ไขประเภท' : 'เพิ่มประเภทวันหยุด'}</div>
              <button onClick={() => setShowTypeForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveType}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={LS}>Code <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={typeForm.code} onChange={setT('code')} placeholder="GOV, ORG, COMP..." style={IS} required />
                </div>
                <div>
                  <label style={LS}>ชื่อประเภท <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={typeForm.typeName} onChange={setT('typeName')} placeholder="วันหยุดราชการ" style={IS} required />
                </div>
                <div>
                  <label style={LS}>สี</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={typeForm.colorCode} onChange={setT('colorCode')}
                      style={{ width: 44, height: 38, border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', padding: 3 }} />
                    <input value={typeForm.colorCode} onChange={setT('colorCode')} style={{ ...IS, flex: 1 }} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  <input type="checkbox" checked={typeForm.isActive === 'Y'} onChange={e => setTypeForm(p => ({ ...p, isActive: e.target.checked ? 'Y' : 'N' }))}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }} />
                  Active
                </label>
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {editTypeId ? 'บันทึก' : 'เพิ่มประเภท'}
                </button>
                <button type="button" onClick={() => setShowTypeForm(false)} style={{ padding: '11px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
