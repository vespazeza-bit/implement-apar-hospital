import { useState } from 'react'
import { useApp } from '../context/AppContext'

const EMPTY_FORM = { name: '', nickname: '', position: '' }

const L = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const I = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', background: '#fff' }

export default function Team() {
  const { teamMembers: members, addTeamMember, updateTeamMember, deleteTeamMember } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = m => { setForm(m); setEditId(m.id); setShowForm(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return alert('กรุณากรอกชื่อ-สกุล')
    try {
      const res = editId
        ? await updateTeamMember(editId, { ...form, id: editId })
        : await addTeamMember(form)
      if (res?.error) { alert('เกิดข้อผิดพลาด: ' + res.error); return }
      setShowForm(false)
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    }
  }

  const handleDelete = async id => {
    await deleteTeamMember(id)
    setConfirmDelete(null)
  }

  const filtered = search
    ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.position?.toLowerCase().includes(search.toLowerCase()))
    : members

  const positions = [...new Set(members.map(m => m.position || 'ไม่ระบุ'))]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>👥 จัดการทีมงาน</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>เพิ่มและจัดการข้อมูลทีมงานเพื่อใช้อ้างอิงในการกำหนดแผนปฏิบัติงาน</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: '16px 24px', border: '1px solid #bfdbfe', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 32 }}>👥</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1e3a5f' }}>{members.length}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>ทีมงานทั้งหมด</div>
          </div>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 24px', border: '1px solid #bbf7d0', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 32 }}>🏷️</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#15803d' }}>{positions.filter(p => p !== 'ไม่ระบุ').length}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>ตำแหน่งที่มี</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={openAdd} style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#1e3a5f,#0891b2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ เพิ่มทีมงาน</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ หรือ ตำแหน่ง..."
          style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 240 }} />
        {search && <button onClick={() => setSearch('')} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>✕ ล้าง</button>}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>แสดง {filtered.length} คน</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{search ? 'ไม่พบทีมงาน' : 'ยังไม่มีข้อมูลทีมงาน'}</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>{search ? 'ลองเปลี่ยนคำค้นหา' : 'คลิก "+ เพิ่มทีมงาน" เพื่อเริ่มต้น'}</div>
          {!search && <button onClick={openAdd} style={{ marginTop: 16, padding: '9px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่มทีมงานคนแรก</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                {['#', 'ชื่อ – สกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'จัดการ'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, idx) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13, width: 50 }}>{idx + 1}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: `hsl(${(member.name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {member.nickname?.charAt(0) || member.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{member.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {member.nickname
                      ? <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fefce8', color: '#ca8a04', border: '1px solid #fde047' }}>{member.nickname}</span>
                      : <span style={{ fontSize: 12, color: '#94a3b8' }}>–</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {member.position
                      ? <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{member.position}</span>
                      : <span style={{ fontSize: 12, color: '#94a3b8' }}>–</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(member)} style={{ padding: '5px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#1d4ed8', fontWeight: 600 }}>✏️ แก้ไข</button>
                      <button onClick={() => setConfirmDelete(member)} style={{ padding: '5px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>🗑️ ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a2d4a,#1e3a5f)', padding: '20px 28px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>👤 {editId ? 'แก้ไขข้อมูลทีมงาน' : 'เพิ่มทีมงานใหม่'}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>กรอกข้อมูลสมาชิกทีมงาน</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '28px' }}>
                {form.name && (
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: `hsl(${(form.name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {form.name.charAt(0)}
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>ชื่อ – สกุล <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="เช่น นายสมชาย ใจดี" style={I} required autoFocus />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>ชื่อเล่น</label>
                  <input value={form.nickname || ''} onChange={set('nickname')} placeholder="เช่น ชาย" style={I} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={L}>ตำแหน่ง</label>
                  <input value={form.position} onChange={set('position')} placeholder="เช่น นักวิชาการคอมพิวเตอร์" style={I} />
                </div>
              </div>
              <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#1e3a5f,#0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  {editId ? '💾 บันทึก' : '✅ เพิ่มทีมงาน'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `hsl(${(confirmDelete.name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26, marginBottom: 16 }}>
              {confirmDelete.name.charAt(0)}
            </div>
            <h3 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 6 }}>ยืนยันการลบ</h3>
            <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{confirmDelete.name}</p>
            {confirmDelete.position && <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{confirmDelete.position}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: '11px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>ลบ</button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}