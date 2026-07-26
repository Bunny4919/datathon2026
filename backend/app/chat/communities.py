import networkx as nx
from neo4j import GraphDatabase
import os

NEO4J_URI = os.getenv("NEO4J_URL", "bolt://localhost:7687")
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password123"

def get_communities():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    with driver.session() as session:
        # Get all edges to build a networkx graph
        edges_query = "MATCH (a)-[r]->(b) RETURN a.id as source, b.id as target"
        result = session.run(edges_query)

        G = nx.Graph()
        for record in result:
            G.add_edge(record["source"], record["target"])

        # Louvain Community Detection
        # networkx doesn't have Louvain built-in, we use community.louvain from python-louvain or a simpler one
        # Actually, networkx has `community.louvain_communities` in newer versions.
        try:
            from networkx.community import louvain_communities
            communities = louvain_communities(G)
        except ImportError:
            # Fallback to a simpler connected components if louvain isn't available
            communities = list(nx.connected_components(G))

        # Map node id to community id
        node_community = {}
        for i, community in enumerate(communities):
            for node in community:
                node_community[node] = i

        driver.close()
        return node_community
