import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import SearchableSelect from '../components/SearchableSelect'

// Rule-based recommendations per category
const RECOMMENDATIONS = {
  'ข้อมูลพื้นฐาน': {
    solution: 'ทบทวนกระบวนการเตรียมข้อมูลพื้นฐาน จัดประชุมร่วมกับทีม รพ. เพื่อวางแผนการจัดเก็บและตรวจสอบความถูกต้องของข้อมูลก่อนนำเข้าระบบ',
    prevention: 'จัดทำ Checklist การเตรียมข้อมูลพื้นฐาน มอบหมายผู้รับผิดชอบตรวจสอบความครบถ้วน และกำหนด Timeline การส่งข้อมูลล่วงหน้าอย่างน้อย 2 สัปดาห์',
    rootCause: ['กระบวนการ (Process)', 'การตัดสินใจ (Decision)'],
  },
  'แบบฟอร์ม': {
    solution: 'ทบทวนข้อกำหนดแบบฟอร์มร่วมกับผู้ใช้งาน ปรับปรุงกระบวนการทดสอบและรับ Feedback ก่อนส่งมอบ',
    prevention: 'กำหนดมาตรฐานแบบฟอร์มล่วงหน้า จัดประชุม Design Review ร่วมกับผู้ใช้งานก่อนเริ่มพัฒนา และกำหนด Prototype Approval',
    rootCause: ['กระบวนการ (Process)', 'การตัดสินใจ (Decision)'],
  },
  'รายงาน': {
    solution: 'ตรวจสอบ Parameter รายงานร่วมกับผู้ใช้งาน ปรับปรุง Logic การคำนวณและทดสอบกับข้อมูลจริง',
    prevention: 'วิเคราะห์ความต้องการรายงานให้ครบถ้วนตั้งแต่ต้น จัดทำ Test Case สำหรับทดสอบรายงานทุกประเภทก่อนส่งมอบ',
    rootCause: ['เครื่องมือ (Tool)', 'กระบวนการ (Process)'],
  },
  'การใช้งานระบบ': {
    solution: 'จัดอบรมเพิ่มเติม จัดทำ FAQ และ Quick Guide สำหรับผู้ใช้งาน เพิ่มช่องทางการสื่อสารและสนับสนุนผู้ใช้งาน',
    prevention: 'จัดทำคู่มือการใช้งานที่ชัดเจน เพิ่มจำนวนชั่วโมงฝึกอบรมและ Workshop Hands-on ก่อนเปิดใช้งานจริง',
    rootCause: ['บุคลากร (People)'],
  },
  'default': {
    solution: 'วิเคราะห์สาเหตุระดับลึก กำหนดมาตรการแก้ไขและผู้รับผิดชอบ ติดตามผลการดำเนินการอย่างต่อเนื่อง',
    prevention: 'จัดทำมาตรฐานการดำเนินงาน Checklist เพื่อป้องกันการเกิดซ้ำ และบันทึกบทเรียนที่ได้ไว้เป็นฐานความรู้',
    rootCause: ['กระบวนการ (Process)'],
  },
}

const RISK_LEVEL = (issues) => {
  const highCount = issues.filter(i => ['high', 'critical'].includes(i.severityKey)).length
  const isRecurring = issues.length >= 3
  if (highCount > 1 || (isRecurring && highCount > 0)) return 'สูง'
  if (highCount === 1 || isRecurring) return 'ปานกลาง'
  return 'ต่ำ'
}

const getRiskStyle = (level) => {
  if (level === 'สูง') return { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }
  if (level === 'ปานกลาง') return { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
  return { color: '#16a34a', bg: '#f0fdf4', border: '#86efac' }
}

const getBuddhistYear = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return d.getFullYear() + 543
}

const formatThaiDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  if (!s.includes('-')) return '-'
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${Number(y) + 543}`
}

const STATUS_LABEL = { open: 'รอแก้ไข', inprogress: 'กำลังแก้ไข', testing: 'ทดสอบ', closed: 'แก้ไขแล้ว' }
const SEV_LABEL = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' }

const thStyle = { padding: '9px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#fff', background: '#1e3a5f', whiteSpace: 'nowrap' }
const tdStyle = { padding: '8px 12px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }

// ─────────────────────────────────────────────────────────────────────────────
// Word Export Helper
// ─────────────────────────────────────────────────────────────────────────────
const downloadDoc = (html, filename) => {
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const docStyles = `
  body { font-family: 'TH Sarabun New', Arial; font-size: 14pt; margin: 2cm; }
  h1 { font-size: 18pt; color: #1e3a5f; text-align: center; margin-bottom: 4pt; }
  h2 { font-size: 16pt; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; margin-top: 18pt; }
  h3 { font-size: 14pt; color: #374151; margin-top: 12pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 14pt; }
  th { background: #1e3a5f; color: white; padding: 6px 8px; border: 1px solid #555; font-size: 12pt; }
  td { padding: 5px 8px; border: 1px solid #ccc; font-size: 12pt; vertical-align: top; }
  .risk-high { color: #dc2626; font-weight: bold; }
  .risk-med { color: #d97706; font-weight: bold; }
  .risk-low { color: #16a34a; }
  .badge { padding: 2px 8px; border-radius: 12px; font-size: 11pt; }
  p { margin: 6pt 0; }
`

// ─────────────────────────────────────────────────────────────────────────────
export default function LessonsLearned() {
  const { hospitals, trainingIssues, systemIssues } = useApp()
  const [tab, setTab] = useState(0)
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear() + 543)

  // ── Year options ────────────────────────────────────────────────────────────
  const years = useMemo(() => {
    const all = [
      ...trainingIssues.map(i => getBuddhistYear(i.date)),
      ...systemIssues.map(i => getBuddhistYear(i.reportDate)),
    ].filter(Boolean)
    const cur = new Date().getFullYear() + 543
    return [...new Set([...all, cur])].sort((a, b) => b - a)
  }, [trainingIssues, systemIssues])

  // ── TAB 1: per-hospital ─────────────────────────────────────────────────────
  const hospIssues = useMemo(() => {
    if (!selectedHosp) return { training: [], system: [], combined: [] }
    const training = trainingIssues.filter(i => String(i.hospitalId) === String(selectedHosp))
    const system = systemIssues.filter(i => String(i.hospitalId) === String(selectedHosp))
    const combined = [
      ...training.map(i => ({ ...i, source: 'อบรม', dateKey: i.date, severityKey: i.severity || 'medium' })),
      ...system.map(i => ({ ...i, source: 'ขึ้นระบบ', dateKey: i.reportDate, severityKey: i.priority || 'medium' })),
    ]
    return { training, system, combined }
  }, [selectedHosp, trainingIssues, systemIssues])

  const hospAnalysis = useMemo(() => {
    if (!hospIssues.combined.length) return []
    const groups = {}
    hospIssues.combined.forEach(issue => {
      const cat = issue.category || 'ไม่ระบุประเภท'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(issue)
    })
    return Object.entries(groups).map(([category, issues]) => {
      const riskLevel = RISK_LEVEL(issues)
      const openCount = issues.filter(i => i.status === 'open').length
      const rec = RECOMMENDATIONS[category] || RECOMMENDATIONS['default']
      return { category, issues, totalCount: issues.length, openCount, riskLevel, recommendation: rec }
    }).sort((a, b) => {
      const o = { 'สูง': 0, 'ปานกลาง': 1, 'ต่ำ': 2 }
      return o[a.riskLevel] - o[b.riskLevel]
    })
  }, [hospIssues])

  // ── TAB 2: year-based ───────────────────────────────────────────────────────
  const yearIssues = useMemo(() => {
    const training = trainingIssues.filter(i => getBuddhistYear(i.date) === selectedYear)
    const system = systemIssues.filter(i => getBuddhistYear(i.reportDate) === selectedYear)
    const combined = [
      ...training.map(i => ({ ...i, source: 'อบรม', dateKey: i.date, severityKey: i.severity || 'medium', hospId: i.hospitalId })),
      ...system.map(i => ({ ...i, source: 'ขึ้นระบบ', dateKey: i.reportDate, severityKey: i.priority || 'medium', hospId: i.hospitalId })),
    ]
    return { training, system, combined }
  }, [selectedYear, trainingIssues, systemIssues])

  const yearAnalysis = useMemo(() => {
    const { combined } = yearIssues
    if (!combined.length) return null

    // Group by category
    const catGroups = {}
    combined.forEach(issue => {
      const cat = issue.category || 'ไม่ระบุ'
      if (!catGroups[cat]) catGroups[cat] = []
      catGroups[cat].push(issue)
    })

    // Root cause groups
    const rcGroups = { Process: [], People: [], Tool: [], Decision: [] }
    combined.forEach(issue => {
      const cat = issue.category || 'ไม่ระบุ'
      const rc = (RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).rootCause
      rc.forEach(r => {
        if (r.includes('Process')) rcGroups.Process.push(issue)
        if (r.includes('People')) rcGroups.People.push(issue)
        if (r.includes('Tool')) rcGroups.Tool.push(issue)
        if (r.includes('Decision')) rcGroups.Decision.push(issue)
      })
    })

    // Controllable = Process/Tool/Decision; People = ควบคุมยาก
    const controllable = combined.filter(i => {
      const cat = i.category || ''
      const rc = (RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).rootCause
      return !rc.every(r => r.includes('People'))
    })
    const uncontrollable = combined.filter(i => {
      const cat = i.category || ''
      const rc = (RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).rootCause
      return rc.every(r => r.includes('People'))
    })

    // Recurring (≥3 occurrences)
    const recurringCats = Object.entries(catGroups).filter(([, iss]) => iss.length >= 3).sort((a, b) => b[1].length - a[1].length)

    // Hospitals affected
    const hospSet = new Set(combined.map(i => i.hospId))

    // Status breakdown
    const openIssues = combined.filter(i => i.status === 'open')
    const inprogressIssues = combined.filter(i => ['inprogress', 'testing'].includes(i.status))
    const closedIssues = combined.filter(i => i.status === 'closed')

    // Next year plan
    const nextYearPlan = Object.entries(catGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([cat, iss]) => ({
        category: cat, count: iss.length,
        action: (RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).solution,
        priority: iss.filter(i => ['high', 'critical'].includes(i.severityKey)).length > 0 ? 'เร่งด่วน' : 'ปกติ',
      }))

    const preventionPlan = Object.entries(catGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cat, iss]) => ({ category: cat, count: iss.length, prevention: (RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).prevention }))

    return { totalIssues: combined.length, hospCount: hospSet.size, catGroups, rcGroups, controllable, uncontrollable, recurringCats, openIssues, inprogressIssues, closedIssues, nextYearPlan, preventionPlan }
  }, [yearIssues])

  const getHospName = (id) => hospitals.find(h => String(h.id) === String(id))?.name || String(id)
  const selectedHospName = selectedHosp ? getHospName(selectedHosp) : ''

  // ── Export Tab1 Word ────────────────────────────────────────────────────────
  const exportTab1Word = () => {
    if (!selectedHosp || !hospAnalysis.length) return alert('กรุณาเลือก รพ. และต้องมีข้อมูลก่อน export')
    const today = new Date()
    const thaiDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`
    let rows = ''
    hospAnalysis.forEach((g, i) => {
      const riskCls = g.riskLevel === 'สูง' ? 'risk-high' : g.riskLevel === 'ปานกลาง' ? 'risk-med' : 'risk-low'
      rows += `<h2>${i + 1}. ประเภทปัญหา: ${g.category}</h2>
<p><b>ระดับความเสี่ยง:</b> <span class="${riskCls}">${g.riskLevel}</span> &nbsp;|&nbsp; จำนวนปัญหา: <b>${g.totalCount}</b> รายการ &nbsp;|&nbsp; ยังไม่แก้ไข: <b>${g.openCount}</b> รายการ</p>
<table><tr><th>#</th><th>ที่มา</th><th>รายละเอียดปัญหา</th><th>ความรุนแรง</th><th>สถานะ</th><th>วิธีแก้ไข</th></tr>
${g.issues.map((iss, j) => `<tr><td>${j + 1}</td><td>${iss.source}</td><td>${iss.description || ''}</td><td>${SEV_LABEL[iss.severityKey] || iss.severityKey}</td><td>${STATUS_LABEL[iss.status] || iss.status}</td><td>${iss.resolution || '-'}</td></tr>`).join('')}
</table>
<p><b>🔍 สาเหตุหลัก:</b> ${g.recommendation.rootCause.join(', ')}</p>
<p><b>💡 แนวทางแก้ไข:</b> ${g.recommendation.solution}</p>
<p><b>🛡️ มาตรการป้องกันไม่ให้เกิดซ้ำ:</b> ${g.recommendation.prevention}</p>`
    })
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>${docStyles}</style></head><body>
<h1>รายงานสรุปปัญหาการดำเนินการติดตั้งระบบ</h1>
<h1>${selectedHospName}</h1>
<p style="text-align:center;color:#64748b">วันที่จัดทำ: ${thaiDate}</p><hr>
<h2>ภาพรวมปัญหา</h2>
<table><tr><th>ประเภท</th><th>จำนวน</th></tr>
<tr><td>ปัญหาการอบรม</td><td>${hospIssues.training.length} รายการ</td></tr>
<tr><td>ปัญหาขึ้นระบบ</td><td>${hospIssues.system.length} รายการ</td></tr>
<tr><td><b>รวมทั้งหมด</b></td><td><b>${hospIssues.combined.length} รายการ</b></td></tr></table>
${rows}</body></html>`
    downloadDoc(html, `สรุปปัญหา_${selectedHospName}_${thaiDate.replace(/\//g, '-')}.doc`)
  }

  // ── Export Tab2 Word ────────────────────────────────────────────────────────
  const exportTab2Word = () => {
    if (!yearAnalysis) return alert('ไม่มีข้อมูลในปี พ.ศ. ที่เลือก')
    const today = new Date()
    const thaiDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`
    const a = yearAnalysis
    const total = a.totalIssues
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>${docStyles}</style></head><body>
<h1>รายงานสรุปบทเรียนประจำปี พ.ศ. ${selectedYear}</h1>
<p style="text-align:center;color:#64748b">วันที่จัดทำ: ${thaiDate} &nbsp;|&nbsp; ปัญหาทั้งหมด: ${total} รายการ จาก ${a.hospCount} รพ.</p><hr>
<h2>1. การวิเคราะห์สาเหตุเชิงลึก (Root Cause Analysis)</h2>
<h3>1.1 วิเคราะห์ตามมิติ Process / People / Tool / Decision</h3>
<table><tr><th>มิติสาเหตุ</th><th>จำนวนปัญหา</th><th>สัดส่วน</th><th>ความหมาย</th></tr>
<tr><td>กระบวนการ (Process)</td><td>${a.rcGroups.Process.length}</td><td>${Math.round(a.rcGroups.Process.length / total * 100)}%</td><td>ปัญหาเกิดจากขั้นตอน/กระบวนการทำงาน</td></tr>
<tr><td>บุคลากร (People)</td><td>${a.rcGroups.People.length}</td><td>${Math.round(a.rcGroups.People.length / total * 100)}%</td><td>ปัญหาเกิดจากทักษะ/ความเข้าใจของผู้ใช้</td></tr>
<tr><td>เครื่องมือ (Tool)</td><td>${a.rcGroups.Tool.length}</td><td>${Math.round(a.rcGroups.Tool.length / total * 100)}%</td><td>ปัญหาเกิดจากระบบ/เครื่องมือ</td></tr>
<tr><td>การตัดสินใจ (Decision)</td><td>${a.rcGroups.Decision.length}</td><td>${Math.round(a.rcGroups.Decision.length / total * 100)}%</td><td>ปัญหาเกิดจากการกำหนดความต้องการ</td></tr></table>
<h3>1.2 แยกประเภทปัญหาที่ควบคุมได้ – ควบคุมไม่ได้</h3>
<table><tr><th>ประเภท</th><th>จำนวน</th><th>แนวทาง</th></tr>
<tr><td>ควบคุมได้ (Controllable)</td><td>${a.controllable.length} รายการ</td><td>สามารถป้องกัน/แก้ไขได้โดยการปรับปรุงกระบวนการ</td></tr>
<tr><td>ควบคุมยาก (Less Controllable)</td><td>${a.uncontrollable.length} รายการ</td><td>ต้องเน้นการพัฒนาทักษะบุคลากรอย่างต่อเนื่อง</td></tr></table>

<h2>2. คุณภาพบทเรียนที่สามารถนำไปใช้ซ้ำได้</h2>
${a.recurringCats.length ?
      `<p>พบปัญหาซ้ำ (≥3 ครั้ง) ${a.recurringCats.length} ประเภท ถือเป็น "บทเรียนเชิงระบบ" ที่ต้องแก้ไขโครงสร้าง:</p>
<table><tr><th>ประเภทปัญหา</th><th>จำนวน</th><th>บทเรียนสำคัญ</th></tr>
${a.recurringCats.map(([cat, iss]) => `<tr><td>${cat}</td><td>${iss.length} ครั้ง</td><td>${(RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).solution}</td></tr>`).join('')}
</table>` :
      '<p>ไม่พบปัญหาที่เกิดซ้ำในระดับที่น่าเป็นห่วง (ต่ำกว่า 3 ครั้งต่อประเภท)</p>'}

<h2>3. แผนพัฒนาและแก้ไขในปีถัดไป (พ.ศ. ${selectedYear + 1})</h2>
<table><tr><th>#</th><th>ประเภทปัญหา</th><th>จำนวน</th><th>ความเร่งด่วน</th><th>แผนดำเนินการ</th></tr>
${a.nextYearPlan.map((p, i) => `<tr><td>${i + 1}</td><td>${p.category}</td><td>${p.count}</td><td>${p.priority}</td><td>${p.action}</td></tr>`).join('')}
</table>

<h2>4. แผนป้องกันไม่ให้เกิดซ้ำ</h2>
<table><tr><th>ประเภทปัญหา</th><th>ความถี่</th><th>มาตรการป้องกัน</th></tr>
${a.preventionPlan.map(p => `<tr><td>${p.category}</td><td>${p.count} ครั้ง</td><td>${p.prevention}</td></tr>`).join('')}
</table>

<h2>5. การติดตามผล (Follow-up)</h2>
<table><tr><th>สถานะ</th><th>จำนวน</th><th>สัดส่วน</th><th>หมายเหตุ</th></tr>
<tr><td>รอแก้ไข (Open)</td><td>${a.openIssues.length}</td><td>${Math.round(a.openIssues.length / total * 100)}%</td><td>ต้องติดตามเร่งด่วน</td></tr>
<tr><td>กำลังดำเนินการ</td><td>${a.inprogressIssues.length}</td><td>${Math.round(a.inprogressIssues.length / total * 100)}%</td><td>อยู่ระหว่างแก้ไข/ทดสอบ</td></tr>
<tr><td>แก้ไขแล้ว (Closed)</td><td>${a.closedIssues.length}</td><td>${Math.round(a.closedIssues.length / total * 100)}%</td><td>ปิดเรียบร้อย</td></tr></table>
</body></html>`
    downloadDoc(html, `สรุปบทเรียน_ปี${selectedYear}.doc`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const tabBtn = (idx, label) => (
    <button onClick={() => setTab(idx)} style={{
      padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: tab === idx ? 700 : 500,
      fontSize: 14, borderBottom: tab === idx ? '3px solid #0891b2' : '3px solid transparent',
      background: 'transparent', color: tab === idx ? '#0891b2' : '#64748b',
      transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: '#1e3a5f', marginBottom: 4 }}>📚 สรุปบทเรียน</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>วิเคราะห์ปัญหาและถอดบทเรียนเพื่อพัฒนาการดำเนินงาน</p>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: 0, marginBottom: 0 }}>
        {tabBtn(0, '🏥 สรุปปัญหาการดำเนินการติดตั้งระบบ')}
        {tabBtn(1, '📖 สรุปบทเรียน')}
      </div>

      <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', padding: 28 }}>

        {/* ── TAB 1 ──────────────────────────────────────────────────────────── */}
        {tab === 0 && (
          <div>
            {/* Selector */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>เลือกโรงพยาบาล:</span>
              <SearchableSelect value={String(selectedHosp || '')} onChange={setSelectedHosp}
                options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
                placeholder="-- เลือก รพ. --" style={{ minWidth: 240 }}
                inputStyle={{ padding: '9px 16px', border: '1.5px solid #3b82f6', fontSize: 14 }} />
              {selectedHosp && hospIssues.combined.length > 0 && (
                <button onClick={exportTab1Word} style={{
                  padding: '9px 20px', background: '#1e40af', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>📄 Export Word</button>
              )}
            </div>

            {!selectedHosp && (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>กรุณาเลือกโรงพยาบาล</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>เพื่อแสดงผลการวิเคราะห์ปัญหาและความเสี่ยง</div>
              </div>
            )}

            {selectedHosp && hospIssues.combined.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบข้อมูลปัญหาของ {selectedHospName}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>ยังไม่มีการบันทึกปัญหาการอบรมหรือปัญหาขึ้นระบบ</div>
              </div>
            )}

            {selectedHosp && hospIssues.combined.length > 0 && (
              <div>
                {/* Overview cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
                  {[
                    { label: 'ปัญหาอบรม', value: hospIssues.training.length, color: '#0891b2', bg: '#eff6ff' },
                    { label: 'ปัญหาขึ้นระบบ', value: hospIssues.system.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'รวมทั้งหมด', value: hospIssues.combined.length, color: '#1e3a5f', bg: '#f0f4f8' },
                    { label: 'ยังไม่แก้ไข', value: hospIssues.combined.filter(i => i.status === 'open').length, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'แก้ไขแล้ว', value: hospIssues.combined.filter(i => i.status === 'closed').length, color: '#16a34a', bg: '#f0fdf4' },
                  ].map(c => (
                    <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${c.color}22` }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Analysis by category */}
                <h3 style={{ fontSize: 16, color: '#1e3a5f', marginBottom: 16 }}>📊 ผลการวิเคราะห์ความเสี่ยงแยกตามประเภทปัญหา</h3>
                {hospAnalysis.map((group, gi) => {
                  const rs = getRiskStyle(group.riskLevel)
                  return (
                    <div key={gi} style={{ border: `1.5px solid ${rs.border}`, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
                      {/* Category header */}
                      <div style={{ background: rs.bg, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>{group.category}</span>
                          <span style={{ marginLeft: 10, padding: '3px 12px', borderRadius: 20, background: rs.bg, color: rs.color, fontSize: 12, fontWeight: 700, border: `1px solid ${rs.border}` }}>
                            ความเสี่ยง: {group.riskLevel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                          <span>จำนวน <b style={{ color: '#1e3a5f' }}>{group.totalCount}</b> รายการ</span>
                          {group.openCount > 0 && <span>ยังไม่แก้ไข <b style={{ color: '#dc2626' }}>{group.openCount}</b></span>}
                          {group.issues.length >= 3 && <span style={{ color: '#d97706', fontWeight: 600 }}>⚠️ เกิดซ้ำ</span>}
                        </div>
                      </div>

                      {/* Issues table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['#', 'ที่มา', 'ระบบงาน', 'รายละเอียดปัญหา', 'ความรุนแรง', 'สถานะ', 'วิธีแก้ไข'].map(h => (
                                <th key={h} style={thStyle}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.issues.map((iss, idx) => (
                              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', width: 40 }}>{idx + 1}</td>
                                <td style={tdStyle}>
                                  <span style={{ padding: '2px 8px', borderRadius: 12, background: iss.source === 'อบรม' ? '#eff6ff' : '#f5f3ff', color: iss.source === 'อบรม' ? '#1d4ed8' : '#7c3aed', fontSize: 12, fontWeight: 600 }}>
                                    {iss.source}
                                  </span>
                                </td>
                                <td style={{ ...tdStyle, color: '#64748b' }}>{iss.systemName || '-'}</td>
                                <td style={tdStyle}>{iss.description || '-'}</td>
                                <td style={tdStyle}>
                                  <span style={{ fontSize: 12 }}>{SEV_LABEL[iss.severityKey] || iss.severityKey}</span>
                                </td>
                                <td style={tdStyle}>
                                  <span style={{ fontSize: 12, color: iss.status === 'open' ? '#dc2626' : iss.status === 'closed' ? '#16a34a' : '#d97706' }}>
                                    {STATUS_LABEL[iss.status] || iss.status}
                                  </span>
                                </td>
                                <td style={{ ...tdStyle, color: '#64748b' }}>{iss.resolution || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Recommendations */}
                      <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>🔍 สาเหตุหลัก: </span>
                          {group.recommendation.rootCause.map((r, i) => (
                            <span key={i} style={{ marginRight: 6, padding: '2px 10px', borderRadius: 12, background: '#e0f2fe', color: '#0369a1', fontSize: 12 }}>{r}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>💡 แนวทางแก้ไข: </span>
                          <span style={{ color: '#475569' }}>{group.recommendation.solution}</span>
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>🛡️ การป้องกันไม่ให้เกิดซ้ำ: </span>
                          <span style={{ color: '#475569' }}>{group.recommendation.prevention}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2 ──────────────────────────────────────────────────────────── */}
        {tab === 1 && (
          <div>
            {/* Year selector */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>เลือกปี พ.ศ.:</span>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ padding: '9px 16px', border: '1.5px solid #3b82f6', borderRadius: 8, fontSize: 14 }}>
                {years.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
              </select>
              {yearAnalysis && (
                <button onClick={exportTab2Word} style={{
                  padding: '9px 20px', background: '#1e40af', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>📄 Export Word</button>
              )}
            </div>

            {!yearAnalysis ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบข้อมูลในปี พ.ศ. {selectedYear}</div>
              </div>
            ) : (
              <div>
                {/* Year overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
                  {[
                    { label: 'ปัญหาทั้งหมด', value: yearAnalysis.totalIssues, color: '#1e3a5f', bg: '#eff6ff' },
                    { label: 'โรงพยาบาล', value: `${yearAnalysis.hospCount} รพ.`, color: '#0891b2', bg: '#f0f9ff' },
                    { label: 'ปัญหาอบรม', value: yearIssues.training.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'ปัญหาขึ้นระบบ', value: yearIssues.system.length, color: '#d97706', bg: '#fffbeb' },
                    { label: 'ยังไม่แก้ไข', value: yearAnalysis.openIssues.length, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'แก้ไขแล้ว', value: yearAnalysis.closedIssues.length, color: '#16a34a', bg: '#f0fdf4' },
                  ].map(c => (
                    <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${c.color}22` }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Section 2.1 Root Cause */}
                <Section num="1" title="การวิเคราะห์สาเหตุเชิงลึก (Root Cause Analysis)">
                  <h4 style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>1.1 วิเคราะห์สาเหตุระดับ Process / People / Tool / Decision</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { key: 'Process', label: 'กระบวนการ (Process)', icon: '⚙️', desc: 'ขั้นตอนการทำงาน', color: '#0891b2', bg: '#eff6ff' },
                      { key: 'People', label: 'บุคลากร (People)', icon: '👥', desc: 'ทักษะ/ความเข้าใจ', color: '#7c3aed', bg: '#f5f3ff' },
                      { key: 'Tool', label: 'เครื่องมือ (Tool)', icon: '🛠️', desc: 'ระบบ/เครื่องมือ', color: '#d97706', bg: '#fffbeb' },
                      { key: 'Decision', label: 'การตัดสินใจ (Decision)', icon: '🎯', desc: 'การกำหนดความต้องการ', color: '#dc2626', bg: '#fef2f2' },
                    ].map(m => {
                      const count = yearAnalysis.rcGroups[m.key].length
                      const pct = yearAnalysis.totalIssues > 0 ? Math.round(count / yearAnalysis.totalIssues * 100) : 0
                      return (
                        <div key={m.key} style={{ background: m.bg, borderRadius: 10, padding: '16px', border: `1px solid ${m.color}22` }}>
                          <div style={{ fontSize: 22 }}>{m.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{m.desc}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{count}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% ของปัญหาทั้งหมด</div>
                          <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct}%`, background: m.color, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <h4 style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>1.2 แยกสิ่งที่ควบคุมได้ – ควบคุมไม่ได้</h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, background: '#f0fdf4', borderRadius: 10, padding: 16, border: '1px solid #86efac' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{yearAnalysis.controllable.length}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>✅ ควบคุมได้</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>ปัญหาที่แก้ไขได้โดยการปรับปรุงกระบวนการ เครื่องมือ และการตัดสินใจ</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, background: '#fffbeb', borderRadius: 10, padding: 16, border: '1px solid #fcd34d' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{yearAnalysis.uncontrollable.length}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>⚠️ ควบคุมยาก</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>ปัญหาที่เกิดจากบุคลากร ต้องเน้นการพัฒนาทักษะอย่างต่อเนื่อง</div>
                    </div>
                  </div>
                </Section>

                {/* Section 2.2 Lesson quality */}
                <Section num="2" title="คุณภาพบทเรียนที่นำไปใช้ซ้ำได้">
                  {yearAnalysis.recurringCats.length === 0 ? (
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, color: '#16a34a', fontSize: 13 }}>
                      ✅ ไม่พบปัญหาที่เกิดซ้ำในระดับที่น่าเป็นห่วง (ทุกประเภทปัญหาเกิดน้อยกว่า 3 ครั้ง)
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>พบปัญหาซ้ำ (≥3 ครั้ง) จำนวน <b style={{ color: '#dc2626' }}>{yearAnalysis.recurringCats.length}</b> ประเภท ถือเป็น "บทเรียนเชิงระบบ" ที่ต้องแก้ไขโครงสร้างอย่างจริงจัง:</p>
                      {yearAnalysis.recurringCats.map(([cat, iss], i) => {
                        const riskCat = RISK_LEVEL(iss.map(x => ({ ...x, severityKey: x.severity || x.priority || 'medium' })))
                        const rs = getRiskStyle(riskCat)
                        return (
                          <div key={i} style={{ background: rs.bg, borderRadius: 10, padding: 16, marginBottom: 10, border: `1px solid ${rs.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: '#1e3a5f' }}>🔁 {cat}</span>
                              <span style={{ color: rs.color, fontWeight: 600, fontSize: 13 }}>เกิดซ้ำ {iss.length} ครั้ง</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#374151' }}>
                              <b>บทเรียน:</b> {(RECOMMENDATIONS[cat] || RECOMMENDATIONS['default']).solution}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Section>

                {/* Section 2.3 Next year plan */}
                <Section num="3" title={`แผนพัฒนาและแก้ไขในปีถัดไป (พ.ศ. ${selectedYear + 1})`}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['ลำดับ', 'ประเภทปัญหา', 'จำนวน', 'ความเร่งด่วน', 'แผนดำเนินการ'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {yearAnalysis.nextYearPlan.map((p, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{i + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{p.category}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{p.count}</td>
                            <td style={tdStyle}>
                              <span style={{ padding: '3px 10px', borderRadius: 12, background: p.priority === 'เร่งด่วน' ? '#fef2f2' : '#f0fdf4', color: p.priority === 'เร่งด่วน' ? '#dc2626' : '#16a34a', fontSize: 12, fontWeight: 600 }}>
                                {p.priority}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, color: '#475569' }}>{p.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                {/* Section 2.4 Prevention */}
                <Section num="4" title="แผนป้องกันไม่ให้เกิดซ้ำ">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {yearAnalysis.preventionPlan.map((p, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ background: '#1e3a5f', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {p.count} ครั้ง
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 13, marginBottom: 4 }}>{p.category}</div>
                          <div style={{ fontSize: 13, color: '#475569' }}>🛡️ {p.prevention}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Section 2.5 Follow-up */}
                <Section num="5" title="การติดตามผล (Follow-up)">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'รอแก้ไข (Open)', count: yearAnalysis.openIssues.length, color: '#dc2626', bg: '#fef2f2' },
                      { label: 'กำลังดำเนินการ', count: yearAnalysis.inprogressIssues.length, color: '#d97706', bg: '#fffbeb' },
                      { label: 'แก้ไขแล้ว (Closed)', count: yearAnalysis.closedIssues.length, color: '#16a34a', bg: '#f0fdf4' },
                    ].map(s => {
                      const pct = yearAnalysis.totalIssues > 0 ? Math.round(s.count / yearAnalysis.totalIssues * 100) : 0
                      return (
                        <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: 16, border: `1px solid ${s.color}22` }}>
                          <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{s.label}</div>
                          <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${pct}%`, background: s.color, height: '100%', borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 4 }}>{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                  {yearAnalysis.openIssues.length > 0 && (
                    <div style={{ background: '#fef2f2', borderRadius: 10, padding: 16, border: '1px solid #fca5a5' }}>
                      <div style={{ fontWeight: 600, color: '#dc2626', fontSize: 13, marginBottom: 8 }}>
                        ⚠️ ปัญหาที่ยังค้างอยู่ {yearAnalysis.openIssues.length} รายการ — ต้องติดตามเร่งด่วน
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {yearAnalysis.openIssues.slice(0, 8).map((iss, i) => (
                          <span key={i} style={{ padding: '3px 10px', background: '#fff', borderRadius: 20, fontSize: 12, border: '1px solid #fca5a5', color: '#7f1d1d' }}>
                            {iss.description?.slice(0, 30)}{iss.description?.length > 30 ? '...' : ''}
                          </span>
                        ))}
                        {yearAnalysis.openIssues.length > 8 && (
                          <span style={{ padding: '3px 10px', background: '#fee2e2', borderRadius: 20, fontSize: 12, color: '#dc2626' }}>+{yearAnalysis.openIssues.length - 8} รายการ</span>
                        )}
                      </div>
                    </div>
                  )}
                </Section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Section wrapper component
function Section({ num, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ background: '#1e3a5f', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>{num}</div>
        <h3 style={{ fontSize: 15, color: '#1e3a5f', fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ paddingLeft: 4 }}>{children}</div>
    </div>
  )
}
