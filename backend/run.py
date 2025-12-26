# This is the entry point of our Flask backend application.
# When we run "python run.py", this file:
#   1. Imports the Flask app created in app/__init__.py
#   2. Starts the backend server on http://localhost:5000
# ---------------------------------------------------------

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
