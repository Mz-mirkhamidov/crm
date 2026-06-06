import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-0 lg:pt-0">
        <div className="lg:hidden h-14" />
        {children}
      </main>
    </div>
  );
}
