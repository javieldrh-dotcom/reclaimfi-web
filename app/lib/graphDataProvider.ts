import { supabase } from "./supabase";
import { ReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
//
// GRAPH NODE TYPE
//

export interface GraphNode {

  id: string;

  type?: string;

  position?: {

    x: number;

    y: number;

  };

  data: {

    label: string;

    entityType?: string;

    riskLevel?: string;

  };

  style?: any;

}

//
// GRAPH EDGE TYPE
//

export interface GraphEdge {

  id: string;

  source: string;

  target: string;

  label?: string;

  animated?: boolean;

  style?: any;

}

//
// GET GRAPH NODES
//

export async function getGraphNodes():

Promise<GraphNode[]> {

  try {

    const { data, error } =
      await supabase

        .from("entities")

        .select("*")

        .limit(100);

    if (error) {

      console.error(
        error.message
      );

      return [];

    }

    //
    // MAP ENTITIES
    //

    return data.map(

      (

        entity: any,
        index: number

      ) => ({

        id:
          entity.id,

        position: {

          x:
            (index % 5) * 320,

          y:
            Math.floor(
              index / 5
            ) * 220,

        },

        data: {

          label:
            entity.entity_name,

          entityType:
            entity.entity_type,

          riskLevel:
            entity.risk_level,

        },

        style:
          generateNodeStyle(
            entity.risk_level
          ),

      })

    );

  } catch (error) {

    console.error(error);

    return [];

  }

}

//
// GET GRAPH EDGES
//

export async function getGraphEdges():

Promise<GraphEdge[]> {

  try {

    const { data, error } =
      await supabase

        .from(
          "entity_relationships"
        )

        .select("*")

        .limit(300);

    if (error) {

      console.error(
        error.message
      );

      return [];

    }

    //
    // MAP RELATIONSHIPS
    //

    return data.map(

      (

        rel: any,
        index: number

      ) => ({

        id:
          rel.id ||

          `edge-${index}`,

        source:
          rel.source_entity,

        target:
          rel.target_entity,

        label:
          rel.relationship_type,

        animated: true,

        style:
          generateEdgeStyle(
            rel.risk_level
          ),

      })

    );

  } catch (error) {

    console.error(error);

    return [];

  }

}

//
// BUILD REALTIME GRAPH
//

export async function buildRealtimeGraph() {

  try {

    const nodes =
      await getGraphNodes();

    const edges =
      await getGraphEdges();

    return {

      nodes,

      edges,

      generatedAt:
        new Date().toISOString(),

      engine:
        "AGI GRAPH ENGINE",

    };

  } catch (error) {

    console.error(error);

    return {

      nodes: [],

      edges: [],

    };

  }

}

//
// GET ENTITY CONNECTIONS
//

export async function getEntityConnections(

  entityId: string

) {

  try {

    const { data, error } =
      await supabase

        .from(
          "entity_relationships"
        )

        .select(`

          *,

          source:source_entity (

            entity_name,

            entity_type,

            risk_level

          ),

          target:target_entity (

            entity_name,

            entity_type,

            risk_level

          )

        `)

        .or(

          `source_entity.eq.${entityId},target_entity.eq.${entityId}`

        );

    if (error) {

      console.error(
        error.message
      );

      return [];

    }

    return data;

  } catch (error) {

    console.error(error);

    return [];

  }

}

//
// GET RISK CLUSTERS
//

export async function getRiskClusters() {

  try {

    const { data, error } =
      await supabase

        .from("entities")

        .select("*")

        .eq(
          "risk_level",
          "HIGH"
        );

    if (error) {

      console.error(
        error.message
      );

      return [];

    }

    return data;

  } catch (error) {

    console.error(error);

    return [];

  }

}

//
// NODE STYLE
//

function generateNodeStyle(

  riskLevel: string

) {

  switch (riskLevel) {

    case "HIGH":

      return {

        background:
          "#450a0a",

        color:
          "#f87171",

        border:
          "2px solid #f87171",

        borderRadius:
          "18px",

        padding:
          "14px",

        fontWeight:
          "bold",

        width:
          240,

      };

    case "MEDIUM":

      return {

        background:
          "#422006",

        color:
          "#facc15",

        border:
          "2px solid #facc15",

        borderRadius:
          "18px",

        padding:
          "14px",

        fontWeight:
          "bold",

        width:
          240,

      };

    default:

      return {

        background:
          "#0f172a",

        color:
          "#38bdf8",

        border:
          "2px solid #38bdf8",

        borderRadius:
          "18px",

        padding:
          "14px",

        fontWeight:
          "bold",

        width:
          240,

      };

  }

}

//
// EDGE STYLE
//

function generateEdgeStyle(

  riskLevel: string

) {

  switch (riskLevel) {

    case "HIGH":

      return {

        stroke:
          "#f87171",

        strokeWidth:
          3,

      };

    case "MEDIUM":

      return {

        stroke:
          "#facc15",

        strokeWidth:
          3,

      };

    default:

      return {

        stroke:
          "#38bdf8",

        strokeWidth:
          2,

      };

  }

}

