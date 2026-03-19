import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {Send,Paperclip,Smile,MoreVertical,Search,X,Download,Trash2,Check,CheckCheck,} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Navbar } from '../Navbar';  
import { Textarea } from "../ui/textarea";
import {getConversations,getConversationMessages,sendMessage,deleteMessage,markMessagesAsRead,createOrGetConversation,} from "../../utils/api";

export default function Chat() {
    const navigate = useNavigate();
    const { conversationId } = useParams();  
    
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const wsRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Load conversations on component mount
    useEffect(() => {
        loadConversations();
        return () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        };
    }, []);

    // Handle conversation selection from URL parameter
    useEffect(() => {
        if (conversationId && conversations.length > 0) {
        const conversation = conversations.find(
            conv => conv.conversation_id === conversationId
        );
        
        if (conversation) {
            handleSelectConversation(conversation);
        }
        }
    }, [conversationId, conversations]);

    // Setup WebSocket when a chat is selected
    useEffect(() => {
        if (selectedChat) {
        loadMessages(selectedChat.conversation_id);
        setupWebSocket(selectedChat.conversation_id);
        markAsRead(selectedChat.conversation_id);
        }

        return () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        };
    }, [selectedChat]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load all conversations
    const loadConversations = async () => {
        try {
        const data = await getConversations();
        setConversations(data);
        } catch (error) {
        console.error("Failed to load conversations:", error);
        }
    };

    // Handle conversation selection with navigation
    const handleSelectConversation = (conversation) => {
        setSelectedChat(conversation);
        
        // Update URL to reflect selected conversation
        navigate(`/chat/${conversation.conversation_id}`, { replace: true });
    };

    // Navigate back to conversation list
    const handleBackToList = () => {
        navigate('/chat');
        setSelectedChat(null);
        if (wsRef.current) {
        wsRef.current.close();
        }
    };

    // Load messages for a conversation
    const loadMessages = async (conversationId) => {
        try {
        setLoading(true);
        const data = await getConversationMessages(conversationId);
        setMessages(data);
        } catch (error) {
        console.error("Failed to load messages:", error);
        } finally {
        setLoading(false);
        }
    };

    // Setup WebSocket connection
    const setupWebSocket = (conversationId) => {
        const token = localStorage.getItem("access_token");
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//localhost:8000/ws/chat/${conversationId}/?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
        console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "chat_message":
            setMessages((prev) => [...prev, data.message]);
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
                setTypingUsers((prev) => ({
                ...prev,
                [data.user_id]: null,
                }));
            }, 3000);
            break;

            case "message_read":
            setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
            break;

            default:
            break;
        }
        };

        ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
        console.log("WebSocket disconnected");
        setTimeout(() => {
            if (selectedChat) {
            setupWebSocket(conversationId);
            }
        }, 3000);
        };

        wsRef.current = ws;
    };

    // Send typing indicator
    const sendTypingIndicator = (isTyping) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
            JSON.stringify({
            type: "typing_indicator",
            is_typing: isTyping,
            }),
        );
        }
    };

    // Handle message input change
    const handleMessageChange = (e) => {
        setMessage(e.target.value);
        sendTypingIndicator(true);

        if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
        }, 3000);
    };

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB");
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
            setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
        }
    };

    // Handle send message
    const handleSend = async () => {
        if (!message.trim() && !selectedFile) return;

        try {
        const formData = new FormData();
        formData.append("content", message);

        if (selectedFile) {
            formData.append("file_attachment", selectedFile);
        }

        await sendMessage(selectedChat.conversation_id, formData);

        setMessage("");
        setSelectedFile(null);
        setFilePreview(null);

        sendTypingIndicator(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        } catch (error) {
        console.error("Failed to send message:", error);
        }
    };

    // Handle delete message
    const handleDeleteMessage = async (messageId) => {
        try {
        await deleteMessage(messageId);
        } catch (error) {
        console.error("Failed to delete message:", error);
        }
    };

    // Mark messages as read
    const markAsRead = async (conversationId) => {
        try {
        await markMessagesAsRead(conversationId);
        } catch (error) {
        console.error("Failed to mark messages as read:", error);
        }
    };

    const currentContact = selectedChat?.other_user;

    const getTypingText = () => {
        const typing = Object.values(typingUsers).filter(Boolean);
        if (typing.length === 0) return null;
        if (typing.length === 1) return `${typing[0]} is typing...`;
        return `${typing.join(", ")} are typing...`;
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <>
        <Navbar />  {/* ← NAVBAR COMPONENT */}
        <div className="h-screen pt-16 bg-white">
            <div className="h-full flex">
            {/* Sidebar - Conversations */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-80 border-r border-gray-200 flex flex-col"
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl tracking-tight mb-4">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                    />
                </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Connect with users to start chatting!</p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                    <button
                        key={conversation.conversation_id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedChat?.conversation_id === conversation.conversation_id
                            ? "bg-gray-50"
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
                            <span className="truncate font-medium">
                            {conversation.other_user?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {conversation.last_message?.time_ago || ""}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message?.content || "No messages yet"}
                        </p>
                        </div>
                        {conversation.unread_count > 0 && (
                        <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {conversation.unread_count}
                        </div>
                        )}
                    </button>
                    ))
                )}
                </div>
            </motion.div>

            {/* Chat Area */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-6 border-b border-gray-200 flex items-center justify-between"
                >
                    <div className="flex items-center space-x-3">
                    {/* Back button for mobile */}
                    <button 
                        onClick={handleBackToList}
                        className="md:hidden mr-2"
                    >
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
                            {currentContact?.name?.charAt(0)?.toUpperCase() || "U"}
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
                        <p className="text-sm text-gray-600">
                        {currentContact?.is_online ? "Online" : "Offline"}
                        </p>
                    </div>
                    </div>
                    <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                    </Button>
                </motion.div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Loading messages...</p>
                    </div>
                    ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                        No messages yet. Start the conversation!
                        </p>
                    </div>
                    ) : (
                    messages.map((msg, index) => {
                        const isOwn =
                        msg.sender_id === localStorage.getItem("user_id");

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

                    {/* Typing Indicator */}
                    {getTypingText() && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 ml-3">
                        <div className="flex space-x-1">
                        <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                        </div>
                        <span>{getTypingText()}</span>
                    </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* File Preview */}
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
                            className="flex-shrink-0"
                        >
                            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                        </button>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>

                {/* Message Input */}
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
                        onKeyPress={(e) => {
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
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No conversation selected
                    </h3>
                    <p className="text-gray-600">
                    Select a conversation from the list to start messaging
                    </p>
                </div>
                </div>
            )}
            </div>
        </div>
        </>
    );
}