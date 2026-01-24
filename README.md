<h1 align="center">
    <img src="https://github.com/user-attachments/assets/ec60b0c4-87ba-48f4-981a-c55ed0e8497b" height="100" width="375" alt="banner" /><br>
</h1>


<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Mirxa01/voice-browser)

</div>

## 🎤 Voice Browser

Voice Browser is an open-source voice-controlled AI web automation tool that runs in your browser. Control your browser with voice commands, get voice feedback, and automate web tasks hands-free!

### ✨ New Voice Features

- **Live Voice Input**: Speak commands naturally and watch the AI execute them in real-time
- **Voice Feedback**: Hear summarized results and task completion notifications
- **User Profile**: Store your information for automatic form filling
- **Memory & Learning**: The AI learns from successful tasks to improve over time
- **Multi-LLM Support**: Connect to OpenAI, Anthropic, Gemini, Ollama, and more

## 🔥 Why Voice Browser?

Looking for a powerful AI browser agent with voice control? **Voice Browser** delivers premium web automation capabilities while keeping you in complete control:

- **100% Free** - No subscription fees or hidden costs. Just install and use your own API keys.
- **Voice-First** - Control everything with your voice, get spoken feedback.
- **Privacy-Focused** - Everything runs in your local browser. Your credentials stay with you.
- **Flexible LLM Options** - Connect to your preferred LLM providers.
- **Fully Open Source** - Complete transparency in how your browser is automated.

> **Note:** We support OpenAI, Anthropic, Gemini, Ollama, Groq, Cerebras, Llama and custom OpenAI-Compatible providers.


## 📊 Key Features

- **Voice Control**: Speak commands to control your browser hands-free
- **Voice Feedback**: Hear task results and notifications spoken aloud
- **Multi-agent System**: Specialized AI agents collaborate to accomplish complex web workflows
- **Interactive Side Panel**: Intuitive chat interface with real-time status updates
- **User Profile**: Auto-fill forms with stored personal information
- **Memory & Learning**: AI learns from successful patterns to improve over time
- **Task Automation**: Seamlessly automate repetitive web automation tasks across websites
- **Follow-up Questions**: Ask contextual follow-up questions about completed tasks
- **Conversation History**: Easily access and manage your AI agent interaction history
- **Multiple LLM Support**: Connect your preferred LLM providers and assign different models to different agents


## 🌐 Browser Support

**Officially Supported:**
- **Chrome** - Full support with all features
- **Edge** - Full support with all features

**Not Supported:**
- Firefox, Safari, and other Chromium variants (Opera, Arc, etc.)

> **Note**: While Voice Browser may function on other Chromium-based browsers, we recommend using Chrome or Edge for the best experience and guaranteed compatibility.


## 🚀 Quick Start

> **⚠️ Important**: You must build the extension first before loading it into Chrome! See the "Build from Source" section below.

1. **Build from Source** (see below) or download the latest release

2. **Install the Extension**:
   * Open `chrome://extensions/` in Chrome
   * Enable `Developer mode` (top right)
   * Click `Load unpacked` (top left)
   * Select the **`dist`** folder (NOT the `chrome-extension` source folder!)

3. **Configure Settings**:
   * Click the Voice Browser icon in your toolbar to open the sidebar
   * Click the `Settings` icon (top right)
   * Add your LLM API keys
   * Configure voice settings (enable TTS, select voice)
   * Set up your user profile for form auto-filling
   * Choose which model to use for different agents (Navigator, Planner)

## 🔧 Manually Install Latest Version

To get the most recent version with all the latest features:

1. **Download**
    * Download the latest `voice-browser.zip` file from the official Github [release page](https://github.com/Mirxa01/voice-browser/releases).

2. **Install**:
    * Unzip `voice-browser.zip`.
    * Open `chrome://extensions/` in Chrome
    * Enable `Developer mode` (top right)
    * Click `Load unpacked` (top left)
    * Select the unzipped `voice-browser` folder.

3. **Configure Agent Models**
    * Click the Voice Browser icon in your toolbar to open the sidebar
    * Click the `Settings` icon (top right).
    * Add your LLM API keys.
    * Choose which model to use for different agents (Navigator, Planner)

4. **Upgrading**:
    * Download the latest `voice-browser.zip` file from the release page.
    * Unzip and replace your existing Voice Browser files with the new ones.
    * Go to `chrome://extensions/` in Chrome and click the refresh icon on the Voice Browser card.

## 🛠️ Build from Source

> **⚠️ You MUST build the extension before loading it into Chrome!** The `chrome-extension` directory contains source code and cannot be loaded directly.

If you prefer to build Voice Browser yourself, follow these steps:

1. **Prerequisites**:
   * [Node.js](https://nodejs.org/) (v22.12.0 or higher)
   * [pnpm](https://pnpm.io/installation) (v9.15.1 or higher)

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/Mirxa01/voice-browser.git
   cd voice-browser
   ```

3. **Install Dependencies**:
   ```bash
   pnpm install
   ```

4. **Build the Extension**:
   ```bash
   pnpm build
   ```
   This will create the extension in the `dist/` directory with a proper `manifest.json` file.

5. **Load the Extension**:
   * The built extension will be in the `dist` directory
   * Open `chrome://extensions/` in Chrome
   * Enable `Developer mode` (top right)
   * Click `Load unpacked` (top left)
   * Select the **`dist`** directory (NOT the `chrome-extension` source directory!)

6. **Development Mode** (optional):
   ```bash
   pnpm dev
   ```
   This will watch for file changes and automatically rebuild to `dist/`.

## 🤖 Choosing Your Models

Voice Browser allows you to configure different LLM models for each agent to balance performance and cost. Here are recommended configurations:

### Better Performance
- **Planner**: Claude Sonnet 4
  - Better reasoning and planning capabilities
- **Navigator**: Claude Haiku 3.5
  - Efficient for web navigation tasks
  - Good balance of performance and cost

### Cost-Effective Configuration
- **Planner**: Claude Haiku or GPT-4o
  - Reasonable performance at lower cost
  - May require more iterations for complex tasks
- **Navigator**: Gemini 2.5 Flash or GPT-4o-mini
  - Lightweight and cost-efficient
  - Suitable for basic navigation tasks

### Local Models
- **Setup Options**:
  - Use Ollama or other custom OpenAI-compatible providers to run models locally
  - Zero API costs and complete privacy with no data leaving your machine

- **Recommended Models**:
  - **Qwen3-30B-A3B-Instruct-2507**
  - **Falcon3 10B**
  - **Qwen 2.5 Coder 14B**
  - **Mistral Small 24B**
  - [Latest test results from community](https://gist.github.com/maximus2600/75d60bf3df62986e2254d5166e2524cb) 
  - We welcome community experience sharing with other local models in our [Discord](https://discord.gg/NN3ABHggMK)

- **Prompt Engineering**:
  - Local models require more specific and cleaner prompts
  - Avoid high-level, ambiguous commands
  - Break complex tasks into clear, detailed steps
  - Provide explicit context and constraints

> **Note**: The cost-effective configuration may produce less stable outputs and require more iterations for complex tasks.

> **Tip**: Feel free to experiment with your own model configurations! Found a great combination? Share it with the community in our [Discord](https://discord.gg/NN3ABHggMK) to help others optimize their setup.

## 💡 See It In Action

Here are some powerful tasks you can accomplish with just a sentence:

1. **News Summary**:
   > "Go to TechCrunch and extract top 10 headlines from the last 24 hours"

2. **GitHub Research**:
   > "Look for the trending Python repositories on GitHub with most stars"

3. **Shopping Research**:
   > "Find a portable Bluetooth speaker on Amazon with a water-resistant design, under $50. It should have a minimum battery life of 10 hours"

## 🛠️ Roadmap

We're actively developing Voice Browser with exciting features on the horizon, welcome to join us! 

Check out our detailed roadmap and upcoming features in our [GitHub Discussions](https://github.com/Mirxa01/voice-browser/discussions). 

## 🤝 Contributing

**We need your help to make Voice Browser even better!**  Contributions of all kinds are welcome:

*  **Share Prompts & Use Cases** 
   * Join our [Discord server](https://discord.gg/NN3ABHggMK).
   * share how you're using Voice Browser.  Help us build a library of useful prompts and real-world use cases.
*  **Provide Feedback** 
   * Try Voice Browser and give us feedback on its performance or suggest improvements in our [Discord server](https://discord.gg/NN3ABHggMK).
* **Contribute Code**
   * Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute code to the project.
   * Submit pull requests for bug fixes, features, or documentation improvements.


We believe in the power of open source and community collaboration.  Join us in building the future of web automation!


## 🔒 Security

If you discover a security vulnerability, please **DO NOT** disclose it publicly through issues, pull requests, or discussions.

Instead, please create a [GitHub Security Advisory](https://github.com/Mirxa01/voice-browser/security/advisories/new) to report the vulnerability responsibly. This allows us to address the issue before it's publicly disclosed.

We appreciate your help in keeping Voice Browser and its users safe!

## 💬 Community

Join our growing community of developers and users:

- [Discord](https://discord.gg/NN3ABHggMK) - Chat with team and community
- [Twitter](https://x.com/Mirxa01) - Follow for updates and announcements
- [GitHub Discussions](https://github.com/Mirxa01/voice-browser/discussions) - Share ideas and ask questions

## 👏 Acknowledgments

Voice Browser builds on top of other awesome open-source projects:

- [Browser Use](https://github.com/browser-use/browser-use)
- [Puppeteer](https://github.com/EmergenceAI/Agent-E)
- [Chrome Extension Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)
- [LangChain](https://github.com/langchain-ai/langchainjs)

Huge thanks to their creators and contributors!

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Made with ❤️ by the Voice Browser Team. 

Like Voice Browser? Give us a star 🌟 and join us in [Discord](https://discord.gg/NN3ABHggMK) | [X](https://x.com/Mirxa01)

## ⚠️ DISCLAIMER ON DERIVATIVE PROJECTS

**We explicitly *DO NOT* endorse, support, or participate in any** projects involving cryptocurrencies, tokens, NFTs, or other blockchain-related applications **based on this codebase.**

**Any such derivative projects are NOT Affiliated with, or maintained by, or in any way connected to the official Voice Browser project or its core team.**

**We assume NO LIABILITY for any losses, damages, or issues arising from the use of third-party derivative projects. Users interact with these projects at their own risk.**

**We reserve the right to publicly distance ourselves from any misuse or misleading use of our name, codebase, or brand.**

We encourage open-source innovation but urge our community to be discerning and cautious. Please ensure you understand the risks before using any software or service built upon our codebase by independent developers.


