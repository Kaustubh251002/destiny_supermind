import json
import requests
import warnings
from typing import Optional
import os

try:
    from langflow.load import upload_file
except ImportError:
    warnings.warn("Langflow provides a function to help you upload files to the flow. Please install langflow to use it.")
    upload_file = None

BASE_API_URL = os.environ.get('BASE_API_URL')
LANGFLOW_ID = os.environ.get('LANGFLOW_ID')
FLOW_ID = os.environ.get('FLOW_ID')
APPLICATION_TOKEN = os.environ.get('APPLICATION_TOKEN')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
ENDPOINT = ""  # You can set a specific endpoint name in the flow settings

# You can tweak the flow by adding a tweaks dictionary
#THIS IS A TEMPLATE
TWEAKS = {
    "AstraDB-EKNPh": {},
    "TextInput-IA62h": {
        "input_value": "USERNAME"
    },
    "CombineText-XnSUA": {},
    "ParseData-bB1wW": {},
    "CombineText-dpoVZ": {},
    "ChatOutput-XJAAL": {},
    "GoogleGenerativeAIModel-Tdtr3": {
        "model" :"model name",
        "google_api_key" : "api_key"
    },
    "TextInput-QOITS": {
        "input_value": "QUESTION"
    }
}

class LangflowClient:
    def __init__(self, application_token: Optional[str] = APPLICATION_TOKEN, endpoint: Optional[str] = ENDPOINT):
        self.base_api_url = BASE_API_URL
        self.langflow_id = LANGFLOW_ID
        self.flow_id = FLOW_ID
        self.application_token = application_token
        self.endpoint = endpoint if endpoint else FLOW_ID

    def run_flow(self, message: str, output_type: str = "chat", input_type: str = "chat", tweaks: Optional[dict] = None) -> dict:
        """
        Run a flow with a given message and optional tweaks.

        :param message: The message to send to the flow
        :param output_type: The output type
        :param input_type: The input type
        :param tweaks: Optional tweaks to customize the flow
        :return: The JSON response from the flow
        """
        api_url = f"{self.base_api_url}/lf/{self.langflow_id}/api/v1/run/{self.endpoint}"

        payload = {
            "input_value": message,
            "output_type": output_type,
            "input_type": input_type,
        }

        headers = None
        if tweaks:
            payload["tweaks"] = tweaks
        if self.application_token:
            headers = {"Authorization": "Bearer " + self.application_token, "Content-Type": "application/json"}

        response = requests.post(api_url, json=payload, headers=headers)
        return response.json()

    def prepare_tweaks(self, message: str) -> dict:
        """
        Prepare the tweaks based on the message.

        :param message: The message to split and customize the flow components
        :return: A dictionary of tweaks
        """
        message_parts = message.split('-')
        tweaks = {
            "AstraDB-EKNPh": {},
            "TextInput-IA62h": {
                "input_value": message_parts[0]
            },
            "CombineText-XnSUA": {},
            "ParseData-bB1wW": {},
            "CombineText-dpoVZ": {},
            "ChatOutput-XJAAL": {},
            "GoogleGenerativeAIModel-Tdtr3": {
                "model": "gemini-1.5-flash",
                "google_api_key": GEMINI_API_KEY
            },
            "TextInput-QOITS": {
                "input_value": message_parts[1] if len(message_parts) > 1 else ''
            }
        }
        return tweaks

    def upload_file_to_flow(self, file_path: str, components: str, tweaks: dict) -> dict:
        """
        Upload a file to the flow.

        :param file_path: Path to the file to upload
        :param components: Components to upload the file to
        :param tweaks: Tweaks to apply during upload
        :return: Updated tweaks after file upload
        """
        if not upload_file:
            raise ImportError("Langflow is not installed. Please install it to use the upload_file function.")
        if not components:
            raise ValueError("You need to provide the components to upload the file to.")

        # Upload the file and get updated tweaks
        return upload_file(file_path=file_path, host=self.base_api_url, flow_id=self.endpoint, components=components, tweaks=tweaks)

    def execute_flow(self, message: str, output_type: str = "chat", input_type: str = "chat", file_path: Optional[str] = None, components: Optional[str] = None) -> dict:
        """
        Execute the flow with the given message and optional file upload.

        :param message: The message to send to the flow
        :param output_type: The output type
        :param input_type: The input type
        :param file_path: Optional file path to upload
        :param components: Optional components to upload the file to
        :return: The response from the flow
        """
        tweaks = self.prepare_tweaks(message)

        if file_path:
            tweaks = self.upload_file_to_flow(file_path=file_path, components=components, tweaks=tweaks)

        response = self.run_flow(message, output_type, input_type, tweaks)
        return response


# Example of how you would use this class:
if __name__ == "__main__":
    # Instantiate the LangflowClient
    client = LangflowClient()

    # Call the `execute_flow` method with parameters
    response = client.execute_flow(
        message="username iamsrk - how many likes do i get on average?",
        output_type="chat",
        input_type="chat"
    )

    # Print the response
    print(json.dumps(response, indent=2))
