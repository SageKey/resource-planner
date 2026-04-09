BEGIN TRANSACTION;
CREATE TABLE app_settings (
    key             TEXT PRIMARY KEY,
    category        TEXT NOT NULL,
    value           TEXT NOT NULL,
    value_type      TEXT NOT NULL,
    label           TEXT NOT NULL,
    description     TEXT,
    min_value       REAL,
    max_value       REAL,
    unit            TEXT,
    sort_order      INTEGER DEFAULT 0,
    updated_at      TEXT DEFAULT (datetime('now')),
    updated_by      TEXT
);
INSERT INTO "app_settings" VALUES('util_under_enabled','utilization','1','bool','Under-utilized state','When enabled, roles below the threshold are flagged as under-utilized.',NULL,NULL,NULL,10,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_under_max','utilization','0.70','float','Under -> Ideal boundary','Default 70%.',0.0,1.5,'%',20,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_ideal_enabled','utilization','1','bool','Ideal state',NULL,NULL,NULL,NULL,30,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_ideal_max','utilization','0.80','float','Ideal -> Stretched boundary','Default 80%.',0.0,1.5,'%',40,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_stretched_enabled','utilization','1','bool','Stretched state',NULL,NULL,NULL,NULL,50,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_stretched_max','utilization','1.00','float','Stretched -> Over boundary','Default 100%.',0.0,2.0,'%',60,'2026-04-08 14:24:01',NULL);
INSERT INTO "app_settings" VALUES('util_over_enabled','utilization','1','bool','Over-capacity state',NULL,NULL,NULL,NULL,70,'2026-04-08 14:24:01',NULL);
CREATE TABLE project_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    person_name     TEXT NOT NULL,
    role_key        TEXT NOT NULL,
    allocation_pct  REAL DEFAULT 1.0,
    UNIQUE(project_id, person_name, role_key)
);
CREATE TABLE project_role_allocations (
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_key    TEXT NOT NULL,
    allocation  REAL DEFAULT 0.0,
    PRIMARY KEY (project_id, role_key)
);
INSERT INTO "project_role_allocations" VALUES('ETE-83','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-83','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-83','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-83','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-83','infrastructure',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-83','dba',0.05);
INSERT INTO "project_role_allocations" VALUES('ETE-83','pm',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-83','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-48','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-48','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-48','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-48','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-48','infrastructure',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-48','dba',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-48','pm',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-48','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-68','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-68','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-68','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-68','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-68','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-43','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-43','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-43','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-43','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-43','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-19','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-19','functional',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-19','technical',0.65);
INSERT INTO "project_role_allocations" VALUES('ETE-19','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-19','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-19','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-49','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-49','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-49','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-49','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-49','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-49','dba',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-49','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-49','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-7','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-7','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-7','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-7','developer',0.6);
INSERT INTO "project_role_allocations" VALUES('ETE-7','infrastructure',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-7','dba',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-7','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-7','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-52','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-52','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-52','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-52','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-52','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-52','dba',0.05);
INSERT INTO "project_role_allocations" VALUES('ETE-52','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-52','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-16','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-16','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-16','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-16','developer',0.6);
INSERT INTO "project_role_allocations" VALUES('ETE-16','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-16','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-16','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-16','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-37','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-37','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-37','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-37','developer',0.65);
INSERT INTO "project_role_allocations" VALUES('ETE-37','infrastructure',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-37','dba',0.05);
INSERT INTO "project_role_allocations" VALUES('ETE-37','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-37','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-97','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-97','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-97','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-97','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-97','infrastructure',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-97','dba',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-97','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-97','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-100','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-100','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-100','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-100','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-100','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-100','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-100','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-100','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-124','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-124','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-124','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-124','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-124','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-124','dba',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-124','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-124','erp',0.0);
INSERT INTO "project_role_allocations" VALUES('ETE-33','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-33','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-33','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-33','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-33','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-33','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-67','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-67','functional',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-67','technical',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-67','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-67','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-14','ba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-14','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-14','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-14','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-14','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-14','dba',0.05);
INSERT INTO "project_role_allocations" VALUES('ETE-14','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-70','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-70','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-70','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-70','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-70','infrastructure',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-70','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-65','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-65','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-65','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-65','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-65','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-65','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-69','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-69','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-69','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-69','developer',0.6);
INSERT INTO "project_role_allocations" VALUES('ETE-69','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-69','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-31','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-31','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-31','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-31','developer',0.6);
INSERT INTO "project_role_allocations" VALUES('ETE-31','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-45','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-45','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-45','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-45','developer',0.4);
INSERT INTO "project_role_allocations" VALUES('ETE-45','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-45','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-42','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-42','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-42','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-42','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-42','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-42','dba',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-42','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-87','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-87','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-87','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-87','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-87','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-87','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-88','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-88','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-88','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-88','developer',0.4);
INSERT INTO "project_role_allocations" VALUES('ETE-88','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-73','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-73','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-73','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-73','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-73','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-10','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-10','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-10','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-10','developer',0.5);
INSERT INTO "project_role_allocations" VALUES('ETE-10','infrastructure',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-10','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-32','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-32','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-32','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-32','developer',0.75);
INSERT INTO "project_role_allocations" VALUES('ETE-32','infrastructure',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-32','pm',0.1);
INSERT INTO "project_role_allocations" VALUES('ETE-76','ba',0.15);
INSERT INTO "project_role_allocations" VALUES('ETE-76','functional',0.2);
INSERT INTO "project_role_allocations" VALUES('ETE-76','technical',0.25);
INSERT INTO "project_role_allocations" VALUES('ETE-76','developer',0.6);
INSERT INTO "project_role_allocations" VALUES('ETE-76','dba',0.05);
INSERT INTO "project_role_allocations" VALUES('ETE-76','pm',0.1);
CREATE TABLE projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT,
    portfolio       TEXT,
    sponsor         TEXT,
    health          TEXT,
    pct_complete    REAL DEFAULT 0.0,
    priority        TEXT,
    start_date      TEXT,
    end_date        TEXT,
    actual_end      TEXT,
    team            TEXT,
    pm              TEXT,
    ba              TEXT,
    functional_lead TEXT,
    technical_lead  TEXT,
    developer_lead  TEXT,
    tshirt_size     TEXT,
    est_hours       REAL DEFAULT 0.0,
    notes           TEXT,
    sort_order      INTEGER,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);
INSERT INTO "projects" VALUES('ETE-83','Customer Master Data Cleanup',NULL,NULL,NULL,'🔵 NEEDS TECHNICAL SPEC',0.15,'High','2025-10-14','2026-06-01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1480.0,'Completed Q1',1,'2026-04-08T09:24:01.318220','2026-04-08T09:24:01.318214');
INSERT INTO "projects" VALUES('ETE-48','System Connection Syteline-VKS',NULL,NULL,NULL,'🟢 ON TRACK',0.1,'High','2026-02-15','2026-06-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,240.0,'',1,'2026-04-08T09:24:01.318313','2026-04-08T09:24:01.318311');
INSERT INTO "projects" VALUES('ETE-68','Catalog API Rust2Python',NULL,NULL,NULL,'🟢 ON TRACK',0.13,'High','2025-11-17','2026-04-24',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,640.0,'',1,'2026-04-08T09:24:01.318380','2026-04-08T09:24:01.318378');
INSERT INTO "projects" VALUES('ETE-43','Data Security - Microsoft Purview',NULL,NULL,NULL,'🟢 ON TRACK',0.0,'High','2026-02-02','2026-06-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,320.0,'',1,'2026-04-08T09:24:01.318439','2026-04-08T09:24:01.318437');
INSERT INTO "projects" VALUES('ETE-19','Changes to AR Aging Report',NULL,NULL,NULL,'🟢 ON TRACK',0.0,'High','2026-02-23','2026-04-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',1,'2026-04-08T09:24:01.318496','2026-04-08T09:24:01.318495');
INSERT INTO "projects" VALUES('ETE-49','Marketing: STE Rewards Tier',NULL,NULL,NULL,'🔵 NEEDS TECHNICAL SPEC',0.0,'Medium','2026-04-01','2026-09-16',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,240.0,'',1,'2026-04-08T09:24:01.318556','2026-04-08T09:24:01.318555');
INSERT INTO "projects" VALUES('ETE-7','Outsourced Unit Core Accounting',NULL,NULL,NULL,'🔵 NEEDS FUNCTIONAL SPEC',0.0,'Medium','2026-04-01','2026-05-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,640.0,'8-9 month project',1,'2026-04-08T09:24:01.318620','2026-04-08T09:24:01.318618');
INSERT INTO "projects" VALUES('ETE-52','SWIMS/Syteline Reporting',NULL,NULL,NULL,'🔵 NEEDS TECHNICAL SPEC',0.0,'Medium','2026-04-01','2026-04-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,40.0,'',1,'2026-04-08T09:24:01.318685','2026-04-08T09:24:01.318684');
INSERT INTO "projects" VALUES('ETE-16','Partial Pay w/ CC from WMERP',NULL,NULL,NULL,'⚪ NOT STARTED',0.0,'Medium','2026-04-01','2026-06-24',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',1,'2026-04-08T09:24:01.318750','2026-04-08T09:24:01.318749');
INSERT INTO "projects" VALUES('ETE-37','Magic Search in BuyETE',NULL,NULL,NULL,'🔵 NEEDS TECHNICAL SPEC',0.0,'Highest','2026-04-01','2026-06-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,40.0,'',1,'2026-04-08T09:24:01.318812','2026-04-08T09:24:01.318811');
INSERT INTO "projects" VALUES('ETE-97','Standard Order Process Notifications',NULL,NULL,NULL,'⚪ NOT STARTED',0.0,'Highest','2026-04-01','2026-06-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,200.0,'',1,'2026-04-08T09:24:01.318874','2026-04-08T09:24:01.318872');
INSERT INTO "projects" VALUES('ETE-100','ATSG Expired Members Self-Payment',NULL,NULL,NULL,'🔵 NEEDS FUNCTIONAL SPEC',0.0,'Medium','2026-04-01','2026-05-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,200.0,'',1,'2026-04-08T09:24:01.318938','2026-04-08T09:24:01.318937');
INSERT INTO "projects" VALUES('ETE-124','Clean Up Return Loads',NULL,NULL,NULL,'🔵 NEEDS TECHNICAL SPEC',0.0,'Highest','2026-04-01','2026-05-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,200.0,'',1,'2026-04-08T09:24:01.318999','2026-04-08T09:24:01.318998');
INSERT INTO "projects" VALUES('ETE-58','Transfer Order Moved Items to Transit Location',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-09-23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319391','2026-04-08T09:24:01.319389');
INSERT INTO "projects" VALUES('ETE-51','RMA Credit Memo on Ghost Check-In',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-08-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319437','2026-04-08T09:24:01.319435');
INSERT INTO "projects" VALUES('ETE-59','Reconcile BridgePay CC Transactions',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-05-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319482','2026-04-08T09:24:01.319481');
INSERT INTO "projects" VALUES('ETE-60','EDI Payments Not Posting on Background',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-09-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319523','2026-04-08T09:24:01.319521');
INSERT INTO "projects" VALUES('ETE-61','Accum Deposits Received Field',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-07-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319564','2026-04-08T09:24:01.319562');
INSERT INTO "projects" VALUES('ETE-86','Allow TCM Core Receiving to Post',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-05-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319604','2026-04-08T09:24:01.319603');
INSERT INTO "projects" VALUES('ETE-34','Salesforce BDR Application & Process Implementation',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-04-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319645','2026-04-08T09:24:01.319644');
INSERT INTO "projects" VALUES('ETE-35','BuyETE Ability for Customers to Save Quotes',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'Medium','2026-04-01','2026-05-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',2,'2026-04-08T09:24:01.319685','2026-04-08T09:24:01.319684');
INSERT INTO "projects" VALUES('ETE-33','EDI 3PL Locations',NULL,NULL,NULL,'⏸️ POSTPONED',0.0,'High','2026-04-01','2026-06-10',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',2,'2026-04-08T09:24:01.319728','2026-04-08T09:24:01.319726');
INSERT INTO "projects" VALUES('ETE-67','Avalara Tax Issues',NULL,NULL,NULL,'✅ COMPLETE',1.0,'Highest','2026-02-04','2026-02-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',3,'2026-04-08T09:24:01.319786','2026-04-08T09:24:01.319784');
INSERT INTO "projects" VALUES('ETE-14','Installed Return RMA Type',NULL,NULL,NULL,'✅ COMPLETE',1.0,'Highest','2026-03-02','2026-03-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',3,'2026-04-08T09:24:01.319844','2026-04-08T09:24:01.319842');
INSERT INTO "projects" VALUES('ETE-70','Nutanix (Replace VMware)',NULL,NULL,NULL,'✅ COMPLETE',1.0,'Highest','2025-12-01','2026-03-21',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'',3,'2026-04-08T09:24:01.319904','2026-04-08T09:24:01.319903');
INSERT INTO "projects" VALUES('ETE-65','Rebuild Vendor Portal',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-10-27','2026-01-09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,60.0,'',3,'2026-04-08T09:24:01.319981','2026-04-08T09:24:01.319980');
INSERT INTO "projects" VALUES('ETE-69','Core Plan Optimization',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-11-12','2026-01-23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,360.0,'',3,'2026-04-08T09:24:01.320040','2026-04-08T09:24:01.320038');
INSERT INTO "projects" VALUES('ETE-31','Restocking Fees Added to RMA Credit Memo',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2024-12-22','2026-02-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,310.0,'',3,'2026-04-08T09:24:01.320098','2026-04-08T09:24:01.320096');
INSERT INTO "projects" VALUES('ETE-45','VB Bin Printer Integration',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-10-20','2026-02-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,160.0,'',3,'2026-04-08T09:24:01.320155','2026-04-08T09:24:01.320154');
INSERT INTO "projects" VALUES('ETE-42','Gear Screen - Improved Production Oversight',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2026-01-12','2026-02-05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,120.0,'NAPA not ready',3,'2026-04-08T09:24:01.320224','2026-04-08T09:24:01.320223');
INSERT INTO "projects" VALUES('ETE-72','Fortigate ZTNA - EMS Setup',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-12-12','2025-12-31',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',3,'2026-04-08T09:24:01.320300','2026-04-08T09:24:01.320298');
INSERT INTO "projects" VALUES('ETE-71','One Drive Migration',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-12-22','2026-02-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.0,'',3,'2026-04-08T09:24:01.320338','2026-04-08T09:24:01.320336');
INSERT INTO "projects" VALUES('ETE-87','Production Dashboard',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2026-04-01','2026-06-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,40.0,'',3,'2026-04-08T09:24:01.320379','2026-04-08T09:24:01.320377');
INSERT INTO "projects" VALUES('ETE-88','Return Load Phase 2',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2025-10-27','2025-12-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,320.0,'',3,'2026-04-08T09:24:01.320437','2026-04-08T09:24:01.320436');
INSERT INTO "projects" VALUES('ETE-73','Teal Parts Daily Inventory Feed',NULL,NULL,NULL,'✅ COMPLETE',1.0,'Highest','2026-04-01','2026-08-19',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,40.0,'',3,'2026-04-08T09:24:01.320494','2026-04-08T09:24:01.320493');
INSERT INTO "projects" VALUES('ETE-10','Upload Utility for Planning Fields',NULL,NULL,NULL,'✅ COMPLETE',0.1,'Highest','2026-04-01','2026-09-09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,80.0,'',3,'2026-04-08T09:24:01.320551','2026-04-08T09:24:01.320550');
INSERT INTO "projects" VALUES('ETE-32','Form: Cash App SQL Fix',NULL,NULL,NULL,'✅ COMPLETE',1.0,'High','2026-04-01','2026-04-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,320.0,'',3,'2026-04-08T09:24:01.320609','2026-04-08T09:24:01.320608');
INSERT INTO "projects" VALUES('ETE-76','FedEx Web Services API',NULL,NULL,NULL,'✅ COMPLETE',0.0,'High','2026-03-03','2026-03-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,40.0,'',3,'2026-04-08T09:24:01.320675','2026-04-08T09:24:01.320673');
CREATE TABLE rm_assumptions (
    key     TEXT PRIMARY KEY,
    value   REAL NOT NULL
);
CREATE TABLE role_phase_efforts (
    role_key    TEXT NOT NULL,
    phase       TEXT NOT NULL,
    effort      REAL NOT NULL,
    PRIMARY KEY (role_key, phase)
);
INSERT INTO "role_phase_efforts" VALUES('pm','discovery',0.1);
INSERT INTO "role_phase_efforts" VALUES('pm','planning',0.25);
INSERT INTO "role_phase_efforts" VALUES('pm','design',0.15);
INSERT INTO "role_phase_efforts" VALUES('pm','build',0.2);
INSERT INTO "role_phase_efforts" VALUES('pm','test',0.2);
INSERT INTO "role_phase_efforts" VALUES('pm','deploy',0.1);
INSERT INTO "role_phase_efforts" VALUES('ba','discovery',0.3);
INSERT INTO "role_phase_efforts" VALUES('ba','planning',0.2);
INSERT INTO "role_phase_efforts" VALUES('ba','design',0.2);
INSERT INTO "role_phase_efforts" VALUES('ba','build',0.1);
INSERT INTO "role_phase_efforts" VALUES('ba','test',0.15);
INSERT INTO "role_phase_efforts" VALUES('ba','deploy',0.05);
INSERT INTO "role_phase_efforts" VALUES('functional','discovery',0.2);
INSERT INTO "role_phase_efforts" VALUES('functional','planning',0.1);
INSERT INTO "role_phase_efforts" VALUES('functional','design',0.3);
INSERT INTO "role_phase_efforts" VALUES('functional','build',0.15);
INSERT INTO "role_phase_efforts" VALUES('functional','test',0.15);
INSERT INTO "role_phase_efforts" VALUES('functional','deploy',0.1);
INSERT INTO "role_phase_efforts" VALUES('technical','discovery',0.05);
INSERT INTO "role_phase_efforts" VALUES('technical','planning',0.1);
INSERT INTO "role_phase_efforts" VALUES('technical','design',0.2);
INSERT INTO "role_phase_efforts" VALUES('technical','build',0.4);
INSERT INTO "role_phase_efforts" VALUES('technical','test',0.15);
INSERT INTO "role_phase_efforts" VALUES('technical','deploy',0.1);
INSERT INTO "role_phase_efforts" VALUES('developer','discovery',0.0);
INSERT INTO "role_phase_efforts" VALUES('developer','planning',0.05);
INSERT INTO "role_phase_efforts" VALUES('developer','design',0.1);
INSERT INTO "role_phase_efforts" VALUES('developer','build',0.5);
INSERT INTO "role_phase_efforts" VALUES('developer','test',0.25);
INSERT INTO "role_phase_efforts" VALUES('developer','deploy',0.1);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','discovery',0.05);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','planning',0.1);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','design',0.15);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','build',0.2);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','test',0.15);
INSERT INTO "role_phase_efforts" VALUES('infrastructure','deploy',0.35);
INSERT INTO "role_phase_efforts" VALUES('dba','discovery',0.05);
INSERT INTO "role_phase_efforts" VALUES('dba','planning',0.1);
INSERT INTO "role_phase_efforts" VALUES('dba','design',0.3);
INSERT INTO "role_phase_efforts" VALUES('dba','build',0.25);
INSERT INTO "role_phase_efforts" VALUES('dba','test',0.2);
INSERT INTO "role_phase_efforts" VALUES('dba','deploy',0.1);
INSERT INTO "role_phase_efforts" VALUES('erp','discovery',0.1);
INSERT INTO "role_phase_efforts" VALUES('erp','planning',0.15);
INSERT INTO "role_phase_efforts" VALUES('erp','design',0.1);
INSERT INTO "role_phase_efforts" VALUES('erp','build',0.1);
INSERT INTO "role_phase_efforts" VALUES('erp','test',0.05);
INSERT INTO "role_phase_efforts" VALUES('erp','deploy',0.5);
CREATE TABLE schema_info (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
INSERT INTO "schema_info" VALUES('version','1');
CREATE TABLE sdlc_phase_weights (
    phase   TEXT PRIMARY KEY,
    weight  REAL NOT NULL
);
INSERT INTO "sdlc_phase_weights" VALUES('discovery',0.1);
INSERT INTO "sdlc_phase_weights" VALUES('planning',0.1);
INSERT INTO "sdlc_phase_weights" VALUES('design',0.15);
INSERT INTO "sdlc_phase_weights" VALUES('build',0.3);
INSERT INTO "sdlc_phase_weights" VALUES('test',0.2);
INSERT INTO "sdlc_phase_weights" VALUES('deploy',0.15);
DELETE FROM "sqlite_sequence";
CREATE TABLE team_members (
    name                 TEXT PRIMARY KEY,
    role                 TEXT NOT NULL,
    role_key             TEXT NOT NULL,
    team                 TEXT,
    vendor               TEXT,
    classification       TEXT,
    rate_per_hour        REAL DEFAULT 0.0,
    weekly_hrs_available REAL DEFAULT 0.0,
    support_reserve_pct  REAL DEFAULT 0.0,
    include_in_capacity  INTEGER DEFAULT 1
);
INSERT INTO "team_members" VALUES('Ajay Kumar','Functional','functional','ERP','Synnergie','MSA',65.0,35.0,0.4,1);
INSERT INTO "team_members" VALUES('Ravindra Reddy','Technical','technical','ERP','Synnergie','MSA',65.0,35.0,0.4,1);
INSERT INTO "team_members" VALUES('Vishnu Premen','Technical','technical','ERP','Synnergie','T&M',65.0,35.0,0.4,1);
INSERT INTO "team_members" VALUES('Deepak Gudwani','Functional','functional','ERP','Synnergie','T&M',65.0,35.0,0.4,1);
INSERT INTO "team_members" VALUES('Sangamesh Koti','Technical','technical','ERP','Synnergie','T&M',65.0,35.0,0.0,1);
INSERT INTO "team_members" VALUES('Bhavya Reddy','Technical','technical','ERP','Synnergie','T&M',65.0,35.0,0.0,1);
INSERT INTO "team_members" VALUES('Sarath Yeturu','Technical','technical','ERP','Synnergie','MSA',65.0,35.0,0.6,1);
INSERT INTO "team_members" VALUES('Vinod Bollepally','DBA','dba','ERP','Synnergie','MSA',65.0,35.0,0.8,1);
INSERT INTO "team_members" VALUES('Jim Young','Business Analyst','ba','Business Analysts','ETE','Internal',65.0,40.0,0.6,1);
INSERT INTO "team_members" VALUES('Alex Young','Developer','developer','Systems Applications','ETE','Internal',65.0,25.0,0.5,1);
INSERT INTO "team_members" VALUES('Nick Smith','Developer','developer','Systems Applications','ETE','Internal',65.0,25.0,0.4,1);
INSERT INTO "team_members" VALUES('Colin Olson','Developer','developer','Systems Applications','ETE','Internal',65.0,25.0,0.1,1);
INSERT INTO "team_members" VALUES('Jonathon Gonzalez','Developer','developer','Systems Applications','ETE','Internal',65.0,25.0,0.25,1);
INSERT INTO "team_members" VALUES('Audrey Debaere','Business Analyst','ba','Business Analysts','ETE','Internal',65.0,35.0,0.5,1);
INSERT INTO "team_members" VALUES('Cristian Varelas','Business Analyst','ba','Business Analysts','ETE','Internal',65.0,35.0,0.2,1);
INSERT INTO "team_members" VALUES('Ryan Picado','Business Analyst','ba','Business Analysts','ETE','Internal',65.0,35.0,0.5,1);
INSERT INTO "team_members" VALUES('Emily Fridley','Project Manager','pm','PMO','ETE','Internal',65.0,35.0,0.5,1);
INSERT INTO "team_members" VALUES('Brett Anderson','Project Manager','pm','PMO','ETE','Internal',65.0,35.0,0.25,1);
INSERT INTO "team_members" VALUES('Bettina Kotico','Project Manager','pm','PMO','Kayana','T&M',65.0,32.0,0.68,1);
INSERT INTO "team_members" VALUES('Donna Wiedemeier','WMS Consultant','wms consultant','WMS','Watermark','T&M',65.0,35.0,0.6,1);
INSERT INTO "team_members" VALUES('Justin Senour','Infrastructure','infrastructure','Infrastructure','ETE','Internal',65.0,40.0,0.6,1);
INSERT INTO "team_members" VALUES('Michael House','Infrastructure','infrastructure','Infrastructure','ETE','Internal',65.0,40.0,0.6,1);
INSERT INTO "team_members" VALUES('Andrew Shaefer','Infrastructure','infrastructure','Infrastructure','ETE','Internal',65.0,40.0,0.6,1);
CREATE INDEX idx_app_settings_category ON app_settings(category);
COMMIT;
