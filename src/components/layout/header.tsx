import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

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
