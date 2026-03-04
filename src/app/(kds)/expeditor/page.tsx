'use client';

import { ExpeditorBoard } from '@/features/kds/components/ExpeditorBoard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ExpeditorPage() {
    return (
        <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>
            <ExpeditorBoard />
        </RoleGuard>
    );
}
