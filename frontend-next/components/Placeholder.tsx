type Props = { title: string; children?: React.ReactNode };

export default function Placeholder({ title, children }: Props) {
    return (
        <div className="min-h-[60vh] bg-secondary-50 py-8">
            <div className="mx-auto max-w-7xl px-4">
                <h1 className="text-3xl font-bold text-secondary-900 mb-4">{title}</h1>
                <p className="text-secondary-600 mb-6">This page is a placeholder. Logic will be added later.</p>
                {children}
            </div>
        </div>
    );
} 