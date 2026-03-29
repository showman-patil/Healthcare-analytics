import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable, appointmentsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { GetAnalyticsOverviewResponse, GetDiseaseTrendsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/overview", async (req, res) => {
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
  const trends = [
    { month: "Jan", diabetes: 45, hypertension: 82, heartDisease: 28, respiratory: 35, cancer: 12 },
    { month: "Feb", diabetes: 52, hypertension: 78, heartDisease: 32, respiratory: 42, cancer: 14 },
    { month: "Mar", diabetes: 48, hypertension: 85, heartDisease: 30, respiratory: 38, cancer: 11 },
    { month: "Apr", diabetes: 61, hypertension: 90, heartDisease: 35, respiratory: 45, cancer: 16 },
    { month: "May", diabetes: 55, hypertension: 88, heartDisease: 28, respiratory: 40, cancer: 13 },
    { month: "Jun", diabetes: 67, hypertension: 92, heartDisease: 38, respiratory: 52, cancer: 18 },
    { month: "Jul", diabetes: 72, hypertension: 95, heartDisease: 42, respiratory: 48, cancer: 20 },
    { month: "Aug", diabetes: 68, hypertension: 89, heartDisease: 39, respiratory: 55, cancer: 17 },
    { month: "Sep", diabetes: 74, hypertension: 98, heartDisease: 45, respiratory: 60, cancer: 22 },
    { month: "Oct", diabetes: 80, hypertension: 102, heartDisease: 48, respiratory: 58, cancer: 19 },
    { month: "Nov", diabetes: 76, hypertension: 96, heartDisease: 44, respiratory: 62, cancer: 21 },
    { month: "Dec", diabetes: 85, hypertension: 108, heartDisease: 52, respiratory: 70, cancer: 25 },
  ];

  res.json(GetDiseaseTrendsResponse.parse(trends));
});

export default router;
