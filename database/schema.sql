-- ============================================================
-- ฐานข้อมูล: ระบบติดตามการติดตั้ง AP/AR โรงพยาบาล
-- Charset: tis620 (ภาษาไทย)
-- ============================================================

CREATE DATABASE IF NOT EXISTS acc_system_setup
  CHARACTER SET tis620
  COLLATE tis620_thai_ci;

USE acc_system_setup;

-- ─── ผู้ใช้งานระบบ ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(100) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  name         VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── โรงพยาบาล ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  code                VARCHAR(50),
  type                VARCHAR(20),
  province            VARCHAR(100),
  region              VARCHAR(100),
  affiliation         VARCHAR(200),
  address             TEXT,
  bed_count           INT DEFAULT 0,
  coordinator         VARCHAR(200),
  coordinator_phone   VARCHAR(50),
  coordinator_email   VARCHAR(200),
  it_contact          VARCHAR(200),
  it_phone            VARCHAR(50),
  note                TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── ทีมงาน ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  position     VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── แผนการปฏิบัติงาน ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_plans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  project_name  VARCHAR(500) NOT NULL,
  hospital_id   INT,
  site_owner    VARCHAR(255),
  install_type  VARCHAR(100),
  budget        DECIMAL(15,2),
  online_start  DATE,
  online_end    DATE,
  start_date    DATE,
  end_date      DATE,
  revisit1      DATE,
  revisit2      DATE,
  status        VARCHAR(50) DEFAULT 'waiting',
  note          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── ทีมงานในแผนงาน ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_plan_team (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  plan_id      INT NOT NULL,
  member_id    INT,
  member_name  VARCHAR(255) NOT NULL,
  role         VARCHAR(255),
  FOREIGN KEY (plan_id) REFERENCES project_plans(id) ON DELETE CASCADE
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── Checklist (basic / form / report / advance) ──────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  type         ENUM('basic','form','report','advance') NOT NULL,
  hospital_id  INT NOT NULL,
  item_id      VARCHAR(50) NOT NULL,
  checked      TINYINT(1) DEFAULT 0,
  note         TEXT,
  item_date    DATE,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_checklist (type, hospital_id, item_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── สรุปปัญหาอบรม ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_issues (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id  INT,
  date         DATE,
  category     VARCHAR(200),
  description  TEXT,
  severity     ENUM('low','medium','high') DEFAULT 'medium',
  status       ENUM('open','inprogress','closed') DEFAULT 'open',
  resolution   TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
) CHARACTER SET tis620 COLLATE tis620_thai_ci;

-- ─── สรุปปัญหาขึ้นระบบ ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_issues (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id   INT,
  report_date   DATE,
  resolved_date DATE,
  category      VARCHAR(200),
  description   TEXT,
  priority      ENUM('low','medium','high','critical') DEFAULT 'medium',
  status        ENUM('open','inprogress','testing','closed') DEFAULT 'open',
  resolution    TEXT,
  reported_by   VARCHAR(200),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
) CHARACTER SET tis620 COLLATE tis620_thai_ci;
