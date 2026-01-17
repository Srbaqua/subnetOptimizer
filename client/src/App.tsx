import { useState, useRef } from "react";
import { toPng } from "html-to-image";

import bg from "./assets/bg.png";

import { buildCidrTree } from "./utils/cidrTree";
import { CidrTree } from "./components/CidrTree";

import { Button } from "./components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

type Project = {
  id: string;
  name: string;
  rootPool: string;
};

type Allocation = {
  siteId: string;
  siteName?: string;
  requestedHosts: number;
  assignedCidr: string | null;
  capacity: number;
};

function sampleTopology() {
  return {
    nodes: [
      { id: "n1", name: "CSE-Lab", hosts: 120 },
      { id: "n2", name: "Admin-Office", hosts: 30 },
      { id: "n3", name: "Guest-WiFi", hosts: 50 },
    ],
  };
}

export default function App() {
  const [name, setName] = useState("");
  const [topologyText, setTopologyText] = useState(
    JSON.stringify(sampleTopology(), null, 2)
  );
  const [response, setResponse] = useState<Project | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treeRef = useRef<HTMLDivElement>(null);

  async function handleExportTree() {
    if (!treeRef.current) return;
    const dataUrl = await toPng(treeRef.current);
    const link = document.createElement("a");
    link.download = "cidr-tree.png";
    link.href = dataUrl;
    link.click();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const topology = JSON.parse(topologyText);
      const res = await fetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Untitled Project", topology }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Project creation failed");

      setResponse(data.project);
      setPlan(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    if (!response?.id) return;
    setPlanLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:4000/api/plans/${response.id}/plan`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Plan generation failed");

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative app-bg"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* calm neutral overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-semibold text-indigo-700">
            Subnet Optimizer
          </h1>
          <p className="mt-2 text-slate-600">
            Design, analyze, and visualize IP subnet allocations
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <aside className="space-y-6">
            <Card className="card-elevated opacity-95">
              <CardHeader>
                <CardTitle className="section-title flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-indigo-500" />
Project Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Project Name
                    </label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Network"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Topology JSON
                    </label>
                    <textarea
                      rows={8}
                      className="mt-1 w-full rounded-md border font-mono text-xs p-3"
                      value={topologyText}
                      onChange={(e) => setTopologyText(e.target.value)}
                    />
                  </div>

                  <Button className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create Project"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={!response || planLoading}
                  className="w-full"
                >
                  {planLoading ? "Generating…" : "Generate Plan"}
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* RIGHT */}
          <main className="lg:col-span-2 space-y-6">
            {response && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="section-title">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>Name: {response.name}</div>
                  <div className="font-mono text-xs">
                    ID: {response.id}
                  </div>
                  <div>Root Pool: {response.rootPool}</div>
                </CardContent>
              </Card>
            )}

            {plan && (
              <Card className="card-elevated">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="section-title">Subnet Plan</CardTitle>
                  <Badge className="bg-pink-500 text-white">
                    Risk {plan.analysis.riskScore}
                  </Badge>
                </CardHeader>

                <CardContent>
                  <div className="table-shell">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Site</TableHead>
                          <TableHead>Hosts</TableHead>
                          <TableHead>CIDR</TableHead>
                          <TableHead className="text-right">
                            Capacity
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.allocations.map((a: Allocation) => (
                          <TableRow
                            key={a.siteId}
                            className=":table-row"
                          >
                            <TableCell className="font-medium">
                              {a.siteName}
                            </TableCell>
                            <TableCell>{a.requestedHosts}</TableCell>
                            <TableCell className="font-mono font-semibold text-indigo-600">
                              {a.assignedCidr}
                            </TableCell>
                            <TableCell className="text-right">
                              {a.capacity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {plan && (
              <Card className="card-elevated">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="section-title">CIDR Hierarchy</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportTree}
                  >
                    Export PNG
                  </Button>
                </CardHeader>
                <CardContent>
                  <div
                    ref={treeRef}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <CidrTree
                      node={buildCidrTree(
                        plan.rootPool,
                        plan.allocations
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
