import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

const recentTransactions = [
  { id: 1, employee: "John Doe", amount: 150.0, date: "2023-06-15", description: "Office supplies" },
  { id: 2, employee: "Jane Smith", amount: 75.5, date: "2023-06-14", description: "Client lunch" },
  { id: 3, employee: "Bob Johnson", amount: 200.0, date: "2023-06-13", description: "Travel expenses" },
]

export function RecentTransactions() {
  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-sm text-primary">Recent Transactions</CardTitle>
        <CardDescription className="text-xs">Latest spending activities</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recentTransactions.map((transaction) => (
            <li key={transaction.id} className="flex flex-col space-y-1 p-2 bg-secondary rounded-lg">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-foreground">{transaction.employee}</span>
                <span className="text-xs font-medium text-primary">${transaction.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{transaction.description}</span>
                <span>{transaction.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

