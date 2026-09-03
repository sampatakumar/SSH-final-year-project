import dotenv from "dotenv";
dotenv.config();

import { edutubeSearchService } from "../src/modules/edutube/services/edutube-search.service.js";

async function verifyLiveEduTube() {
  console.log("==================================================");
  console.log(" EDUTUBE BACKEND LIVE YOUTUBE API VERIFIER");
  console.log("==================================================");

  const keyPresent = Boolean(process.env.YOUTUBE_API_KEY);
  console.log(`\n[1/3] Environment: YOUTUBE_API_KEY present = ${keyPresent}`);

  if (!keyPresent) {
    console.error("❌ YOUTUBE_API_KEY is not found in environment.");
    process.exit(1);
  }

  // 1. Test Search Endpoint with 'javascript'
  console.log("\n[2/3] Executing live search for query 'javascript'...");
  const startTime = Date.now();
  const searchResult = await edutubeSearchService.searchVideos({
    q: "javascript",
    maxResults: 5,
  });
  const latency = Date.now() - startTime;

  console.log(`✓ Search completed in ${latency}ms`);
  console.log(`  Items returned: ${searchResult.items?.length || 0}`);
  console.log(`  Cached: ${searchResult.cached}`);
  console.log(`  NextPageToken: ${searchResult.nextPageToken || "N/A"}`);

  if (!searchResult.items || searchResult.items.length === 0) {
    console.error("❌ No items returned in search result.");
    process.exit(1);
  }

  for (const [idx, item] of searchResult.items.slice(0, 3).entries()) {
    console.log(`  ${idx + 1}. [${item.videoId}] ${item.title}`);
    console.log(`     Channel: ${item.channelTitle}`);
    console.log(`     Embed URL: ${item.embedUrl}`);
    console.log(`     Educational Score: ${item.educationalScore}/100`);
  }

  // 2. Test Video Details with the first video ID
  const firstVideoId = searchResult.items[0].videoId;
  console.log(`\n[3/3] Fetching full video details for ID: ${firstVideoId}...`);
  const detailResult = await edutubeSearchService.getVideoById(firstVideoId);

  console.log(`✓ Video details retrieved:`);
  console.log(`  Title: ${detailResult.video.title}`);
  console.log(`  Duration: ${detailResult.video.duration.formatted} (${detailResult.video.duration.seconds}s)`);
  console.log(`  Embeddable: ${detailResult.video.embeddable}`);
  console.log(`  Views: ${detailResult.video.statistics.viewCount.toLocaleString()}`);

  console.log("\n==================================================");
  console.log(" 🎉 LIVE EDUTUBE API VERIFICATION SUCCESSFUL!");
  console.log("==================================================");
}

verifyLiveEduTube().catch((err) => {
  console.error("❌ Live EduTube verification failed:", err.message);
  process.exit(1);
});
