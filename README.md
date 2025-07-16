# opencode-web

A web interface for [opencode](https://github.com/sst/opencode) AI coding agent.

## Description

opencode-web provides a user-friendly way to chat with the opencode AI coding assistant via the browser.

⚠️This is a work in progress and experimental.

## Getting Started

1. **Run the Web Client**  
   Clone this repository and install dependencies:

   ```bash
   git clone https://github.com/nihalshetty0/opencode-web
   cd opencode-web
   pnpm install   # or yarn/npm
   pnpm dev       # or yarn dev / npm run dev
   ```

   By default, the web client is accessible at [http://localhost:5173](http://localhost:5173).

2. **Start the Opencode Server**  
   Make sure you have the [opencode server](https://github.com/sst/opencode) installed on your machine.

   Navigate to your repo directory and run the opencode server:

   ```bash
   cd <your-repo-directory>
   opencode serve
   ```

3. **Open the web client**  
   With both the server and web client running, open the web client in your browser. You’ll be able to start new chat sessions and interact with the coding agent!
