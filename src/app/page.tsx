import { Link } from "lucide-react";
import { Globe } from "~/app/_components/globe";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {


  return (
    <HydrateClient>
      <main className="space-y-6  max-w-4xl mx-auto h-full p-12">
        <Card>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left side - Text content */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Make money move{' '}
                    <span className="text-[#4ab3e8]">Freelii</span>
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    The digital banking platform for modern businesses.
                  </p>
                </div>
              </div>

              {/* Right side - Globe */}
              <div className="relative h-[400px]">
                <Globe />
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </HydrateClient>
  );
}
