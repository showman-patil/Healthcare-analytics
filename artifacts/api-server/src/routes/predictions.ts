import { Router, type IRouter } from "express";
import { PredictDiseaseBody, PredictDiseaseResponse } from "@workspace/api-zod";
import { analyzePrediction } from "../lib/prediction-engine";

const router: IRouter = Router();

router.post("/predictions", async (req, res) => {
  const body = PredictDiseaseBody.parse(req.body);
  const result = PredictDiseaseResponse.parse(analyzePrediction(body));

  res.json(result);
});

export default router;
