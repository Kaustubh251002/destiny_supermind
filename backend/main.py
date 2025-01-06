from fastapi import FastAPI, Query, HTTPException
import os
from dotenv import load_dotenv
from astrapy import DataAPIClient
from insta_fetch import fetch_posts_parallel
import uuid
import json
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize FastAPI app
app = FastAPI(title="Instagram Data Insights API", description="API for fetching and analyzing Instagram data.")

# Load environment variables
ASTRADB_TOKEN = os.getenv("ASTRADB_TOKEN")
DATASTAX_API_ENDPOINT = os.getenv("DATASTAX_API_ENDPOINT")
COLLECTION_NAME = "instagram"
DATA_COUNT = 1000
INSTALOADER_FETCH_COUNT = 100

# Initialize Astra DB client
try:
    client = DataAPIClient(ASTRADB_TOKEN)
    db = client.get_database_by_api_endpoint(DATASTAX_API_ENDPOINT)
except Exception as e:
    logging.error(f"Error initializing Astra DB client: {e}")
    raise RuntimeError("Failed to initialize Astra DB client.")

# Helper functions
def get_collection(collection_name):
    """
    Get a collection from Astra DB.
    :param collection_name: The name of the collection.
    :return: Collection object.
    """
    try:
        return db.get_collection(collection_name)
    except Exception as e:
        logging.error(f"Error fetching collection '{collection_name}': {e}")
        raise HTTPException(status_code=500, detail="Error fetching collection from Astra DB.")

def get_astra_data(username, count, collection_name):
    """
    Fetch data from Astra DB based on username and count.
    :param username: The username to query.
    :param count: Number of records to fetch.
    :param collection_name: The name of the collection.
    :return: Query results.
    """
    try:
        collection = get_collection(collection_name)
        results = collection.find(
            filter={"$and": [{"metadata.username": {"$eq": username}}]},
            sort={"$vectorize": username},
            limit=count,
            projection={"$vectorize": True},
            include_similarity=True,
            max_time_ms=300000
        )
        return results
    except Exception as e:
        logging.error(f"Error querying data for username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Error querying data from Astra DB.")

# API Endpoints
@app.get("/api/v1/health", summary="Health Check", description="Endpoint to check the health of the API.")
async def health():
    """
    Health check endpoint to verify the API is running.
    :return: A simple health status.
    """
    return {"status": "healthy"}

@app.get("/api/v1/getData", summary="Fetch Instagram Data", description="Fetch Instagram data for a given username and count.")
async def get_data(
    username: str = Query(..., description="Username to fetch data for"),
    count: int = Query(..., description="Number of data items to fetch")
):
    """
    Endpoint to get Instagram data based on username and count.
    :param username: The username to query data for.
    :param count: The number of data items to return.
    :return: A list of documents with the requested data.
    """
    try:
        logging.info(f"Fetching data for username: {username}, count: {count}")

        # Attempt to fetch data from Astra DB
        data = get_astra_data(username, count, COLLECTION_NAME)
        result = [doc for doc in data]

        # If no data is found, fetch from Instagram
        if not result:
            logging.warning(f"No data found for username '{username}' in Astra DB. Fetching from Instagram.")
            fetch_posts_parallel(
                [username],
                max_posts=INSTALOADER_FETCH_COUNT,
                output_file="./live_data/data.json",
                num_workers=10,
                num_loaders=10
            )

            # Load fetched data from file
            try:
                with open("./live_data/data.json", "r") as file:
                    json_data = json.load(file)
            except Exception as e:
                logging.error(f"Error loading fetched data: {e}")
                raise HTTPException(status_code=500, detail="Error loading fetched data.")

            # Transform and insert data into Astra DB
            for document in json_data:
                document["$vectorize"] = document.pop("username")
                document["_id"] = uuid.uuid4().hex

            collection = get_collection(COLLECTION_NAME)
            insertion_result = collection.insert_many(json_data)

            if not insertion_result.inserted_ids:
                logging.error("No data inserted into Astra DB.")
                raise HTTPException(status_code=500, detail="No data inserted into Astra DB.")

            # Retrieve the newly inserted data
            data = get_astra_data(username, count, COLLECTION_NAME)
            result = [doc for doc in data]


        logging.info(f"Successfully fetched data for username: {username}")
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Unexpected error while fetching data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

# Uncomment and implement additional endpoints as needed
@app.get("/api/v1/getInsights", summary="Get Data Insights", description="Fetch insights based on username and query.")
async def get_insights(username: str, query: str):
    """
    Placeholder for an endpoint to fetch data insights.
    """
    pass
