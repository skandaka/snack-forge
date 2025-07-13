
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

* **Interactive 3D Canvas:** Drag and drop ingredients into a live 3D scene powered by `React Three Fiber` and `three.js`. Watch your snack come to life with procedurally generated models for each ingredient.
* **Real-Time Nutrition Analysis:** A robust Python backend calculates detailed nutritional information (calories, macros, vitamins) for your creation as you build it.
* **Live AI Coaching (Powered by Google Gemini):**
    * **Chat with an AI:** Ask questions about your snack, get suggestions, and receive instant feedback.
    * **One-Click Improvements:** Ask the AI to automatically optimize your snack for goals like "higher protein" or "lower sugar."
    * **AI-Generated Recommendations:** Let the AI invent a completely new snack for you based on your saved preferences.
* **Dynamic UI:** A professional, responsive interface built with Next.js, TypeScript, and Tailwind CSS, featuring resizable panels and a modern aesthetic.
* **State Management with Zustand:** A centralized store ensures the UI, 3D canvas, and AI coach are always in sync.
* **Full-Stack Architecture:** A decoupled frontend and backend architecture for scalability and separation of concerns.

## 🛠️ Tech Stack

| Area       | Technology                                                                                                   |
| :--------- | :----------------------------------------------------------------------------------------------------------- |
| **Frontend** | [**Next.js**](https://nextjs.org/), [**React**](https://reactjs.org/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **3D** | [**React Three Fiber**](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), [**three.js**](https://threejs.org/), [**Drei**](https://github.com/pmndrs/drei)      |
| **AI** | [**Google Gemini API**](https://ai.google.dev/)                                                              |
| **State** | [**Zustand**](https://github.com/pmndrs/zustand)                                                             |
| **Backend** | [**Flask**](https://flask.palletsprojects.com/), [**Python**](https://www.python.org/)                                                               |
| **Styling** | [**Framer Motion**](https://www.framer.com/motion/) for animations                                           |

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine. These steps are designed to be universal for **Windows, macOS, and Linux**.

### Prerequisites

* **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
* **Python** (v3.8 or later) - [Download here](https://www.python.org/)
    * During installation on Windows, make sure to check the box that says **"Add Python to PATH"**.
* A **Google Gemini API Key**.

### 1. Clone the Repository

First, clone the project to your local machine using Git.

```bash
git clone [https://github.com/skandaka/snack-forge.git](https://github.com/skandaka/snack-forge.git)
cd snack-forge
```

### 2. Backend Setup (Python)

These steps set up the Python server that handles nutrition calculations.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
# On macOS/Linux:
python3 -m venv venv
# On Windows:
python -m venv venv

# Activate the virtual environment
# On macOS/Linux (zsh, bash):
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install the required Python packages
pip install -r requirements.txt
```

### 3. Frontend Setup (Next.js)

These steps set up the user interface and AI components.

```bash
# Navigate to the frontend directory from the root
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
cd path/to/your/project/snack-forge/backend

# Activate the virtual environment if it's not already active
# macOS/Linux: source venv/bin/activate
# Windows: venv\Scripts\activate

# Run the Flask server using the python module for compatibility
# On macOS/Linux:
python3 -m flask run
# On Windows:
python -m flask run
```

You should see output indicating the server is running on `http://127.0.0.1:5000`. Leave this terminal running.

#### Terminal 2: Start the Frontend

```bash
# Make sure you are in the 'frontend' directory
cd path/to/your/project/snack-forge/frontend

# Run the Next.js development server
npm run dev
```

The frontend will start up and be available at `http://localhost:3000`.

Open `http://localhost:3000` in your browser. You can now start building snacks!

## 🔍 Troubleshooting

* **Error: `command not found: flask` or `zsh: command not found: flask`**
    * **Cause:** The Python virtual environment is not active, or Python scripts are not in your system's PATH.
    * **Solution:** Always run the backend server using the command `python3 -m flask run` (or `python -m flask run` on Windows). This command uses the Python interpreter to find and run the `flask` module directly, bypassing any PATH issues.
* **AI Features Not Working / "Check your API key" error:**
    * **Cause:** The Gemini API key is missing, incorrect, or not loaded properly.
    * **Solution:**
        1.  Ensure the file in the `frontend` directory is named exactly `.env.local`.
        2.  Double-check that the variable name inside the file is `NEXT_PUBLIC_GEMINI_API_KEY`.
        3.  Make sure you have restarted the `npm run dev` server after creating or changing the `.env.local` file.
* **Error: `Cannot find module '...'` during `npm install` or `npm run dev`:**
    * **Cause:** Your `node_modules` directory might be corrupted.
    * **Solution:** Delete the `node_modules` folder and the `package-lock.json` file in the `frontend` directory, then run `npm install` again.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, find a bug, or want to improve the code, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
