import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { doctorsTable } from "@workspace/db/schema";
import { ListDoctorsResponse } from "@workspace/api-zod";
import { demoDoctors } from "../lib/demo-data";

const router: IRouter = Router();

router.get("/doctors", async (req, res) => {
  if (!db) {
    res.json(ListDoctorsResponse.parse(demoDoctors));
    return;
  }

  const doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.id);
  res.json(ListDoctorsResponse.parse(doctors));
});

export default router;
