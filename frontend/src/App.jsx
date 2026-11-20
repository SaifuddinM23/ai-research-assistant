import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { getDocuments, uploadDocument, deleteDocument, sendMessage } from './api';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

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
        addToast(`"${file.name}" indexed successfully!`, 'success');
      } catch (err) {
        if (err.response?.status === 409) {
          addToast('This document is already indexed in the knowledge base.', 'warning');
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
        addToast('Document removed from index', 'success');
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
                    ? question.slice(0, 36) + (question.length > 36 ? '...' : '')
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
    <div className="flex h-screen w-screen bg-[#0c0d12] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar in normal flex flow */}
      {sidebarOpen && (
        <aside className="w-72 shrink-0 h-full border-r border-[#242630] bg-[#121318] flex flex-col z-20">
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
            onToggleSidebar={() => setSidebarOpen(false)}
          />
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-[#0c0d12] relative overflow-hidden">
        <ChatWindow
          chat={activeChat}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          documentCount={documents.length}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium max-w-sm border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-[#2a1314] text-red-200 border-red-800'
                : toast.type === 'warning'
                ? 'bg-[#2a2213] text-amber-200 border-amber-800'
                : 'bg-[#12281a] text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
