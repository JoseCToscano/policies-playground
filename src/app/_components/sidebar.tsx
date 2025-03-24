import { Button } from "~/components/ui/button";

import { ArrowLeftRight, Banknote, BarChart3, FileText, History } from "lucide-react";

import {
    Sidebar as SidebarUI,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "~/components/ui/sidebar";
import { Wallet } from "lucide-react";

export function Sidebar() {
    return <SidebarUI>
        <SidebarHeader className="border-b p-4">
            <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">MA</div>
                <div className="font-semibold">Master Account</div>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/dashboard">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Overview</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/invoices">
                                    <FileText className="h-4 w-4" />
                                    <span>Invoices</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/exchange">
                                    <ArrowLeftRight className="h-4 w-4" />
                                    <span>Currency Exchange</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/withdrawals">
                                    <Banknote className="h-4 w-4" />
                                    <span>Withdrawals</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/history">
                                    <History />
                                    <span>Transaction History</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
            <Button className="w-full" size="lg">
                <Wallet className="mr-2 h-4 w-4" />
                Fund Wallet
            </Button>
        </SidebarFooter>
    </SidebarUI>
}