import { getGraphSpaceById } from "@/app/actions/manageTextActions";
import Header from "@/components/layout/header";
import { CreateTextualItemForm } from "@/components/textualitem/CreateTextualItemForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Simplest props structure for a dynamic route server component
export default async function SingleGraphSpacePage({ params }: { params: { id: string } }) {
  const graphSpace = await getGraphSpaceById(params.id);

  if (!graphSpace) {
    return (
      <>
        <Header />
        <main className="p-8">
          <h1 className="text-2xl font-bold">Graph Space not found or access denied.</h1>
          <Link href="/dashboard"><Button variant="link">Back to Dashboard</Button></Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{graphSpace.name}</h1>
          {graphSpace.description && <p className="text-lg text-gray-600">{graphSpace.description}</p>}
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add New Textual Item</h2>
          <CreateTextualItemForm graphSpaceId={graphSpace.id} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Textual Items</h2>
          {graphSpace.textualItems.length === 0 ? (
            <p>No textual items added to this graph space yet.</p>
          ) : (
            <ul className="space-y-3">
              {graphSpace.textualItems.map((item) => (
                <li key={item.id} className="p-4 border rounded-md shadow-sm">
                  <p className="truncate text-gray-700">{item.rawText.substring(0, 200)}{item.rawText.length > 200 ? "..." : ""}</p>
                  <p className="text-xs text-gray-400 mt-1">Added: {new Date(item.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
