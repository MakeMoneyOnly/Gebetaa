/**
 * Campaign Builder Component
 * TASK-LOYALTY-001: Email/SMS Marketing Campaigns
 *
 * UI for creating and managing marketing campaigns
 */

'use client';

import { useState } from 'react';

interface CampaignBuilderProps {
    restaurantId: string;
    onSave: (campaign: any) => void;
    onCancel: () => void;
}

const CAMPAIGN_TYPES = [
    { value: 'win_back', label: 'Win-Back Campaign' },
    { value: 'birthday', label: 'Birthday Campaign' },
    { value: 'new_guest', label: 'New Guest Welcome' },
    { value: 'loyalty_milestone', label: 'Loyalty Milestone' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'custom', label: 'Custom' },
] as const;

const CHANNELS = [
    { value: 'email', label: 'Email Only' },
    { value: 'sms', label: 'SMS Only' },
    { value: 'both', label: 'Email & SMS' },
] as const;

export function CampaignBuilder({ restaurantId: _restaurantId, onSave, onCancel }: CampaignBuilderProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [campaignType, setCampaignType] = useState<string>('');
    const [channel, setChannel] = useState<string>('email');
    const [subject, setSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [smsBody, setSmsBody] = useState('');
    const [targetCriteria, setTargetCriteria] = useState({
        min_visits: '',
        inactive_days: '',
        min_lifetime_value: '',
    });
    const [scheduledAt, setScheduledAt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNext = () => {
        if (step === 1 && (!name || !campaignType)) {
            setError('Please fill in campaign name and type');
            return;
        }
        if (step === 2 && channel !== 'sms' && !subject) {
            setError('Please enter an email subject');
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    campaign_type: campaignType,
                    channel,
                    subject: channel !== 'sms' ? subject : undefined,
                    email_html: channel !== 'sms' ? emailBody : undefined,
                    sms_body: channel !== 'email' ? smsBody : undefined,
                    target_criteria: {
                        min_visits: targetCriteria.min_visits
                            ? parseInt(targetCriteria.min_visits)
                            : undefined,
                        inactive_days: targetCriteria.inactive_days
                            ? parseInt(targetCriteria.inactive_days)
                            : undefined,
                        min_lifetime_value: targetCriteria.min_lifetime_value
                            ? parseFloat(targetCriteria.min_lifetime_value)
                            : undefined,
                    },
                    scheduled_at: scheduledAt || undefined,
                    is_automated: false,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to create campaign');
            }

            onSave(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            {/* Progress Steps */}
            <div className="border-b px-6 py-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    {['Details', 'Content', 'Targeting', 'Review'].map((label, index) => (
                        <div key={label} className="flex items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                                    step > index + 1
                                        ? 'bg-green-500 text-white'
                                        : step === index + 1
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {step > index + 1 ? '✓' : index + 1}
                            </div>
                            <span
                                className={`ml-2 text-sm ${step === index + 1 ? 'font-medium' : 'text-gray-500'}`}
                            >
                                {label}
                            </span>
                            {index < 3 && (
                                <div className="mx-2 h-px w-12 bg-gray-300 dark:bg-gray-600" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Step 1: Details */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Campaign Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., March Birthday Special"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Campaign Type *
                            </label>
                            <select
                                value={campaignType}
                                onChange={e => setCampaignType(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select type...</option>
                                {CAMPAIGN_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Channel *</label>
                            <div className="flex gap-4">
                                {CHANNELS.map(ch => (
                                    <label key={ch.value} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="channel"
                                            value={ch.value}
                                            checked={channel === ch.value}
                                            onChange={e => setChannel(e.target.value)}
                                        />
                                        {ch.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content */}
                {step === 2 && (
                    <div className="space-y-4">
                        {channel !== 'sms' && (
                            <>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Email Subject *
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Special offer just for you!"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Email Content
                                    </label>
                                    <textarea
                                        value={emailBody}
                                        onChange={e => setEmailBody(e.target.value)}
                                        rows={8}
                                        className="w-full rounded border px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="<html>...</html>"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Variables: {'{{guest_name}}'}, {'{{restaurant_name}}'}
                                    </p>
                                </div>
                            </>
                        )}

                        {channel !== 'email' && (
                            <div>
                                <label className="mb-1 block text-sm font-medium">SMS Body *</label>
                                <textarea
                                    value={smsBody}
                                    onChange={e => setSmsBody(e.target.value)}
                                    rows={4}
                                    maxLength={160}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Hi {{guest_name}}! Special offer..."
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {smsBody.length}/160 characters
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Targeting */}
                {step === 3 && (
                    <div className="space-y-4">
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Define who should receive this campaign. Leave blank to include all
                            guests.
                        </p>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Minimum Visits</label>
                            <input
                                type="number"
                                min="0"
                                value={targetCriteria.min_visits}
                                onChange={e =>
                                    setTargetCriteria({
                                        ...targetCriteria,
                                        min_visits: e.target.value,
                                    })
                                }
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 3"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Inactive Days (Win-Back)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={targetCriteria.inactive_days}
                                onChange={e =>
                                    setTargetCriteria({
                                        ...targetCriteria,
                                        inactive_days: e.target.value,
                                    })
                                }
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 30"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Minimum Lifetime Value (ETB)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={targetCriteria.min_lifetime_value}
                                onChange={e =>
                                    setTargetCriteria({
                                        ...targetCriteria,
                                        min_lifetime_value: e.target.value,
                                    })
                                }
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 1000"
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Review Campaign</h3>

                        <div className="space-y-3 rounded bg-gray-50 p-4 dark:bg-gray-900">
                            <div>
                                <span className="text-sm text-gray-500">Name:</span>
                                <span className="ml-2 font-medium">{name}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Type:</span>
                                <span className="ml-2">
                                    {CAMPAIGN_TYPES.find(t => t.value === campaignType)?.label}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Channel:</span>
                                <span className="ml-2">
                                    {CHANNELS.find(c => c.value === channel)?.label}
                                </span>
                            </div>
                            {subject && (
                                <div>
                                    <span className="text-sm text-gray-500">Subject:</span>
                                    <span className="ml-2">{subject}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Schedule (optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={e => setScheduledAt(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Leave blank to save as draft
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex gap-3 border-t pt-4 dark:border-gray-700">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Back
                        </button>
                    )}

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Campaign'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
