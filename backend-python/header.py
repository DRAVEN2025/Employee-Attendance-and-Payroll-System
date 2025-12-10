from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

cors = CORS(app, 
    origins=['http://localhost:5173'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
    supports_credentials=True
)