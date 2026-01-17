// src/algorithms/analyzer.ts
import ip from "ip";

type Allocation = {
  siteId: string;
  siteName?: string;
  requestedHosts: number;
  assignedCidr: string | null;
  capacity: number;
  error?: string;
};

function cidrRange(cidr: string) {
  const subnet = ip.cidrSubnet(cidr);
  return {
    start: ip.toLong(subnet.networkAddress),
    end: ip.toLong(subnet.broadcastAddress),
  };
}

export function analyzeAllocations(allocations: Allocation[]) {
  const warnings: { type: string; message: string }[] = [];
  let riskScore = 0;

  // Overlap detection
  const ranges = allocations
    .filter((a) => a.assignedCidr)
    .map((a) => ({
      site: a.siteName || a.siteId,
      cidr: a.assignedCidr!,
      ...cidrRange(a.assignedCidr!),
    }))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < ranges.length - 1; i++) {
    if (ranges[i].end >= ranges[i + 1].start) {
      warnings.push({
        type: "OVERLAP",
        message: `Subnet ${ranges[i].cidr} overlaps with ${ranges[i + 1].cidr}`,
      });
      riskScore += 50;
    }
  }

  //  Large broadcast domain
  for (const a of allocations) {
    if (a.capacity > 1024) {
      warnings.push({
        type: "LARGE_SUBNET",
        message: `Subnet ${a.assignedCidr} has very large broadcast domain (${a.capacity} hosts)`,
      });
      riskScore += 20;
    }
  }

  //  Allocation errors
  for (const a of allocations) {
    if (a.error) {
      warnings.push({
        type: "ALLOCATION_ERROR",
        message: `Allocation failed for ${a.siteName || a.siteId}`,
      });
      riskScore += 30;
    }
  }

  return {
    riskScore: Math.min(100, riskScore),
    warnings,
  };
}
