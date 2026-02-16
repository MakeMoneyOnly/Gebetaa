'use client';

import React from 'react';
import { HelpCircle, MessageSquare, BookOpen, ExternalLink } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="space-y-10 pb-20 min-h-screen bg-white">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Help & Information</h1>
                <p className="text-gray-500 font-medium">Get support and learn how to use Gebeta.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FAQs / Knowledge Base Card */}
                <div className="group bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100/50 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-orange-100 flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <BookOpen className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Knowledge Base</h2>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                        Browse our comprehensive guides and tutorials to master the Gebeta platform.
                        Learn about menu management, order processing, and more.
                    </p>
                    <button className="h-12 px-6 bg-white border-2 border-gray-100 text-gray-900 rounded-xl font-bold text-sm hover:border-black hover:bg-black hover:text-white transition-all flex items-center gap-2">
                        View Documentation
                        <ExternalLink className="h-4 w-4" />
                    </button>
                </div>

                {/* Contact Support Card */}
                <div className="group bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <MessageSquare className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Contact Support</h2>
                    <p className="text-blue-900/60 font-medium text-sm leading-relaxed mb-8">
                        Need help with something specific? Our support team is available 24/7 to assist you with any issues.
                    </p>
                    <button className="h-12 px-6 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        Chat with Us
                    </button>
                </div>
            </div>

            {/* Quick Links / FAQs List */}
            <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h3>
                <div className="grid gap-4">
                    {[
                        "How do I update my menu inventory?",
                        "Can I add multiple staff accounts?",
                        "How are payouts processed?",
                        "What if a customer cancels an order?"
                    ].map((question, i) => (
                        <div key={i} className="group p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-gray-300 transition-all cursor-pointer flex justify-between items-center">
                            <span className="font-bold text-gray-700 group-hover:text-black">{question}</span>
                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                                <ExternalLink className="h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
