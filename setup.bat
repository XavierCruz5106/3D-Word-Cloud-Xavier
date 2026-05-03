@echo off

echo Setting up backend...

cd backend

python -m venv venv
call venv\Scripts\activate

python -m pip install --upgrade pip
pip install -r requirements.txt

cd ..

echo Setting up frontend...

pushd frontend

call npm install

popd

echo Starting backend...

start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo Starting frontend...

start cmd /k "cd frontend && npm run dev"

echo.
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
pause