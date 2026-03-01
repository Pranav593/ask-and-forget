import firebase_admin
from firebase_admin import credentials, firestore
import os

db = None

if os.path.exists("serviceAccountKey.json"):
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print("Warning: serviceAccountKey.json not found. Firebase operations will fail.")
