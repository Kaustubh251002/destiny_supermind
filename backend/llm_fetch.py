import google.generativeai as genai
import os
from dotenv import load_dotenv

def setup_gemini():
    """
    Initialize the Gemini API with credentials
    """
    try:
        # Load environment variables from .env file
        load_dotenv()
        
        # Get API key from environment variable
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        # Configure the Gemini API
        genai.configure(api_key=api_key)
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        return model
        
    except Exception as e:
        print(f"Error setting up Gemini: {str(e)}")
        return None

def get_gemini_response(prompt, temperature=0.7):
    """
    Get a response from Gemini for a given prompt
    
    Args:
        prompt (str): The input prompt to send to Gemini
        temperature (float): Controls randomness in the response (0.0 to 1.0)
    
    Returns:
        str: The generated response
    """
    try:
        # Setup the model
        model = setup_gemini()
        if not model:
            return "Failed to initialize Gemini"
            
        # Generate the response
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature
            )
        )
        
        # Return the response text
        return response.text
        
    except Exception as e:
        return f"Error generating response: {str(e)}"

def main():
    # Example usage
    prompt = "Explain the concept of quantum computing in simple terms"
    
    print("Sending prompt to Gemini...")
    response = get_gemini_response(prompt)
    
    print("\nPrompt:", prompt)
    print("\nResponse:", response)

if __name__ == "__main__":
    main()