export const dynamic = 'force-dynamic';

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
    return <div className="font-manrope min-h-screen bg-stone-950 text-white">{children}</div>;
}

export const metadata = {
    title: 'Gebeta Terminal',
    description: 'Cashier and settlement workspace',
    themeColor: '#111111',
};
