import os
import sys
import asyncio
import chardet
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.llms import Ollama
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.documents.base import Document
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.utilities import SQLDatabase

FAISS_INDEX_PATH = "faiss_index"

# Initialize FastAPI app
app = FastAPI(title="Arc1610", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global states
embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = None
retrieval_pipeline = None

def init_pipeline(model_name="mistral"):
    global vector_store, retrieval_pipeline
    if os.path.exists(FAISS_INDEX_PATH):
        print("Loading FAISS index and setting up the pipeline...")
        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = vector_store.as_retriever()
        llm = Ollama(model=model_name)
        prompt = ChatPromptTemplate.from_template("""
You are an expert developer assistant. Answer the user's question based on the following context.
Be concise and clear.
If the answer includes a code snippet, format it using markdown with the correct language identifier.

Context:
{context}

Question: {input}
""")
        retrieval_pipeline = (
            {"context": retriever, "input": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        print("✅ Pipeline is ready.")
    else:
        print("⚠️ FAISS index not found. Pipeline will be inactive until a workspace is indexed.")

# Try initializing on startup
init_pipeline()

class UniversalTextLoader(TextLoader):
    def lazy_load(self):
        try:
            with open(self.file_path, "rb") as f:
                raw = f.read()
                result = chardet.detect(raw)
                encoding = result["encoding"] or "utf-8"
            with open(self.file_path, encoding=encoding, errors="ignore") as f:
                text = f.read()
            yield Document(page_content=text, metadata={"source": self.file_path})
        except Exception:
            yield Document(page_content="", metadata={"source": self.file_path})

@app.post("/index")
async def index_workspace(path: str, model_name: str = "mistral"):
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=400, detail="Invalid path provided.")
    
    print(f"Starting multi-format ingestion from '{path}'...")
    all_documents = []
    code_extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.txt', '.sql', '.yaml', '.yml']
    exclude_dirs = {'node_modules', 'dist', 'build', '__pycache__', '.git', '.idea', '.vscode', 'venv', '.venv', 'env', '.next', '.nuxt', '.cache'}

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            file_path = os.path.join(root, file)
            try:
                if file.lower().endswith(".pdf"):
                    loader = PyPDFLoader(file_path)
                    all_documents.extend(loader.load())
                elif file.lower().endswith(".sqlite3") or file.endswith(".db"):
                    db = SQLDatabase.from_uri(f"sqlite:///{file_path}")
                    schema_info = db.get_table_info()
                    all_documents.append(Document(page_content=f"Database Schema for {file}:\n{schema_info}", metadata={"source": file_path}))
                elif any(file.lower().endswith(ext) for ext in code_extensions):
                    loader = UniversalTextLoader(file_path)
                    all_documents.extend(loader.lazy_load())
            except Exception as e:
                print(f"  -> Failed to process {file_path}: {e}")

    if not all_documents:
        raise HTTPException(status_code=400, detail="No processable documents found.")

    print(f"✅ Loaded {len(all_documents)} documents. Chunking...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = text_splitter.split_documents(all_documents)
    
    print("Creating embeddings... (This may take a while)")
    global vector_store
    vector_store = FAISS.from_documents(docs, embeddings)
    vector_store.save_local(FAISS_INDEX_PATH)
    
    # Reinit pipeline with new index
    init_pipeline(model_name)
    
    return {"status": "success", "message": f"Vector store saved for {len(docs)} chunks."}

async def stream_llm_response(question: str):
    if not retrieval_pipeline:
        yield "data: Error: Vector index not found. Please index a workspace first.\n\n"
        return
    try:
        async for chunk in retrieval_pipeline.astream(question):
            if chunk:
                yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.01)
    except Exception as e:
        print(f"❌ Error during stream: {e}")
        yield f"data: Error: An error occurred while generating the response.\n\n"

@app.get("/ask")
async def ask_question(request: Request):
    question = request.query_params.get("question", "").strip()
    if not question:
        async def error_stream(): yield "data: Error: No question provided.\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")
    return StreamingResponse(stream_llm_response(question), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    # Allow port to be passed dynamically from VS Code Extension
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Starting Arc1610 local API on port {port}...")
    uvicorn.run(app, host="127.0.0.1", port=port)