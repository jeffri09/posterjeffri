import { generatePosterContent } from './services/geminiService.js';

process.env.API_KEY = "AIzaSyDYViVypbm2TC3xYZ9w8Xd9CjmStXtPpkU";

async function run() {
  try {
    console.log("Mencoba memanggil generatePosterContent...");
    const result = await generatePosterContent("Sabar Menghadapi Ujian");
    console.log("BERHASIL! Hasilnya:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("GAGAL:", error);
  }
}

run();
