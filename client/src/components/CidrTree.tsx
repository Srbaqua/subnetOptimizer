import { useState } from "react";
import type { CidrNode } from "../utils/cidrTree";

export function CidrTree({ node }: { node: CidrNode }) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = node.children.length > 0;

  return (
    <div className="ml-4 mt-2">
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="text-xs w-4">
            {expanded ? "▼" : "▶"}
          </span>
        )}

        <span
          className={`font-mono text-sm ${
            node.label
              ? "text-blue-700 font-semibold"
              : "text-gray-700"
          }`}
          title={node.cidr}
        >
          {node.cidr}
        </span>

        {node.label && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {node.label}
          </span>
        )}
      </div>

      {expanded &&
        node.children.map((child, idx) => (
          <CidrTree key={idx} node={child} />
        ))}
    </div>
  );
}
