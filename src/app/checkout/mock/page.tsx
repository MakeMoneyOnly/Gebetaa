import { Suspense } from 'react';
import MockChapaCheckout from './MockChapaCheckout';

export default function MockChapaPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gray-50">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />
                </div>
            }
        >
            <MockChapaCheckout />
        </Suspense>
    );
}
