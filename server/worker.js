import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { QdrantClient } from "@qdrant/js-client-rest";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log("Job", job.data);
    const data = JSON.parse(job.data);
    /*
    Path: data.path
    read the pdf from path,
    chunk the pdf,
    call the openai embedding model for every chunk,
    store the chunk in qdrant db
    */

    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    console.log("DOCS LOADED:", docs.length);
    console.log(docs[0]?.pageContent.slice(0, 500));

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.API_KEY, // Defaults to process.env.HUGGINGFACEHUB_API_KEY
      model: "", // Defaults to `BAAI/bge-base-en-v1.5` if not provided
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "langchainjs-testing",
      }
    );
    try {
      await vectorStore.addDocuments(docs);
      console.log(`✅ All docs are added to vector store`);
    } catch (error) {
      console.error("❌ Error adding documents to vector store:", error);
    }

    console.log(`All docs are added to vector store`);
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: "6379",
    },
  }
);
