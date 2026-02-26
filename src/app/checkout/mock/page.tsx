import { Suspense } from 'react';
import MockChapaCheckout from './MockChapaCheckout';

export default function MockChapaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" /></div>}>
            <MockChapaCheckout />
        </Suspense>
    );
}
