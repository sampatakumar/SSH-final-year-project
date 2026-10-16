import { connectDB } from "../../../core/database/db.js";
import { academicCatalogService } from "../services/academicCatalog.service.js";
import mongoose from "mongoose";

async function run() {
  console.log("[Academic Catalog Seed] Connecting to database...");
  await connectDB();
  console.log("[Academic Catalog Seed] Running idempotent seed operation...");
  const result = await academicCatalogService.seedCatalog();
  console.log("[Academic Catalog Seed] Completed successfully:", result.stats);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[Academic Catalog Seed] Error running seed:", err);
  process.exit(1);
});
