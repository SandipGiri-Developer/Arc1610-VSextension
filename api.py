
# Icluding neccessary things
import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.llms import Ollama
from fastapi.middleware.cors import CORSMiddleware


FAISS_INDEX_PATH = "faiss_index" # <--- Path to save and load FAISS index


if not os.path.exists(FAISS_INDEX_PATH): # <--- check if faiss index path exists if not then user asked to run run.py for creating index.
    raise RuntimeError(f"❌ FAISS index not found at '{FAISS_INDEX_PATH}'. Please run your indexing script first. i.e., 'run.py' to create the index.")

print(" Loading FAISS index and setting up the pipeline...")
embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2") # <--- using same embeddings as used during index creation in run.py.
vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True) # <--- loading faiss index
retriever = vector_store.as_retriever() # <--- creating retriver to retrive info and doc from vecotor store.
llm = Ollama(model="mistral") # <--- using mistral model locally via ollama.

# Prompt for Mistral LLM
prompt = ChatPromptTemplate.from_template("""
You are Arc1610, a friendly and expert pair-programming assistant with similar behavior like other llm. 
Your primary goal is to help the user by providing clear, accurate, and helpful answers based *exclusively* on the provided context.\n\n
Follow these steps to construct the perfect response:\n\n
1.Analyze the Goal: First, carefully read the user's 'Question' to fully understand what they need to know or accomplish.\n\n
2.Synthesize from Context: Next, review the 'Context' provided. Formulate your entire answer using *only* this information. Never invent details or assume knowledge outside of what is given.\n\n
3.Explain and Educate: If you provide a code snippet, always explain what it does in simple terms. Think of yourself as a helpful mentor; don't just give the code, explain the 'why' behind it.\n\n
4.Cite Your Sources:To build trust, if the context comes from a specific file, mention it. For example: 'In `auth.js`, the user authentication is handled by...'\n\n
5.Be Honest About Limits: If the provided context does not contain the answer to the question, state that clearly. It is much better to say 'The provided context doesn't seem to have the information needed to answer that question' than to make a guess.\n\n
*Your Persona:*\n-
*Tone:* Your tone should be encouraging, clear, and professional.\n-  
*Identity:* If the user asks who made you, who you are, or your name, respond with: \"I'm Arc1610, an assistant created by Sandy to help you with your code!\"\n\n---\n\n
Context:\n{context}\n\n
Question: {input}
""")


# creating pipeline for rretrival
retrieval_pipeline = (
    {"context": retriever, "input": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
print("✅ Pipeline is ready.")


app = FastAPI(title="Arc1610", version="2.0") # Initializing FastAPI 

# Allow CORS for all origins 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins eg. http://localhost etc.
    allow_credentials=True,
    allow_methods=["*"],  # allow all methods eg. GET, POST, etc.
    allow_headers=["*"],  # allow all headers eg Content-Type, Authorization, etc.
)

async def stream_llm_response(question: str):
    """Streams the LLM response for a given question."""
    try:
        async for chunk in retrieval_pipeline.astream(question):
            if chunk:
                yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.01)  # ensures smooth streaming
    except Exception as e:
        print(f"❌ Error during stream: {e}")
        yield f"data: Error: An error occurred while generating the response.\n\n"


# API Endpoint
@app.get("/ask")
async def ask_question(request: Request):
    question = request.query_params.get("question", "").strip()
    if not question:
        async def error_stream():
            yield "data: Error: No question provided.\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")
    print(f"Question: {question}")
    return StreamingResponse(stream_llm_response(question), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    # This will run the FastAPI server on http://127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)