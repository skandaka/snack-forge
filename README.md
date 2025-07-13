# 🍔 SnackSmith: The AI-Powered 3D Snack Builder

<div align="center">
<img src="https://raw.githubusercontent.com/skandaka/snack-forge/main/frontend/public/logo.png" alt="SnackSmith Logo" width="150">
<p>
<strong>Forge the perfect healthy snack with the power of AI and 3D visualization.</strong>
</p>
<p>
<a href="#-key-features">Key Features</a> •
<a href="#-tech-stack">Tech Stack</a> •
<a href="#-getting-started">Getting Started</a> •
<a href="#-troubleshooting">Troubleshooting</a>
</p>
</div>

---

**SnackSmith** is a revolutionary web application that transforms the way you create and understand healthy snacks. Move beyond simple recipes and step into a 3D, interactive workspace where you can visually construct energy bars, protein balls, and snack bowls. As you add ingredients, you get instant nutritional feedback and intelligent suggestions from a powerful AI coach, helping you design snacks that are not only delicious but perfectly tailored to your health goals.

## ✨ Key Features

* **Interactive 3D Canvas:** Drag and drop ingredients into a live 3D scene powered by `React Three Fiber` and `three.js`.
* **Real-Time Nutrition Analysis:** A robust Python backend calculates detailed nutritional information for your creation as you build it.
* **Live AI Coaching (Powered by Google Gemini):** Chat with an AI, get one-click snack improvements, and receive new snack recommendations.
* **Dynamic UI:** A professional, responsive interface built with Next.js, TypeScript, and Tailwind CSS.
* **State Management with Zustand:** A centralized store ensures the UI, 3D canvas, and AI coach are always in sync.

## 🛠️ Tech Stack

| Area       | Technology                                                                                                   |
| :--------- | :----------------------------------------------------------------------------------------------------------- |
| **Frontend** | [**Next.js**](https://nextjs.org/), [**React**](https://reactjs.org/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **3D** | [**React Three Fiber**](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), [**three.js**](https://threejs.org/), [**Drei**](https://github.com/pmndrs/drei)      |
| **AI** | [**Google Gemini API**](https://ai.google.dev/)                                                              |
| **State** | [**Zustand**](https://github.com/pmndrs/zustand)                                                             |
| **Backend** | [**FastAPI**](https://fastapi.tiangolo.com/)/[**Flask**](https://flask.palletsprojects.com/) with [**Uvicorn**](https://www.uvicorn.org/) Server |
| **Styling** | [**Framer Motion**](https://www.framer.com/motion/) for animations                                           |


## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine. These steps are designed to be universal for **Windows, macOS, and Linux**.

### Prerequisites

* **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
* **Python** (v3.8 or later) - [Download here](https://www.python.org/)
    * **Important (Windows):** During installation, make sure to check the box that says **"Add Python to PATH"**.
* A **Google Gemini API Key**.

### 1. Clone the Repository

First, clone the project to your local machine using Git.

```bash
git clone [https://github.com/skandaka/snack-forge.git](https://github.com/skandaka/snack-forge.git)
cd snack-forge
```

### 2. Backend Setup (Python)

This is the most critical step. **Follow the order carefully.**

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a Python virtual environment
#    On macOS/Linux:
python3 -m venv venv
#    On Windows:
python -m venv venv

# 3. Activate the virtual environment. YOU MUST DO THIS BEFORE INSTALLING PACKAGES.
#    On macOS/Linux (zsh, bash):
source venv/bin/activate
#    On Windows (Command Prompt):
venv\Scripts\activate
#    On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

#    Your terminal prompt should now show `(venv)` at the beginning.

# 4. Install the required Python packages INTO the activated virtual environment.
pip install -r requirements.txt

# 5. (Optional) Verify the installation. This command should show uvicorn's details.
pip show uvicorn
```

### 3. Frontend Setup (Next.js)

These steps set up the user interface and AI components.

```bash
# Navigate to the frontend directory from the project's root folder
cd ../frontend

# Install Node.js dependencies
npm install
```

### 4. Environment Variables (Critical for AI)

The AI features will not work without a Google Gemini API key.

1.  Visit [**Google AI Studio**](https://aistudio.google.com/) and click "**Get API key**" to create your free key.
2.  In the `frontend` directory, **create a new file** named `.env.local`.
3.  Open the `.env.local` file and add your API key exactly like this, replacing `YOUR_API_KEY_HERE` with the key you just copied:
    ```env
    NEXT_PUBLIC_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

### 5. Running the Application

You must run both the backend and frontend servers at the same time in **two separate terminal windows**.

#### Terminal 1: Start the Backend

```bash
# Make sure you are in the 'backend' directory
# From project root: cd backend

# Activate the virtual environment if it's not already active
# macOS/Linux: source venv/bin/activate
# Windows: venv\Scripts\activate

# Run the Uvicorn server. This is the correct command.
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
You should see output indicating the server is running on `http://0.0.0.0:8000`. Leave this terminal running.

#### Terminal 2: Start the Frontend

```bash
# Make sure you are in the 'frontend' directory
# From project root: cd frontend

# Run the Next.js development server
npm run dev
```
The frontend will start up and be available at `http://localhost:3000`.

Open `http://localhost:3000` in your browser. You can now start building snacks!

## 🔍 Troubleshooting

* **Error: `No module named Flask` or `No module named uvicorn`**
    * **Cause:** This is the most common error. It means you ran `pip install -r requirements.txt` **before** activating the virtual environment. The packages were installed globally instead of inside your project's isolated `venv` folder.
    * **Solution:**
        1.  Navigate to the `backend` directory.
        2.  Activate the virtual environment (`source venv/bin/activate` or `venv\Scripts\activate`).
        3.  Run `pip install -r requirements.txt` again. This will install the packages in the correct location.
        4.  Run the server with `uvicorn app:app --reload --host 0.0.0.0 --port 8000`.

* **AI Features Not Working / "Check your API key" error:**
    * **Cause:** The Gemini API key is missing, incorrect, or not loaded properly.
    * **Solution:**
        1.  Ensure the file in the `frontend` directory is named exactly `.env.local`.
        2.  Double-check that the variable name inside the file is `NEXT_PUBLIC_GEMINI_API_KEY`.
        3.  **You must restart the `npm run dev` server** after creating or changing the `.env.local` file.
* **Ingredients Not Loading:**
       * **Solution:**
             -> Reload the page!
        
