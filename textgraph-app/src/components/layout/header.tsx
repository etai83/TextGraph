import { UserButton } from "@clerk/nextjs"; // Corrected: UserButton from @clerk/nextjs
import Link from "next/link";

// UserButton is client-side aware. Header can be async if it needs to do other async work,
// but not strictly necessary for UserButton alone.
export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">TextGraph</Link>
      <div>
        <UserButton afterSignOutUrl="/"/>
      </div>
    </header>
  );
}
