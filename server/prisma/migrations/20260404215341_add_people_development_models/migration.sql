-- CreateTable
CREATE TABLE "DevelopmentPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collaboratorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DevelopmentPlan_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DevelopmentGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "skillId" INTEGER,
    "currentLevel" REAL,
    "targetLevel" REAL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "targetDate" DATETIME,
    "completedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DevelopmentGoal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DevelopmentPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DevelopmentGoal_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DevelopmentAction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" TEXT NOT NULL DEFAULT 'experience',
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "evidence" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DevelopmentAction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "DevelopmentGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimePeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "collaboratorId" INTEGER NOT NULL,
    "timePeriodId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ASPIRATIONAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Objective_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Objective_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "metricType" TEXT NOT NULL DEFAULT 'NUMBER',
    "targetDirection" TEXT NOT NULL DEFAULT 'INCREASE',
    "startValue" REAL NOT NULL DEFAULT 0,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "targetValue" REAL NOT NULL DEFAULT 1,
    "unit" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "confidence" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyResultId" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "collaboratorId" INTEGER NOT NULL,
    "reviewerId" TEXT,
    "developmentPlanId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "overallRating" INTEGER,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "overallComments" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_developmentPlanId_fkey" FOREIGN KEY ("developmentPlanId") REFERENCES "DevelopmentPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewSkillRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,
    "rating" INTEGER,
    "previousLevel" REAL,
    "currentLevel" REAL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewSkillRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewSkillRating_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KPI" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "baselineValue" REAL,
    "targetValue" REAL,
    "targetDirection" TEXT NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "department" TEXT,
    "collaboratorId" INTEGER,
    "objectiveId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KPI_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KPI_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KPIEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kpiId" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "note" TEXT,
    "recordedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KPIEntry_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collaboratorId" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckInNote_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DevelopmentPlan_collaboratorId_idx" ON "DevelopmentPlan"("collaboratorId");

-- CreateIndex
CREATE INDEX "DevelopmentPlan_status_idx" ON "DevelopmentPlan"("status");

-- CreateIndex
CREATE INDEX "DevelopmentGoal_planId_idx" ON "DevelopmentGoal"("planId");

-- CreateIndex
CREATE INDEX "DevelopmentGoal_skillId_idx" ON "DevelopmentGoal"("skillId");

-- CreateIndex
CREATE INDEX "DevelopmentGoal_status_idx" ON "DevelopmentGoal"("status");

-- CreateIndex
CREATE INDEX "DevelopmentAction_goalId_idx" ON "DevelopmentAction"("goalId");

-- CreateIndex
CREATE INDEX "DevelopmentAction_status_idx" ON "DevelopmentAction"("status");

-- CreateIndex
CREATE INDEX "Objective_collaboratorId_timePeriodId_idx" ON "Objective"("collaboratorId", "timePeriodId");

-- CreateIndex
CREATE INDEX "Objective_status_idx" ON "Objective"("status");

-- CreateIndex
CREATE INDEX "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId");

-- CreateIndex
CREATE INDEX "CheckIn_keyResultId_createdAt_idx" ON "CheckIn"("keyResultId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_collaboratorId_idx" ON "Review"("collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_cycleId_collaboratorId_key" ON "Review"("cycleId", "collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSkillRating_reviewId_skillId_key" ON "ReviewSkillRating"("reviewId", "skillId");

-- CreateIndex
CREATE INDEX "KPI_collaboratorId_idx" ON "KPI"("collaboratorId");

-- CreateIndex
CREATE INDEX "KPI_objectiveId_idx" ON "KPI"("objectiveId");

-- CreateIndex
CREATE INDEX "KPI_isActive_idx" ON "KPI"("isActive");

-- CreateIndex
CREATE INDEX "KPIEntry_kpiId_recordedAt_idx" ON "KPIEntry"("kpiId", "recordedAt");

-- CreateIndex
CREATE INDEX "CheckInNote_collaboratorId_meetingDate_idx" ON "CheckInNote"("collaboratorId", "meetingDate");
