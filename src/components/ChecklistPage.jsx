import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ChecklistPage({ type, title, icon, items, description, hideHeader }) {
  const { hospitals, getChecklistData, updateChecklistItem, getProgress } = useApp()
  const [selectedHosp, setSelectedHosp] = useState('')
  const [noteItem, setNoteItem] = useState(null)
  const [note, setNote] = useState('')
  const [filterDone, setFilterDone] = useState('all')

  const hosp = hospitals.find(h => h.id === Number(selectedHosp))
  const data = selectedHosp ? getChecklistData(type, Number(selectedHosp)) : {}
  const progress = selectedHosp ? getProgress(type, Number(selectedHosp)) : null

  const toggle = (itemId) => {
    const current = data[itemId] || {}
    updateChecklistItem(type, Number(selectedHosp), itemId, {
      ...current,
      checked: !current.checked,
      date: !current.checked ? new Date().toISOString().split('T')[0] : current.date,
    })
  }

  const saveNote = (itemId) => {
    const current = data[itemId] || {}
    updateChecklistItem(type, Number(selectedHosp), itemId, { ...current, note })
    setNoteItem(null)
    setNote('')
  }

  const openNote = (itemId) => {
    setNoteItem(itemId)
    setNote(data[itemId]?.note || '')
  }

  const filteredItems = items.filter(item => {
    const checked = !!data[item.id]?.checked
    if (filterDone === 'done') return checked
    if (filterDone === 'pending') return !checked
    return true
  })

  return (
    <div>
      {!hideHeader && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>{icon} {title}</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>{description}</p>
        </div>
      )}

      {/* All hospitals summary */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 12 }}>สรุปความคืบหน้าทุก รพ.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {hospitals.map(h => {
            const p = getProgress(type, h.id)
            return (
              <div key={h.id} onClick={() => setSelectedHosp(String(h.id))} style={{
                padding: '8px 14px', borderRadius: 8, border: `2px solid ${selectedHosp === String(h.id) ? '#0891b2' : '#e2e8f0'}`,
                background: selectedHosp === String(h.id) ? '#eff6ff' : '#f8fafc',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: p.pct === 100 ? '#16a34a' : p.pct > 0 ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
                  {p.pct}% ({p.checked}/{p.total})
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 3, height: 4, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#16a34a' : p.pct > 0 ? '#0891b2' : '#e2e8f0', height: '100%' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hospital selector */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', marginBottom: 20, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>เลือกโรงพยาบาล:</label>
        <select value={selectedHosp} onChange={e => setSelectedHosp(e.target.value)} style={{
          padding: '8px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8,
          fontSize: 14, minWidth: 240, background: '#f8fafc', cursor: 'pointer',
        }}>
          <option value="">-- เลือกโรงพยาบาล --</option>
          {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>

        {progress && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'done', 'pending'].map(f => (
                <button key={f} onClick={() => setFilterDone(f)} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: filterDone === f ? '#0891b2' : '#e2e8f0',
                  background: filterDone === f ? '#eff6ff' : '#fff',
                  color: filterDone === f ? '#0891b2' : '#64748b',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {f === 'all' ? 'ทั้งหมด' : f === 'done' ? '✅ เสร็จแล้ว' : '⏳ ยังไม่เสร็จ'}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: progress.pct === 100 ? '#16a34a' : '#0891b2' }}>{progress.pct}%</span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>{progress.checked}/{progress.total}</span>
            </div>
          </>
        )}
      </div>

      {!selectedHosp ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>กรุณาเลือกโรงพยาบาล</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>หรือคลิกโรงพยาบาลจากแถบด้านบน</div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 24px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>{hosp?.name} – ความคืบหน้า</span>
              <span style={{ fontWeight: 700, color: progress?.pct === 100 ? '#16a34a' : '#0891b2' }}>{progress?.pct}%</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${progress?.pct}%`, background: progress?.pct === 100 ? '#16a34a' : 'linear-gradient(90deg, #0891b2, #38bdf8)', height: '100%', borderRadius: 8, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Checklist */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#1e3a5f', fontSize: 14 }}>
              {icon} รายการตรวจสอบ ({filteredItems.length} รายการ)
            </div>
            {filteredItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>ไม่มีรายการที่ตรงกับตัวกรอง</div>
            ) : filteredItems.map((item, idx) => {
              const itemData = data[item.id] || {}
              return (
                <div key={item.id} style={{
                  padding: '16px 24px',
                  borderBottom: idx < filteredItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  background: itemData.checked ? '#f0fdf4' : '#fff',
                }}>
                  <input type="checkbox" checked={!!itemData.checked} onChange={() => toggle(item.id)}
                    style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2, accentColor: '#16a34a' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: itemData.checked ? '#16a34a' : '#1e293b', textDecoration: itemData.checked ? 'line-through' : 'none' }}>
                      {item.label}
                    </div>
                    {itemData.note && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                        💬 {itemData.note}
                      </div>
                    )}
                    {itemData.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>✅ ตรวจสอบเมื่อ: {itemData.date}</div>}
                  </div>
                  <button onClick={() => openNote(item.id)} style={{
                    padding: '5px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', flexShrink: 0,
                  }}>📝 บันทึก</button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Note Modal */}
      {noteItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: 12, color: '#1e3a5f', fontSize: 16 }}>📝 บันทึกหมายเหตุ</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              {items.find(i => i.id === noteItem)?.label}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
              placeholder="กรอกหมายเหตุหรือรายละเอียดเพิ่มเติม..."
              style={{ width: '100%', padding: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => saveNote(noteItem)} style={{ flex: 1, padding: '10px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>บันทึก</button>
              <button onClick={() => { setNoteItem(null); setNote('') }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
