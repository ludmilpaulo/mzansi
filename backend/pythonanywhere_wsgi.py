"""WSGI entry for PythonAnywhere.

Copy or point /var/www/kudya_pythonanywhere_com_wsgi.py at this file.
"""

from pathlib import Path
import sys

BACKEND_DIR = Path("/home/kudya/mzansi/backend")
REPO_DIR = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(REPO_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")

from config.wsgi import application  # noqa: E402
