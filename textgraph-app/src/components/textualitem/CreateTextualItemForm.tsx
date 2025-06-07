"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createTextualItem } from "@/app/actions/manageTextActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { toast } from "sonner"; // Changed import

export function CreateTextualItemForm({ graphSpaceId }: { graphSpaceId: string }) {
  const initialState = { error: null, success: false, textualItem: null };
  const createTextualItemWithId = createTextualItem.bind(null); // This is fine
  const [state, dispatch] = useFormState(createTextualItemWithId, initialState);
  const { pending } = useFormStatus();
  // Removed const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error); // Changed usage
    }
    if (state?.success) { // Simplified success condition
      toast.success("Textual Item added!"); // Changed usage
      // Consider resetting the form
    }
  }, [state]); // Removed toast from dependencies

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="graphSpaceId" value={graphSpaceId} />
      <div>
        <Label htmlFor="rawText">Text Content</Label>
        <Textarea id="rawText" name="rawText" required rows={10} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Textual Item"}
      </Button>
    </form>
  );
}
