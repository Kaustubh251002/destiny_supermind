export const fetchData = async (username, count) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      // Log the entire `process.env` object to see if the variable is defined
      console.error("Environment variables:", process.env);

      // Explicitly log a warning for the missing variable
      throw new Error(
        "Backend URL is not defined in the .env file or is not exposed properly in the production environment."
      );
    }

    // Log the URL being fetched for debugging purposes
    console.log(`Fetching data from: ${backendUrl}/getData?username=${username}&count=${count}`);

    const response = await fetch(
      `${backendUrl}/getData?username=${encodeURIComponent(username)}&count=${count}`
    );

    if (!response.ok) {
      // Log the HTTP status and response for debugging
      const errorText = await response.text();
      console.log(`HTTP Error: ${response.status}`, errorText);
      // throw new Error(`Error fetching data: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Log the detailed error message
    console.error("Error in fetchData:", error.message);
    console.error("Stack trace:", error.stack);
    throw error; // Rethrow the error to propagate it to the caller
  }
};
