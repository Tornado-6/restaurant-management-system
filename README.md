# Restaurant Management System

A comprehensive restaurant management system built with Django REST Framework and React.

## Features

- User Authentication and Authorization
- Kitchen Management
- Order Processing
- Table Management
- Real-time Updates
- Modern React Frontend

## Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
```bash
python manage.py runserver
```

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Project Structure

```
restaurant-management-system/
├── backend/
│   ├── authentication/
│   ├── kitchen/
│   ├── orders/
│   ├── tables/
│   └── core/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── requirements.txt
└── README.md
```
