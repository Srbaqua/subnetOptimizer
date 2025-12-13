import { useState } from "react";
import { buildCidrTree } from "./utils/cidrTree";
import { CidrTree } from "./components/CidrTree";
import { toPng } from "html-to-image";
import { useRef } from "react";


type Project = {
  id: string;
  name: string;
  rootPool: string;
  topology: any;
  createdAt: string;
};

type Allocation = {
  siteId: string;
  siteName?: string;
  requestedHosts: number;
  assignedCidr: string | null;
  capacity: number;
  error?: string;
};

function sampleTopology() {
  return {
    nodes: [
      { id: "n1", name: "CSE-Lab", hosts: 120 },
      { id: "n2", name: "Admin-Office", hosts: 30 },
      { id: "n3", name: "Guest-WiFi", hosts: 50 },
    ],
    links: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  };
}

export default function App() {
  const [name, setName] = useState("");
  const [topologyText, setTopologyText] = useState(JSON.stringify(sampleTopology(), null, 2));
  const [response, setResponse] = useState<Project | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  async function handleExportTree() {
    if (!treeRef.current) return;

    try {
      const dataUrl = await toPng(treeRef.current);
      const link = document.createElement("a");
      link.download = "cidr-tree.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  }



  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const topology = JSON.parse(topologyText);
      const payload = { name: name || "Untitled Project", topology };

      const res = await fetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
        setResponse(null);
      } else {
        setResponse(data.project);
        setPlan(null);
      }
    } catch (err: any) {
      setError(err.message || "invalid topology JSON");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    if (!response) return;
    setPlanLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/plans/${response.id}/plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
      } else {
        setPlan(data.plan);
      }
    } catch (err: any) {
      setError(err.message || "plan API error");
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Subnet Optimizer
          </h1>
          <p className="mt-1 text-slate-600">
            Design, analyze, and visualize IP subnet allocations
          </p>
        </header>

        {/* <h1 className="text-2xl font-bold mb-4">Subnet Optimizer — Create Project</h1> */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Create Project
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
  Project Name
</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., NIT Hamirpur Campus"
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Topology JSON</label>
            <textarea
              value={topologyText}
              onChange={(e) => setTopologyText(e.target.value)}
              rows={12}
              className="mt-1 block w-full border rounded p-3 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg font-medium"
 disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
            <button type="button" onClick={() => setTopologyText(JSON.stringify(sampleTopology(), null, 2))} className="px-3 py-2 border rounded">
              Load Sample Topology
            </button>
          </div>
        </form>
        </section>
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
  Project Details
</h2>

          {error && <pre className="text-red-600">{error}</pre>}
          {response ? (
            <div>
              <pre className="mt-2 bg-slate-50 text-slate-600 text-xs p-3 rounded text-sm">{JSON.stringify(response, null, 2)}</pre>

              <div className="mt-3">
                <button onClick={handleGeneratePlan} disabled={planLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg font-medium"
>
                  {planLoading ? "Generating..." : "Generate Plan"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-2">No response yet</p>
          )}
        </div>

        {plan && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              Plan
              <span
                className={`px-3 py-1 rounded text-white text-sm ${plan.analysis.riskScore === 0
                  ? "bg-green-600"
                  : plan.analysis.riskScore < 50
                    ? "bg-yellow-500"
                    : "bg-red-600"
                  }`}
              >
                Risk Score: {plan.analysis.riskScore}
              </span>
            </h2>
            {plan.analysis.warnings.length > 0 ? (
              <div className="mt-3 space-y-2">
                {plan.analysis.warnings.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className="border-l-4 border-red-500 bg-red-50 p-3 text-sm"
                  >
                    <strong>{w.type}:</strong> {w.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-green-700 bg-green-50 p-3 rounded text-sm">
                ✅ No subnetting issues detected. Design is safe.
              </div>
            )}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  CIDR Tree
                  <span className="ml-2 text-sm text-slate-500">
                    (click to expand / collapse)
                  </span>
                </h3>


                <button
                  onClick={handleExportTree}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg font-medium"

                >
                  Export PNG
                </button>
              </div>

              <div
                ref={treeRef}
                className="mt-2 bg-slate-50 border rounded p-3"
              >
                <CidrTree node={buildCidrTree(plan.rootPool, plan.allocations)} />
              </div>
            </div>


            <div className="mt-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left border-b p-2">Site</th>
                    <th className="text-left border-b p-2">Requested Hosts</th>
                    <th className="text-left border-b p-2">Assigned CIDR</th>
                    <th className="text-left border-b p-2">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.allocations.map((a: Allocation) => (
                    <tr key={a.siteId}>
                      <td className="p-2 border-b">{a.siteName || a.siteId}</td>
                      <td className="p-2 border-b">{a.requestedHosts}</td>
                      <td className="p-2 border-b">{a.assignedCidr ?? "—"}</td>
                      <td className="p-2 border-b">{a.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </section>

      </div>
    </div>
  );
}
