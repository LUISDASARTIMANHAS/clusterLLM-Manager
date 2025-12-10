
  # Project Name: Cluster LLM

  Description: This web app provides a load-balanced interface for a cluster of Ollama LLMs. It uses
  a Node.js/Express backend to distribute prompts and manage responses.

 # Features:
   * LLM Clustering with round-robin load balancing.
   * Server health checks.
   * Dynamic model loading from the cluster.
   * Normal and streaming response modes.
   * Simple web UI for model selection, prompting, and response viewing.

# How it Works:
  The Express server in server.js powers the index.html single-page app. Key API endpoints include  
  /models for a consolidated model list, /chat for standard requests, and /chat/stream for real-time
  responses via server-sent events. The front end allows users to select a model, enter a prompt,   
  choose a generation mode, and view the output.

 # Getting Started:
   1. Edit ollamaServers in server.js with your Ollama instances' details.
   2. Run npm install.
   3. Run npm start.
   4. Open http://localhost:3000 in your browser.

 # Technologies: Node.js, Express.js, HTML, JavaScript, and the Ollama API.

  This should be sufficient for your GitHub repo. Let me know if there's anything else.
