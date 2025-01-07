// utils/fetchData.ts
import { DataAPIClient } from "@datastax/astra-db-ts";

const token = process.env.ASTRA_DB_APPLICATION_TOKEN as string;
const endpoint = process.env.ASTRA_DB_API_ENDPOINT as string;
const collectionName = "insta_json_metadata";

// Utility function to fetch user metadata
export const fetchData = async (userID: string) => {
  try {
    // Initialize Astra DB client
    const client = new DataAPIClient(token);
    const database = client.db(endpoint);
    const collection = database.collection(collectionName);

    // Query for the user metadata by $vectorize field
    const query = { $vectorize: userID };
    const userMetadata = await collection.findOne(query);

    // Close the client after use
    await client.close();

    // Return the filtered metadata if it exists
    if (userMetadata) {
      return {
        username: userMetadata.$vectorize,
        metadata: userMetadata.metadata,
      };
    }

    // If no user found, return null
    return null;
  } catch (error) {
    console.error("Error fetching user metadata:", error);
    throw new Error("Unable to fetch user metadata");
  }
};
