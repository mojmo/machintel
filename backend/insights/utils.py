import os
import google.generativeai as genai
from google.auth.exceptions import DefaultCredentialsError
from dotenv import load_dotenv
import pandas as pd
from .models import Insight
from datasets.models import Dataset


load_dotenv()

def generate_insight(dataset_id, dataset_file_path):

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if DefaultCredentialsError(GEMINI_API_KEY) is None:
        return "Gemini API key is not set. Please set the GEMINI_API_KEY environment variable."
    
    dataset = Dataset.objects.get(id=dataset_id)
    
    df = pd.read_csv(dataset_file_path)
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"Analyze this dataset about CNC milling machines and provide detailed insights.\n{df}"
    response = model.generate_content(prompt)
    
    if response.text:
        processed_recommendation = process_gemini_response(response.text)
        Insight.objects.create(
            dataset=dataset,
            recommendation=processed_recommendation,
        )
    else:
        raise Exception("Failed to generate insights from the dataset.")


import markdown
from django.utils.html import escape

def process_gemini_response(response_text):
    try:
        # Attempt to convert Markdown to HTML
        html_content = markdown.markdown(response_text)
        return html_content
    except Exception:
        # Fallback to escaping plain text
        return escape(response_text)