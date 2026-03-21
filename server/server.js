import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import fs from "node:fs";
import { Queue } from "bullmq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getRedisConnectionConfig } from "./redisConfig.js";
import { initWorker } from "./worker.js";

const redisConnection = getRedisConnectionConfig();
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "langchainjs-testing";

if (!redisConnection) {
  console.warn(
    "Redis is not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT to enable PDF upload queue.",
  );
}

const queue = redisConnection
  ? new Queue("file-upload-queue", {
      connection: redisConnection,
    })
  : null;

if (redisConnection) {
  initWorker(redisConnection);
  console.log("Background worker started for file processing.");
}

fs.mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  }),
);

app.get("/", (req, res) => {
  res.json({ status: "All cool" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!queue) {
      return res.status(503).json({
        message:
          "Queue is not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file was uploaded." });
    }

    await queue.add(
      "file-ready",
      JSON.stringify({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      }),
    );
    return res.json({ message: "Uploaded" });
  } catch (error) {
    console.error("Upload failed", error);
    return res.status(500).json({ message: "Failed to upload PDF." });
  }
});

app.get("/chat", async (req, res) => {
  try {
    const userQuery = req.query.message;

    if (!userQuery || typeof userQuery !== "string") {
      return res
        .status(400)
        .json({ message: "Query parameter 'message' is required." });
    }

    const missing = [];
    if (!process.env.API_KEY) missing.push("API_KEY");
    if (!process.env.MISTRAL_API_KEY) missing.push("MISTRAL_API_KEY");
    if (process.env.NODE_ENV === "production" && !process.env.QDRANT_URL) {
      missing.push("QDRANT_URL");
    }
    if (missing.length > 0) {
      return res.status(503).json({
        message: "Server is missing required configuration.",
        missing,
      });
    }

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: COLLECTION_NAME,
      },
    );

    const ret = vectorStore.asRetriever({
      k: 4,
    });
    const result = await ret.invoke(userQuery);

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(409).json({
        message:
          "No PDF content is indexed yet (or no relevant chunks were found). Upload a PDF first.",
        docs: [],
      });
    }

    // Clean up the retrieved chunks before injecting
    const context = result
      .map((doc, i) => {
        const page = doc.metadata?.loc?.pageNumber ?? "unknown";
        const source = doc.metadata?.source ?? "document";
        return `[Chunk ${i + 1}] (Source: ${source}, Page: ${page})\n${doc.pageContent}`;
      })
      .join("\n\n---\n\n");

    const SYSTEM_PROMPT = `
You are a precise and helpful assistant that answers questions strictly based on the content of an uploaded PDF document.

## Instructions
- Answer ONLY using the context chunks provided below.
- If the answer is not found in the context, say: "I couldn't find this information in the uploaded document."
- Do NOT make up, infer, or use outside knowledge.
- Always respond in clean, readable Markdown.
- Use bullet points, tables, or headers when it improves clarity.
- If the answer spans multiple chunks, synthesize them into a single coherent response.
- When relevant, mention the page number like: *(Page 3)* so users can verify.

## Context from PDF
${context}
`;

    const model = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY,
      temperature: 0,
    });

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userQuery),
    ];

    const chatResult = await model.invoke(messages);
    console.log("content", chatResult);

    return res.json({
      message: chatResult.content,
      docs: result,
    });
  } catch (error) {
    console.error("Chat failed", error);
    const rawMessage = error instanceof Error ? error.message : String(error);
    const isLikelyDependencyIssue =
      /ECONNREFUSED|ENOTFOUND|fetch failed|socket|timed out|timeout|503|502|504/i.test(
        rawMessage,
      );

    return res.status(isLikelyDependencyIssue ? 503 : 500).json({
      message: "Chat request failed.",
      error: rawMessage,
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
