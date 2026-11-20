import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { getDocuments, uploadDocument, deleteDocument, sendMessage } from './api';
import { Menu, X } from 'lucide-react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function App() {
  const [chats, setChats] = useState([
    { id: generateId(), title: 'New Chat', messages: [] },
  ]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState([]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const addToast = useCallback((message, type = 'error') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      // silent — backend may not be running
    }
  }, []);

  const handleNewChat = useCallback(() => {
    const newChat = { id: generateId(), title: 'New Chat', messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const handleDeleteChat = useCallback(
    (chatId) => {
      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== chatId);
        if (filtered.length === 0) {
          const newChat = { id: generateId(), title: 'New Chat', messages: [] };
          setActiveChatId(newChat.id);
          return [newChat];
        }
        if (chatId === activeChatId) {
          setActiveChatId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeChatId]
  );

  const handleUpload = useCallback(
    async (file) => {
      setUploadProgress(0);
      try {
        await uploadDocument(file, (progress) => setUploadProgress(progress));
        await fetchDocuments();
        addToast('Document uploaded successfully', 'success');
      } catch (err) {
        if (err.response?.status === 409) {
          addToast('This document has already been uploaded', 'warning');
        } else {
          addToast(
            err.response?.data?.detail || 'Failed to upload document',
            'error'
          );
        }
      } finally {
        setUploadProgress(null);
      }
    },
    [fetchDocuments, addToast]
  );

  const handleDeleteDocument = useCallback(
    async (docId) => {
      try {
        await deleteDocument(docId);
        setDocuments((prev) => prev.filter((d) => (d.id || d.document_id) !== docId));
        addToast('Document deleted', 'success');
      } catch {
        addToast('Failed to delete document', 'error');
      }
    },
    [addToast]
  );

  const handleSendMessage = useCallback(
    async (question) => {
      if (!question.trim() || isLoading) return;

      const userMessage = { role: 'user', content: question };
      const updatedMessages = [...activeChat.messages, userMessage];

      // Update chat with user message and title
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                title:
                  c.messages.length === 0
                    ? question.slice(0, 50) + (question.length > 50 ? '...' : '')
                    : c.title,
                messages: updatedMessages,
              }
            : c
        )
      );

      setIsLoading(true);
      try {
        const chatHistory = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const documentIds = documents.map((d) => d.id || d.document_id);
        const res = await sendMessage(question, chatHistory, documentIds);

        const aiMessage = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations || [],
          source_type: res.data.source_type || 'unknown',
          query_type: res.data.query_type || 'unknown',
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, messages: [...updatedMessages, aiMessage] }
              : c
          )
        );
      } catch (err) {
        addToast(
          err.response?.data?.detail || 'Failed to get response. Is the backend running?',
          'error'
        );
        // Add error message to chat
        const errorMessage = {
          role: 'assistant',
          content:
            '⚠️ Sorry, I encountered an error processing your request. Please check that the backend is running and try again.',
          citations: [],
          source_type: 'error',
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, messages: [...updatedMessages, errorMessage] }
              : c
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeChat, activeChatId, documents, isLoading, addToast]
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 lg:hidden transition-all duration-200"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          documents={documents}
          uploadProgress={uploadProgress}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onUpload={handleUpload}
          onDeleteDocument={handleDeleteDocument}
        />
      </div>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          chat={activeChat}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          documentCount={documents.length}
        />
      </main>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-enter px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm ${
              toast.type === 'error'
                ? 'bg-red-900/90 text-red-200 border border-red-800'
                : toast.type === 'warning'
                ? 'bg-yellow-900/90 text-yellow-200 border border-yellow-800'
                : 'bg-emerald-900/90 text-emerald-200 border border-emerald-800'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
