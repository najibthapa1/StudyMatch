import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Paperclip,
    Smile,
    MoreVertical,
    Search,
    X,
    Download,
    Trash2,
    Check,
    CheckCheck,
    MessageCircle,
    Users,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Navbar } from "../Navbar";
import { Textarea } from "../ui/textarea";
import {
    getConversations,
    getConversationMessages,
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    createOrGetConversation,
    getConnections,
} from "../../utils/api";

const getCurrentUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user?.user_id || null;
    } catch {
        return null;
    }
};

export default function Chat() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const wsConvIdRef = useRef(null);

  const currentUserId = getCurrentUserId();

  // Load on mount, cleanup on unmount
  useEffect(() => {
    loadConversations();
    loadConnections();
    return () => {
      shouldReconnectRef.current = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle conversation selection from URL param
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(
        (c) => c.conversation_id === conversationId,
      );
      if (conv) handleSelectConversation(conv);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!selectedChat) return;

    shouldReconnectRef.current = true;
    loadMessages(selectedChat.conversation_id);
    setupWebSocket(selectedChat.conversation_id);
    markAsRead(selectedChat.conversation_id);

    return () => {
      shouldReconnectRef.current = false;
      wsConvIdRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedChat?.conversation_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  };

  const loadConnections = async () => {
    try {
      const data = await getConnections();
      setConnections(Array.isArray(data.connections) ? data.connections : []);
    } catch (error) {
      console.error("Failed to load connections:", error);
      setConnections([]);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedChat(conversation);
    navigate(`/chat/${conversation.conversation_id}`, { replace: true });
  };

  const handleStartConversation = async (connection) => {
    try {
      const result = await createOrGetConversation(connection.user_id);
      const freshConversations = await getConversations();
      setConversations(
        Array.isArray(freshConversations) ? freshConversations : [],
      );
      const found = freshConversations.find(
        (c) => c.conversation_id === result.conversation_id,
      );
      if (found) {
        handleSelectConversation(found);
      } else {
        setSelectedChat({
          conversation_id: result.conversation_id,
          other_user: {
            user_id: connection.user_id,
            name: connection.profile.full_name,
            avatar: connection.profile.profile_picture,
            is_online: false,
          },
        });
        navigate(`/chat/${result.conversation_id}`, { replace: true });
      }
      setActiveTab("messages");
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleBackToList = () => {
    shouldReconnectRef.current = false;
    wsConvIdRef.current = null; // ← add this line
    if (wsRef.current) wsRef.current.close();
    setSelectedChat(null);
    navigate("/chat");
  };

  const loadMessages = async (convId) => {
    try {
      setLoading(true);
      const data = await getConversationMessages(convId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (convId) => {
    // ✅ Don't reconnect if already connected to same conversation
    if (
      wsConvIdRef.current === convId &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    if (wsRef.current) wsRef.current.close();
    wsConvIdRef.current = convId;

    const token = localStorage.getItem("access_token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//localhost:8000/ws/chat/${convId}/?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "chat_message":
          setMessages((prev) => {
            const exists = prev.find(
              (m) => m.message_id === data.message.message_id,
            );
            return exists ? prev : [...prev, data.message];
          });
          loadConversations();
          break;
        case "message_deleted":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === data.message_id
                ? { ...msg, is_deleted: true, content: "Message deleted" }
                : msg,
            ),
          );
          break;
        case "typing_indicator":
          setTypingUsers((prev) => ({
            ...prev,
            [data.user_id]: data.is_typing ? data.user_name : null,
          }));
          setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [data.user_id]: null }));
          }, 3000);
          break;
        case "message_read":
          setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
          break;
        default:
          break;
      }
    };

    ws.onerror = (error) => console.error("WebSocket error:", error);

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      if (shouldReconnectRef.current) {
        setTimeout(() => setupWebSocket(convId), 3000);
      }
    };

    wsRef.current = ws;
  };

  const sendTypingIndicator = (isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "typing_indicator", is_typing: isTyping }),
      );
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    sendTypingIndicator(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => sendTypingIndicator(false),
      3000,
    );
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // ✅ Fixed handleSend: optimistic update so message appears instantly
  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    // Snapshot before clearing
    const content = message;
    const fileToSend = selectedFile;

    // Clear inputs immediately for snappy UX
    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (fileToSend) formData.append("file_attachment", fileToSend);

      const sent = await sendMessage(selectedChat.conversation_id, formData);

      setMessages((prev) => {
        const exists = prev.find((m) => m.message_id === sent.message_id);
        return exists ? prev : [...prev, sent];
      });

      loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessage(content);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await markMessagesAsRead(convId);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const getTypingText = () => {
    const typing = Object.values(typingUsers).filter(Boolean);
    if (typing.length === 0) return null;
    if (typing.length === 1) return `${typing[0]} is typing...`;
    return `${typing.join(", ")} are typing...`;
  };

  const currentContact = selectedChat?.other_user;
  const filteredConversations = conversations.filter((conv) =>
    conv.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const conversationUserIds = new Set(
    conversations.map((c) => c.other_user?.user_id),
  );
  const filteredConnections = connections.filter(
    (conn) =>
      conn.profile.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (conn.profile.course || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <Navbar />
      <div className="h-screen pt-16 bg-white">
        <div className="h-full flex">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-80 border-r border-gray-200 flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl tracking-tight mb-4">Messages</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "messages"
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chats{" "}
                  {conversations.length > 0 && `(${conversations.length})`}
                </button>
                <button
                  onClick={() => setActiveTab("contacts")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "contacts"
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Contacts {connections.length > 0 && `(${connections.length})`}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === "messages" ? (
                filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Switch to Contacts to start a chat
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.conversation_id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedChat?.conversation_id ===
                        conversation.conversation_id
                          ? "bg-gray-50 border-l-2 border-l-black"
                          : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {conversation.other_user?.avatar ? (
                            <img
                              src={conversation.other_user.avatar}
                              alt={conversation.other_user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {conversation.other_user?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        {conversation.other_user?.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate font-medium text-sm">
                            {conversation.other_user?.name || "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {conversation.last_message?.time_ago || ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.last_message?.content ||
                            "No messages yet"}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                          {conversation.unread_count}
                        </div>
                      )}
                    </button>
                  ))
                )
              ) : filteredConnections.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No connections yet</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Connect with students to start chatting
                  </p>
                </div>
              ) : (
                filteredConnections.map((connection) => {
                  const hasConversation = conversationUserIds.has(
                    connection.user_id,
                  );
                  return (
                    <button
                      key={connection.user_id}
                      onClick={() => handleStartConversation(connection)}
                      className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {connection.profile.profile_picture ? (
                          <img
                            src={connection.profile.profile_picture}
                            alt={connection.profile.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {connection.profile.initials ||
                              connection.profile.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                              "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {connection.profile.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {connection.profile.course ||
                            connection.profile.university_name ||
                            ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          hasConversation
                            ? "bg-gray-100 text-gray-500"
                            : "bg-black text-white"
                        }`}
                      >
                        {hasConversation ? "Open" : "Message"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Chat Area */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6 border-b border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <button onClick={handleBackToList} className="md:hidden mr-2">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {currentContact?.avatar ? (
                        <img
                          src={currentContact.avatar}
                          alt={currentContact.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {currentContact?.name?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      )}
                    </div>
                    {currentContact?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {currentContact?.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {currentContact?.is_online ? "Online" : "Connected"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </motion.div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Loading messages...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No messages yet.</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Say hello to {currentContact?.name}!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <motion.div
                        key={msg.message_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                      >
                        <div className={`max-w-md ${isOwn ? "order-2" : ""}`}>
                          {!isOwn && (
                            <p className="text-xs text-gray-500 mb-1 ml-3">
                              {msg.sender_name}
                            </p>
                          )}
                          <div className="relative">
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                msg.is_deleted
                                  ? "bg-gray-100 text-gray-500 italic"
                                  : isOwn
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {msg.is_deleted ? (
                                <p className="text-sm">{msg.content}</p>
                              ) : (
                                <>
                                  <p>{msg.content}</p>
                                  {msg.file_url && (
                                    <div className="mt-2">
                                      {msg.file_type?.startsWith("image/") ? (
                                        <img
                                          src={msg.file_url}
                                          alt={msg.file_name}
                                          className="max-w-xs rounded-lg"
                                        />
                                      ) : (
                                        <a
                                          href={msg.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 text-sm underline"
                                        >
                                          <Download className="w-4 h-4" />
                                          <span>{msg.file_name}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            {isOwn && !msg.is_deleted && (
                              <button
                                onClick={() =>
                                  handleDeleteMessage(msg.message_id)
                                }
                                className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 mt-1 ml-3">
                            <p className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {isOwn && (
                              <span className="text-xs text-gray-500">
                                {msg.is_read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {getTypingText() && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 ml-3">
                    <div className="flex space-x-1">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span>{getTypingText()}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="px-6 py-3 border-t border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {filePreview ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <Paperclip className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                      >
                        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6 border-t border-gray-200"
              >
                <div className="flex items-end space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    className="flex-shrink-0 bg-black hover:bg-gray-800"
                    size="icon"
                    disabled={!message.trim() && !selectedFile}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 text-sm">
                  Choose from your chats or start a new one from Contacts
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
