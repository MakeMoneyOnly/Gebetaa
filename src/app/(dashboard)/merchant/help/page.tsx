'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, Search, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';

type SupportArticle = {
    id: string;
    title: string;
    category: string;
};

type SupportTicket = {
    id: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    source: string;
    created_at: string;
    updated_at: string;
};

export default function HelpPage() {
    const [query, setQuery] = useState('');
    const { loading: articlesLoading, markLoaded: markArticlesLoaded, setLoading: setArticlesLoading } = usePageLoadGuard('help.articles');
    const [articles, setArticles] = useState<SupportArticle[]>([]);
    const { loading: ticketsLoading, markLoaded: markTicketsLoaded, setLoading: setTicketsLoading } = usePageLoadGuard('help.tickets');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [ticketSubmitting, setTicketSubmitting] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

    const loadArticles = async (searchQuery: string) => {
        try {
            setArticlesLoading(true);
            const response = await fetch(`/api/support/articles?query=${encodeURIComponent(searchQuery)}`, { method: 'GET' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load articles.');
            }
            setArticles((payload?.data?.articles ?? []) as SupportArticle[]);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to load articles.');
        } finally {
            markArticlesLoaded();
        }
    };

    const loadTickets = async () => {
        try {
            setTicketsLoading(true);
            const response = await fetch('/api/support/tickets?limit=20', { method: 'GET' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load support tickets.');
            }
            setTickets((payload?.data?.tickets ?? []) as SupportTicket[]);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to load tickets.');
        } finally {
            markTicketsLoaded();
        }
    };

    useEffect(() => {
        void loadArticles('');
        void loadTickets();
    }, []);

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await loadArticles(query);
    };

    const handleTicketSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedSubject = subject.trim();
        const trimmedDescription = description.trim();
        if (trimmedSubject.length < 3) {
            toast.error('Subject must be at least 3 characters.');
            return;
        }
        if (trimmedDescription.length < 5) {
            toast.error('Description must be at least 5 characters.');
            return;
        }

        try {
            setTicketSubmitting(true);
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: trimmedSubject,
                    description: trimmedDescription,
                    priority,
                    diagnostics_json: { source_page: 'merchant_help' },
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to create ticket.');
            }

            setSubject('');
            setDescription('');
            setPriority('medium');
            toast.success('Support ticket created.');
            await loadTickets();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create ticket.');
        } finally {
            setTicketSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 min-h-screen bg-white">
            <div>
                <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Help & Support</h1>
                <p className="text-gray-500 font-medium">Knowledge base, ticketing, and support history.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search articles..."
                                className="w-full h-11 rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-gray-400"
                            />
                        </div>
                        <button className="h-11 px-4 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800">
                            Search
                        </button>
                    </form>

                    {articlesLoading && (
                        <div className="text-sm text-gray-500 inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading articles...
                        </div>
                    )}

                    {!articlesLoading && (
                        <div className="space-y-2">
                            {articles.length === 0 && <p className="text-sm text-gray-500">No articles found.</p>}
                            {articles.map((article) => (
                                <div key={article.id} className="rounded-xl border border-gray-100 p-3">
                                    <p className="text-sm font-semibold text-gray-900">{article.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{article.category}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Create Support Ticket</h2>
                    <form onSubmit={handleTicketSubmit} className="space-y-3">
                        <input
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Subject"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Describe your issue..."
                            className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <select
                            value={priority}
                            onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high' | 'critical')}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <button
                            type="submit"
                            disabled={ticketSubmitting}
                            className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {ticketSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Submit Ticket
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ticket History Timeline</h2>
                {ticketsLoading && (
                    <div className="text-sm text-gray-500 inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading ticket history...
                    </div>
                )}
                {!ticketsLoading && (
                    <div className="space-y-3">
                        {tickets.length === 0 && <p className="text-sm text-gray-500">No support tickets yet.</p>}
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                                <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                                    <span>Priority: {ticket.priority}</span>
                                    <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                                    <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
