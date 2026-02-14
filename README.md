<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Sauda-Sahayak Banner" width="100%" />
  
  # Sauda-Sahayak (The Deal Assistant)
  ### Your AI Wingman for the Indian Street Economy
  
  *[Gemini 3 Bengaluru 2026 Hackathon Project]*
  *Tracks: 📍 Localization (Primary) | 🛒 Consumer (Secondary)*

</div>

---

## 📖 Overview
**Sauda-Sahayak** is a multimodal AI agent designed to help users negotiate fair prices with auto drivers and brokers in Bangalore. It leverages **Audio** to detect verbal scams, **Vision** to spot fake taxi apps, and **Local Knowledge** to suggest the perfect Kannada/Hindi counter-offers.

Living in Bangalore, "Meter Broken" or "Wonandhalf" are daily phrases. This app gives you the **Street Smarts** of a local, powered by Google's Gemini 1.5 Flash.

## ✨ Key Features

### 🎙️ Audio Negotiation ("The Ear")
- **Scam Detection**: Real-time analysis of driver's speech to detect common tactics like "The Meter Broken Lie", "The Techie Tax", or "The Emotional Trap".
- **Fair Price Estimation**: meaningful price range suggestions based on destination and current context.
- **Smart Responses**: Get suggested replies in English, Hindi, or Kannada.

### 📷 Vision Verification ("The Eye")
- **Fake App Detector**: 'Scan Mode' uses your camera to analyze the driver's phone screen.
- **Fraud Alert**: Identifies manipulated screenshots or fake clone apps (e.g., fake TownRide UIs) by spotting visual anomalies like double status bars or mismatched fonts.
- **Instant Verdict**: "SAFE" or "FAKE" with a confidence score.

### 🎭 Local Mode ("The Personality")
- **Rowdy Mode (Local Mode ON)**: Switches the AI to use "Kanglish" (Kannada + English), aggressive slang ("Boss", "Guru", "Meter Haaki"), and firm negotiation tactics.
- **Polite Mode (Local Mode OFF)**: Uses standard English/Hindi with polite phrasing ("Sir", "Please").

### ⚡ Live Mode & Gamification
- **Live Interaction**: Hands-free voice mode for real-time coaching.
- **Scoreboard**: Track your "Street Smarts" XP and total money saved.

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), TypeScript
- **AI Model**: Google Gemini 1.5 Flash (via `@google/genai` SDK)
- **Styling**: Tailwind CSS + CSS Variables (Dark/Glassmorphism Theme)
- **Audio/Video**: Web Audio API, MediaRecorder API
- **Icons**: Lucide React
- **Visualization**: Recharts

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Cloud Project with Gemini API enabled
- API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sauda-sahayak.git
   cd sauda-sahayak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the Application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 How to Use

1. **Set Your Persona**: Toggle the "Rowdy/Polite" button based on how aggressive you need to be.
2. **Negotiate**:
   - Tap **Mic** to record the driver's offer.
   - Or **Type** the scenario manually.
   - The AI will tell you the Risk Level (Low/High) and what to say next.
3. **Verify**:
   - Switch to **Scan Mode**.
   - Point your camera at the driver's phone if they show you a price on an app.
   - The AI will verify if the app interface is genuine.
4. **Win**: Accept the deal and see your savings!

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <p>Built with ❤️ in Bengaluru</p>
</div>
