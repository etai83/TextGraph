import { getGraphSpaces } from "@/app/actions/manageTextActions";
import { CreateGraphSpaceForm } from "@/components/graphspace/CreateGraphSpaceForm";
import Header from "@/components/layout/header"; // Assuming Header exists
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const graphSpaces = await getGraphSpaces();

  return (
    <>
      <Header />
      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {/* TODO: Add a Dialog for CreateGraphSpaceForm */}
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Graph Space</h2>
          <CreateGraphSpaceForm />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Graph Spaces</h2>
          {graphSpaces.length === 0 ? (
            <p>No graph spaces created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {graphSpaces.map((space) => (
                <Card key={space.id}>
                  <CardHeader>
                    <CardTitle>{space.name}</CardTitle>
                    {space.description && <CardDescription>{space.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">Created: {new Date(space.createdAt).toLocaleDateString()}</p>
                    <Link href={`/dashboard/graph-spaces/${space.id}`}>
                      <Button variant="outline">Open</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
