from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from astrapy import DataAPIClient
from llm_fetch import GeminiClient
from langflow_fetch import LangflowClient, getInsightsFromLangflow
from insta_indiv_fetch import fetch_posts_parallel
import uuid
import json
import logging
import asyncio
from datetime import datetime

# Custom exceptions
class AstraDBError(Exception):
    """Raised when AstraDB operations fail"""
    pass

class InstagramFetchError(Exception):
    """Raised when Instagram data fetching fails"""
    pass

class ConfigError(Exception):
    """Raised when configuration or environment variables are invalid"""
    pass

# API Clients singleton class
class APIClients:
    _instance = None
    
    def __init__(self):
        self.db_client = None
        self.gemini_client = None
        self.langflow_client = None
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def initialize(self):
        """Initialize all API clients"""
        try:
            # Initialize AstraDB client
            client = await asyncio.to_thread(
                lambda: DataAPIClient(os.getenv("ASTRADB_TOKEN"))
            )
            self.db_client = await asyncio.to_thread(
                lambda: client.get_database_by_api_endpoint(os.getenv("DATASTAX_API_ENDPOINT"))
            )
            
            # Initialize Gemini client
            self.gemini_client = await asyncio.to_thread(GeminiClient)
            
            # Initialize Langflow client
            self.langflow_client = await asyncio.to_thread(LangflowClient)
            
            logger.info("All API clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize API clients: {str(e)}")
            raise

# Configure logging
def setup_logging():
    logger = logging.getLogger("instagram-api")
    logger.setLevel(logging.INFO)
    
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

# Initialize logger
logger = setup_logging()

# Constants
COLLECTION_NAME = "instagram"
DATA_COUNT = 1000
INSTALOADER_FETCH_COUNT = 100
MAX_WORKERS = 10

# Load environment variables
async def init_environment():
    """Initialize and validate environment variables asynchronously"""
    try:
        if os.path.exists('../.env'):
            load_dotenv('../.env')
        else:
            load_dotenv()
        
        required_vars = ['ASTRADB_TOKEN', 'DATASTAX_API_ENDPOINT', 'GEMINI_PROMPT', 'GEMINI_PROMPT_2']
        missing = [var for var in required_vars if not os.getenv(var)]
        
        if missing:
            raise ConfigError(f"Missing required environment variables: {', '.join(missing)}")
            
        logger.info("Environment variables loaded successfully")
    except Exception as e:
        logger.error(f"Environment initialization failed: {str(e)}")
        raise

# Initialize FastAPI app
app = FastAPI(
    title="Instagram Data Insights API",
    description="API for fetching and analyzing Instagram data"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize environment and clients on startup
@app.on_event("startup")
async def startup_event():
    try:
        await init_environment()
        await APIClients.get_instance().initialize()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

async def get_collection(collection_name: str):
    """Get AstraDB collection with error handling asynchronously"""
    try:
        db = APIClients.get_instance().db_client
        return await asyncio.to_thread(lambda: db.get_collection(collection_name))
    except Exception as e:
        logger.error(f"Failed to get collection {collection_name}: {str(e)}")
        raise AstraDBError(f"Collection access failed: {str(e)}")

async def get_astra_data(username: str, count: int, collection_name: str) -> List[Dict[str, Any]]:
    """Fetch data from AstraDB asynchronously"""
    try:
        collection = await get_collection(collection_name)
        results = await asyncio.to_thread(
            lambda: collection.find(
                filter={"$and": [{"metadata.username": {"$eq": username}}]},
                sort={"$vectorize": username},
                limit=count,
                projection={"$vectorize": True},
                include_similarity=True
            )
        )
        return list(results)
    except Exception as e:
        logger.error(f"Data fetch failed for {username}: {str(e)}")
        raise AstraDBError(f"Data fetch failed: {str(e)}")

def format_data_as_csv(data: List[Dict[str, Any]]) -> str:
    """Format data as CSV string"""
    try:
        csv_lines = []
        for item in data:
            metadata = item.get('metadata', {})
            row = [
                str(metadata.get("post_id", "")),
                str(metadata.get("likes", "")),
                str(metadata.get("comments", "")),
                str(metadata.get("views", "")),
                str(metadata.get("timestamp", "")),
                str(metadata.get("hashtags", [])),
                str(metadata.get("caption", "").strip().replace('\n', ' ')),
                str(metadata.get("type", ""))
            ]
            csv_lines.append(",".join(row))
        return "\n".join(csv_lines)
    except Exception as e:
        logger.error(f"CSV formatting failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to format data")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    try:
        await get_collection(COLLECTION_NAME)
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/getData")
async def get_data(
    username: str = Query(..., min_length=1, max_length=30),
    count: int = Query(..., gt=0, le=1000)
):
    """Fetch Instagram data endpoint"""
    try:
        logger.info(f"Fetching data for username: {username}, count: {count}")
        
        # Try AstraDB first
        result = await get_astra_data(username, count, COLLECTION_NAME)
        
        # Fallback to Instagram fetch if no data
        if not result:
            logger.info(f"No data found in AstraDB for {username}, fetching from Instagram")
            try:
                # Ensure directory exists
                await asyncio.to_thread(lambda: os.makedirs("./live_data", exist_ok=True))
                
                # Fetch posts from Instagram - wrapped in asyncio.to_thread since fetch_posts_parallel is synchronous
                await asyncio.to_thread(
                    fetch_posts_parallel,
                    username,
                    max_posts=INSTALOADER_FETCH_COUNT,
                    output_file="./live_data/data.json",
                    num_workers=MAX_WORKERS
                )
                
                # Read the fetched data
                json_data = await asyncio.to_thread(
                    lambda: json.load(open("./live_data/data.json", "r"))
                )
                
                if not json_data:
                    raise InstagramFetchError("No data fetched from Instagram")
                
                # Process and store data
                processed_data = []
                for doc in json_data:
                    doc["$vectorize"] = doc.pop("username")
                    doc["_id"] = uuid.uuid4().hex
                    processed_data.append(doc)
                
                # Store in AstraDB
                collection = await get_collection(COLLECTION_NAME)
                await asyncio.to_thread(
                    lambda: collection.insert_many(processed_data)
                )
                result = processed_data
                
                logger.info(f"Successfully fetched and stored {len(result)} posts for {username}")
                
            except Exception as e:
                logger.error(f"Instagram fetch failed: {str(e)}")
                raise InstagramFetchError(f"Instagram fetch failed: {str(e)}")
            finally:
                # Cleanup
                if os.path.exists("./live_data/data.json"):
                    await asyncio.to_thread(lambda: os.remove("./live_data/data.json"))
        
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in getData: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/getInsights")
async def get_insights(
    username: str = Query(..., min_length=1, max_length=30),
    query: str = Query(..., min_length=1)
):
    """Get insights endpoint"""
    try:
        logger.info(f"Generating insights for {username} with query: {query}")
        
        # Try Langflow first
        try:
            response = await asyncio.to_thread(
                getInsightsFromLangflow,
                username,
                query,
                APIClients.get_instance().langflow_client
            )
            logger.info("Successfully generated insights using Langflow")
            return response
        except Exception as e:
            logger.warning(f"Langflow insights failed, falling back to Gemini: {str(e)}")
            
            # Fallback to Gemini
            data = await get_astra_data(username, DATA_COUNT, COLLECTION_NAME)
            formatted_data = format_data_as_csv(data)
            
            prompt = f"{os.getenv('GEMINI_PROMPT')}\n{query}\n{os.getenv('GEMINI_PROMPT_2')}\n{formatted_data}"
            
            response = await asyncio.to_thread(
                APIClients.get_instance().gemini_client.get_response,
                prompt
            )

            response = response.text
            
            logger.info("Successfully generated insights using Gemini fallback")
            return {"response": response}
            
    except Exception as e:
        logger.error(f"Insights generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        # Add any cleanup operations here
        logger.info("Application shutting down")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")

app.add_event_handler("shutdown", shutdown_event)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)