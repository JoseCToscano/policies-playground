import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Progress } from "~/components/ui/progress"
import { DollarSign, PlusCircle, FileText, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "~/lib/utils"
import { AccountSwitcher } from "~/app/_components/account-switcher"

// This would typically come from a database or API
const employeeData = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    position: "Senior Product Manager",
    department: "Product Development",
    employeeId: "EMP-2024-001",
    balance: 5000,
    totalBudget: 10000,
    usedBudget: 6500,
    pendingAmount: 1200,
    web3Address: "0x1234...5678",
    expenseRequests: [
        {
            id: 1,
            amount: 150,
            description: "Office supplies",
            status: "approved",
            date: "2023-06-15",
            category: "Supplies",
        },
        {
            id: 2,
            amount: 300,
            description: "Client dinner",
            status: "pending",
            date: "2023-06-18",
            category: "Entertainment",
        },
        { id: 3, amount: 75, description: "Taxi fare", status: "rejected", date: "2023-06-20", category: "Travel" },
        {
            id: 4,
            amount: 2500,
            description: "Conference tickets",
            status: "approved",
            date: "2023-06-22",
            category: "Training",
        },
        {
            id: 5,
            amount: 3475,
            description: "Team workshop materials",
            status: "approved",
            date: "2023-06-25",
            category: "Training",
        },
    ],
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount)
}

export default function EmployeeDashboard({ params }: { params: { id: string } }) {
    const budgetUsagePercentage = (employeeData.usedBudget / employeeData.totalBudget) * 100
    const remainingBudget = employeeData.totalBudget - employeeData.usedBudget
    const availableBudget = remainingBudget - employeeData.pendingAmount

    return (
        <div className="space-y-6 w-full h-full p-12 pt-0">
            <AccountSwitcher />
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Employee ID: {employeeData.employeeId}</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Expense Request
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card text-card-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Account Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={`/placeholder.svg?height=80&width=80`} alt={employeeData.name} />
                                <AvatarFallback className="text-lg">
                                    {employeeData.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold">{employeeData.name}</h2>
                                <p className="text-sm text-muted-foreground">{employeeData.position}</p>
                                <p className="text-sm text-muted-foreground">{employeeData.department}</p>
                                <p className="text-xs text-muted-foreground">Web3: {employeeData.web3Address}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card text-card-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Budget Usage</span>
                                <span className="font-medium">{budgetUsagePercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={budgetUsagePercentage} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Budget</p>
                                <p className="text-lg font-bold">{formatCurrency(employeeData.totalBudget)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Used Budget</p>
                                <p className="text-lg font-bold">{formatCurrency(employeeData.usedBudget)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Pending Amount</p>
                                <p className="text-lg font-bold">{formatCurrency(employeeData.pendingAmount)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Available Budget</p>
                                <p className="text-lg font-bold">{formatCurrency(availableBudget)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card text-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg">Expense History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {employeeData.expenseRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className={cn(
                                            "p-2 rounded-full",
                                            request.status === "approved"
                                                ? "bg-green-500/10"
                                                : request.status === "rejected"
                                                    ? "bg-red-500/10"
                                                    : "bg-yellow-500/10",
                                        )}
                                    >
                                        {request.status === "approved" ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : request.status === "rejected" ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-yellow-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{request.description}</p>
                                        <div className="flex space-x-4">
                                            <p className="text-sm text-muted-foreground">{request.category}</p>
                                            <p className="text-sm text-muted-foreground">{request.date}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(request.amount)}</p>
                                    <p
                                        className={cn(
                                            "text-sm",
                                            request.status === "approved"
                                                ? "text-green-500"
                                                : request.status === "rejected"
                                                    ? "text-red-500"
                                                    : "text-yellow-500",
                                        )}
                                    >
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

