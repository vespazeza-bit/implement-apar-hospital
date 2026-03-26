const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'vespazeza', password: process.env.DB_PASS || '64120482',
  database: process.env.DB_NAME || 'acc_system_setup', charset: 'utf8mb4',
  waitForConnections: true, connectionLimit: 10,
  dateStrings: true,   // คืนค่า DATE/DATETIME เป็น string 'YYYY-MM-DD' แทน Date object
})

// ตั้งค่า charset utf8mb4 ทุก connection เพื่อให้ภาษาไทยแสดงผลถูกต้อง
pool.on('connection', (conn) => {
  conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'")
})

const nd = (d) => (d && d !== '' ? d : null)   // nullDate
const nn = (n) => (n !== '' && n != null ? Number(n) : null)  // nullNum

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: '✅ AP/AR API Server กำลังทำงาน' }))

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT VERSION() as ver, NOW() as now')
    res.json({ db: 'connected', version: rows[0].ver, time: rows[0].now })
  } catch (e) {
    res.status(500).json({ db: 'error', message: e.message })
  }
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const [r] = await pool.query(
      'SELECT id, username, name FROM users WHERE username=? AND password=?',
      [req.body.username, req.body.password])
    if (!r.length) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    res.json(r[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name } = req.body
    const [r] = await pool.query(
      'INSERT INTO users (username,password,name) VALUES (?,?,?)', [username, password, name])
    res.json({ id: r.insertId, username, name })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' })
    res.status(500).json({ error: e.message })
  }
})

// ─── Hospitals ────────────────────────────────────────────────────────────────
app.get('/api/hospitals', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM hospitals ORDER BY name')
    res.json(r.map(h => ({
      id: h.id, name: h.name, code: h.code || '', type: h.type || '',
      province: h.province || '', region: h.region || '', affiliation: h.affiliation || '',
      address: h.address || '', bedCount: h.bed_count || 0,
      coordinator: h.coordinator || '', coordinatorPhone: h.coordinator_phone || '',
      coordinatorEmail: h.coordinator_email || '',
      itContact: h.it_contact || '', itPhone: h.it_phone || '', note: h.note || '',
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/hospitals', async (req, res) => {
  try {
    const d = req.body
    const [r] = await pool.query(
      `INSERT INTO hospitals (name,code,type,province,region,affiliation,address,
        bed_count,coordinator,coordinator_phone,coordinator_email,it_contact,it_phone,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [d.name,d.code,d.type,d.province,d.region,d.affiliation,d.address,
       nn(d.bedCount),d.coordinator,d.coordinatorPhone,d.coordinatorEmail,
       d.itContact,d.itPhone,d.note])
    res.json({ id: r.insertId, ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/hospitals/:id', async (req, res) => {
  try {
    const d = req.body
    await pool.query(
      `UPDATE hospitals SET name=?,code=?,type=?,province=?,region=?,affiliation=?,address=?,
        bed_count=?,coordinator=?,coordinator_phone=?,coordinator_email=?,
        it_contact=?,it_phone=?,note=? WHERE id=?`,
      [d.name,d.code,d.type,d.province,d.region,d.affiliation,d.address,
       nn(d.bedCount),d.coordinator,d.coordinatorPhone,d.coordinatorEmail,
       d.itContact,d.itPhone,d.note, req.params.id])
    res.json({ id: Number(req.params.id), ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/hospitals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hospitals WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Team Members ─────────────────────────────────────────────────────────────
app.get('/api/team', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM team_members ORDER BY name')
    res.json(r)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/team', async (req, res) => {
  try {
    const { name, position, nickname } = req.body
    const [r] = await pool.query('INSERT INTO team_members (name,position,nickname) VALUES (?,?,?)', [name, position, nickname || null])
    res.json({ id: r.insertId, name, position, nickname: nickname || '' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/team/:id', async (req, res) => {
  try {
    const { name, position, nickname } = req.body
    console.log(`[PUT /api/team/${req.params.id}]`, { name, position, nickname })
    await pool.query('UPDATE team_members SET name=?,position=?,nickname=? WHERE id=?',
      [name, position, nickname || null, req.params.id])
    console.log(`[PUT /api/team] บันทึกสำเร็จ id=${req.params.id} nickname="${nickname}"`)
    res.json({ id: Number(req.params.id), name, position, nickname: nickname || '' })
  } catch (e) {
    console.error('[PUT /api/team] ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/team/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM team_members WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Project Plans ────────────────────────────────────────────────────────────
app.get('/api/plans', async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM project_plans ORDER BY online_start, created_at')
    const [teams] = await pool.query('SELECT * FROM project_plan_team')
    res.json(plans.map(p => ({
      id: p.id, projectName: p.project_name,
      hospitalId: p.hospital_id ? String(p.hospital_id) : '',
      siteOwner: p.site_owner || '', installType: p.install_type || '',
      budget: p.budget || '', onlineStart: p.online_start || '',
      onlineEnd: p.online_end || '', startDate: p.start_date || '',
      endDate: p.end_date || '', revisit1: p.revisit1 || '',
      revisit2: p.revisit2 || '', status: p.status || 'waiting',
      note: p.note || '',
      team: teams.filter(t => t.plan_id === p.id).map(t => ({
        id: t.id, memberId: String(t.member_id || ''), name: t.member_name, role: t.role || '',
      })),
      createdAt: p.created_at,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/plans', async (req, res) => {
  try {
    const d = req.body
    const [r] = await pool.query(
      `INSERT INTO project_plans (project_name,hospital_id,site_owner,install_type,budget,
        online_start,online_end,start_date,end_date,revisit1,revisit2,status,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [d.projectName, nn(d.hospitalId), d.siteOwner, d.installType, nn(d.budget),
       nd(d.onlineStart), nd(d.onlineEnd), nd(d.startDate), nd(d.endDate),
       nd(d.revisit1), nd(d.revisit2), d.status, d.note])
    const planId = r.insertId
    for (const m of (d.team || [])) {
      await pool.query(
        'INSERT INTO project_plan_team (plan_id,member_id,member_name,role) VALUES (?,?,?,?)',
        [planId, nn(m.memberId), m.name, m.role])
    }
    res.json({ id: planId, ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/plans/:id', async (req, res) => {
  try {
    const d = req.body
    await pool.query(
      `UPDATE project_plans SET project_name=?,hospital_id=?,site_owner=?,install_type=?,budget=?,
        online_start=?,online_end=?,start_date=?,end_date=?,revisit1=?,revisit2=?,status=?,note=?
       WHERE id=?`,
      [d.projectName, nn(d.hospitalId), d.siteOwner, d.installType, nn(d.budget),
       nd(d.onlineStart), nd(d.onlineEnd), nd(d.startDate), nd(d.endDate),
       nd(d.revisit1), nd(d.revisit2), d.status, d.note, req.params.id])
    await pool.query('DELETE FROM project_plan_team WHERE plan_id=?', [req.params.id])
    for (const m of (d.team || [])) {
      await pool.query(
        'INSERT INTO project_plan_team (plan_id,member_id,member_name,role) VALUES (?,?,?,?)',
        [req.params.id, nn(m.memberId), m.name, m.role])
    }
    res.json({ id: Number(req.params.id), ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/plans/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM project_plans WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Checklist ────────────────────────────────────────────────────────────────
app.get('/api/checklist', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM checklist_items')
    const result = { basic: {}, form: {}, report: {}, advance: {} }
    rows.forEach(r => {
      if (!result[r.type][r.hospital_id]) result[r.type][r.hospital_id] = {}
      result[r.type][r.hospital_id][r.item_id] = {
        checked: !!r.checked, note: r.note || '', date: r.item_date || '',
      }
    })
    res.json(result)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/checklist/:type/:hospitalId/:itemId', async (req, res) => {
  try {
    const { checked, note, date } = req.body
    await pool.query(
      `INSERT INTO checklist_items (type,hospital_id,item_id,checked,note,item_date)
       VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE checked=VALUES(checked),note=VALUES(note),item_date=VALUES(item_date)`,
      [req.params.type, req.params.hospitalId, req.params.itemId, checked ? 1 : 0, note || '', nd(date)])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Training Issues ──────────────────────────────────────────────────────────
app.get('/api/training-issues', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM training_issues ORDER BY date DESC, created_at DESC')
    res.json(r.map(x => ({
      id: x.id, hospitalId: x.hospital_id ? String(x.hospital_id) : '',
      date: x.date || '', resolvedDate: x.resolved_date || '',
      category: x.category || '', description: x.description || '',
      severity: x.severity, status: x.status,
      resolution: x.resolution || '', reportedBy: x.reported_by || '',
      systemName: x.system_name || '',
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/training-issues', async (req, res) => {
  try {
    const d = req.body
    const [r] = await pool.query(
      'INSERT INTO training_issues (hospital_id,date,resolved_date,category,description,severity,status,resolution,reported_by,system_name) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [nn(d.hospitalId), nd(d.date), nd(d.resolvedDate), d.category, d.description, d.severity, d.status, d.resolution, d.reportedBy, d.systemName || ''])
    res.json({ id: r.insertId, ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/training-issues/:id', async (req, res) => {
  try {
    const d = req.body
    await pool.query(
      'UPDATE training_issues SET hospital_id=?,date=?,resolved_date=?,category=?,description=?,severity=?,status=?,resolution=?,reported_by=?,system_name=? WHERE id=?',
      [nn(d.hospitalId), nd(d.date), nd(d.resolvedDate), d.category, d.description, d.severity, d.status, d.resolution, d.reportedBy, d.systemName || '', req.params.id])
    res.json({ id: Number(req.params.id), ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/training-issues/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM training_issues WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── System Issues ────────────────────────────────────────────────────────────
app.get('/api/system-issues', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM system_issues ORDER BY report_date DESC, created_at DESC')
    res.json(r.map(x => ({
      id: x.id, hospitalId: x.hospital_id ? String(x.hospital_id) : '',
      reportDate: x.report_date || '', resolvedDate: x.resolved_date || '',
      category: x.category || '', description: x.description || '',
      priority: x.priority, status: x.status,
      resolution: x.resolution || '', reportedBy: x.reported_by || '',
      systemName: x.system_name || '',
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/system-issues', async (req, res) => {
  try {
    const d = req.body
    const [r] = await pool.query(
      'INSERT INTO system_issues (hospital_id,report_date,resolved_date,category,description,priority,status,resolution,reported_by,system_name) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [nn(d.hospitalId), nd(d.reportDate), nd(d.resolvedDate), d.category, d.description, d.priority, d.status, d.resolution, d.reportedBy, d.systemName || ''])
    res.json({ id: r.insertId, ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/system-issues/:id', async (req, res) => {
  try {
    const d = req.body
    await pool.query(
      'UPDATE system_issues SET hospital_id=?,report_date=?,resolved_date=?,category=?,description=?,priority=?,status=?,resolution=?,reported_by=?,system_name=? WHERE id=?',
      [nn(d.hospitalId), nd(d.reportDate), nd(d.resolvedDate), d.category, d.description, d.priority, d.status, d.resolution, d.reportedBy, d.systemName || '', req.params.id])
    res.json({ id: Number(req.params.id), ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/system-issues/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM system_issues WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Advance Records ─────────────────────────────────────────────────────────
app.get('/api/advance-records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM advance_records ORDER BY created_at DESC')
    res.json(rows.map(r => ({
      id: r.id, planId: r.plan_id ? String(r.plan_id) : '',
      objective: r.objective || '',
      documents: r.documents ? JSON.parse(r.documents) : [],
      amount: r.amount || '', advDate: r.adv_date || '',
      clearDate: r.clear_date || '', actualAmount: r.actual_amount || '',
      status: r.status || 'pending', note: r.note || '',
      createdAt: r.created_at,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/advance-records', async (req, res) => {
  try {
    const d = req.body
    const [r] = await pool.query(
      `INSERT INTO advance_records (plan_id,objective,documents,amount,adv_date,clear_date,actual_amount,status,note)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [nn(d.planId), d.objective, JSON.stringify(d.documents || []),
       nn(d.amount), nd(d.advDate), nd(d.clearDate), nn(d.actualAmount), d.status, d.note])
    res.json({ id: r.insertId, ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/advance-records/:id', async (req, res) => {
  try {
    const d = req.body
    await pool.query(
      `UPDATE advance_records SET plan_id=?,objective=?,documents=?,amount=?,adv_date=?,clear_date=?,actual_amount=?,status=?,note=? WHERE id=?`,
      [nn(d.planId), d.objective, JSON.stringify(d.documents || []),
       nn(d.amount), nd(d.advDate), nd(d.clearDate), nn(d.actualAmount), d.status, d.note, req.params.id])
    res.json({ id: Number(req.params.id), ...d })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/advance-records/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM advance_records WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Basic Checklist Entries ──────────────────────────────────────────────────
app.get('/api/basic-entries', async (req, res) => {
  try {
    const { hospitalId } = req.query
    if (!hospitalId) return res.json([])
    const [r] = await pool.query(
      `SELECT e.id, e.hospital_id, e.master_id, e.status, e.note,
              m.system_name, m.item_name, m.detail, m.sort_order
       FROM basic_checklist_entries e
       JOIN basic_checklist_master m ON e.master_id = m.id
       WHERE e.hospital_id = ?
       ORDER BY m.sort_order, m.id`,
      [hospitalId])
    res.json(r.map(x => ({
      id: x.id, hospitalId: x.hospital_id, masterId: x.master_id,
      status: x.status || 'waiting', note: x.note || '',
      systemName: x.system_name || '', itemName: x.item_name || '',
      detail: x.detail || '', sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// สรุปความคืบหน้าต่อ รพ. (ใช้ใน ProjectSummary)
app.get('/api/basic-entries/summary', async (req, res) => {
  try {
    const [r] = await pool.query(
      `SELECT hospital_id, COUNT(*) AS total,
              SUM(status = 'done') AS done
       FROM basic_checklist_entries
       GROUP BY hospital_id`)
    res.json(r.map(x => ({
      hospitalId: String(x.hospital_id),
      total: Number(x.total),
      done: Number(x.done),
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// นำเข้ารายการ bulk upsert
app.post('/api/basic-entries/import', async (req, res) => {
  try {
    const { hospitalId, items } = req.body  // items: [{masterId, status, note}]
    if (!hospitalId || !items?.length) return res.json({ ok: true, count: 0 })
    for (const item of items) {
      await pool.query(
        `INSERT INTO basic_checklist_entries (hospital_id, master_id, status, note)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note)`,
        [hospitalId, item.masterId, item.status || 'waiting', item.note || ''])
    }
    res.json({ ok: true, count: items.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/basic-entries/:id', async (req, res) => {
  try {
    const { status, note } = req.body
    await pool.query('UPDATE basic_checklist_entries SET status=?,note=? WHERE id=?',
      [status, note || '', req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/basic-entries/hospital/:hospitalId', async (req, res) => {
  try {
    await pool.query('DELETE FROM basic_checklist_entries WHERE hospital_id=?', [req.params.hospitalId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/basic-entries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM basic_checklist_entries WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Form Checklist Master ────────────────────────────────────────────────────
app.get('/api/form-master', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM form_checklist_master ORDER BY sort_order, id')
    res.json(r.map(x => ({
      id: x.id, systemName: x.system_name || '', formName: x.form_name || '',
      printName: x.print_name || '', paperSize: x.paper_size || 'A4',
      parameter: x.parameter || '', condition: x.condition_text || '',
      sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/form-master', async (req, res) => {
  try {
    const { systemName, formName, printName, paperSize, parameter, condition, sortOrder } = req.body
    const [r] = await pool.query(
      'INSERT INTO form_checklist_master (system_name,form_name,print_name,paper_size,parameter,condition_text,sort_order) VALUES (?,?,?,?,?,?,?)',
      [systemName, formName, printName || '', paperSize || 'A4', parameter || '', condition || '', nn(sortOrder) ?? 0])
    res.json({ id: r.insertId, systemName, formName, printName: printName || '', paperSize: paperSize || 'A4', parameter: parameter || '', condition: condition || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/form-master/:id', async (req, res) => {
  try {
    const { systemName, formName, printName, paperSize, parameter, condition, sortOrder } = req.body
    await pool.query(
      'UPDATE form_checklist_master SET system_name=?,form_name=?,print_name=?,paper_size=?,parameter=?,condition_text=?,sort_order=? WHERE id=?',
      [systemName, formName, printName || '', paperSize || 'A4', parameter || '', condition || '', nn(sortOrder) ?? 0, req.params.id])
    res.json({ id: Number(req.params.id), systemName, formName, printName: printName || '', paperSize: paperSize || 'A4', parameter: parameter || '', condition: condition || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/form-master/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM form_checklist_master WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Form Checklist Entries ───────────────────────────────────────────────────
app.get('/api/form-entries', async (req, res) => {
  try {
    const { hospitalId } = req.query
    if (!hospitalId) return res.json([])
    const [r] = await pool.query(
      `SELECT e.id, e.hospital_id, e.master_id, e.status, e.assigned_to, e.note,
              m.system_name, m.form_name, m.print_name, m.paper_size, m.sort_order
       FROM form_checklist_entries e
       JOIN form_checklist_master m ON e.master_id = m.id
       WHERE e.hospital_id = ?
       ORDER BY m.sort_order, m.id`,
      [hospitalId])
    res.json(r.map(x => ({
      id: x.id, hospitalId: x.hospital_id, masterId: x.master_id,
      status: x.status || 'waiting_form', assignedTo: x.assigned_to || '', note: x.note || '',
      systemName: x.system_name || '', formName: x.form_name || '',
      printName: x.print_name || '', paperSize: x.paper_size || 'A4', sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/form-entries/import', async (req, res) => {
  try {
    const { hospitalId, items } = req.body  // items: [{masterId, status, assignedTo, note}]
    if (!hospitalId || !items?.length) return res.json({ ok: true, count: 0 })
    for (const item of items) {
      await pool.query(
        `INSERT INTO form_checklist_entries (hospital_id, master_id, status, assigned_to, note)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), assigned_to=VALUES(assigned_to), note=VALUES(note)`,
        [hospitalId, item.masterId, item.status || 'waiting_form', item.assignedTo || '', item.note || ''])
    }
    res.json({ ok: true, count: items.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// สรุปความคืบหน้าต่อ รพ. (ใช้ใน ProjectSummary)
app.get('/api/form-entries/summary', async (req, res) => {
  try {
    const [r] = await pool.query(
      `SELECT hospital_id, COUNT(*) AS total,
              SUM(status = 'done') AS done
       FROM form_checklist_entries
       GROUP BY hospital_id`)
    res.json(r.map(x => ({
      hospitalId: String(x.hospital_id),
      total: Number(x.total),
      done: Number(x.done),
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/form-entries/:id', async (req, res) => {
  try {
    const { status, assignedTo, note } = req.body
    await pool.query(
      'UPDATE form_checklist_entries SET status=?,assigned_to=?,note=? WHERE id=?',
      [status, assignedTo || '', note || '', req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Report Checklist Master ──────────────────────────────────────────────────
app.get('/api/report-master', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM report_checklist_master ORDER BY sort_order, id')
    res.json(r.map(x => ({
      id: x.id, systemName: x.system_name || '', reportName: x.report_name || '',
      printName: x.print_name || '', paperSize: x.paper_size || 'A4',
      parameter: x.parameter || '', condition: x.condition_text || '',
      sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/report-master', async (req, res) => {
  try {
    const { systemName, reportName, printName, paperSize, parameter, condition, sortOrder } = req.body
    const [r] = await pool.query(
      'INSERT INTO report_checklist_master (system_name,report_name,print_name,paper_size,parameter,condition_text,sort_order) VALUES (?,?,?,?,?,?,?)',
      [systemName, reportName, printName || '', paperSize || 'A4', parameter || '', condition || '', nn(sortOrder) ?? 0])
    res.json({ id: r.insertId, systemName, reportName, printName: printName || '', paperSize: paperSize || 'A4', parameter: parameter || '', condition: condition || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/report-master/:id', async (req, res) => {
  try {
    const { systemName, reportName, printName, paperSize, parameter, condition, sortOrder } = req.body
    await pool.query(
      'UPDATE report_checklist_master SET system_name=?,report_name=?,print_name=?,paper_size=?,parameter=?,condition_text=?,sort_order=? WHERE id=?',
      [systemName, reportName, printName || '', paperSize || 'A4', parameter || '', condition || '', nn(sortOrder) ?? 0, req.params.id])
    res.json({ id: Number(req.params.id), systemName, reportName, printName: printName || '', paperSize: paperSize || 'A4', parameter: parameter || '', condition: condition || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/report-master/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM report_checklist_master WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Report Checklist Entries ─────────────────────────────────────────────────
app.get('/api/report-entries', async (req, res) => {
  try {
    const { hospitalId } = req.query
    if (!hospitalId) return res.json([])
    const [r] = await pool.query(
      `SELECT e.id, e.hospital_id, e.master_id, e.status, e.assigned_to, e.note,
              m.system_name, m.report_name, m.print_name, m.paper_size, m.sort_order
       FROM report_checklist_entries e
       JOIN report_checklist_master m ON e.master_id = m.id
       WHERE e.hospital_id = ?
       ORDER BY m.sort_order, m.id`,
      [hospitalId])
    res.json(r.map(x => ({
      id: x.id, hospitalId: x.hospital_id, masterId: x.master_id,
      status: x.status || 'waiting_form', assignedTo: x.assigned_to || '', note: x.note || '',
      systemName: x.system_name || '', reportName: x.report_name || '',
      printName: x.print_name || '', paperSize: x.paper_size || 'A4', sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/report-entries/import', async (req, res) => {
  try {
    const { hospitalId, items } = req.body
    if (!hospitalId || !items?.length) return res.json({ ok: true, count: 0 })
    for (const item of items) {
      await pool.query(
        `INSERT INTO report_checklist_entries (hospital_id, master_id, status, assigned_to, note)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), assigned_to=VALUES(assigned_to), note=VALUES(note)`,
        [hospitalId, item.masterId, item.status || 'waiting_form', item.assignedTo || '', item.note || ''])
    }
    res.json({ ok: true, count: items.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// สรุปความคืบหน้าต่อ รพ. (ใช้ใน ProjectSummary)
app.get('/api/report-entries/summary', async (req, res) => {
  try {
    const [r] = await pool.query(
      `SELECT hospital_id, COUNT(*) AS total,
              SUM(status = 'done') AS done
       FROM report_checklist_entries
       GROUP BY hospital_id`)
    res.json(r.map(x => ({
      hospitalId: String(x.hospital_id),
      total: Number(x.total),
      done: Number(x.done),
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/report-entries/:id', async (req, res) => {
  try {
    const { status, assignedTo, note } = req.body
    await pool.query(
      'UPDATE report_checklist_entries SET status=?,assigned_to=?,note=? WHERE id=?',
      [status, assignedTo || '', note || '', req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── MasterPlan Topics ────────────────────────────────────────────────────────
app.get('/api/masterplan-topics', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM masterplan_topics ORDER BY sort_order, id')
    res.json(r.map(x => ({ id: x.id, title: x.title, sortOrder: x.sort_order })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/masterplan-topics', async (req, res) => {
  try {
    const { title, sortOrder } = req.body
    const [r] = await pool.query('INSERT INTO masterplan_topics (title, sort_order) VALUES (?,?)', [title, nn(sortOrder) ?? 0])
    res.json({ id: r.insertId, title, sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/masterplan-topics/:id', async (req, res) => {
  try {
    const { title, sortOrder } = req.body
    await pool.query('UPDATE masterplan_topics SET title=?, sort_order=? WHERE id=?', [title, nn(sortOrder) ?? 0, req.params.id])
    res.json({ id: Number(req.params.id), title, sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/masterplan-topics/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM masterplan_topics WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── MasterPlan Items ─────────────────────────────────────────────────────────
app.get('/api/masterplan-items', async (req, res) => {
  try {
    const { planId } = req.query
    if (!planId) return res.json([])
    const [r] = await pool.query(
      'SELECT * FROM masterplan_items WHERE plan_id=? ORDER BY COALESCE(start_date,"9999-99-99"), start_time, sort_order',
      [planId])
    res.json(r.map(x => ({
      id: x.id, planId: x.plan_id, topicTitle: x.topic_title || '',
      startDate: x.start_date ? String(x.start_date).slice(0, 10) : '',
      endDate: x.end_date ? String(x.end_date).slice(0, 10) : '',
      startTime: x.start_time || '', endTime: x.end_time || '',
      taskDetail: x.task_detail || '', responsible: x.responsible || '',
      hospitalResponsible: x.hospital_responsible || '',
      preparation: x.preparation || '', sortOrder: x.sort_order || 0,
      status: x.status || 'pending',
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/masterplan-items', async (req, res) => {
  try {
    const { planId, topicTitle, startDate, endDate, startTime, endTime, taskDetail, responsible, hospitalResponsible, preparation, sortOrder, status } = req.body
    const [r] = await pool.query(
      'INSERT INTO masterplan_items (plan_id,topic_title,start_date,end_date,start_time,end_time,task_detail,responsible,hospital_responsible,preparation,sort_order,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [planId, topicTitle || '', startDate || null, endDate || null, startTime || '', endTime || '', taskDetail || '', responsible || '', hospitalResponsible || '', preparation || '', nn(sortOrder) ?? 0, status || 'pending'])
    res.json({ id: r.insertId })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/masterplan-items/:id', async (req, res) => {
  try {
    const { topicTitle, startDate, endDate, startTime, endTime, taskDetail, responsible, hospitalResponsible, preparation, status } = req.body
    await pool.query(
      'UPDATE masterplan_items SET topic_title=?,start_date=?,end_date=?,start_time=?,end_time=?,task_detail=?,responsible=?,hospital_responsible=?,preparation=?,status=? WHERE id=?',
      [topicTitle || '', startDate || null, endDate || null, startTime || '', endTime || '', taskDetail || '', responsible || '', hospitalResponsible || '', preparation || '', status || 'pending', req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/masterplan-items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM masterplan_items WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── MasterPlan Summary (per hospital) ───────────────────────────────────────
app.get('/api/masterplan-items/summary', async (req, res) => {
  try {
    const [r] = await pool.query(`
      SELECT p.hospital_id AS hospitalId,
             COUNT(mi.id) AS total,
             SUM(CASE WHEN mi.status = 'done' THEN 1 ELSE 0 END) AS done
      FROM masterplan_items mi
      JOIN project_plans p ON p.id = mi.plan_id
      GROUP BY p.hospital_id
    `)
    res.json(r.map(x => ({ hospitalId: String(x.hospitalId), total: Number(x.total), done: Number(x.done) })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Debug schema ─────────────────────────────────────────────────────────────
app.get('/api/schema', async (req, res) => {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM team_members')
    res.json(cols.map(c => ({ field: c.Field, type: c.Type })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Basic Checklist Master ────────────────────────────────────────────────────
app.get('/api/basic-master', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM basic_checklist_master ORDER BY sort_order, id')
    res.json(r.map(x => ({
      id: x.id, systemName: x.system_name || '', itemName: x.item_name || '',
      detail: x.detail || '', sortOrder: x.sort_order || 0,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/basic-master', async (req, res) => {
  try {
    const { systemName, itemName, detail, sortOrder } = req.body
    const [r] = await pool.query(
      'INSERT INTO basic_checklist_master (system_name,item_name,detail,sort_order) VALUES (?,?,?,?)',
      [systemName, itemName, detail || '', nn(sortOrder) ?? 0])
    res.json({ id: r.insertId, systemName, itemName, detail: detail || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/basic-master/:id', async (req, res) => {
  try {
    const { systemName, itemName, detail, sortOrder } = req.body
    await pool.query(
      'UPDATE basic_checklist_master SET system_name=?,item_name=?,detail=?,sort_order=? WHERE id=?',
      [systemName, itemName, detail || '', nn(sortOrder) ?? 0, req.params.id])
    res.json({ id: Number(req.params.id), systemName, itemName, detail: detail || '', sortOrder: sortOrder || 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/basic-master/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM basic_checklist_master WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Migrations ───────────────────────────────────────────────────────────────
const DEFAULT_BASIC_ITEMS = [
  { system_name: 'ระบบเจ้าหนี้ (AP)', item_name: 'ข้อมูลผู้ขาย (Vendor Master)', detail: 'ข้อมูลผู้ขายทั้งหมดที่ใช้ในระบบ' },
  { system_name: 'ระบบลูกหนี้ (AR)', item_name: 'ข้อมูลลูกค้า (Customer Master)', detail: 'ข้อมูลลูกค้าทั้งหมดที่ใช้ในระบบ' },
  { system_name: 'ระบบบัญชี', item_name: 'ผังบัญชี (Chart of Accounts)', detail: 'ผังบัญชีที่ใช้ในองค์กร' },
  { system_name: 'ระบบบัญชี', item_name: 'หน่วยงาน / ศูนย์ต้นทุน (Cost Center)', detail: 'โครงสร้างหน่วยงานและศูนย์ต้นทุน' },
  { system_name: 'ระบบเจ้าหนี้ (AP)', item_name: 'เงื่อนไขการชำระเงิน (Payment Terms)', detail: 'เงื่อนไขการชำระเงินที่ใช้กับผู้ขาย' },
  { system_name: 'ระบบเจ้าหนี้ (AP)', item_name: 'ข้อมูลธนาคาร (Bank Master)', detail: 'ข้อมูลบัญชีธนาคารที่ใช้จ่ายชำระ' },
  { system_name: 'ระบบภาษี', item_name: 'ข้อมูลภาษีมูลค่าเพิ่ม (VAT Setting)', detail: 'การตั้งค่า VAT ในระบบ' },
  { system_name: 'ระบบภาษี', item_name: 'ข้อมูลหัก ณ ที่จ่าย (WHT Setting)', detail: 'อัตราและประเภทภาษีหัก ณ ที่จ่าย' },
  { system_name: 'ระบบสินค้า', item_name: 'รหัสสินค้า / บริการ (Item/Service Code)', detail: 'รหัสสินค้าและบริการที่ใช้ในการซื้อขาย' },
  { system_name: 'ระบบงบประมาณ', item_name: 'ข้อมูลงบประมาณ (Budget Data)', detail: 'ข้อมูลงบประมาณประจำปี' },
]

async function runMigrations() {
  const columnMigrations = [
    {
      table: 'team_members', column: 'nickname',
      sql: `ALTER TABLE team_members ADD COLUMN nickname VARCHAR(100) NULL AFTER name`,
    },
    {
      table: 'training_issues', column: 'resolved_date',
      sql: `ALTER TABLE training_issues ADD COLUMN resolved_date DATE NULL`,
    },
    {
      table: 'training_issues', column: 'reported_by',
      sql: `ALTER TABLE training_issues ADD COLUMN reported_by VARCHAR(200) NULL`,
    },
    {
      table: 'training_issues', column: 'system_name',
      sql: `ALTER TABLE training_issues ADD COLUMN system_name VARCHAR(200) NULL`,
    },
    {
      table: 'system_issues', column: 'system_name',
      sql: `ALTER TABLE system_issues ADD COLUMN system_name VARCHAR(200) NULL`,
    },
    {
      table: 'form_checklist_master', column: 'condition_text',
      sql: `ALTER TABLE form_checklist_master ADD COLUMN condition_text TEXT NULL`,
    },
    {
      table: 'masterplan_items', column: 'status',
      sql: `ALTER TABLE masterplan_items ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER preparation`,
    },
  ]

  for (const m of columnMigrations) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`)
      if (cols.length === 0) {
        await pool.query(m.sql)
        console.log(`✅ Migration: เพิ่ม ${m.column} ใน ${m.table} สำเร็จ`)
      }
    } catch (e) {
      console.error(`❌ Migration error (${m.table}.${m.column}):`, e.message)
    }
  }

  // สร้างตาราง basic_checklist_entries ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS basic_checklist_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        master_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_hosp_master (hospital_id, master_id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง basic_checklist_entries พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (basic_checklist_entries):', e.message)
  }

  // สร้างตาราง basic_checklist_master ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS basic_checklist_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        system_name VARCHAR(200) NOT NULL DEFAULT '',
        item_name VARCHAR(200) NOT NULL,
        detail TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง basic_checklist_master พร้อมใช้งาน')

    // seed ข้อมูล default ถ้าตารางว่าง
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM basic_checklist_master')
    if (existing[0].cnt === 0) {
      for (let i = 0; i < DEFAULT_BASIC_ITEMS.length; i++) {
        const item = DEFAULT_BASIC_ITEMS[i]
        await pool.query(
          'INSERT INTO basic_checklist_master (system_name,item_name,detail,sort_order) VALUES (?,?,?,?)',
          [item.system_name, item.item_name, item.detail, i + 1])
      }
      console.log(`✅ Migration: seed ข้อมูล default ${DEFAULT_BASIC_ITEMS.length} รายการใน basic_checklist_master`)
    }
  } catch (e) {
    console.error('❌ Migration error (basic_checklist_master):', e.message)
  }

  // สร้างตาราง form_checklist_entries ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_checklist_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        master_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting_form',
        assigned_to VARCHAR(200) DEFAULT '',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_form_hosp_master (hospital_id, master_id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง form_checklist_entries พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (form_checklist_entries):', e.message)
  }

  // สร้างตาราง form_checklist_master ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_checklist_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        system_name VARCHAR(200) NOT NULL DEFAULT '',
        form_name VARCHAR(200) NOT NULL DEFAULT '',
        print_name VARCHAR(200) NOT NULL DEFAULT '',
        paper_size VARCHAR(10) NOT NULL DEFAULT 'A4',
        parameter TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง form_checklist_master พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (form_checklist_master):', e.message)
  }

  // สร้างตาราง report_checklist_master ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_checklist_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        system_name VARCHAR(200) NOT NULL DEFAULT '',
        report_name VARCHAR(200) NOT NULL DEFAULT '',
        print_name VARCHAR(200) NOT NULL DEFAULT '',
        paper_size VARCHAR(10) NOT NULL DEFAULT 'A4',
        parameter TEXT,
        condition_text TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง report_checklist_master พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (report_checklist_master):', e.message)
  }

  // สร้างตาราง report_checklist_entries ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_checklist_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        master_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting_form',
        assigned_to VARCHAR(200) DEFAULT '',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_report_hosp_master (hospital_id, master_id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง report_checklist_entries พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (report_checklist_entries):', e.message)
  }

  // สร้างตาราง masterplan_topics ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterplan_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง masterplan_topics พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (masterplan_topics):', e.message)
  }

  // สร้างตาราง masterplan_items ถ้ายังไม่มี
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS masterplan_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        topic_title VARCHAR(500) DEFAULT '',
        start_date DATE NULL,
        end_date DATE NULL,
        start_time VARCHAR(10) DEFAULT '',
        end_time VARCHAR(10) DEFAULT '',
        task_detail TEXT,
        responsible VARCHAR(300) DEFAULT '',
        hospital_responsible VARCHAR(300) DEFAULT '',
        preparation TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ Migration: ตาราง masterplan_items พร้อมใช้งาน')
  } catch (e) {
    console.error('❌ Migration error (masterplan_items):', e.message)
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
runMigrations().then(() => {
  app.listen(3001, () => console.log('✅ API Server รันที่ http://localhost:3001'))
})