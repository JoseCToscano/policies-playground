import { Sidebar } from "~/app/_components/sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen">
            <main className="flex-1 overflow-y-auto p-4">
                {children}
            </main>
        </div>
    );
}
