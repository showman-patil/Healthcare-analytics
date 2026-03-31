import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable, appointmentsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { GetAnalyticsOverviewResponse, GetDiseaseTrendsResponse } from "@workspace/api-zod";
import { demoAnalyticsOverview, demoDiseaseTrends } from "../lib/demo-data";

const router: IRouter = Router();

router.get("/analytics/overview", async (req, res) => {
  if (!db) {
    res.json(GetAnalyticsOverviewResponse.parse(demoAnalyticsOverview));
    return;
  }

  const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);
  const [doctorCount] = await db.select({ count: sql<number>`count(*)` }).from(doctorsTable);
  const [appointmentCount] = await db.select({ count: sql<number>`count(*)` }).from(appointmentsTable);
  const [criticalCount] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable)
    .where(sql`risk_level in ('critical', 'high')`);

  const overview = GetAnalyticsOverviewResponse.parse({
    totalPatients: Number(patientCount?.count ?? 0),
    totalDoctors: Number(doctorCount?.count ?? 0),
    totalAppointments: Number(appointmentCount?.count ?? 0),
    criticalCases: Number(criticalCount?.count ?? 0),
    bedOccupancy: 72.5,
    avgWaitTime: 18.3,
    patientGrowth: 12.4,
    appointmentGrowth: 8.7,
  });

  res.json(overview);
});

router.get("/analytics/disease-trends", async (req, res) => {
  if (!db) {
    res.json(GetDiseaseTrendsResponse.parse(demoDiseaseTrends));
    return;
  }

  res.json(GetDiseaseTrendsResponse.parse(demoDiseaseTrends));
});

export default router;
