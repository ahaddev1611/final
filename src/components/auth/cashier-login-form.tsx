
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { initialMockUsers } from '@/lib/data'; // Import initialMockUsers to check against

// Updated mock authentication function
async function authenticateCashier(username?: string, password?: string) {
  const user = initialMockUsers.find(u => u.role === 'cashier' && u.username === username && u.password === password);
  if (user) {
    return { success: true, message: 'Login successful', userId: user.id };
  }
  return { success: false, message: 'Invalid credentials. Use ca1/password or ca2/password.' };
}


export function CashierLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const authResult = await authenticateCashier(username, password);

    setIsLoading(false);
    if (authResult.success && authResult.userId) {
      router.push(`/cashier/billing?cashierId=${authResult.userId}`);
    } else {
      setError(authResult.message);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md">
          <User className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-headline">Cashier Login</CardTitle>
        <CardDescription>Access the ZippyBill billing system.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
             <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4 !text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="ca1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-base"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : <><LogIn className="mr-2 h-5 w-5" /> Login</>}
          </Button>
          <Button variant="link" asChild className="text-sm">
             <Link href="/login/admin">Switch to Admin Login</Link>
           </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
