"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import NavigationDivider from "~/components/ui/navigation-divider"
import Image from "next/image"
import BetaBadge from "~/app/_components/beta-badge"
import Link from "next/link"
interface Account {
    id: string
    name: string
    type: "master" | "sub"
    gradientFrom: string
    gradientTo: string
}

const accounts: Account[] = [
    {
        id: "master",
        name: "Master Account",
        type: "master",
        gradientFrom: "#4ab3e8",
        gradientTo: "#0081c6",
    },
    {
        id: "1",
        name: "John Doe",
        type: "sub",
        gradientFrom: "#82B1FF",
        gradientTo: "#2979FF",
    },
    {
        id: "2",
        name: "Jane Smith",
        type: "sub",
        gradientFrom: "#B388FF",
        gradientTo: "#7C4DFF",
    },
]

export function AccountSwitcher() {
    const router = useRouter()
    const [selectedAccount, setSelectedAccount] = React.useState("master")

    const handleAccountChange = (accountId: string) => {
        setSelectedAccount(accountId)
        if (accountId === "master") {
            router.push("/home")
        } else {
            router.push(`/sub/${accountId}`)
        }
    }

    const currentAccount = accounts.find((account) => account.id === selectedAccount)

    return (
        <div className="flex items-center justify-start sticky top-0 bg-background z-10 pt-4">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Link
                        href="/home"
                        className="w-9 h-9 rounded-full flex items-center justify-center border-[0.5px] border-gray-200 p-1"
                    >
                        <Image src={"/ribbon-logo.png"} width={32} height={32} alt="Ribbon Logo" />
                    </Link>
                    <div className="absolute -bottom-3">
                        <BetaBadge />
                    </div>
                </div>
            </div>
            <NavigationDivider className="h-8 w-8 text-gray-200 sm:ml-3 " />
            <Select value={selectedAccount} onValueChange={handleAccountChange}>
                <SelectTrigger className="w-[240px] bg-background border-none focus:ring-0">
                    <div className="flex items-center gap-2">
                        <SelectValue placeholder="Select account" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Master Account</SelectLabel>
                        <SelectItem value="master">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${accounts[0]?.gradientFrom} 0%, ${accounts[0]?.gradientTo} 100%)`,
                                    }}
                                >
                                    <span className="text-white text-xs font-medium">MA</span>
                                </div>
                                <span>Master Account</span>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Sub Accounts</SelectLabel>
                        {accounts
                            .filter((account) => account.type === "sub")
                            .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{
                                                background: `linear-gradient(135deg, ${account.gradientFrom} 0%, ${account.gradientTo} 100%)`,
                                            }}
                                        >
                                            <span className="text-white text-xs font-medium">
                                                {account.name?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                        </div>
                                        <span>{account.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}

