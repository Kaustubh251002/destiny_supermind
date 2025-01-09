export const fetchData = async (username, count) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      throw new Error("Backend URL is not defined in the .env file.");
    }

    const response = await fetch(
      `${backendUrl}/getData?username=${encodeURIComponent(username)}&count=${count}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching data`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchData:", error);
    throw error;
  }
};
