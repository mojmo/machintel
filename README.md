# MachIntel

![MachIntel Logo](/frontend/public/settings-icon.svg)

## Project Overview
MachIntel is a machine learning-based predictive maintenance system for CNC milling machines. It leverages data analytics and AI to predict potential machine failures before they occur, helping manufacturers reduce downtime, optimize maintenance schedules, and extend equipment lifetime.

### Key Features
- 🔍 **Predictive Maintenance Analysis**: Detect potential failures before they happen
- 🧠 **AI-Powered Insights**: Get intelligent recommendations based on your machine data
- 📊 **Comprehensive Visualizations**: Interactive charts for understanding machine performance
- 📤 **Easy Dataset Upload**: Simple CSV upload interface for quick analysis
- 🔄 **Real-time Processing**: Fast data processing for immediate predictions

## Tech Stack

### Backend
- **Framework**: Django with Django REST Framework
- **Machine Learning**: Scikit-learn with SMOTE for class balancing
- **Task Processing**: Celery for asynchronous tasks
- **AI Integration**: Google Gemini for advanced analytics
- **Database**: PostgreSQL

### Frontend
- **Framework**: React with Vite
- **State Management**: React Context API
- **Routing**: React Router
- **Visualization**: Chart.js with React-Chartjs-2
- **Styling**: CSS with responsive design
- **Animations**: Framer Motion

## Machine Learning Model

MachIntel uses a decision tree classifier with SMOTE (Synthetic Minority Over-sampling Technique) for handling class imbalance in CNC machine failure prediction. The model processes several key features:

- Machine Type (High/Medium/Low)
- Air temperature (K)
- Process temperature (K)
- Rotational speed (rpm)
- Torque (Nm)
- Tool wear (min)

The preprocessing pipeline applies:
- Passthrough for numerical features
- OneHotEncoder for categorical features
- SMOTE for balancing the dataset

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Google Gemini API key (for AI insights feature)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mojmo/machintel.git
   cd machintel
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Create an environment file:
   ```bash
   cp .env.template .env
   ```
   Edit the `.env` file with your database credentials and API keys.

5. Apply migrations and create a superuser:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

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
   npm run dev
   ```

4. The application will be available at `http://localhost:5173`

## Usage Guide

### Uploading Datasets
1. Navigate to the Upload page
2. Select a CSV file containing CNC machine data
3. The system expects columns for:
   - Product ID
   - Type (H, M, or L)
   - Air temperature [K]
   - Process temperature [K]
   - Rotational speed [rpm]
   - Torque [Nm]
   - Tool wear [min]

### Viewing Dataset Analytics
1. Go to the Datasets page
2. Click on a dataset to view:
   - Basic statistics (averages for temperature, tool wear, etc.)
   - Machine type distribution
   - Temperature correlations
   - Rotational speed vs. torque analysis
   - Tool wear trends

### Getting Predictions
1. Navigate to a dataset's details page
2. Click "Generate Predictions"
3. Review the prediction results showing:
   - Product IDs with potential failure risks
   - Confidence scores for each prediction
   - Feature details that influenced the prediction

### AI Recommendations
1. Go to the Recommendations page
2. Select a dataset to analyze
3. The system will use Google Gemini to provide in-depth insights about your machine data

## Environment Variables

Create a `.env` file based on `.env.template` with the following variables:

```
# Database settings
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Django secret key
SECRET_KEY=your_secret_key

# JWT settings
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

## Project Structure

```
machintel/
│
├── backend/                  # Django backend
│   ├── config/               # Project settings
│   ├── authentication/       # User auth
│   ├── datasets/             # Dataset management
│   ├── insights/             # AI insights
│   ├── ml_model/             # ML implementation
│   ├── predictions/          # Prediction APIs
│   └── users/                # User management
│
├── frontend/                 # React frontend
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # React components
│       │   ├── Layout/       # App layout components
│       │   └── Pages/        # Page components
│       ├── config/           # Frontend config
│       └── App.jsx           # Main application
│
└── data/                     # Sample data files
    └── ai4i2020.csv          # Training dataset
```

## License

[MIT License](LICENSE)

## Contributors

- [Mugtaba Mohamed](https://github.com/mojmo)
- [Mohamed Ahmed](https://github.com/piorto)
- [Makkawy Alnoman](https://github.com/Makkawy-Alnouman)

## Acknowledgments

- Dataset based on the AI4I 2020 Predictive Maintenance Dataset