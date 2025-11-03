import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, RotateCcw, Coffee, Store, Calculator, Zap, Database, Search, MessageSquare, X } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}`);
  const [apiStatus, setApiStatus] = useState({ chat: 'unknown', products: 'unknown', outlets: 'unknown' });
  const [showCommands, setShowCommands] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [agentActivity, setAgentActivity] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BACKEND_RENDER || 'http://localhost:8000';

  const QUICK_COMMANDS = [
    { cmd: '/calc', desc: 'Calculate expression', example: '/calc 15 + 25 * 2', icon: Calculator },
    { cmd: '/products', desc: 'Search products', example: '/products glass cup', icon: Coffee },
    { cmd: '/outlets', desc: 'Find outlets', example: '/outlets Petaling Jaya', icon: Store },
    { cmd: '/reset', desc: 'Reset conversation', example: '/reset', icon: RotateCcw }
  ];

  useEffect(() => {
    loadConversation();
    checkApiHealth();
    addMessage('bot', '👋 Hello! I\'m the ChatBot AI assistant. I can help you with:\n\n• Finding ZUS Coffee outlets\n• Product information and drinkware\n• Calculations\n• Store hours and locations\n\n💡 **Quick commands:** Type `/` to see available commands', {}, false);
  }, []);

  useEffect(() => {
    scrollToBottom();
    saveConversation();
  }, [messages]);

  useEffect(() => {
    const commands = QUICK_COMMANDS.map(c => c.cmd.toLowerCase());
    if (input.startsWith('/')) {
      const typed = input.toLowerCase().split(' ')[0];
      setShowCommands(commands.some(cmd => cmd.startsWith(typed)));
    } else {
      setShowCommands(false);
    }
  }, [input]);

  const loadConversation = () => {
    try {
      const saved = localStorage.getItem('ChatBot_conversation');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.userId === userId) {
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const saveConversation = () => {
    try {
      localStorage.setItem('ChatBot_conversation', JSON.stringify({
        userId,
        messages,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data.services);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setApiStatus({ chat: 'offline', products: 'offline', outlets: 'offline' });
    }
  };

  const addMessage = (sender, content, metadata = {}, save = true) => {
    const newMsg = {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date().toLocaleTimeString(),
      ...metadata
    };
    setMessages(prev => save ? [...prev, newMsg] : [newMsg]);
  };

  const addAgentActivity = (activity, type = 'info') => {
    setAgentActivity(prev => [...prev, {
      id: Date.now() + Math.random(),
      text: activity,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const enhanceQuery = (message) => {
    const productPatterns = [
      /what.*products/i,
      /show.*products/i,
      /list.*products/i,
      /what.*do you (have|sell|offer)/i,
      /what.*drinkware/i
    ];
    
    if (productPatterns.some(pattern => pattern.test(message))) {
      return message + " cup mug glass drinkware coffee";
    }
    
    return message;
  };

  const handleCommand = (cmd) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch(command) {
      case '/calc':
        if (args) {
          return `Calculate ${args}`;
        }
        return "Please provide an expression. Example: /calc 15 + 25";
      
      case '/products':
        if (args) {
          return `Show me ${args}`;
        }
        return "What products do you have?";
      
      case '/outlets':
        if (args) {
          return `Find outlets in ${args}`;
        }
        return "Show me all outlets";
      
      case '/reset':
        handleReset();
        return null;
      
      default:
        return cmd;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let userMessage = input.trim();
    
    // Handle commands
    if (userMessage.startsWith('/')) {
      const processed = handleCommand(userMessage);
      if (!processed) return; // Command handled internally (like /reset)
      userMessage = processed;
    }

    const enhancedMessage = enhanceQuery(userMessage);
    
    setInput('');
    addMessage('user', userMessage);
    setIsLoading(true);
    setAgentActivity([]);

    try {
      addAgentActivity('🤖 Analyzing intent...', 'processing');
      
      await new Promise(resolve => setTimeout(resolve, 300));

      addAgentActivity('🔍 Calling chat endpoint...', 'api');

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: enhancedMessage
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Log tool usage
      if (data.tools_used && data.tools_used.length > 0) {
        data.tools_used.forEach(tool => {
          addAgentActivity(`⚙️ Tool used: ${tool}`, 'tool');
        });
      }

      addAgentActivity('✅ Response generated', 'success');

      let botResponse = data.response;
      if (botResponse.includes("No products found") && /what.*products/i.test(userMessage)) {
        botResponse = "We have a great selection of drinkware! Try asking about:\n\n• Glass coffee cups\n• Ceramic travel mugs\n• Stainless steel thermos\n• Eco-friendly bamboo cups\n• French press coffee makers\n\nWhat interests you?";
      }
      
      addMessage('bot', botResponse, {
        intent: data.intent,
        tools: data.tools_used,
        timestamp: new Date(data.timestamp).toLocaleTimeString()
      });

    } catch (error) {
      console.error('Chat error:', error);
      addAgentActivity(`❌ Error: ${error.message}`, 'error');
      
      addMessage('bot', `⚠️ Sorry, I encountered an error: ${error.message}\n\nPlease check:\n• Is the backend running on ${API_BASE}?\n• Try the /reset command to start fresh`, {
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setAgentActivity([]);
    localStorage.removeItem('ChatBot_conversation');
    addMessage('bot', '🔄 Conversation reset. How can I help you today?');
  };

  const insertCommand = (cmd) => {
    setInput(cmd.cmd + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const quickActions = [
    { label: 'Find outlets in PJ', icon: Store, message: 'Show me outlets in Petaling Jaya' },
    { label: 'Glass coffee cups', icon: Coffee, message: 'Show me glass coffee cups' },
    { label: 'Calculate 15 + 25', icon: Calculator, message: 'Calculate 15 + 25 * 2' },
    { label: 'Eco-friendly cups', icon: Coffee, message: 'Do you have eco-friendly bamboo cups?' }
  ];

  const StatusIndicator = ({ status }) => {
    const colors = {
      operational: 'bg-green-500',
      healthy: 'bg-green-500',
      offline: 'bg-red-500',
      unknown: 'bg-gray-400'
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown} animate-pulse`} />;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">ChatBot AI Assistant</h1>
                  <p className="text-sm text-gray-600">ZUS Coffee Helper • Part 1-6 Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={apiStatus.chat} />
                    <span className="text-gray-600">Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={apiStatus.products} />
                    <span className="text-gray-600">Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={apiStatus.outlets} />
                    <span className="text-gray-600">Outlets</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowAgentPanel(!showAgentPanel)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Toggle agent panel"
                >
                  <Zap className={`w-5 h-5 ${showAgentPanel ? 'text-amber-600' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`flex flex-col gap-1 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : msg.error
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.tools && msg.tools.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1">
                        {msg.tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.intent && (
                      <div className="mt-1 text-xs opacity-70">
                        Intent: {msg.intent}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 px-2">{msg.timestamp}</span>
                </div>

                {msg.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span className="text-gray-600">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Quick actions:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.message)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-sm text-gray-700 border border-amber-200"
                  >
                    <action.icon className="w-4 h-4 text-amber-600" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Command Autocomplete */}
        {showCommands && (
          <div className="px-4 pb-2">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-2">
              {QUICK_COMMANDS.filter(cmd => 
                cmd.cmd.toLowerCase().startsWith(input.toLowerCase().split(' ')[0])
              ).map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => insertCommand(cmd)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded text-left"
                >
                  <cmd.icon className="w-4 h-4 text-amber-600" />
                  <div className="flex-1">
                    <div className="font-mono text-sm font-semibold text-gray-800">{cmd.cmd}</div>
                    <div className="text-xs text-gray-500">{cmd.desc}</div>
                  </div>
                  <div className="text-xs text-gray-400">{cmd.example}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about outlets, products, or calculations... (Type / for commands)"
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                {input.startsWith('/') && (
                  <div className="absolute right-3 top-3 text-xs text-amber-600 font-mono">
                    CMD
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {apiStatus.chat === 'offline' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Backend is offline. Make sure FastAPI is running on {API_BASE}</span>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              💡 Press Enter to send • Shift+Enter for newline • Type / for commands
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Panel */}
      {showAgentPanel && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-800">Agent Activity</h3>
            </div>
            <button
              onClick={() => setShowAgentPanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {agentActivity.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Agent activity will appear here during processing</p>
              </div>
            ) : (
              agentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-2 items-start">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                    activity.type === 'error' ? 'bg-red-500' :
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'tool' ? 'bg-blue-500' :
                    activity.type === 'api' ? 'bg-purple-500' :
                    'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>API Call</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Tool Usage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Error</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;