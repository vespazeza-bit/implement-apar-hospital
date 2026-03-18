import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #0891b2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 48px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  logo: { textAlign: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 28 },
  title: { fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b' },
  tabs: { display: 'flex', marginBottom: 28, background: '#f1f5f9', borderRadius: 8, padding: 4 },
  tab: (active) => ({ flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#1e3a5f' : '#64748b', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #1e3a5f, #0891b2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: 0.5 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #fecaca' },
  success: { background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #bbf7d0' },
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', name: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState('checking') // 'checking' | 'connected' | 'error'

  useEffect(() => {
    // ล้าง users เก่าจาก localStorage ให้ใช้ MySQL อย่างเดียว
    localStorage.removeItem('users')
    api.get('/health')
      .then(r => setDbStatus(r.db === 'connected' ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'))
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login', { username: form.username, password: form.password })
      if (res.error) { setError(res.error); setLoading(false); return }
      localStorage.setItem('currentUser', JSON.stringify(res))
      navigate('/')
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.username || !form.password || !form.name) return setError('กรุณากรอกข้อมูลให้ครบถ้วน')
    if (form.password !== form.confirmPassword) return setError('รหัสผ่านไม่ตรงกัน')
    if (form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { username: form.username, password: form.password, name: form.name })
      if (res.error) { setError(res.error); setLoading(false); return }
      setSuccess('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ')
      setForm({ username: '', password: '', name: '', confirmPassword: '' })
      setTimeout(() => setTab('login'), 1500)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🏥</div>
          <div style={S.title}>ระบบติดตามการติดตั้ง AP/AR</div>
          <div style={S.subtitle}>ระบบบัญชีเจ้าหนี้ – ลูกหนี้ โรงพยาบาล</div>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>เข้าสู่ระบบ</button>
          <button style={S.tab(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>สมัครสมาชิก</button>
        </div>

        {error && <div style={S.error}>⚠️ {error}</div>}
        {success && <div style={S.success}>✅ {success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={S.field}>
              <label style={S.label}>ชื่อผู้ใช้</label>
              <input style={S.input} value={form.username} onChange={set('username')} placeholder="กรอกชื่อผู้ใช้" autoComplete="username" />
            </div>
            <div style={S.field}>
              <label style={S.label}>รหัสผ่าน</label>
              <input style={S.input} type="password" value={form.password} onChange={set('password')} placeholder="กรอกรหัสผ่าน" autoComplete="current-password" />
            </div>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={S.field}>
              <label style={S.label}>ชื่อ-นามสกุล</label>
              <input style={S.input} value={form.name} onChange={set('name')} placeholder="กรอกชื่อ-นามสกุล" />
            </div>
            <div style={S.field}>
              <label style={S.label}>ชื่อผู้ใช้</label>
              <input style={S.input} value={form.username} onChange={set('username')} placeholder="กรอกชื่อผู้ใช้" autoComplete="username" />
            </div>
            <div style={S.field}>
              <label style={S.label}>รหัสผ่าน</label>
              <input style={S.input} type="password" value={form.password} onChange={set('password')} placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="new-password" />
            </div>
            <div style={S.field}>
              <label style={S.label}>ยืนยันรหัสผ่าน</label>
              <input style={S.input} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password" />
            </div>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
          ระบบติดตามการติดตั้งและเตรียมความพร้อม AP/AR
        </div>

        {/* DB Status */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: dbStatus === 'connected' ? '#f0fdf4' : dbStatus === 'error' ? '#fef2f2' : '#f8fafc', border: `1px solid ${dbStatus === 'connected' ? '#bbf7d0' : dbStatus === 'error' ? '#fecaca' : '#e2e8f0'}` }}>
          <span style={{ fontSize: 10, width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: dbStatus === 'connected' ? '#16a34a' : dbStatus === 'error' ? '#dc2626' : '#94a3b8', boxShadow: dbStatus === 'connected' ? '0 0 6px #16a34a' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: dbStatus === 'connected' ? '#15803d' : dbStatus === 'error' ? '#dc2626' : '#64748b' }}>
            {dbStatus === 'checking' ? 'กำลังตรวจสอบฐานข้อมูล...' : dbStatus === 'connected' ? 'เชื่อมต่อฐานข้อมูลสำเร็จ' : 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>acc_system_setup</span>
        </div>
      </div>
    </div>
  )
}