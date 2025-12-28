# AiRRo - RAG-Based Search Engine (React + Flask)


![demo gif](demo.gif)


A Retrieval-Augmented Generation (RAG) powered search engine with a React frontend and a Python Flask backend.
The frontend is fully decoupled from the backend and communicates via REST APIs, enabling seamless integration with any compatible backend implementation.

> **Note**
> The backend source code is intentionally not included for security and privacy reasons.
> Any backend that follows the defined API contract will work with this frontend.

---

## Features

- Retrieval-Augmented Generation (RAG) based search
- Responsive and modern React user interface
- Backend-agnostic REST API communication
- Modular and scalable frontend architecture
- Clean UI using Material UI and Tailwind CSS

---

## Tech Stack

### Frontend
- React
- Material UI (`@mui/material`)
- Tailwind CSS
- React Router DOM
- React Icons
- Emotion (`@emotion/react`, `@emotion/styled`)

### Backend (Abstracted)
- Python
- Flask
- Vector database (custom python sqlite create while crawling urls)
- Embedding models (HuggingFace nomic-embed-text)
- Large Language Model (llama-instruct hugging face inference endpoint)

---

## Installation

### Prerequisites
- Node.js (>= 18)
- npm

### Frontend Setup

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom
npm install react-icons
```

### Tailwind CSS Setup (reger)

[Link Text](https://tailwindcss.com/docs/installation/using-vite)

## Running the Frontend

```bash
npm install
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## Backend API Contract

The frontend expects the backend to expose REST endpoints similar to the following.

### Search Endpoint

```
POST /text_search_query
```
```
POST /ai_rag_search
```

#### Request Body
```json
{
  "search_query": "Your search query"
}
```

#### Response
```json
{
 'ranked_docs': List,
 'status': str,
 'found': int,
 'search_time': float
}
```

```json
ai response will the stream of tokens (establish a server side event connection)
```

Any backend implementation adhering to this structure will integrate seamlessly.

---

## Security Notice

- Backend source code is not publicly available
- API keys and credentials must be stored securely on the server
- CORS should be properly configured to allow frontend access

---

## Future Enhancements

- Streaming responses from the LLM
- Conversational chat history
- User authentication and session management
- Search result ranking and filtering
- Multi-document upload and ingestion UI
- scaling and real world deployment

---

## License

This project is licensed under the MIT License.

---

## Author

Developed by **Bavin Saravanan**
