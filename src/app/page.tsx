import Header from "@/components/layout/header";
import { auth, currentUser } from "@clerk/nextjs";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = auth();
  const user = await currentUser();

  return (
    <>
      <Header />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to TextGraph</h1>
        {!userId && (
          <div className="space-x-4">
            <Link href="/sign-in" className="text-blue-500 hover:underline">Sign In</Link>
            <Link href="/sign-up" className="text-blue-500 hover:underline">Sign Up</Link>
          </div>
        )}
        {userId && (
          <div>
            <p className="mb-2">You are signed in as: {user?.firstName} {user?.lastName} ({user?.emailAddresses[0]?.emailAddress})</p>
            <p className="text-sm text-gray-600">User ID: {userId}</p>
            {/* Add links to create GraphSpace or view existing ones here later */}
          </div>
        )}
      </main>
    </>
  );
}
