import { supabase } from "./supabase";

//
// TYPES
//

interface RelationshipInput {
  sourceEntity: string;
  sourceType: string;
  targetEntity: string;
  targetType: string;
  relationshipType: string;
  riskLevel?: string;
  metadata?: any;
}

//
// FIND OR CREATE ENTITY (SAFE VERSION)
//

async function findOrCreateEntity(
  entityName: string,
  entityType: string,
  riskLevel?: string
) {
  const { data: existing, error } = await supabase
    .from("entities")
    .select("*")
    .eq("entity_name", entityName)
    .maybeSingle();

  if (error) throw error;

  if (existing) return existing.id;

  const { data, error: insertError } = await supabase
    .from("entities")
    .insert([
      {
        entity_name: entityName,
        entity_type: entityType,
        risk_level: riskLevel || "LOW",
      },
    ])
    .select()
    .single();

  if (insertError) throw insertError;

  return data.id;
}

//
// CREATE RELATIONSHIP
//

export async function createRelationship(input: RelationshipInput) {
  try {
    const sourceId = await findOrCreateEntity(
      input.sourceEntity,
      input.sourceType,
      input.riskLevel
    );

    const targetId = await findOrCreateEntity(
      input.targetEntity,
      input.targetType,
      input.riskLevel
    );

    const { data, error } = await supabase
      .from("entity_relationships")
      .insert([
        {
          source_entity: sourceId,
          target_entity: targetId,
          relationship_type: input.relationshipType,
          risk_level: input.riskLevel || "LOW",
          metadata: input.metadata || {},
        },
      ])
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("RELATIONSHIP ERROR:", error);
    return null;
  }
}

//
// FIND CONNECTIONS (FIXED JOIN SAFETY)
//

export async function findConnections(entityName: string) {
  try {
    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("entity_name", entityName)
      .maybeSingle();

    if (!entity) return [];

    const { data, error } = await supabase
      .from("entity_relationships")
      .select(
        `
        id,
        relationship_type,
        risk_level,
        source_entity,
        target_entity
      `
      )
      .or(
        `source_entity.eq.${entity.id},target_entity.eq.${entity.id}`
      );

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

//
// DETECT RISK CLUSTERS
//

export async function detectRiskClusters() {
  const { data, error } = await supabase
    .from("entity_relationships")
    .select("*")
    .eq("risk_level", "HIGH");

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []).map((item) => ({
    relationship: item.relationship_type,
    source: item.source_entity,
    target: item.target_entity,
    risk: item.risk_level,
  }));
}

//
// CORRELATION ENGINE (SAFE)
//

export function correlateEntities(entities: any[]) {
  const correlations: any[] = [];

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      correlations.push({
        source: entities[i],
        target: entities[j],
        relationship: "CORRELATED",
      });
    }
  }

  return correlations;
}

//
// BUILD GRAPH (REACTFLOW COMPATIBLE)
//

export async function buildInvestigationGraph(rootEntity: string) {
  try {
    const rootConnections = await findConnections(rootEntity);

    const nodesMap = new Map();
    const edges: any[] = [];

    for (const rel of rootConnections) {
      nodesMap.set(rel.source_entity, {
        id: rel.source_entity,
        data: { label: rel.source_entity },
      });

      nodesMap.set(rel.target_entity, {
        id: rel.target_entity,
        data: { label: rel.target_entity },
      });

      edges.push({
        id: `${rel.source_entity}-${rel.target_entity}`,
        source: rel.source_entity,
        target: rel.target_entity,
        label: rel.relationship_type,
      });
    }

    return {
      root: rootEntity,
      nodes: Array.from(nodesMap.values()),
      edges,
    };
  } catch (error) {
    console.error(error);
    return { root: rootEntity, nodes: [], edges: [] };
  }
}

