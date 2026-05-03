import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDYViVypbm2TC3xYZ9w8Xd9CjmStXtPpkU" });

async function listModels() {
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      if (model.name.includes("flash")) {
        console.log(model.name);
      }
    }
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

listModels();
