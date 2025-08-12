import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

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
app.use(cors());

app.get("/", (req, res) => {
  res.json({ status: "All cool" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: "uplodaed" });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;
  console.log("quest", userQuery);

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.API_KEY, // Defaults to process.env.HUGGINGFACEHUB_API_KEY
    model: "", // Defaults to `BAAI/bge-base-en-v1.5` if not provided
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "langchainjs-testing",
    }
  );

  const ret = vectorStore.asRetriever({
    k: 2,
  });
  const result = await ret.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are helfull AI Assistant who answeres the user query based on the available context from PDF File.
  Context:
  ${JSON.stringify(result)}
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
});

app.listen(8000, () => console.log("server stareted on port:${8000}"));
