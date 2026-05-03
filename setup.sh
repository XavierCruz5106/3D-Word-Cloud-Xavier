#!/bin/bash

echo "Setting up backend..."

cd backend

python3 -m venv venv

source venv/bin/activate

python3 -m pip install --upgrade pip
pip3 install -r requirements.txt

cd ..

echo "Setting up frontend..."

cd frontend
npm install
cd ..

echo "Starting backend + frontend..."

# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!

cd ..

# Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"

wait $BACKEND_PID $FRONTEND_PID