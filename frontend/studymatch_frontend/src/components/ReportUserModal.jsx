import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

const REPORT_REASONS = [
    { value: 'spam',          label: 'Spam or Misleading Content' },
    { value: 'harassment',    label: 'Harassment or Bullying' },
    { value: 'inappropriate', label: 'Inappropriate Behavior' },
    { value: 'fake',          label: 'Fake Profile or Impersonation' },
    { value: 'scam',          label: 'Scam or Fraud' },
    { value: 'other',         label: 'Other' },
];

export function ReportUserModal({ isOpen, onClose, userName, userEmail, userId }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReason) return;

        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/connections/report/${userId}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: selectedReason, details }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit report');
            }

            setIsSubmitted(true);
            setTimeout(() => {
                handleClose();
            }, 2500);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after animation
        setTimeout(() => {
            setSelectedReason('');
            setDetails('');
            setIsSubmitted(false);
            setError('');
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!isSubmitted ? (
                                <>
                                    {/* Header */}
                                    <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Flag className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl tracking-tight">Report User</h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Report {userName} for violating community guidelines
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                        {/* User Info */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <p className="text-sm text-gray-500 mb-1">Reporting:</p>
                                            <p className="font-medium">{userName}</p>
                                            <p className="text-sm text-gray-500">{userEmail}</p>
                                        </div>

                                        {/* Warning */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-800">
                                                False reports may result in action against your account. Only report genuine violations of our community guidelines.
                                            </p>
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                                <p className="text-sm text-red-600">{error}</p>
                                            </div>
                                        )}

                                        {/* Reason */}
                                        <div className="space-y-2">
                                            <Label>Reason for Report *</Label>
                                            <div className="space-y-2">
                                                {REPORT_REASONS.map((reason) => (
                                                    <label
                                                        key={reason.value}
                                                        className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                                                            selectedReason === reason.value
                                                                ? 'border-black bg-gray-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="reason"
                                                            value={reason.value}
                                                            checked={selectedReason === reason.value}
                                                            onChange={(e) => setSelectedReason(e.target.value)}
                                                            className="w-4 h-4 text-black accent-black"
                                                        />
                                                        <span className="ml-3 text-sm">{reason.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2">
                                            <Label htmlFor="details">Additional Details (Optional)</Label>
                                            <Textarea
                                                id="details"
                                                value={details}
                                                onChange={(e) => setDetails(e.target.value)}
                                                placeholder="Provide any additional context or evidence that might help us review this report..."
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleClose}
                                                className="flex-1"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1 bg-red-600 hover:bg-red-700"
                                                disabled={!selectedReason || isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    'Submitting...'
                                                ) : (
                                                    <>
                                                        <Flag className="w-4 h-4 mr-2" />
                                                        Submit Report
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                /* Success */
                                <div className="p-12 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', duration: 0.5 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <Flag className="w-8 h-8 text-green-600" />
                                    </motion.div>
                                    <h3 className="text-2xl mb-2">Report Submitted</h3>
                                    <p className="text-gray-600">
                                        Thank you for helping keep our community safe. We'll review this report shortly.
                                    </p>
                                    <div className="w-12 h-1 bg-green-600 mx-auto rounded-full mt-6" />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}