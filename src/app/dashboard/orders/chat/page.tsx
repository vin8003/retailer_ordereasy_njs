"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import { orderService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Assuming utils exists for cn helper logic often used with shadcn

// Minimal cn polyfill if lib/utils doesn't exist or isn't exported, but shadcn usually needs it.
// I'll assume it exists. If not, I can remove `cn` usage or implement it.

interface ChatMessage {
    id: number;
    sender: number;
    sender_name: string;
    sender_type: string;
    message: string;
    is_read: boolean;
    created_at: string;
    is_me: boolean;
}

function ChatContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const safeOrderId = orderId ? Number(orderId) : 0;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!safeOrderId) return;

        fetchMessages();
        markRead();

        const handleFcmUpdate = (event: any) => {
            const payload = event.detail;
            const updatedOrderId = payload.data?.order_id || payload.data?.id;

            if (Number(updatedOrderId) === safeOrderId) {
                fetchMessages(true);
                markRead();
            }
        };

        window.addEventListener('fcm_chat_message', handleFcmUpdate);

        return () => {
            window.removeEventListener('fcm_chat_message', handleFcmUpdate);
        };
    }, [safeOrderId]);

    useEffect(() => {
        if (bottomRef.current) {
            // Logic to stay at bottom if already at bottom?
            // For now, always scroll to bottom on new messages
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    const fetchMessages = async (isBackground = false) => {
        if (!safeOrderId) return;
        if (!isBackground) setIsLoading(true);
        try {
            const response = await orderService.fetchOrderChat(safeOrderId);
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching chat:", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    const markRead = async () => {
        if (!safeOrderId) return;
        try {
            await orderService.markChatRead(safeOrderId);
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !safeOrderId) return;

        const msgToSend = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        try {
            await orderService.sendChatMessage(safeOrderId, msgToSend);
            await fetchMessages(true);
        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(msgToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!safeOrderId) return <div className="p-8 text-center text-muted-foreground">Invalid Order ID</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-3xl mx-auto rounded-lg overflow-hidden border bg-background shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-card">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="font-semibold text-lg">Chat with Customer</h1>
                    <p className="text-xs text-muted-foreground">Order #{safeOrderId}</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-70">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation with the customer.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex w-full ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-[80%] gap-2 ${msg.is_me ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback className={msg.is_me ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                                        {msg.sender_name?.[0]?.toUpperCase() || (msg.is_me ? 'R' : 'C')}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`flex flex-col ${msg.is_me ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl text-sm ${msg.is_me
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-white border shadow-sm rounded-bl-sm'
                                        }`}>
                                        {msg.message}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                        {format(new Date(msg.created_at), 'h:mm a')}
                                        {msg.is_me && msg.is_read && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Replies */}
            <div className="p-2 border-t bg-background overflow-x-auto flex gap-2 whitespace-nowrap">
                {["Order confirmed", "Out for delivery", "Delivered", "Item unavailable"].map(reply => (
                    <Button
                        key={reply}
                        variant="secondary"
                        size="sm"
                        className="rounded-full text-xs h-7"
                        onClick={() => setNewMessage(reply)}
                    >
                        {reply}
                    </Button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-background flex gap-2">
                <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isSending}
                    className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Chat...</div>}>
            <ChatContent />
        </Suspense>
    );
}
