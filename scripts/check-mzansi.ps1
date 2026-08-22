$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location (Join-Path $root "backend")
if (Test-Path ".\.venv\Scripts\python.exe") {
    .\.venv\Scripts\python.exe manage.py check
    .\.venv\Scripts\python.exe manage.py test
} else {
    python manage.py check
    python manage.py test
}
Pop-Location

Push-Location (Join-Path $root "web")
npm run lint
npm test
Pop-Location

Push-Location (Join-Path $root "mobile")
npm run lint
npm test
Pop-Location
