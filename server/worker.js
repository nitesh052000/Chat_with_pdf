import { Worker } from "bullmq";
import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";

export const initWorker = (redisConnection) =>
  new Worker(
    "file-upload-queue",
    async (job) => {
      console.log("Job", job.data);
      const data = JSON.parse(job.data);

      // 1. Load the PDF
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();
      console.log("PAGES LOADED:", docs.length);

      // 2. Configure the Splitter
      const splitter = new CharacterTextSplitter({
        separator: "\n",
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      // 3. Chop the pages into chunks
      const chunkedDocs = await splitter.splitDocuments(docs);
      console.log(
        `Split ${docs.length} pages into ${chunkedDocs.length} chunks.`,
      );

      // 4. Set up Embeddings & Vector Store
      const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.API_KEY,
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL || "http://localhost:6333",
          collectionName:
            process.env.QDRANT_COLLECTION || "langchainjs-testing",
        },
      );

      // 5. Store the chunks in Qdrant
      try {
        await vectorStore.addDocuments(chunkedDocs);
        console.log(`✅ All chunks are added to the vector store`);
      } catch (error) {
        console.error("❌ Error adding documents to vector store:", error);
      }
    },
    {
      concurrency: 5,
      connection: redisConnection,
    },
  );
