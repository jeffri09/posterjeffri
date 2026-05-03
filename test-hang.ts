import { generatePosterContent } from './services/geminiService.js';

process.env.GEMINI_API_KEY = "AIzaSyDYViVypbm2TC3xYZ9w8Xd9CjmStXtPpkU"; 

async function run() {
  console.log("Starting...");
  try {
    const res = await generatePosterContent("Sabar");
    console.log(res);
  } catch (e) {
    console.log("Error:", e);
  }
  console.log("Done.");
}

run();
