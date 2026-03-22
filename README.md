# 📚 ChatWithPdf

ChatWithPdf is a web application that allows users to **upload PDF files** and **ask AI-powered questions** about their content.  
It’s perfect for quickly extracting insights, summarizing documents, or finding specific information without manually reading the entire PDF.

---

## 🚀 Features
- 📂 **Upload PDF** — Easily upload files from your device.  
- 💬 **Chat with PDFs** — Ask natural language questions about the file’s content.  
- ⚡ **Instant AI Responses** — Get accurate answers in seconds.  
- 🎯 **User-Friendly Interface** — Simple and responsive design.

---

## 🛠️ Tech Stack
- **Frontend:** React.js / Next.js  
- **Backend:** Node.js / Express.js  
- **AI Integration:** OpenAI API  
- **Database (Optional):** Supabase / MongoDB  
- **Styling:** Tailwind CSS  

---

---

## 🏗️ Architecture

The application follows a PDF-to-RAG workflow:

1. Users authenticate with **Clerk**.
2. PDFs are uploaded through the frontend.
3. The backend stores uploaded PDF files.
4. A **BullMQ** worker processes the PDF asynchronously.
5. The worker uses a **PDF loader** to extract content and create chunks.
6. Chunk embeddings are generated and stored in a **vector database** such as **Qdrant**.
7. During chat, the system retrieves relevant document chunks.
8. The LLM uses those chunks as context to answer the user query.

![Architecture](docs/architecture.png)

---


## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/ChatWithPdf.git
cd ChatWithPdf
