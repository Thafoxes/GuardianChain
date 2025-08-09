import Placeholder from '@/components/Placeholder';

export default function Page({ params }: { params: { id: string } }) {
    return <Placeholder title={`Report #${params.id}`} />;
} 