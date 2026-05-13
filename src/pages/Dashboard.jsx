import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const PROJECT_STATUS = {
  waiting:    { label: 'รอดำเนินการ',    color: '#6b7280', bg: '#f3f4f6' },
  planning:   { label: 'วางแผนงาน',       color: '#ca8a04', bg: '#fefce8' },
  advance:    { label: 'จัดทำ Adv',        color: '#ea580c', bg: '#fff7ed' },
  inprog:     { label: 'กำลังดำเนินการ',  color: '#0891b2', bg: '#ecfeff' },
  deliver:    { label: 'ส่งมอบงาน',       color: '#1d4ed8', bg: '#eff6ff' },
  revisit:    { label: 'Revisit',          color: '#db2777', bg: '#fdf2f8' },
  accounting: { label: 'ส่งต่อบัญชี',     color: '#7c3aed', bg: '#f5f3ff' },
  closed:     { label: 'ปิดโครงการ',      color: '#16a34a', bg: '#f0fdf4' },
}

const SEV_COLOR = {
  low:      { label: 'ต่ำ',      color: '#16a34a', bg: '#f0fdf4' },
  medium:   { label: 'ปานกลาง',  color: '#d97706', bg: '#fffbeb' },
  high:     { label: 'สูง',      color: '#dc2626', bg: '#fef2f2' },
  critical: { label: 'วิกฤต',    color: '#7c3aed', bg: '#f5f3ff' },
}

// ─── Date helpers (รองรับ BE/CE ปนกัน — ปี ≥ 2400 ถือเป็น พ.ศ.) ──────────────
const toCE = (d) => {
  if (!d) return null
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return null
  const [y, m, day] = s.split('-')
  const yi = parseInt(y, 10)
  if (isNaN(yi)) return null
  const ce = yi >= 2400 ? yi - 543 : yi
  return new Date(`${ce}-${m}-${day}T00:00:00`)
}
const formatDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${y}`
}
const daysFromToday = (d) => {
  const target = toCE(d)
  if (!target) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

// ─── Reusable building blocks ────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon, link }) {
  const inner = (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 22px',
      border: '1px solid #e2e8f0', borderLeft: `4px solid ${accent}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  )
  return link
    ? <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
    : inner
}

function PanelCard({ title, icon, link, linkLabel, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>{icon} {title}</div>
        {link && <Link to={link} style={{ fontSize: 12, color: '#0891b2', textDecoration: 'none' }}>{linkLabel || 'ดูทั้งหมด'} →</Link>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function ProgressBar({ pct, color }) {
  const c = color || (pct === 100 ? '#16a34a' : pct > 50 ? '#0891b2' : pct > 0 ? '#d97706' : '#e2e8f0')
  return (
    <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: c, height: '100%', borderRadius: 4 }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    hospitals, projectPlans, trainingIssues, systemIssues, advanceRecords,
    basicEntriesSummary, formEntriesSummary, reportEntriesSummary, loading,
  } = useApp()

  const stats = useMemo(() => {
    // ── KPI 1: Hospitals ────────────────────────────────────────────────────
    const totalHosp = hospitals.length
    const hospWithPlan = new Set(projectPlans.map(p => String(p.hospitalId)))
    const hospOnline = new Set(projectPlans.filter(p => p.status === 'closed').map(p => String(p.hospitalId)))
    const hospActive = [...hospWithPlan].filter(id => !hospOnline.has(id)).length

    // ── KPI 2: Projects on-time vs delayed ─────────────────────────────────
    let onTime = 0, delayed = 0, ongoing = 0, finished = 0
    projectPlans.forEach(p => {
      if (p.status === 'closed') { finished += 1; return }
      ongoing += 1
      const days = daysFromToday(p.endDate)
      if (days != null && days < 0) delayed += 1
      else onTime += 1
    })

    // ── KPI 3: Open issues ──────────────────────────────────────────────────
    const openTraining = trainingIssues.filter(i => i.status !== 'closed')
    const openSystem = systemIssues.filter(i => i.status !== 'closed')
    const allOpenIssues = [
      ...openTraining.map(i => ({ ...i, source: 'training', sev: i.severity })),
      ...openSystem.map(i => ({ ...i, source: 'system', sev: i.priority })),
    ]
    const sevCount = { critical: 0, high: 0, medium: 0, low: 0 }
    allOpenIssues.forEach(i => { if (sevCount[i.sev] != null) sevCount[i.sev] += 1 })

    // ── KPI 4: Advance budget ───────────────────────────────────────────────
    const totalAdvance = advanceRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const totalActual = advanceRecords.reduce((s, r) => s + (Number(r.actualAmount) || 0), 0)
    const advCount = advanceRecords.length

    // ── Action #1: โครงการใกล้ online ใน 30 วัน ─────────────────────────────
    const upcomingOnline = projectPlans
      .filter(p => p.status !== 'closed' && p.onlineStart)
      .map(p => ({ ...p, _days: daysFromToday(p.onlineStart) }))
      .filter(p => p._days != null && p._days >= -7 && p._days <= 30)
      .sort((a, b) => a._days - b._days)
      .slice(0, 8)

    // ── Action #2: Critical/High open issues ────────────────────────────────
    const criticalIssues = allOpenIssues
      .filter(i => i.sev === 'critical' || i.sev === 'high')
      .sort((a, b) => {
        const order = { critical: 0, high: 1 }
        if (order[a.sev] !== order[b.sev]) return order[a.sev] - order[b.sev]
        const da = a.date || a.reportDate || ''
        const db = b.date || b.reportDate || ''
        return db.localeCompare(da)
      })
      .slice(0, 6)

    // ── Section 3: Average checklist progress per hospital ─────────────────
    const progressPerHosp = hospitals.map(h => {
      const id = String(h.id)
      const b = basicEntriesSummary.find(s => s.hospitalId === id) || { done: 0, total: 0 }
      const f = formEntriesSummary.find(s => s.hospitalId === id) || { done: 0, total: 0 }
      const r = reportEntriesSummary.find(s => s.hospitalId === id) || { done: 0, total: 0 }
      const total = b.total + f.total + r.total
      const done = b.done + f.done + r.done
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      return { id, name: h.name, pct, done, total, hasData: total > 0 }
    }).filter(x => x.hasData)
    const topProgress = [...progressPerHosp].sort((a, b) => b.pct - a.pct).slice(0, 5)
    const bottomProgress = [...progressPerHosp].sort((a, b) => a.pct - b.pct).slice(0, 5)

    // ── Activity feed: 10 most recent issues ───────────────────────────────
    const allIssues = [
      ...trainingIssues.map(i => ({ ...i, source: 'training', _date: i.date || '' })),
      ...systemIssues.map(i => ({ ...i, source: 'system', _date: i.reportDate || '' })),
    ]
    const recentActivity = allIssues
      .filter(i => i._date)
      .sort((a, b) => b._date.localeCompare(a._date))
      .slice(0, 10)

    // ── สรุปสถานะโครงการ ──────────────────────────────────────────────────
    const statusCounts = {}
    Object.keys(PROJECT_STATUS).forEach(k => { statusCounts[k] = 0 })
    projectPlans.forEach(p => { if (statusCounts[p.status] != null) statusCounts[p.status] += 1 })

    return {
      totalHosp, hospActive, hospOnline: hospOnline.size,
      onTime, delayed, ongoing, finished,
      totalOpen: allOpenIssues.length, sevCount,
      totalAdvance, totalActual, advCount,
      upcomingOnline, criticalIssues,
      topProgress, bottomProgress, recentActivity,
      statusCounts, totalPlans: projectPlans.length,
    }
  }, [hospitals, projectPlans, trainingIssues, systemIssues, advanceRecords,
      basicEntriesSummary, formEntriesSummary, reportEntriesSummary])

  const getHospName = (id) => hospitals.find(h => String(h.id) === String(id))?.name || id

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📊 Dashboard ภาพรวม</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>สรุปสถานะการติดตั้งระบบ AP/AR ทุกโรงพยาบาลในมุมมองเดียว</p>
      </div>

      {/* Section 1: KPI Cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        <KpiCard
          label="โรงพยาบาลทั้งหมด"
          value={stats.totalHosp}
          sub={`Online แล้ว ${stats.hospOnline} • กำลังดำเนินการ ${stats.hospActive}`}
          accent="#1e3a5f" icon="🏥" link="/hospitals"
        />
        <KpiCard
          label="โครงการ"
          value={stats.ongoing + stats.finished}
          sub={`ตามกำหนด ${stats.onTime} • ล่าช้า ${stats.delayed} • ปิดแล้ว ${stats.finished}`}
          accent={stats.delayed > 0 ? '#dc2626' : '#0891b2'} icon="📋" link="/workplan"
        />
        <KpiCard
          label="ปัญหาที่ยังไม่ปิด"
          value={stats.totalOpen}
          sub={`วิกฤต ${stats.sevCount.critical} • สูง ${stats.sevCount.high} • ปานกลาง ${stats.sevCount.medium} • ต่ำ ${stats.sevCount.low}`}
          accent={stats.sevCount.critical + stats.sevCount.high > 0 ? '#dc2626' : '#d97706'}
          icon="⚠️" link="/risk-analysis"
        />
        <KpiCard
          label="งบเบิก Advance"
          value={stats.totalAdvance.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
          sub={`${stats.advCount} ครั้ง • ใช้จริง ${stats.totalActual.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท`}
          accent="#16a34a" icon="💰" link="/advance"
        />
      </div>

      {/* Section 1.5: สรุปสถานะโครงการ ────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>สรุปสถานะโครงการทั้งหมด</span>
            <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', borderRadius: 20, padding: '2px 10px' }}>
              รวม {stats.totalPlans} โครงการ
            </span>
          </div>
          <a href="/workplan" style={{ fontSize: 12, color: '#0891b2', textDecoration: 'none', fontWeight: 600 }}>ดูแผนทั้งหมด →</a>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(PROJECT_STATUS).map(([key, s]) => {
            const count = stats.statusCounts?.[key] || 0
            const pct = stats.totalPlans > 0 ? Math.round(count / stats.totalPlans * 100) : 0
            return (
              <div key={key} style={{ flex: '1 1 120px', minWidth: 110, background: s.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${s.color}33`, position: 'relative', overflow: 'hidden' }}>
                {/* progress bar background */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: `${pct}%`, background: s.color, borderRadius: '0 0 10px 10px', transition: 'width 0.6s' }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{pct}% ของทั้งหมด</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: Action items ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 22 }}>
        {/* Upcoming online */}
        <PanelCard title="โครงการใกล้ Online (30 วัน)" icon="🚀" link="/workplan" linkLabel="ดูแผนทั้งหมด">
          {stats.upcomingOnline.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              ไม่มีโครงการในช่วง 30 วันข้างหน้า
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.upcomingOnline.map(p => {
                const status = PROJECT_STATUS[p.status] || PROJECT_STATUS.waiting
                const overdue = p._days < 0
                const urgent = p._days >= 0 && p._days <= 7
                return (
                  <div key={p.id} style={{
                    padding: '10px 14px', borderRadius: 8, border: '1px solid #f1f5f9',
                    background: overdue ? '#fef2f2' : urgent ? '#fffbeb' : '#fafafa',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🏥 {getHospName(p.hospitalId)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {p.projectName || '-'} • Online: {formatDate(p.onlineStart)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: overdue ? '#dc2626' : urgent ? '#d97706' : '#0891b2',
                      }}>
                        {overdue ? `เลย ${-p._days} วัน` : p._days === 0 ? 'วันนี้' : `อีก ${p._days} วัน`}
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                        background: status.bg, color: status.color, marginTop: 2,
                      }}>{status.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PanelCard>

        {/* Critical/High open issues */}
        <PanelCard title="ปัญหาเร่งด่วน (วิกฤต/สูง)" icon="🚨" link="/risk-analysis" linkLabel="วิเคราะห์เต็ม">
          {stats.criticalIssues.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              ไม่มีปัญหาวิกฤต/สูงที่ยังไม่ปิด 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.criticalIssues.map((i, idx) => {
                const sev = SEV_COLOR[i.sev] || SEV_COLOR.medium
                const linkTo = i.source === 'training' ? '/training-issues' : '/system-issues'
                return (
                  <Link key={`${i.source}-${i.id || idx}`} to={linkTo} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, border: '1px solid #f1f5f9',
                      background: '#fafafa', display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                        background: sev.bg, color: sev.color, flexShrink: 0,
                      }}>{sev.label}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                          {i.description || '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          🏥 {getHospName(i.hospitalId)} • {i.source === 'training' ? 'อบรม' : 'ขึ้นระบบ'} • {formatDate(i.date || i.reportDate)}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </PanelCard>
      </div>

      {/* Section 3: Progress + Activity ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 22 }}>
        {/* Top/Bottom progress */}
        <PanelCard title="ความคืบหน้า Checklist เฉลี่ย" icon="📈" link="/workplan">
          {stats.topProgress.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              ยังไม่มีข้อมูล Checklist
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>🟢 คืบหน้ามากที่สุด (Top 5)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {stats.topProgress.map(h => (
                  <div key={h.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                      <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{h.pct}%</span>
                    </div>
                    <ProgressBar pct={h.pct} color="#16a34a" />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>🔴 ต้องเร่งติดตาม (Bottom 5)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.bottomProgress.map(h => (
                  <div key={h.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                      <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{h.pct}%</span>
                    </div>
                    <ProgressBar pct={h.pct} color="#dc2626" />
                  </div>
                ))}
              </div>
            </>
          )}
        </PanelCard>

        {/* Recent activity */}
        <PanelCard title="กิจกรรมล่าสุด" icon="🕐">
          {stats.recentActivity.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              ยังไม่มีกิจกรรม
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.recentActivity.map((i, idx) => {
                const sev = SEV_COLOR[i.severity || i.priority] || SEV_COLOR.medium
                const linkTo = i.source === 'training' ? '/training-issues' : '/system-issues'
                const isClosed = i.status === 'closed'
                return (
                  <Link key={`${i.source}-${i.id || idx}`} to={linkTo} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '8px 12px', borderRadius: 6, borderLeft: `3px solid ${sev.color}`,
                      background: isClosed ? '#f0fdf4' : '#fafafa', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {i.source === 'training' ? '🎓' : '🖥️'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i.description || '-'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          {getHospName(i.hospitalId)} • {formatDate(i._date)} {isClosed && '• ✅ ปิดแล้ว'}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </PanelCard>
      </div>

      {/* Quick links ───────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 }}>🔗 ทางลัด</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {[
            { to: '/workplan', icon: '📋', label: 'แผนปฏิบัติงาน' },
            { to: '/calendar', icon: '📅', label: 'ปฏิทิน' },
            { to: '/advance', icon: '⚙️', label: 'Advance' },
            { to: '/training-issues', icon: '🎓', label: 'ปัญหาอบรม' },
            { to: '/system-issues', icon: '🖥️', label: 'ปัญหาขึ้นระบบ' },
            { to: '/risk-analysis', icon: '⚠️', label: 'วิเคราะห์ความเสี่ยง' },
            { to: '/lessons-learned', icon: '📚', label: 'สรุปบทเรียน' },
          ].map(q => (
            <Link key={q.to} to={q.to} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 12, color: '#374151', textAlign: 'center', fontWeight: 600,
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{q.icon}</div>
                {q.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
