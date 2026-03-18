import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'

// ─── Risk config ─────────────────────────────────────────────────────────────

const SEVERITY_SCORE = { high: 3, medium: 2, low: 1 }
const STATUS_WEIGHT  = { open: 1, inprogress: 0.6, closed: 0 }

const RISK_LEVEL = [
  { min: 8,  label: 'สูงมาก',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
  { min: 4,  label: 'สูง',         color: '#ea580c', bg: '#fff7ed', border: '#fdba74', icon: '🟠' },
  { min: 2,  label: 'ปานกลาง',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🟡' },
  { min: 0.1,label: 'ต่ำ',         color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '🟢' },
  { min: 0,  label: 'ไม่มีความเสี่ยง', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', icon: '⚪' },
]

const RECOMMENDATIONS = {
  'ข้อมูลพื้นฐาน': [
    'จัดทำ Template มาตรฐานสำหรับนำเข้าข้อมูลพื้นฐานพร้อม Validation',
    'กำหนดผู้รับผิดชอบตรวจสอบความถูกต้องของข้อมูลก่อน Go-Live',
    'จัดอบรมเพิ่มเติมด้านการกรอกข้อมูลพื้นฐานให้กับเจ้าหน้าที่',
    'ทดสอบการนำเข้าข้อมูลทดสอบก่อนนำเข้าจริงอย่างน้อย 1 รอบ',
  ],
  'แบบฟอร์ม': [
    'ทดสอบการพิมพ์แบบฟอร์มกับข้อมูลจริงก่อน Go-Live ทุกแบบ',
    'อบรมผู้ใช้งานการออกแบบฟอร์มและการตั้งค่า Parameter',
    'กำหนดขั้นตอน UAT แบบฟอร์มพร้อมผู้รับผิดชอบตรวจสอบ',
    'จัดทำคู่มือการใช้งานแบบฟอร์มแต่ละประเภทเป็นภาษาไทย',
  ],
  'รายงาน': [
    'เปรียบเทียบผลลัพธ์รายงานกับระบบเดิมก่อน Go-Live',
    'กำหนดผู้รับผิดชอบตรวจสอบรายงานสำคัญประจำวัน/เดือน',
    'จัดทำรายการ Checklist รายงานที่ต้องทดสอบครบก่อนปิดโครงการ',
    'อบรมการอ่านและตีความรายงานให้ผู้บริหารและผู้ใช้งาน',
  ],
  'การใช้งานระบบ': [
    'จัดอบรมเพิ่มเติมเฉพาะกลุ่มผู้ใช้งานที่ยังมีปัญหา',
    'จัดทำคู่มือการใช้งานประจำวัน (Quick Guide) เป็นภาษาไทย',
    'ตั้ง Help Desk หรือช่องทางติดต่อทีมสนับสนุนที่ชัดเจน',
    'กำหนด Super User ประจำ รพ. เพื่อเป็นจุดประสานงานแรก',
  ],
  'อื่นๆ': [
    'วิเคราะห์สาเหตุปัญหาเพิ่มเติมและจัดทำแผนรับมือ',
    'บันทึกปัญหาและวิธีแก้ไขเพื่อสร้างฐานความรู้',
    'ประสานงานทีมพัฒนาระบบหากปัญหาเกี่ยวข้องกับ Software',
  ],
}

const DEFAULT_REC = [
  'ติดตามและประเมินผลการแก้ไขปัญหาอย่างต่อเนื่อง',
  'จัดประชุมทบทวนปัญหาและความเสี่ยงประจำสัปดาห์',
  'บันทึกบทเรียนที่ได้รับเพื่อปรับปรุงการติดตั้งครั้งต่อไป',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRiskLevel = (score) => RISK_LEVEL.find(r => score >= r.min) || RISK_LEVEL[RISK_LEVEL.length - 1]

const calcScore = (issues) =>
  issues.reduce((s, i) => s + (SEVERITY_SCORE[i.severity] || 1) * (STATUS_WEIGHT[i.status] ?? 1), 0)

const formatDate = () => {
  const d = new Date()
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

// ─── Components ───────────────────────────────────────────────────────────────

function RiskBadge({ score }) {
  const r = getRiskLevel(score)
  return (
    <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: r.bg, color: r.color, border: `1px solid ${r.border}`, whiteSpace: 'nowrap' }}>
      {r.icon} {r.label}
    </span>
  )
}

function ScoreBar({ score, max = 15 }) {
  const pct = Math.min((score / max) * 100, 100)
  const r = getRiskLevel(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: r.color, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: r.color, minWidth: 32 }}>{score.toFixed(1)}</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RiskAnalysis() {
  const { hospitals, trainingIssues, systemIssues } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [filterHosp, setFilterHosp] = useState('')
  const printRef = useRef()

  const allIssues = [
    ...trainingIssues.map(i => ({ ...i, source: 'training' })),
    ...systemIssues.map(i => ({ ...i, source: 'system' })),
  ]

  const getHospName = (id) => hospitals.find(h => String(h.id) === String(id))?.name || `รพ. ${id}`

  // Risk per hospital
  const hospRisks = hospitals.map(h => {
    const hIssues = allIssues.filter(i => String(i.hospitalId) === String(h.id))
    const score = calcScore(hIssues)
    const openHigh = hIssues.filter(i => i.severity === 'high' && i.status !== 'closed').length
    const openMed  = hIssues.filter(i => i.severity === 'medium' && i.status !== 'closed').length
    const openLow  = hIssues.filter(i => i.severity === 'low' && i.status !== 'closed').length
    const total    = hIssues.length
    const closed   = hIssues.filter(i => i.status === 'closed').length
    const categories = [...new Set(hIssues.map(i => i.category).filter(Boolean))]
    return { hosp: h, score, openHigh, openMed, openLow, total, closed, categories }
  }).sort((a, b) => b.score - a.score)

  // Risk per category
  const allCats = [...new Set(allIssues.map(i => i.category || 'ไม่ระบุ'))]
  const catRisks = allCats.map(cat => {
    const issues = allIssues.filter(i => (i.category || 'ไม่ระบุ') === cat)
    const score  = calcScore(issues)
    const open   = issues.filter(i => i.status !== 'closed').length
    const recs   = RECOMMENDATIONS[cat] || DEFAULT_REC
    return { cat, issues, score, open, recs }
  }).sort((a, b) => b.score - a.score)

  const totalOpen = allIssues.filter(i => i.status !== 'closed').length
  const highRisk  = hospRisks.filter(h => h.score >= 4).length
  const maxScore  = hospRisks.reduce((m, h) => Math.max(m, h.score), 0)

  // Filtered hospital list for detail view
  const filteredHospRisks = filterHosp
    ? hospRisks.filter(h => String(h.hosp.id) === filterHosp)
    : hospRisks

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head>
        <meta charset="utf-8">
        <title>รายงานวิเคราะห์ความเสี่ยง</title>
        <style>
          body { font-family: 'Sarabun', 'Tahoma', sans-serif; font-size: 13px; color: #1e293b; margin: 0; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 12px; }
          th { background: #f1f5f9; font-weight: 700; }
          h1 { font-size: 20px; color: #1e3a5f; margin-bottom: 4px; }
          h2 { font-size: 16px; color: #1e3a5f; margin: 20px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
          h3 { font-size: 14px; color: #374151; margin: 12px 0 6px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
          .rec { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 8px 12px; margin: 4px 0; border-radius: 4px; font-size: 12px; }
          .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${content}</body></html>
    `)
    win.document.close()
    win.print()
  }

  const TABS = [
    { key: 'overview',  label: '📊 ภาพรวมความเสี่ยง' },
    { key: 'hospital',  label: '🏥 วิเคราะห์ตาม รพ.' },
    { key: 'category',  label: '🗂️ วิเคราะห์ตามประเภท' },
    { key: 'report',    label: '📑 รายงานผู้บริหาร' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>⚠️ วิเคราะห์ความเสี่ยง</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>ประมวลผลและวิเคราะห์ความเสี่ยงจากปัญหาอบรมและขึ้นระบบ พร้อมแนวทางป้องกัน</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '📋', label: 'ปัญหาทั้งหมด', value: allIssues.length, color: '#1e3a5f', bg: '#eff6ff' },
          { icon: '🔓', label: 'ยังไม่แก้ไข', value: totalOpen, color: '#dc2626', bg: '#fef2f2' },
          { icon: '🏥', label: 'รพ. ความเสี่ยงสูง', value: highRisk, color: '#ea580c', bg: '#fff7ed' },
          { icon: '📈', label: 'คะแนนความเสี่ยงสูงสุด', value: maxScore.toFixed(1), color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'none', color: activeTab === t.key ? '#0891b2' : '#64748b',
            borderBottom: `3px solid ${activeTab === t.key ? '#0891b2' : 'transparent'}`,
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top risky hospitals */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h3 style={{ color: '#1e3a5f', fontSize: 15, marginBottom: 16 }}>🏥 ระดับความเสี่ยงตาม รพ.</h3>
            {hospRisks.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>ยังไม่มีข้อมูล</div>
            ) : hospRisks.slice(0, 10).map(h => (
              <div key={h.hosp.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{h.hosp.name}</span>
                  <RiskBadge score={h.score} />
                </div>
                <ScoreBar score={h.score} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  ปัญหา {h.total} รายการ | ค้างแก้ {h.total - h.closed} รายการ
                </div>
              </div>
            ))}
          </div>

          {/* Risk by category */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h3 style={{ color: '#1e3a5f', fontSize: 15, marginBottom: 16 }}>🗂️ ระดับความเสี่ยงตามประเภท</h3>
            {catRisks.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>ยังไม่มีข้อมูล</div>
            ) : catRisks.map(c => (
              <div key={c.cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{c.cat}</span>
                  <RiskBadge score={c.score} />
                </div>
                <ScoreBar score={c.score} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {c.issues.length} รายการ | ค้างแก้ {c.open} รายการ
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Hospital ── */}
      {activeTab === 'hospital' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filterHosp} onChange={e => setFilterHosp(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 220 }}>
              <option value="">ทุก รพ.</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            {filterHosp && (
              <button onClick={() => setFilterHosp('')}
                style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
                ✕ ล้าง
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredHospRisks.filter(h => h.total > 0).map(h => {
              const rl = getRiskLevel(h.score)
              const hIssues = allIssues.filter(i => String(i.hospitalId) === String(h.hosp.id))
              const catGroups = [...new Set(hIssues.map(i => i.category || 'ไม่ระบุ'))]
              return (
                <div key={h.hosp.id} style={{ background: '#fff', borderRadius: 12, border: `1.5px solid ${rl.border}`, overflow: 'hidden' }}>
                  <div style={{ background: rl.bg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>🏥 {h.hosp.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{h.hosp.province} | ประเภท {h.hosp.type}</div>
                    </div>
                    <RiskBadge score={h.score} />
                    <div style={{ fontSize: 12, color: '#64748b' }}>คะแนนความเสี่ยง: <strong>{h.score.toFixed(1)}</strong></div>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'ปัญหาทั้งหมด', value: h.total, color: '#1e3a5f' },
                        { label: 'ค้างแก้ไข', value: h.total - h.closed, color: '#dc2626' },
                        { label: 'ความรุนแรงสูง', value: h.openHigh, color: '#ea580c' },
                        { label: 'แก้ไขแล้ว', value: h.closed, color: '#16a34a' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '10px 4px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Issues by category */}
                    {catGroups.map(cat => {
                      const catIssues = hIssues.filter(i => (i.category || 'ไม่ระบุ') === cat)
                      const catScore  = calcScore(catIssues)
                      const recs = RECOMMENDATIONS[cat] || DEFAULT_REC
                      return (
                        <div key={cat} style={{ marginBottom: 14, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ background: '#f8fafc', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#374151', flex: 1 }}>📂 {cat}</span>
                            <RiskBadge score={catScore} />
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{catIssues.length} รายการ</span>
                          </div>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 6 }}>🛡️ แนวทางป้องกัน / แก้ไข:</div>
                            {recs.map((r, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                                <span style={{ color: '#0891b2', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                                <span style={{ fontSize: 12, color: '#374151' }}>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {filteredHospRisks.filter(h => h.total > 0).length === 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบปัญหาที่บันทึกไว้</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Category ── */}
      {activeTab === 'category' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {catRisks.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16 }}>ยังไม่มีข้อมูลปัญหา</div>
            </div>
          ) : catRisks.map(c => {
            const rl = getRiskLevel(c.score)
            const hospInCat = [...new Set(c.issues.map(i => i.hospitalId))]
            return (
              <div key={c.cat} style={{ background: '#fff', borderRadius: 12, border: `1.5px solid ${rl.border}`, overflow: 'hidden' }}>
                <div style={{ background: rl.bg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>📂 {c.cat}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {c.issues.length} รายการ | ค้างแก้ {c.open} รายการ | {hospInCat.length} รพ.
                    </div>
                  </div>
                  <RiskBadge score={c.score} />
                  <div style={{ fontSize: 12, color: '#64748b' }}>คะแนน: <strong>{c.score.toFixed(1)}</strong></div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  {/* Issues by severity */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'ความรุนแรงสูง', count: c.issues.filter(i => i.severity === 'high').length, color: '#dc2626', bg: '#fef2f2' },
                      { label: 'ปานกลาง', count: c.issues.filter(i => i.severity === 'medium').length, color: '#d97706', bg: '#fffbeb' },
                      { label: 'ต่ำ', count: c.issues.filter(i => i.severity === 'low').length, color: '#16a34a', bg: '#f0fdf4' },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 16px', textAlign: 'center', minWidth: 100 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>🛡️ แนวทางป้องกันและลดความเสี่ยง</div>
                    {c.recs.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 13, color: '#374151' }}>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hospitals affected */}
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>🏥 รพ. ที่มีปัญหาประเภทนี้:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {hospInCat.map(hid => (
                        <span key={hid} style={{ padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, border: '1px solid #bfdbfe' }}>
                          {getHospName(hid)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Executive Report ── */}
      {activeTab === 'report' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'flex-end' }}>
            <button onClick={handlePrint} style={{
              padding: '10px 24px', background: '#1e3a5f', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>🖨️ พิมพ์ / PDF</button>
          </div>

          <div ref={printRef} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '32px 40px' }}>
            {/* Report header */}
            <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: '2px solid #1e3a5f', paddingBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>รายงานสำหรับผู้บริหาร</div>
              <h1 style={{ fontSize: 22, color: '#1e3a5f', margin: '0 0 4px' }}>รายงานการวิเคราะห์ความเสี่ยง</h1>
              <div style={{ fontSize: 14, color: '#374151' }}>ระบบบัญชีเจ้าหนี้ – ลูกหนี้ (AP/AR) โรงพยาบาล</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>วันที่จัดทำ: {formatDate()}</div>
            </div>

            {/* 1. สรุปภาพรวม */}
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
                1. สรุปภาพรวมความเสี่ยง
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'รพ. ทั้งหมด', value: hospitals.length, color: '#1e3a5f' },
                  { label: 'ปัญหาทั้งหมด', value: allIssues.length, color: '#374151' },
                  { label: 'ยังไม่แก้ไข', value: totalOpen, color: '#dc2626' },
                  { label: 'รพ. ความเสี่ยงสูง', value: highRisk, color: '#ea580c' },
                ].map(s => (
                  <div key={s.label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e3a5f' }}>
                    {['ระดับความเสี่ยง', 'เกณฑ์คะแนน', 'จำนวน รพ.', 'ความหมาย'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RISK_LEVEL.slice(0, 4).map((rl, i) => {
                    const next = RISK_LEVEL[i + 1]
                    const cnt  = hospRisks.filter(h => h.score >= rl.min && (!next || h.score < RISK_LEVEL[i - 1]?.min)).length
                    const cnt2 = hospRisks.filter(h => {
                      if (i === 0) return h.score >= 8
                      if (i === 1) return h.score >= 4 && h.score < 8
                      if (i === 2) return h.score >= 2 && h.score < 4
                      return h.score > 0 && h.score < 2
                    }).length
                    const meanings = ['ต้องแก้ไขเร่งด่วน วางแผนป้องกันทันที', 'ต้องติดตามและจัดการอย่างใกล้ชิด', 'ติดตามและพัฒนาอย่างต่อเนื่อง', 'อยู่ในระดับที่ยอมรับได้ ติดตามต่อไป']
                    return (
                      <tr key={rl.label} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: rl.color }}>{rl.icon} {rl.label}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {i === 0 ? '≥ 8' : i === 1 ? '4 – 7.9' : i === 2 ? '2 – 3.9' : '0.1 – 1.9'}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{cnt2}</td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontSize: 12 }}>{meanings[i]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>

            {/* 2. ความเสี่ยงตาม รพ. */}
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
                2. ระดับความเสี่ยงแต่ละโรงพยาบาล
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e3a5f' }}>
                    {['#', 'โรงพยาบาล', 'จังหวัด', 'ปัญหาทั้งหมด', 'ค้างแก้ไข', 'ความรุนแรงสูง', 'คะแนน', 'ระดับความเสี่ยง'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hospRisks.map((h, idx) => {
                    const rl = getRiskLevel(h.score)
                    return (
                      <tr key={h.hosp.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{h.hosp.name}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{h.hosp.province}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{h.total}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{h.total - h.closed}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#ea580c', fontWeight: 600 }}>{h.openHigh}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: rl.color }}>{h.score.toFixed(1)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: rl.bg, color: rl.color, border: `1px solid ${rl.border}` }}>
                            {rl.icon} {rl.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>

            {/* 3. ความเสี่ยงตามประเภทปัญหา */}
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
                3. การวิเคราะห์ความเสี่ยงตามประเภทปัญหาและแนวทางป้องกัน
              </h2>
              {catRisks.map((c, idx) => {
                const rl = getRiskLevel(c.score)
                return (
                  <div key={c.cat} style={{ marginBottom: 20, border: `1px solid ${rl.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: rl.bg, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', flex: 1 }}>
                        {idx + 1}. {c.cat}
                      </span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'white', color: rl.color, border: `1px solid ${rl.border}` }}>
                        {rl.icon} {rl.label} (คะแนน {c.score.toFixed(1)})
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 24, marginBottom: 10, fontSize: 13, color: '#64748b' }}>
                        <span>ปัญหาทั้งหมด: <strong>{c.issues.length}</strong></span>
                        <span>ค้างแก้ไข: <strong style={{ color: '#dc2626' }}>{c.open}</strong></span>
                        <span>แก้ไขแล้ว: <strong style={{ color: '#16a34a' }}>{c.issues.length - c.open}</strong></span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f', marginBottom: 6 }}>แนวทางป้องกันและลดความเสี่ยง:</div>
                      {c.recs.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
                          <span style={{ color: '#0891b2', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, color: '#374151' }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>

            {/* 4. ข้อเสนอแนะ */}
            <section style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
                4. ข้อเสนอแนะสำหรับผู้บริหาร
              </h2>
              {[
                { icon: '🎯', title: 'มาตรการระยะสั้น (ทันที)', items: ['กำหนดผู้รับผิดชอบแก้ไขปัญหาที่ความรุนแรงสูงทุกรายการ', 'ประชุมทบทวนความคืบหน้าการแก้ไขปัญหาทุกสัปดาห์', 'ตรวจสอบให้แน่ใจว่าทุก รพ. มี Super User ประจำ'] },
                { icon: '📅', title: 'มาตรการระยะกลาง (1–3 เดือน)', items: ['จัดอบรมเพิ่มเติมเฉพาะกลุ่มสำหรับปัญหาที่พบบ่อย', 'จัดทำคู่มือการใช้งานและ FAQ เป็นภาษาไทย', 'สร้างกลไก Help Desk และช่องทางรับเรื่องร้องเรียน'] },
                { icon: '🌟', title: 'มาตรการระยะยาว (3 เดือนขึ้นไป)', items: ['ทบทวนและปรับปรุงกระบวนการ Go-Live สำหรับ รพ. ถัดไป', 'สร้างฐานความรู้ (Knowledge Base) จากบทเรียนที่ได้รับ', 'ประเมินความพึงพอใจผู้ใช้งานและวัดผลลัพธ์การติดตั้ง'] },
              ].map(s => (
                <div key={s.title} style={{ marginBottom: 14, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 14px', fontWeight: 700, fontSize: 13, color: '#1e3a5f' }}>
                    {s.icon} {s.title}
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    {s.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#0891b2', fontWeight: 700, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
              รายงานนี้จัดทำโดยระบบวิเคราะห์ความเสี่ยงอัตโนมัติ | ระบบติดตามการติดตั้งระบบ AP/AR โรงพยาบาล
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
