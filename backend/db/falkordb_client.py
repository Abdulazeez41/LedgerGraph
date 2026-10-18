import logging
from typing import Any, Dict, List, Optional, Tuple
from falkordb import FalkorDB
from falkordb.node import Node
from falkordb.edge import Edge
from falkordb.path import Path
from backend.config import settings

logger = logging.getLogger(__name__)

class FalkorDBClient:
    def __init__(self):
        self._db: Optional[FalkorDB] = None
        self._active_port: int = settings.FALKORDB_PORT
        self.graph_name = settings.FALKORDB_GRAPH

    def get_client(self) -> FalkorDB:
        if self._db is not None:
            return self._db

        # Try configured port first, fallback to alternate port (6380 <-> 6379)
        ports_to_try = [settings.FALKORDB_PORT]
        alt_port = 6379 if settings.FALKORDB_PORT == 6380 else 6380
        if alt_port not in ports_to_try:
            ports_to_try.append(alt_port)

        last_error = None
        for port in ports_to_try:
            try:
                db = FalkorDB(host=settings.FALKORDB_HOST, port=port)
                # Quick health check
                test_graph = db.select_graph("_ping_check_")
                test_graph.query("RETURN 1")
                try:
                    test_graph.delete()
                except Exception:
                    pass
                self._db = db
                self._active_port = port
                logger.info(f"Connected to FalkorDB on {settings.FALKORDB_HOST}:{port}")
                return self._db
            except Exception as e:
                last_error = e
                logger.warning(f"Failed connecting to FalkorDB on port {port}: {e}")

        raise ConnectionError(
            f"Could not connect to FalkorDB on {settings.FALKORDB_HOST} (tried ports {ports_to_try}). "
            f"Ensure FalkorDB Docker container is running: `docker run -d -p 6380:6379 falkordb/falkordb:latest`. "
            f"Original error: {last_error}"
        )

    def get_graph(self, graph_name: Optional[str] = None):
        client = self.get_client()
        name = graph_name or self.graph_name
        return client.select_graph(name)

    @staticmethod
    def serialize_value(val: Any) -> Any:
        if isinstance(val, Node):
            return {
                "_type": "node",
                "id": val.id,
                "labels": val.labels,
                "properties": {k: FalkorDBClient.serialize_value(v) for k, v in val.properties.items()}
            }
        elif isinstance(val, Edge):
            return {
                "_type": "edge",
                "id": val.id,
                "relation": val.relation,
                "src_node": val.src_node,
                "dest_node": val.dest_node,
                "properties": {k: FalkorDBClient.serialize_value(v) for k, v in val.properties.items()}
            }
        elif isinstance(val, Path):
            return {
                "_type": "path",
                "nodes": [FalkorDBClient.serialize_value(n) for n in val.nodes()],
                "edges": [FalkorDBClient.serialize_value(e) for e in val.edges()]
            }
        elif isinstance(val, bytes):
            return val.decode("utf-8", errors="replace")
        elif isinstance(val, list):
            return [FalkorDBClient.serialize_value(item) for item in val]
        elif isinstance(val, dict):
            return {k: FalkorDBClient.serialize_value(v) for k, v in val.items()}
        return val

    def execute_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        graph_name: Optional[str] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, Any]]:
        graph = self.get_graph(graph_name)
        try:
            res = graph.query(query, params or {})
            headers = []
            if res.header:
                for h in res.header:
                    if isinstance(h, (list, tuple)) and len(h) > 1:
                        col = h[1].decode() if isinstance(h[1], bytes) else str(h[1])
                    else:
                        col = str(h)
                    headers.append(col)

            rows = []
            if res.result_set:
                for raw_row in res.result_set:
                    row_dict = {}
                    for col_idx, col_name in enumerate(headers):
                        val = raw_row[col_idx] if col_idx < len(raw_row) else None
                        row_dict[col_name] = self.serialize_value(val)
                    rows.append(row_dict)

            metadata = {
                "nodes_created": getattr(res, "nodes_created", 0),
                "nodes_deleted": getattr(res, "nodes_deleted", 0),
                "relationships_created": getattr(res, "relationships_created", 0),
                "relationships_deleted": getattr(res, "relationships_deleted", 0),
                "labels_added": getattr(res, "labels_added", 0),
                "properties_set": getattr(res, "properties_set", 0),
            }
            return headers, rows, metadata
        except Exception as e:
            logger.error(f"Error executing Cypher query '{query}': {e}")
            raise

    def check_health(self) -> Dict[str, Any]:
        try:
            client = self.get_client()
            graph = self.get_graph()
            
            # Count nodes and relationships
            _, node_res, _ = self.execute_query("MATCH (n) RETURN count(n) AS node_count")
            _, edge_res, _ = self.execute_query("MATCH ()-[r]->() RETURN count(r) AS edge_count")
            
            node_count = node_res[0]["node_count"] if node_res else 0
            edge_count = edge_res[0]["edge_count"] if edge_res else 0

            return {
                "status": "healthy",
                "connected": True,
                "host": settings.FALKORDB_HOST,
                "port": self._active_port,
                "graph": self.graph_name,
                "node_count": node_count,
                "relationship_count": edge_count
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "connected": False,
                "host": settings.FALKORDB_HOST,
                "port": self._active_port,
                "graph": self.graph_name,
                "error": str(e)
            }

db_client = FalkorDBClient()
