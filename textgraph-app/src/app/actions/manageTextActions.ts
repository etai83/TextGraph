"use server";

import { PrismaClient, EntityType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { extractEntities as performNerExtraction, NerResult } from '@/lib/nlp/ner';

const prisma = new PrismaClient();

async function getClerkUserId() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

// --- GraphSpace Actions ---
export async function createGraphSpace(formData: FormData) {
  const clerkId = await getClerkUserId();
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  if (!name) return { error: "Name is required." };
  try {
    const graphSpace = await prisma.graphSpace.create({ data: { userId: clerkId, name, description } });
    revalidatePath('/dashboard');
    return { success: true, graphSpace };
  } catch (e) { console.error("Error creating GraphSpace:", e); return { error: "Failed to create graph space." }; }
}

export async function getGraphSpaces() {
  const clerkId = await getClerkUserId();
  try { return await prisma.graphSpace.findMany({ where: { userId: clerkId }, orderBy: { createdAt: 'desc' } });
  } catch (e) { console.error("Error fetching GraphSpaces:", e); return []; }
}

export async function getGraphSpaceById(id: string) {
  const clerkId = await getClerkUserId();
  try { return await prisma.graphSpace.findFirst({ where: { id, userId: clerkId }, include: { textualItems: { orderBy: { createdAt: 'desc' } } } });
  } catch (e) { console.error("Error fetching GraphSpace by ID:", e); return null; }
}

// --- TextualItem Actions ---
export async function createTextualItem(formData: FormData) {
  const clerkId = await getClerkUserId();
  const rawText = formData.get('rawText') as string;
  const graphSpaceId = formData.get('graphSpaceId') as string;
  if (!rawText || !graphSpaceId) return { error: "Text and Graph Space ID are required." };
  const graphSpace = await prisma.graphSpace.findFirst({ where: { id: graphSpaceId, userId: clerkId } });
  if (!graphSpace) return { error: "GraphSpace not found or user does not have access." };
  try {
    const textualItem = await prisma.textualItem.create({ data: { graphSpaceId, rawText } });
    revalidatePath(`/dashboard/graph-spaces/${graphSpaceId}`);
    processTextualItemForEntities(textualItem.id).catch(console.error);
    return { success: true, textualItem };
  } catch (e) { console.error("Error creating TextualItem:", e); return { error: "Failed to create textual item." }; }
}

// --- Entity Extraction Action ---
function mapNlpEntityTypeToPrisma(nlpEntityType: string): EntityType {
  switch (nlpEntityType) {
    case 'PER': return EntityType.PERSON;
    case 'LOC': return EntityType.LOCATION;
    case 'ORG': return EntityType.OTHER;
    case 'MISC': return EntityType.OTHER;
    default: return EntityType.OTHER;
  }
}

export async function processTextualItemForEntities(textualItemId: string) {
  console.log(`Starting entity extraction for TextualItem ID: ${textualItemId}`);
  const clerkId = await getClerkUserId();
  const textualItem = await prisma.textualItem.findFirst({
    where: { id: textualItemId, graphSpace: { userId: clerkId } },
  });

  if (!textualItem) {
    console.error(`TextualItem not found or user ${clerkId} does not have access to item ${textualItemId}.`);
    return { error: "TextualItem not found or access denied." };
  }
  if (!textualItem.rawText || textualItem.rawText.trim() === "") {
    console.log(`TextualItem ${textualItemId} is empty, skipping NER.`);
    return { success: true, message: "Textual item is empty, no entities to extract." };
  }

  let nlpEntities: NerResult[];
  try {
    nlpEntities = await performNerExtraction(textualItem.rawText);
  } catch (error) {
    console.error(`NLP extraction failed for TextualItem ${textualItemId}:`, error);
    return { error: "NLP extraction failed." };
  }

  const entitiesToCreate = nlpEntities.map(nlpEntity => ({
    textItemId: textualItemId,
    entityType: mapNlpEntityTypeToPrisma(nlpEntity.entity_group),
    value: nlpEntity.word,
    startPosition: nlpEntity.start,
    endPosition: nlpEntity.end,
  }));

  try {
    await prisma.entity.deleteMany({ where: { textItemId: textualItemId } });
    await prisma.entity.createMany({ data: entitiesToCreate });
    console.log(`Successfully saved ${entitiesToCreate.length} entities for TextualItem ${textualItemId}.`);
    revalidatePath(`/dashboard/graph-spaces/${textualItem.graphSpaceId}`);
    buildEdgesForTextualItem(textualItemId).catch(console.error);
    return { success: true, count: entitiesToCreate.length };
  } catch (error) {
    console.error(`Failed to save entities for TextualItem ${textualItemId} to database:`, error);
    return { error: "Failed to save entities to database." };
  }
}

// --- Edge Construction Action ---
export async function buildEdgesForTextualItem(textualItemId: string) {
  console.log(`Starting edge construction for TextualItem ID: ${textualItemId}`);
  const clerkId = await getClerkUserId();
  const textualItem = await prisma.textualItem.findFirst({
    where: { id: textualItemId, graphSpace: { userId: clerkId } },
    include: { entities: true },
  });

  if (!textualItem) return { error: "TextualItem not found or access denied for edge construction." };
  const entities = textualItem.entities;
  if (entities.length < 2) return { success: true, message: "Not enough entities to form edges." };

  const edgesToCreate = [];
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      let sourceId = entities[i].id;
      let targetId = entities[j].id;
      if (sourceId > targetId) [sourceId, targetId] = [targetId, sourceId];
      edgesToCreate.push({ sourceEntityId: sourceId, targetEntityId: targetId, relationType: "RELATED_TO" });
    }
  }

  if (edgesToCreate.length === 0) return { success: true, message: "No new edges formed." };
  try {
    const entityIdsInItem = entities.map(e => e.id);
    await prisma.edge.deleteMany({ where: { OR: [{ sourceEntityId: { in: entityIdsInItem } }, { targetEntityId: { in: entityIdsInItem } }] } });
    await prisma.edge.createMany({ data: edgesToCreate, skipDuplicates: true });
    return { success: true, count: edgesToCreate.length };
  } catch (error) {
    console.error(`Failed to save edges for TextualItem ${textualItemId} to database:`, error);
    return { error: "Failed to save edges to database." };
  }
}

// --- Graph Data Retrieval Action ---
export async function getGraphDataForGraphSpace(graphSpaceId: string) {
  console.log(`Fetching graph data for GraphSpace ID: ${graphSpaceId}`);
  const clerkId = await getClerkUserId();

  const graphSpace = await prisma.graphSpace.findFirst({
    where: { id: graphSpaceId, userId: clerkId },
    include: {
      textualItems: {
        include: {
          entities: true, // Include entities for each textual item
        },
      },
    },
  });

  if (!graphSpace) {
    console.error(`GraphSpace not found or user ${clerkId} does not have access to GraphSpace ${graphSpaceId}.`);
    return { error: "GraphSpace not found or access denied." };
  }

  const allEntities = graphSpace.textualItems.flatMap(item => item.entities);
  if (allEntities.length === 0) {
    console.log(`No entities found in GraphSpace ${graphSpaceId}.`);
    return { nodes: [], edges: [] }; // Return empty graph if no entities
  }

  const entityIds = allEntities.map(entity => entity.id);

  // Fetch all edges where either the source or target entity is in this graph space's entities
  const allEdges = await prisma.edge.findMany({
    where: {
      OR: [
        { sourceEntityId: { in: entityIds } },
        { targetEntityId: { in: entityIds } },
      ],
    },
  });

  // Transform data for graph visualization
  const nodes = allEntities.map(entity => ({
    id: entity.id,
    label: entity.value, // Use entity value as label
    type: entity.entityType, // PERSON, LOCATION, etc.
    // any other properties needed by the graph library
  }));

  const edges = allEdges.map(edge => ({
    id: edge.id,
    source: edge.sourceEntityId,
    target: edge.targetEntityId,
    label: edge.relationType, // e.g., "RELATED_TO"
  }));

  console.log(`Returning ${nodes.length} nodes and ${edges.length} edges for GraphSpace ${graphSpaceId}.`);
  return { nodes, edges };
}
