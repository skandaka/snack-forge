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
    <a href="#-environment-variables">Configuration</a> •
    <a href="#-contributing">Contributing</a>
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

| Area      | Technology                                                                                                  |
| :-------- | :---------------------------------------------------------------------------------------------------------- |
| **Frontend** | [**Next.js**](https://nextjs.org/), [**React**](https://reactjs.org/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **3D** | [**React Three Fiber**](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), [**three.js**](https://threejs.org/), [**Drei**](https://github.com/pmndrs/drei)      |
| **AI** | [**Google Gemini API**](https://ai.google.dev/)                                                              |
| **State** | [**Zustand**](https://github.com/pmndrs/zustand)                                                            |
| **Backend** | [**Flask**](https://flask.palletsprojects.com/), [**Python**](https://www.python.org/)                                                              |
| **Styling** | [**Framer Motion**](https://www.framer.com/motion/) for animations                                          |

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

* **Node.js** (v18 or later)
* **Python** (v3.8 or later) & `pip`
* A **Google Gemini API Key** (see [Configuration](#-environment-variables) section)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/skandaka/snack-forge.git](https://github.com/skandaka/snack-forge.git)
    cd snack-forge
    ```

2.  **Setup the Backend:**
    ```bash
    cd backend

    # Create and activate a virtual environment
    python3 -m venv venv
    source venv/bin/activate

    # Install Python dependencies
    pip install -r requirements.txt
    ```

3.  **Setup the Frontend:**
    ```bash
    cd ../frontend

    # Install Node.js dependencies
    npm install

    # Create the environment file (see below)
    cp .env.example .env.local
    ```

### 🔑 Environment Variables

The AI features require a Google Gemini API key.

1.  Visit [**Google AI Studio**](https://aistudio.google.com/) to create your free API key.
2.  Open the `.env.local` file you created in the `frontend` directory.
3.  Add your API key to the file:
    ```env
    NEXT_PUBLIC_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

### Running the Application

You need to run both the backend and frontend servers simultaneously in two separate terminal windows.

1.  **Run the Backend Server (from the `backend` directory):**
    ```bash
    source venv/bin/activate
    flask run
    ```
    The backend will be running at `http://127.0.0.1:5000`.

2.  **Run the Frontend Server (from the `frontend` directory):**
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:3000`.

Open `http://localhost:3000` in your browser to start forging snacks!

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, find a bug, or want to improve the code, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
