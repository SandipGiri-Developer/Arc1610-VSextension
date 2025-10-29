import os
import chardet
from langchain_core.documents.base import Document
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# SET UP THE ENVIRONMENT
CODEBASE_PATH = "Sample-College-ERP"  # <--- Change this to your codebase path
FAISS_INDEX_PATH = "faiss_index"    # <--- Path to save & load FAISS index

# UNIVERSAL TEXT LOADER 
class UniversalTextLoader(TextLoader):# compatibel with all the encoding.
    def lazy_load(self):
        with open(self.file_path, "rb") as f:
            raw = f.read()
            result = chardet.detect(raw)
            encoding = result["encoding"] or "utf-8"
        with open(self.file_path, encoding=encoding, errors="ignore") as f:
            text = f.read()
        # Yield a Document object
        yield Document(page_content=text, metadata={"source": self.file_path})

#  CREATE VECTOR STORE 
def create_vector_store():
    
    print(f"Loading codebase from '{CODEBASE_PATH}'...")

    loader = DirectoryLoader( # loading the codebase directory
        CODEBASE_PATH,
        glob="**/*[.js,.jsx,.ts,.tsx,.css,.html,.json,.md,.pdf,.png,.svg]", # ensuring works with all the file types.(can add or remove cause sometime it can raise errors)
        loader_cls=UniversalTextLoader,            # for diff encoding files
        exclude=["**/node_modules/**", "**/dist/**", "**/build/**"] # excluding unneccessary and too big folders to save  your time and resources.
    )

    documents = loader.load() # loading doc
    if not documents:
        print("No documents found. Check CODEBASE_PATH and glob pattern.")
        return

    print(f"Loaded {len(documents)} documents.") # number of doc loaded

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200) # splitting doc into chunks of 1000 tokens
    docs = text_splitter.split_documents(documents) # splitting documents
    print(f"Split into {len(docs)} chunks.") # number of chunks created

    print("Creating embeddings... (This may take some time for many files)")
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2") # using sentece transformer embeddings with model all-MiniLM-L6-v2(lightweight and fast)
    vector_store = FAISS.from_documents(docs, embeddings) 
    vector_store.save_local(FAISS_INDEX_PATH)# saving vector 
    print(f"Vector store saved to '{FAISS_INDEX_PATH}'")

if __name__ == "__main__":
    if not os.path.exists(FAISS_INDEX_PATH):
        create_vector_store()
    else:
        print(f"FAISS index already exists at '{FAISS_INDEX_PATH}'. Delete it if you want to recreate the index with updated changes in your project.")
