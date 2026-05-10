/*
 Navicat Premium Data Transfer

 Source Server         : My-connection
 Source Server Type    : MySQL
 Source Server Version : 100017 (10.0.17-MariaDB)
 Source Host           : 127.0.1.1:3306
 Source Schema         : acc_system_setup

 Target Server Type    : MySQL
 Target Server Version : 100017 (10.0.17-MariaDB)
 File Encoding         : 65001

 Date: 26/03/2026 15:21:25
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for advance_records
-- ----------------------------
DROP TABLE IF EXISTS `advance_records`;
CREATE TABLE `advance_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NULL DEFAULT NULL,
  `objective` varchar(500) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `documents` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `amount` decimal(15, 2) NULL DEFAULT NULL,
  `adv_date` date NULL DEFAULT NULL,
  `clear_date` date NULL DEFAULT NULL,
  `actual_amount` decimal(15, 2) NULL DEFAULT NULL,
  `status` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'pending',
  `note` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `plan_id`(`plan_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 3 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of advance_records
-- ----------------------------
INSERT INTO `advance_records` VALUES (2, 1, 'ติดตั้งระบบ', '[{\"label\":\"Master Plan\",\"checked\":true},{\"label\":\"ประมาณการค่าใช้จ่าย\",\"checked\":true},{\"label\":\"ไฟล์สรุปปัญหา\",\"checked\":true},{\"label\":\"หนังสือแจ้ง Rev\",\"checked\":true},{\"label\":\"หาที่พัก\",\"checked\":true}]', 31340.00, '2026-02-04', '2026-03-06', 34153.00, 'waiting_clear', '', '2026-03-15 14:30:46');

-- ----------------------------
-- Table structure for basic_checklist_entries
-- ----------------------------
DROP TABLE IF EXISTS `basic_checklist_entries`;
CREATE TABLE `basic_checklist_entries`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NOT NULL,
  `master_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'waiting',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_hosp_master`(`hospital_id`, `master_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of basic_checklist_entries
-- ----------------------------
INSERT INTO `basic_checklist_entries` VALUES (1, 1, 1, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:38:52');
INSERT INTO `basic_checklist_entries` VALUES (2, 1, 2, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:38:37');
INSERT INTO `basic_checklist_entries` VALUES (3, 1, 3, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:38:40');
INSERT INTO `basic_checklist_entries` VALUES (4, 1, 4, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:27');
INSERT INTO `basic_checklist_entries` VALUES (5, 1, 5, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:29');
INSERT INTO `basic_checklist_entries` VALUES (6, 1, 6, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:31');
INSERT INTO `basic_checklist_entries` VALUES (7, 1, 7, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:33');
INSERT INTO `basic_checklist_entries` VALUES (8, 1, 8, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:34');
INSERT INTO `basic_checklist_entries` VALUES (9, 1, 9, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:35');
INSERT INTO `basic_checklist_entries` VALUES (10, 1, 10, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:37');
INSERT INTO `basic_checklist_entries` VALUES (11, 1, 11, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:39');
INSERT INTO `basic_checklist_entries` VALUES (12, 1, 12, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:40');
INSERT INTO `basic_checklist_entries` VALUES (13, 1, 13, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:41');
INSERT INTO `basic_checklist_entries` VALUES (14, 1, 14, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:43');
INSERT INTO `basic_checklist_entries` VALUES (15, 1, 15, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:45');
INSERT INTO `basic_checklist_entries` VALUES (16, 1, 16, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:49');
INSERT INTO `basic_checklist_entries` VALUES (17, 1, 17, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:50');
INSERT INTO `basic_checklist_entries` VALUES (18, 1, 18, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:52');
INSERT INTO `basic_checklist_entries` VALUES (19, 1, 19, 'done', '', '2026-03-15 20:37:51', '2026-03-15 21:06:44');
INSERT INTO `basic_checklist_entries` VALUES (20, 1, 20, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:56');
INSERT INTO `basic_checklist_entries` VALUES (21, 1, 21, 'done', '', '2026-03-15 20:37:51', '2026-03-15 20:47:47');

-- ----------------------------
-- Table structure for basic_checklist_master
-- ----------------------------
DROP TABLE IF EXISTS `basic_checklist_master`;
CREATE TABLE `basic_checklist_master`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `item_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of basic_checklist_master
-- ----------------------------
INSERT INTO `basic_checklist_master` VALUES (1, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลแผนก', 'acc_department', 1, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (11, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทอนุมัติ', '', 11, '2026-03-15 20:24:06');
INSERT INTO `basic_checklist_master` VALUES (2, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทสินค้า', '', 2, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (12, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลเจ้าหน้าที่อนุมัติ', '', 12, '2026-03-15 20:24:19');
INSERT INTO `basic_checklist_master` VALUES (3, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทการชำระเงิน', '', 3, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (4, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลผัง GF', '', 4, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (5, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลผัง GL', '', 5, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (15, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทรายการสินค้า', '', 15, '2026-03-15 20:25:07');
INSERT INTO `basic_checklist_master` VALUES (6, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทงบ', '', 6, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (14, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลสมุดบัญชีธนาคาร ', '', 14, '2026-03-15 20:24:44');
INSERT INTO `basic_checklist_master` VALUES (7, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลชื่องบประมาณ', '', 7, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (8, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทการซื้อ', '', 8, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (9, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลประเภทผู้ลงนามเอกสาร', '', 9, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (13, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลธนาคาร', '', 13, '2026-03-15 20:24:31');
INSERT INTO `basic_checklist_master` VALUES (10, 'ระบบเจ้าหนี้ (AP)', 'ข้อมูลผู้ลงนามเอกสาร', '', 10, '2026-03-15 19:53:04');
INSERT INTO `basic_checklist_master` VALUES (16, 'ระบบลูกหนี้ (AR)', 'กลุ่มบริหารลูกหนี้', '', 16, '2026-03-15 20:25:24');
INSERT INTO `basic_checklist_master` VALUES (17, 'ระบบลูกหนี้ (AR)', 'ประเภทกองทุน สปสช.', '', 17, '2026-03-15 20:25:38');
INSERT INTO `basic_checklist_master` VALUES (18, 'ระบบรายได้', 'ข้อมูลเชื่อมต่อผังบัญชี', '', 18, '2026-03-15 20:26:06');
INSERT INTO `basic_checklist_master` VALUES (19, 'ระบบสินทรัพย์', 'ประเภททรัพย์สิน', '', 19, '2026-03-15 20:26:23');
INSERT INTO `basic_checklist_master` VALUES (20, 'ระบบผู้ดูแลระบบ', 'ตั้งค่าระบบบัญชี', '', 20, '2026-03-15 20:27:03');
INSERT INTO `basic_checklist_master` VALUES (21, 'ระบบเจ้าหนี้ (AP)', 'ทะเบียนผู้จำหน่าย', '', 21, '2026-03-15 20:27:56');
INSERT INTO `basic_checklist_master` VALUES (23, 'ระบบการเงิน', 'เล่มใบเสร็จ', '', 22, '2026-03-15 23:15:34');

-- ----------------------------
-- Table structure for checklist_items
-- ----------------------------
DROP TABLE IF EXISTS `checklist_items`;
CREATE TABLE `checklist_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('basic','form','report','advance') CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `hospital_id` int NOT NULL,
  `item_id` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `checked` tinyint(1) NULL DEFAULT 0,
  `note` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `item_date` date NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_checklist`(`type`, `hospital_id`, `item_id`) USING BTREE,
  INDEX `hospital_id`(`hospital_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of checklist_items
-- ----------------------------
INSERT INTO `checklist_items` VALUES (1, 'basic', 13, 'b1', 0, '', '2026-03-15', '2026-03-15 17:38:31');
INSERT INTO `checklist_items` VALUES (2, 'basic', 13, 'b2', 0, '', '2026-03-15', '2026-03-15 17:38:30');
INSERT INTO `checklist_items` VALUES (3, 'basic', 2, 'b1', 1, '', '2026-03-15', '2026-03-15 19:37:50');
INSERT INTO `checklist_items` VALUES (4, 'basic', 2, 'b2', 1, '', '2026-03-15', '2026-03-15 19:37:58');
INSERT INTO `checklist_items` VALUES (5, 'basic', 2, 'b3', 1, '', '2026-03-15', '2026-03-15 19:37:59');
INSERT INTO `checklist_items` VALUES (6, 'basic', 2, 'b4', 1, '', '2026-03-15', '2026-03-15 19:38:00');
INSERT INTO `checklist_items` VALUES (7, 'basic', 2, 'b5', 1, '', '2026-03-15', '2026-03-15 19:38:01');

-- ----------------------------
-- Table structure for form_checklist_entries
-- ----------------------------
DROP TABLE IF EXISTS `form_checklist_entries`;
CREATE TABLE `form_checklist_entries`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NOT NULL,
  `master_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'waiting_form',
  `assigned_to` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_form_hosp_master`(`hospital_id`, `master_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of form_checklist_entries
-- ----------------------------
INSERT INTO `form_checklist_entries` VALUES (1, 1, 1, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 22:31:15');
INSERT INTO `form_checklist_entries` VALUES (2, 1, 2, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 22:31:17');
INSERT INTO `form_checklist_entries` VALUES (3, 1, 3, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 22:31:19');
INSERT INTO `form_checklist_entries` VALUES (4, 1, 4, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 23:04:44');
INSERT INTO `form_checklist_entries` VALUES (5, 1, 5, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 23:04:46');
INSERT INTO `form_checklist_entries` VALUES (6, 1, 6, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 23:04:48');
INSERT INTO `form_checklist_entries` VALUES (7, 1, 7, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 22:56:05');
INSERT INTO `form_checklist_entries` VALUES (8, 1, 8, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 22:30:41', '2026-03-15 22:56:06');

-- ----------------------------
-- Table structure for form_checklist_master
-- ----------------------------
DROP TABLE IF EXISTS `form_checklist_master`;
CREATE TABLE `form_checklist_master`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `form_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `print_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `paper_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A4',
  `parameter` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `condition_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of form_checklist_master
-- ----------------------------
INSERT INTO `form_checklist_master` VALUES (1, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ACC-JOURNAL-1', 'ใบสำคัญการลงบัญชีด้านทั่วไป', 'A4', '', 1, '2026-03-15 21:42:37', NULL);
INSERT INTO `form_checklist_master` VALUES (2, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ACC-JOURNAL-2', 'ใบสำคัญการลงบัญชีด้้านทั่วไป(ซื้อ)', 'A4', '', 2, '2026-03-15 21:42:55', NULL);
INSERT INTO `form_checklist_master` VALUES (3, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ACC-JOURNAL-3', 'ใบสำคัญการลงบัญชีด้านรับ', 'A4', '', 3, '2026-03-15 21:43:10', NULL);
INSERT INTO `form_checklist_master` VALUES (4, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ACC-JOURNAL-4', 'ใบสำคัญการลงบัญชีด้านจ่าย', 'A4', '', 4, '2026-03-15 21:43:27', 'กรณีมีภาษีหัก ณ ที่จ่ายเมื่อพิมพ์เอกสารไม่ต้องแสดงขอให้ยุบยอดรวมในเครดิต');
INSERT INTO `form_checklist_master` VALUES (5, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ACC-JOURNAL-6', 'ใบสำคัญการลงบัญชีทั่วไป', 'A4', '', 5, '2026-03-15 21:43:44', NULL);
INSERT INTO `form_checklist_master` VALUES (6, 'ระบบเจ้าหนี้ (AP)', 'XE-FORM-ใบรับรองหักภาษีณที่จ่าย', 'ใบรับรองหักภาษีณที่จ่าย', 'A4', '', 6, '2026-03-15 21:44:01', NULL);
INSERT INTO `form_checklist_master` VALUES (7, 'ระบบการเงิน', 'XE-FORM-บันทึกข้อความขออนุมัติจ่ายเงิน1', 'บันทึกข้อความขออนุมัติจ่ายเงิน', 'A4', '', 7, '2026-03-15 21:44:51', NULL);
INSERT INTO `form_checklist_master` VALUES (8, 'ระบบรายได้', 'XE-FORM-ใบส่งเงินนำมาชำระ', 'ใบส่งเงินนำมาชำระ', 'A4', '', 8, '2026-03-15 21:45:10', NULL);

-- ----------------------------
-- Table structure for hospitals
-- ----------------------------
DROP TABLE IF EXISTS `hospitals`;
CREATE TABLE `hospitals`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `code` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `type` varchar(20) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `province` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `region` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `affiliation` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `address` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `bed_count` int NULL DEFAULT 0,
  `coordinator` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `coordinator_phone` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `coordinator_email` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `it_contact` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `it_phone` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `note` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of hospitals
-- ----------------------------
INSERT INTO `hospitals` VALUES (1, 'โรงพยาบาลน่าน', '10716', 'A', 'น่าน', 'ภาคเหนือ', '', '', 800, '', '', '', '', '', '', '2026-03-15 13:11:03');
INSERT INTO `hospitals` VALUES (2, 'โรงพยาบาลแม่จริม', '11173', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:11:49');
INSERT INTO `hospitals` VALUES (3, 'โรงพยาบาลบ้านหลวง', '11174', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:12:31');
INSERT INTO `hospitals` VALUES (4, 'โรงพยาบาลนาน้อย', '11175', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:12:48');
INSERT INTO `hospitals` VALUES (5, 'โรงพยาบาลท่าวังผา', '11176', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:13:06');
INSERT INTO `hospitals` VALUES (6, 'โรงพยาบาลเวียงสา', '11177', 'F', 'น่าน', 'ภาคเหนือ', '', '', 90, '', '', '', '', '', '', '2026-03-15 13:13:22');
INSERT INTO `hospitals` VALUES (7, 'โรงพยาบาลทุ่งช้าง', '11178', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:13:37');
INSERT INTO `hospitals` VALUES (8, 'โรงพยาบาลเชียงกลาง', '11179', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:14:16');
INSERT INTO `hospitals` VALUES (9, 'โรงพยาบาลนาหมื่น', '11180', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:14:59');
INSERT INTO `hospitals` VALUES (10, 'โรงพยาบาลสันติสุข', '11181', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:15:20');
INSERT INTO `hospitals` VALUES (11, 'โรงพยาบาลบ่อเกลือ', '11182', 'F', 'น่าน', '', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:15:36');
INSERT INTO `hospitals` VALUES (12, 'โรงพยาบาลสองแคว', '11183', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:15:53');
INSERT INTO `hospitals` VALUES (13, 'โรงพยาบาลสมเด็จพระยุพราชปัว', '11453', 'F', 'น่าน', '', '', '', 120, '', '', '', '', '', '', '2026-03-15 13:16:16');
INSERT INTO `hospitals` VALUES (14, 'โรงพยาบาลเฉลิมพระเกียรติ', '11625', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:16:33');
INSERT INTO `hospitals` VALUES (15, 'โรงพยาบาลภูเพียง', '25017', 'F', 'น่าน', 'ภาคเหนือ', '', '', 30, '', '', '', '', '', '', '2026-03-15 13:52:39');
INSERT INTO `hospitals` VALUES (16, 'บริษัทบางกอกเมดิคอลซอฟต์แวร์จำกัด', '', 'OTHER', 'กทม.', 'ภาคกลาง', '', '', NULL, '', '', '', '', '', '', '2026-03-15 15:44:35');

-- ----------------------------
-- Table structure for masterplan_items
-- ----------------------------
DROP TABLE IF EXISTS `masterplan_items`;
CREATE TABLE `masterplan_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NOT NULL,
  `topic_title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `start_date` date NULL DEFAULT NULL,
  `end_date` date NULL DEFAULT NULL,
  `start_time` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `end_time` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `task_detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `responsible` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `hospital_responsible` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `preparation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of masterplan_items
-- ----------------------------
INSERT INTO `masterplan_items` VALUES (43, 1, 'ประชุมผ่าน Zoom กับโรงพยาบาลน่าน เพื่อชี้แจ้งแผนปฏิบัติงานของทีม', '2026-02-02', '2026-02-02', '09:00', '12:00', 'ประชุมชี้แจง', 'เด่นนภา มีบุญ, พิจิตรา ไตรสุธา, วิลาวัลย์ ฟักแก้ว, สิทธิชาติ วงศ์ยุทธนาพงศ์, อภิสรา แก้วกองนอก, อัครเดช ดุลย์แสง', 'ไอที+งานบัญชี', '', 'done', 0, '2026-03-19 01:26:51', '2026-03-19 01:26:51');
INSERT INTO `masterplan_items` VALUES (44, 1, 'ประสานไอทีโรงพยาบาลน่านให้จัดเตรียมเครื่อง server สำหรับจัดทำฐานข้อมูลบัญชี', '2026-02-09', '2026-02-12', '', '', '', '', '', '', 'done', 1, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (45, 1, 'ติดตามและจัดทำข้อมูลพื้นฐานสำหรับใช้งานระบบ BMS-Accounting', '2026-02-09', '2026-02-12', '', '', '', '', '', '', 'done', 2, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (46, 1, 'จัดทำและปรับแก้ไขแบบฟอร์มที่ใช้งานในระบบเพิ่มเติม', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 3, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (47, 1, 'จัดเตรียมฐานข้อมูลสำหรับใช้งานระบบ BMS-Accounting ฐานจริง และอบรม', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 4, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (48, 1, 'สำรวจหน้างานโรงพยาบาลน่านแผนกบัญชี (เจ้าหนี้) - การเงิน เพื่อสอบถามกระบวนการ', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 5, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (49, 1, 'ประสานงานกับกลุ่มงานแผนกบัญชีเพื่อชี้แจงการขอข้อมูลพื้นฐาน', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 6, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (50, 1, 'ติดตั้งโปรแกรมบัญชี ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีเจ้าหนี้)', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 7, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (51, 1, 'ตรวจสอบข้อมูลพื้นฐานและแบบฟอร์มเตรียมความพร้อมก่อนใช้งาน', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 8, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (52, 1, 'ประชุมนำเสนอความสามารถของระบบ BMS-Accounting  และสรุปกระบวนการใช้งานโปรแกรม', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 9, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (53, 1, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของเจ้าหนี้', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 10, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (54, 1, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของลูกหนี้', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 11, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (55, 1, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของรายได้', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 12, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (56, 1, 'Stand by ดูแลการใช้งาน ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีเจ้าหนี้)', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 13, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (57, 1, 'สรุปปัญหาการใช้งาน ประจำวัน', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 14, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (58, 1, 'สำรวจหน้างานจัดเก็บ + บัญชี (ลูกหนี้)', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 15, '2026-03-19 01:26:51', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (59, 1, 'จัดทำข้อมูลพื้นฐานบัญชี (ลูกหนี้)', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 16, '2026-03-19 01:26:52', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (60, 1, 'ประชุมสรุปปัญหาการใช้งาน ร่วมกับทีมเจ้าหน้าที่โรงพยบาลและผู้ดูแลระบบ ครั้งที่ 1', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'done', 17, '2026-03-19 01:26:52', '2026-03-19 01:27:58');
INSERT INTO `masterplan_items` VALUES (61, 1, 'ประชุมสรุปปัญหาการใช้งาน ร่วมกับทีมเจ้าหน้าที่โรงพยบาลและผู้ดูแลระบบ ครั้งที่ 2', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'in_progress', 18, '2026-03-19 01:26:52', '2026-03-19 01:34:11');
INSERT INTO `masterplan_items` VALUES (62, 1, 'Stand by ดูแลการใช้งาน ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีลูกหนี้)', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'in_progress', 19, '2026-03-19 01:26:52', '2026-03-19 01:34:11');
INSERT INTO `masterplan_items` VALUES (63, 1, 'ประชุมสรุปปัญหาการเพื่อส่งต่องานกับผู้ดูแลระบบ', '2026-02-15', '2026-03-05', '', '', '', '', '', '', 'in_progress', 20, '2026-03-19 01:26:52', '2026-03-19 01:34:11');

-- ----------------------------
-- Table structure for masterplan_topics
-- ----------------------------
DROP TABLE IF EXISTS `masterplan_topics`;
CREATE TABLE `masterplan_topics`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of masterplan_topics
-- ----------------------------
INSERT INTO `masterplan_topics` VALUES (1, 'ประชุมผ่าน Zoom กับโรงพยาบาลน่าน เพื่อชี้แจ้งแผนปฏิบัติงานของทีม', 0, '2026-03-18 19:12:26');
INSERT INTO `masterplan_topics` VALUES (2, 'ประสานไอทีโรงพยาบาลน่านให้จัดเตรียมเครื่อง server สำหรับจัดทำฐานข้อมูลบัญชี', 1, '2026-03-18 19:12:34');
INSERT INTO `masterplan_topics` VALUES (3, 'ติดตามและจัดทำข้อมูลพื้นฐานสำหรับใช้งานระบบ BMS-Accounting', 2, '2026-03-18 19:12:41');
INSERT INTO `masterplan_topics` VALUES (4, 'จัดทำและปรับแก้ไขแบบฟอร์มที่ใช้งานในระบบเพิ่มเติม', 3, '2026-03-18 19:13:00');
INSERT INTO `masterplan_topics` VALUES (5, 'จัดเตรียมฐานข้อมูลสำหรับใช้งานระบบ BMS-Accounting ฐานจริง และอบรม', 4, '2026-03-18 19:13:14');
INSERT INTO `masterplan_topics` VALUES (6, 'สำรวจหน้างานโรงพยาบาลน่านแผนกบัญชี (เจ้าหนี้) - การเงิน เพื่อสอบถามกระบวนการ', 5, '2026-03-18 19:13:24');
INSERT INTO `masterplan_topics` VALUES (7, 'ประสานงานกับกลุ่มงานแผนกบัญชีเพื่อชี้แจงการขอข้อมูลพื้นฐาน', 6, '2026-03-18 19:13:30');
INSERT INTO `masterplan_topics` VALUES (8, 'ติดตั้งโปรแกรมบัญชี ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีเจ้าหนี้)', 7, '2026-03-18 19:13:40');
INSERT INTO `masterplan_topics` VALUES (9, 'ตรวจสอบข้อมูลพื้นฐานและแบบฟอร์มเตรียมความพร้อมก่อนใช้งาน', 8, '2026-03-18 19:13:47');
INSERT INTO `masterplan_topics` VALUES (10, 'ประชุมนำเสนอความสามารถของระบบ BMS-Accounting  และสรุปกระบวนการใช้งานโปรแกรม', 9, '2026-03-18 19:13:54');
INSERT INTO `masterplan_topics` VALUES (11, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของเจ้าหนี้', 10, '2026-03-18 19:14:02');
INSERT INTO `masterplan_topics` VALUES (12, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของลูกหนี้', 0, '2026-03-18 19:14:11');
INSERT INTO `masterplan_topics` VALUES (13, 'อบรมการใช้งาน - ระบบบัญชีในส่วนของรายได้', 12, '2026-03-18 19:14:21');
INSERT INTO `masterplan_topics` VALUES (14, 'Stand by ดูแลการใช้งาน ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีเจ้าหนี้)', 13, '2026-03-18 19:14:30');
INSERT INTO `masterplan_topics` VALUES (15, 'สรุปปัญหาการใช้งาน ประจำวัน', 14, '2026-03-18 19:14:36');
INSERT INTO `masterplan_topics` VALUES (16, 'สำรวจหน้างานจัดเก็บ + บัญชี (ลูกหนี้)', 15, '2026-03-18 19:14:44');
INSERT INTO `masterplan_topics` VALUES (17, 'จัดทำข้อมูลพื้นฐานบัญชี (ลูกหนี้)', 16, '2026-03-18 19:14:51');
INSERT INTO `masterplan_topics` VALUES (18, 'ประชุมสรุปปัญหาการใช้งาน ร่วมกับทีมเจ้าหน้าที่โรงพยบาลและผู้ดูแลระบบ ครั้งที่ 1', 17, '2026-03-18 19:15:35');
INSERT INTO `masterplan_topics` VALUES (19, 'ประชุมสรุปปัญหาการใช้งาน ร่วมกับทีมเจ้าหน้าที่โรงพยบาลและผู้ดูแลระบบ ครั้งที่ 2', 18, '2026-03-18 19:15:40');
INSERT INTO `masterplan_topics` VALUES (20, 'Stand by ดูแลการใช้งาน ณ หน่วยบริการ (ส่วนงานการเงิน,บัญชีลูกหนี้)', 19, '2026-03-18 19:15:49');
INSERT INTO `masterplan_topics` VALUES (21, 'ประชุมสรุปปัญหาการเพื่อส่งต่องานกับผู้ดูแลระบบ', 20, '2026-03-18 19:16:20');

-- ----------------------------
-- Table structure for project_plan_team
-- ----------------------------
DROP TABLE IF EXISTS `project_plan_team`;
CREATE TABLE `project_plan_team`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NOT NULL,
  `member_id` int NULL DEFAULT NULL,
  `member_name` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `role` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `plan_id`(`plan_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 86 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of project_plan_team
-- ----------------------------
INSERT INTO `project_plan_team` VALUES (85, 1, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (80, 1, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (81, 1, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (82, 1, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (83, 1, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (84, 1, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (7, 2, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (8, 2, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (9, 2, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (10, 3, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (11, 3, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (12, 3, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (19, 4, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (20, 4, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (21, 4, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (68, 5, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (67, 5, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (25, 6, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (26, 6, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (27, 6, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (38, 7, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (37, 7, 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า');
INSERT INTO `project_plan_team` VALUES (66, 8, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (65, 8, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (64, 8, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (34, 9, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (35, 9, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (36, 9, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (39, 7, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (40, 10, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (41, 10, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (42, 10, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (43, 11, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (44, 11, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (45, 11, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (46, 12, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (47, 12, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (48, 12, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (49, 13, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (50, 13, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (51, 13, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (52, 14, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (53, 14, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (54, 14, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (55, 15, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (56, 15, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (57, 15, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');
INSERT INTO `project_plan_team` VALUES (69, 5, 5, 'พิจิตรา ไตรสุธา', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (70, 16, 2, 'เด่นนภา มีบุญ', 'ผู้จัดการโครงการติดตั้งระบบบัญชี');
INSERT INTO `project_plan_team` VALUES (71, 16, 4, 'วิลาวัลย์ ฟักแก้ว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (72, 16, 3, 'อภิสรา แก้วกองนอก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบงานบัญชี');
INSERT INTO `project_plan_team` VALUES (73, 16, 6, 'อัครเดช ดุลย์แสง', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)');

-- ----------------------------
-- Table structure for project_plans
-- ----------------------------
DROP TABLE IF EXISTS `project_plans`;
CREATE TABLE `project_plans`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_name` varchar(500) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `hospital_id` int NULL DEFAULT NULL,
  `site_owner` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `install_type` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `budget` decimal(15, 2) NULL DEFAULT NULL,
  `online_start` date NULL DEFAULT NULL,
  `online_end` date NULL DEFAULT NULL,
  `start_date` date NULL DEFAULT NULL,
  `end_date` date NULL DEFAULT NULL,
  `revisit1` date NULL DEFAULT NULL,
  `revisit2` date NULL DEFAULT NULL,
  `status` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'waiting',
  `note` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `hospital_id`(`hospital_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of project_plans
-- ----------------------------
INSERT INTO `project_plans` VALUES (1, 'ติดตั้งระบบบัญชีเจ้าหนี้', 1, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', NULL, '2026-02-09', '2026-02-12', '2026-02-15', '2026-03-05', NULL, NULL, 'deliver', '', '2026-03-15 13:20:54');
INSERT INTO `project_plans` VALUES (2, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 13, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 979200.00, '2026-06-01', '2026-06-05', '2026-06-08', '2026-06-19', NULL, NULL, 'waiting', '', '2026-03-15 13:24:36');
INSERT INTO `project_plans` VALUES (3, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 14, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 504000.00, '2026-07-20', '2026-07-24', '2026-07-27', '2026-08-07', NULL, NULL, 'waiting', '', '2026-03-15 13:26:59');
INSERT INTO `project_plans` VALUES (4, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 10, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 504000.00, '2026-08-10', '2026-08-14', '2026-08-17', '2026-08-28', NULL, NULL, 'waiting', '', '2026-03-15 13:28:44');
INSERT INTO `project_plans` VALUES (5, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 8, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 504000.00, '2026-10-19', '2026-10-23', '2026-10-26', '2026-11-06', NULL, NULL, 'waiting', '', '2026-03-15 13:52:09');
INSERT INTO `project_plans` VALUES (6, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 15, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 504000.00, '2026-09-14', '2026-09-18', '2026-09-21', '2026-10-02', NULL, NULL, 'waiting', '', '2026-03-15 13:54:00');
INSERT INTO `project_plans` VALUES (7, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 9, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'ติดตั้งระบบ', 504000.00, '2026-12-07', '2026-12-11', '2026-12-14', '2026-12-25', NULL, NULL, 'waiting', '', '2026-03-15 13:55:39');
INSERT INTO `project_plans` VALUES (8, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 11, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-05-25', '2026-05-29', '2026-06-01', '2026-06-12', NULL, NULL, 'waiting', '', '2026-03-15 13:57:13');
INSERT INTO `project_plans` VALUES (9, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 5, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-06-15', '2026-06-19', '2026-06-22', '2026-07-03', NULL, NULL, 'waiting', '', '2026-03-15 13:59:19');
INSERT INTO `project_plans` VALUES (10, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 12, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-07-13', '2026-07-17', '2026-07-20', '2026-07-31', NULL, NULL, 'waiting', '', '2026-03-15 14:01:09');
INSERT INTO `project_plans` VALUES (11, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 7, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-08-03', '2026-08-07', '2026-08-10', '2026-08-21', NULL, NULL, 'waiting', '', '2026-03-15 14:03:40');
INSERT INTO `project_plans` VALUES (12, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 2, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-08-17', '2026-08-21', '2026-08-24', '2026-09-04', NULL, NULL, 'waiting', '', '2026-03-15 14:05:00');
INSERT INTO `project_plans` VALUES (13, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 6, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 957600.00, '2026-10-12', '2026-10-16', '2026-10-19', '2026-10-30', NULL, NULL, 'waiting', '', '2026-03-15 14:07:12');
INSERT INTO `project_plans` VALUES (14, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 3, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-11-09', '2026-11-13', '2026-11-16', '2026-11-27', NULL, NULL, 'waiting', '', '2026-03-15 14:29:33');
INSERT INTO `project_plans` VALUES (15, 'ติดตั้งระบบบัญชีเจ้าหนี้-ลูกหนี้', 4, 'เด่นนภา มีบุญ', 'ติดตั้งระบบ', 504000.00, '2026-11-30', '2026-12-04', '2026-12-07', '2026-12-18', NULL, NULL, 'waiting', '', '2026-03-15 14:39:08');
INSERT INTO `project_plans` VALUES (16, 'ปฏิบัติงาน office', 16, 'เด่นนภา มีบุญ', 'เข้า Office', NULL, '2026-03-09', '2026-04-18', '2026-03-09', '2026-04-18', NULL, NULL, 'closed', '', '2026-03-15 15:45:43');

-- ----------------------------
-- Table structure for report_checklist_entries
-- ----------------------------
DROP TABLE IF EXISTS `report_checklist_entries`;
CREATE TABLE `report_checklist_entries`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NOT NULL,
  `master_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'waiting_form',
  `assigned_to` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_report_hosp_master`(`hospital_id`, `master_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of report_checklist_entries
-- ----------------------------
INSERT INTO `report_checklist_entries` VALUES (1, 1, 1, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 23:48:47', '2026-03-15 23:49:11');
INSERT INTO `report_checklist_entries` VALUES (2, 1, 2, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 23:48:47', '2026-03-15 23:49:13');
INSERT INTO `report_checklist_entries` VALUES (3, 1, 3, 'done', 'อัครเดช ดุลย์แสง', '', '2026-03-15 23:48:47', '2026-03-16 21:45:41');

-- ----------------------------
-- Table structure for report_checklist_master
-- ----------------------------
DROP TABLE IF EXISTS `report_checklist_master`;
CREATE TABLE `report_checklist_master`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `report_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `print_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `paper_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A4',
  `parameter` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `condition_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of report_checklist_master
-- ----------------------------
INSERT INTO `report_checklist_master` VALUES (1, 'ระบบบัญชี', 'CUSTOM-ACC-งบทดลอง', 'CUSTOM-ACC-งบทดลอง', 'A4', '', '', 1, '2026-03-15 23:48:03');
INSERT INTO `report_checklist_master` VALUES (2, 'ระบบบัญชี', 'CUSTOM-ACC-งบดุล', 'CUSTOM-ACC-งบดุล', 'A4', '', '', 2, '2026-03-15 23:48:19');
INSERT INTO `report_checklist_master` VALUES (3, 'ระบบบัญชี', 'CUSTOM-ACC-งบกำไรขาดทุน', 'CUSTOM-ACC-งบกำไรขาดทุน', 'A4', '', '', 3, '2026-03-15 23:48:33');

-- ----------------------------
-- Table structure for system_issues
-- ----------------------------
DROP TABLE IF EXISTS `system_issues`;
CREATE TABLE `system_issues`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NULL DEFAULT NULL,
  `report_date` date NULL DEFAULT NULL,
  `resolved_date` date NULL DEFAULT NULL,
  `category` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `priority` enum('low','medium','high','critical') CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'medium',
  `status` enum('open','inprogress','testing','closed') CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'open',
  `resolution` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `reported_by` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `system_name` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `hospital_id`(`hospital_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 6 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_issues
-- ----------------------------
INSERT INTO `system_issues` VALUES (1, 1, '2026-02-16', '2026-02-16', 'ข้อมูล Migration', 'ทดสอบบันทึกปัญหา', 'low', 'open', 'ปรับแก้ไขดึงจากช่วงวันที่อนุมัติจ่ายเรียบร้อยแล้ว', 'อภิรา', '2026-03-15 16:16:42', NULL);
INSERT INTO `system_issues` VALUES (2, 1, '2026-02-23', '2026-02-23', 'การพิมพ์รายงาน', 'พิมพ์รายงานการจ่ายแล้วข้อมูลแสดงไม่ถุกต้อง', 'medium', 'inprogress', '', 'เด่นนภา มีบุญ', '2026-03-15 16:17:55', 'ระบบเจ้าหนี้ (AP)');
INSERT INTO `system_issues` VALUES (5, 1, '2026-03-16', '2026-03-16', 'แบบฟอร์ม', 'ไม่มีแบบฟอร์มขออนุมัติจ่าย', 'medium', 'open', '', 'วิลาวัลย์ ฟักแก้ว', '2026-03-15 19:28:47', 'ระบบการเงิน');

-- ----------------------------
-- Table structure for team_members
-- ----------------------------
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE `team_members`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `nickname` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `position` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of team_members
-- ----------------------------
INSERT INTO `team_members` VALUES (15, 'อัครเดช ดุลย์แสง', 'แม็ก', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบและดูแลหลังการขาย(Report)', '2026-03-15 19:27:24');
INSERT INTO `team_members` VALUES (10, 'สิทธิชาติ วงศ์ยุทธนาพงศ์', 'เอี๋ยม', 'ผู้จัดการโครงการติดตั้งระบบคลังสินค้า', '2026-03-15 19:24:57');
INSERT INTO `team_members` VALUES (11, 'เด่นนภา มีบุญ', 'ไก่', 'ผู้จัดการโครงการติดตั้งระบบบัญชี', '2026-03-15 19:25:14');
INSERT INTO `team_members` VALUES (12, 'อภิสรา แก้วกองนอก', 'เจี๊ยบ', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบบัญชี', '2026-03-15 19:25:48');
INSERT INTO `team_members` VALUES (13, 'พิจิตรา ไตรสุธา', 'เตย', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบบัญชี', '2026-03-15 19:26:20');
INSERT INTO `team_members` VALUES (14, 'วิลาวัลย์ ฟักแก้ว', 'วิว', 'เจ้าหน้าที่ปฏิบัติการติดตั้งระบบบัญชี', '2026-03-15 19:27:01');

-- ----------------------------
-- Table structure for training_issues
-- ----------------------------
DROP TABLE IF EXISTS `training_issues`;
CREATE TABLE `training_issues`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NULL DEFAULT NULL,
  `date` date NULL DEFAULT NULL,
  `category` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `severity` enum('low','medium','high') CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'medium',
  `status` enum('open','inprogress','closed') CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT 'open',
  `resolution` text CHARACTER SET tis620 COLLATE tis620_thai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_date` date NULL DEFAULT NULL,
  `reported_by` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `system_name` varchar(200) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `hospital_id`(`hospital_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 13 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of training_issues
-- ----------------------------
INSERT INTO `training_issues` VALUES (6, 1, '2026-03-09', 'ข้อมูลพื้นฐาน', 'ข้อมูลประเภทสินค้าไม่ครบ', 'medium', 'open', '', '2026-03-15 19:28:14', '2026-03-09', 'เด่นนภา มีบุญ', 'ระบบเจ้าหนี้ (AP)');
INSERT INTO `training_issues` VALUES (7, 1, '2026-02-17', 'ข้อมูลพื้นฐาน', 'ขอเพิ่มข้อมูลประเภทงบประมาณ', 'medium', 'inprogress', '', '2026-03-15 22:46:41', '2026-02-17', 'วิลาวัลย์ ฟักแก้ว', NULL);
INSERT INTO `training_issues` VALUES (8, 1, '2026-03-16', 'รายงาน', 'งานการเงินแจ้งว่าเมื่อดึงรายงานการจ่ายแล้วข้อมูลไม่ถูกต้อง', 'medium', 'inprogress', '', '2026-03-16 21:05:37', '2026-03-16', 'เด่นนภา มีบุญ', 'ระบบเจ้าหนี้ (AP)');
INSERT INTO `training_issues` VALUES (9, 1, '2026-03-09', 'การใช้งานระบบ', 'งานพัสดุไม่คีย์เลข GFINS ทำให้บัญชีไม่สามารถเทียบข้อมูลเลข GF ในระบบได้', 'medium', 'open', 'แนะนำให้พัสดุบันทึกข้อมูลให้ครบถ้วน', '2026-03-16 22:09:13', '2026-03-09', 'อภิสรา แก้วกองนอก', 'ระบบเจ้าหนี้ (AP)');
INSERT INTO `training_issues` VALUES (10, 1, '2026-03-11', 'การใช้งานระบบ', 'งานคลังไม่บันทึกแผนงบประมาณในระบบ inv ทำให้ไม่ทราบข้อมูลแผนการจัดซื้อ เพื่อนำมาพิจารณาในการอนุมัติ PO', 'high', 'inprogress', 'แนะนำให้ทุกคลังทำแผนจัดซื้อในแต่ละปีงบประมาณ', '2026-03-16 22:10:27', '2026-03-11', 'อภิสรา แก้วกองนอก', 'ระบบเจ้าหนี้ (AP)');
INSERT INTO `training_issues` VALUES (11, 1, '2026-03-18', 'แบบฟอร์ม', 'เมื่อรับรู้รายได้แล้วไม่สามารถบันทึกออกใบเสร็จรับเงินได้', 'medium', 'open', '', '2026-03-16 22:11:18', '2026-03-18', 'พิจิตรา ไตรสุธา', 'ระบบรายได้');
INSERT INTO `training_issues` VALUES (12, 1, '2026-03-12', 'แบบฟอร์ม', 'เมื่อบันทึกรับโอนแล้วไม่มีหน้าจออกใบเสร็จรับเงินเพื่อออกใบเสร็จให้กับ กองทุน', 'high', 'open', '', '2026-03-16 22:12:15', '2026-03-12', 'พิจิตรา ไตรสุธา', 'ระบบลูกหนี้ (AR)');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `name` varchar(255) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'vespazeza', '64120482', 'เด่นนภา เจ้าหน้าที่BMS', '2026-03-15 13:05:57');

SET FOREIGN_KEY_CHECKS = 1;
