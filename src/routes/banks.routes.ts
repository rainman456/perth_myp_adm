import { Router, Request, Response } from "express";
import { getBanks } from "../services/paystack_service";

const router = Router();

/**
 * GET /banks
 * Optional query: ?country=nigeria|ghana|kenya|south africa
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { country } = req.query as { country?: string };

    const banks = await getBanks(country);
    return res.status(200).json({
      success: true,
      message: "Banks list retrieved successfully",
      data: banks,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch banks",
    });
  }
});

export default router;
