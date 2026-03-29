import React, { useRef, useState } from "react";
import { Send, Search } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const contacts = [
  { id: 1, name: "John Martinez", role: "Patient", lastMessage: "When is my next appointment?", time: "10:30 AM", unread: 2, initials: "JM" },
  { id: 2, name: "Mary Thompson", role: "Patient", lastMessage: "Thank you for the prescription", time: "09:15 AM", unread: 0, initials: "MT" },
  { id: 3, name: "Dr. Michael Chen", role: "Doctor", lastMessage: "Patient transfer query", time: "Yesterday", unread: 1, initials: "MC" },
  { id: 4, name: "Linda Garcia", role: "Patient", lastMessage: "I have a question about my results", time: "Yesterday", unread: 0, initials: "LG" },
  { id: 5, name: "Robert Lee", role: "Patient", lastMessage: "Feeling better today!", time: "Mar 27", unread: 0, initials: "RL" },
];

const mockMessages: Record<number, Array<{ sender: string; text: string; time: string; isSelf: boolean }>> = {
  1: [
    { sender: "John Martinez", text: "Hello Dr. Johnson, I wanted to ask about my last ECG results.", time: "10:00 AM", isSelf: false },
    { sender: "You", text: "Hi John, the results look promising. Your heart rate variability has improved.", time: "10:05 AM", isSelf: true },
    { sender: "John Martinez", text: "That's great news! When is my next appointment?", time: "10:30 AM", isSelf: false },
  ],
  2: [
    { sender: "Mary Thompson", text: "Dr. Johnson, I picked up the metformin from the pharmacy.", time: "09:10 AM", isSelf: false },
    { sender: "You", text: "Perfect! Make sure to take it with meals and monitor your blood sugar daily.", time: "09:12 AM", isSelf: true },
    { sender: "Mary Thompson", text: "Thank you for the prescription, doctor!", time: "09:15 AM", isSelf: false },
  ],
  3: [
    { sender: "Dr. Michael Chen", text: "Sarah, I have a diabetic patient who might need a cardiology consult.", time: "Yesterday 2:00 PM", isSelf: false },
    { sender: "You", text: "Sure Michael, send me the patient summary and I'll take a look this week.", time: "Yesterday 3:30 PM", isSelf: true },
    { sender: "Dr. Michael Chen", text: "Patient transfer query - I'll send the full report.", time: "Yesterday 4:00 PM", isSelf: false },
  ],
};

export default function DoctorMessages() {
  const container = useRef<HTMLDivElement>(null);
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState(mockMessages);
  const [search, setSearch] = useState("");

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const currentMessages = localMessages[selectedContact.id] ?? [];

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setLocalMessages(prev => ({
      ...prev,
      [selectedContact.id]: [
        ...(prev[selectedContact.id] ?? []),
        { sender: "You", text: newMessage, time: "Just now", isSelf: true }
      ]
    }));
    setNewMessage("");
  };

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={container} className="space-y-4">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Chat with patients and colleagues</p>
      </div>

      <div className="premium-card overflow-hidden gsap-in" style={{ height: "580px" }}>
        <div className="flex h-full">
          {/* Contact List */}
          <div className="w-72 border-r border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <Search size={13} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border/60 transition-colors flex items-center gap-3 ${
                    selectedContact.id === contact.id ? "bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground truncate">{contact.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{contact.lastMessage}</span>
                      {contact.unread > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {selectedContact.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground">{selectedContact.role}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${msg.isSelf ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.isSelf
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                </div>
              ))}
              {currentMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 border border-border bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={sendMessage}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
