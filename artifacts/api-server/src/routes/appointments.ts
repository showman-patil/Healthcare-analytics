import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable, doctorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  ListAppointmentsResponse,
  CreateAppointmentBody,
} from "@workspace/api-zod";
import { demoAppointments, demoDoctors, demoPatients } from "../lib/demo-data";

const router: IRouter = Router();

router.get("/appointments", async (req, res) => {
  if (!db) {
    res.json(ListAppointmentsResponse.parse(demoAppointments));
    return;
  }

  const appointments = await db.select().from(appointmentsTable).orderBy(appointmentsTable.id);
  res.json(ListAppointmentsResponse.parse(appointments));
});

router.post("/appointments", async (req, res) => {
  const body = CreateAppointmentBody.parse(req.body);

  if (!db) {
    const patient = demoPatients.find((item) => item.id === body.patientId);
    const doctor = demoDoctors.find((item) => item.id === body.doctorId);

    const appointment = {
      id: demoAppointments.length + 1,
      patientId: body.patientId,
      patientName: patient?.name ?? "Unknown",
      doctorId: body.doctorId,
      doctorName: doctor?.name ?? "Unknown",
      date: body.date,
      time: body.time,
      type: body.type ?? "Consultation",
      notes: body.notes,
      status: "scheduled" as const,
    };

    demoAppointments.push(appointment);
    res.status(201).json(appointment);
    return;
  }

  let patientName = "Unknown";
  let doctorName = "Unknown";

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, body.patientId));
  if (patient) patientName = patient.name;

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, body.doctorId));
  if (doctor) doctorName = doctor.name;

  const [appointment] = await db.insert(appointmentsTable).values({
    patientId: body.patientId,
    patientName,
    doctorId: body.doctorId,
    doctorName,
    date: body.date,
    time: body.time,
    type: body.type,
    notes: body.notes,
    status: "scheduled",
  }).returning();

  res.status(201).json(appointment);
});

export default router;
