import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  ListPatientsResponse,
  GetPatientResponse,
  CreatePatientBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/patients", async (req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(patientsTable.id);
  res.json(ListPatientsResponse.parse(patients));
});

router.get("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(GetPatientResponse.parse(patient));
});

router.post("/patients", async (req, res) => {
  const body = CreatePatientBody.parse(req.body);
  const [patient] = await db.insert(patientsTable).values({
    name: body.name,
    age: body.age,
    gender: body.gender,
    bloodType: body.bloodType,
    phone: body.phone,
    email: body.email,
    condition: body.condition,
    doctorId: body.doctorId,
    riskLevel: "low",
    status: "active",
  }).returning();
  res.status(201).json(patient);
});

export default router;
