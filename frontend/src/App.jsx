import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { getDocuments, uploadDocument, deleteDocument, sendMessage } from './api';
import { Menu, X, Sparkles, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function App() {
  const [chats, setChats] = useState([
    { id: generateId(), title: 'Transformer & RAG Research', messages: [] },
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
    }, 4500);
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      // Backend may be starting
    }
  }, []);

  const handleNewChat = useCallback(() => {
    const newChat = { id: generateId(), title: 'New Research Chat', messages: [] };
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
          const newChat = { id: generateId(), title: 'New Research Chat', messages: [] };
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
        addToast(`"${file.name}" indexed successfully into ChromaDB!`, 'success');
      } catch (err) {
        if (err.response?.status === 409) {
          addToast('This research paper has already been indexed in ChromaDB.', 'warning');
        } else {
          addToast(
            err.response?.data?.detail || 'Failed to upload and index document.',
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
        addToast('Document removed from ChromaDB index', 'success');
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

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                title:
                  c.messages.length === 0
                    ? question.slice(0, 40) + (question.length > 40 ? '...' : '')
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
          source_type: res.data.source_type || 'document',
          query_type: res.data.query_type || 'document',
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
          err.response?.data?.detail || 'Failed to get response. Please check server.',
          'error'
        );
        const errorMessage = {
          role: 'assistant',
          content:
            '⚠️ An error occurred while retrieving or processing your query. Please check that the backend is active.',
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
    <div className="flex h-screen bg-[#090a0f] text-zinc-100 overflow-hidden font-sans">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-4 z-50 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white lg:hidden transition-all duration-200 cursor-pointer shadow-lg"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          chat={activeChat}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          documentCount={documents.length}
        />
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-enter flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-medium max-w-sm backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/90 text-red-200 border border-red-800/80'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border border-amber-800/80'
                : 'bg-emerald-950/90 text-emerald-200 border border-emerald-800/80'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
