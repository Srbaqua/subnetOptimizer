// src/algorithms/allocator.ts
import ip from "ip";

type AvailableBlock = {
  cidr: string;
  start: number; // numeric IPv4
  end: number;
  prefix: number;
};

export type Allocation = {
  siteId: string;
  siteName?: string;
  requestedHosts: number;
  assignedCidr: string | null;
  capacity: number; // usable hosts
  error?: string;
};

function cidrToRange(cidr: string) {
  const subnet = ip.cidrSubnet(cidr);
  const start = ip.toLong(subnet.networkAddress);
  const end = ip.toLong(subnet.broadcastAddress);
  const prefix = parseInt(cidr.split("/")[1], 10);
  return { start, end, prefix, cidr };
}

function rangeToCidr(start: number, prefix: number) {
  const addr = ip.fromLong(start);
  return `${addr}/${prefix}`;
}

function hostsForPrefix(prefix: number) {
  // usable hosts for IPv4: 2^(32 - prefix) - 2 (except special cases)
  if (prefix >= 31) return 0;
  return Math.max(0, Math.pow(2, 32 - prefix) - 2);
}

function minimalPrefixForHosts(hosts: number) {
  // need hosts + 2 addresses (network + broadcast) but we compute usable hosts later
  const required = hosts + 2;
  for (let p = 32; p >= 0; p--) {
    const capacity = Math.pow(2, 32 - p);
    if (capacity >= required) return p;
  }
  return 0; // fallback
}

function splitBlockToPrefix(block: AvailableBlock, neededPrefix: number) {
  // if block.prefix > neededPrefix (i.e., block is smaller) -> cannot
  // if block.prefix === neededPrefix -> return the block as allocation, remainder none
  // if block.prefix < neededPrefix -> split repeatedly until we get a /neededPrefix and return first child and add remainder(s)
  const results: { take: AvailableBlock; remainders: AvailableBlock[] } = {
    take: block,
    remainders: [],
  };

  if (block.prefix === neededPrefix) {
    results.take = block;
    results.remainders = [];
    return results;
  }

  // split iteratively: each split increases prefix by 1 and creates two halves
  let currStart = block.start;
  let currPrefix = block.prefix;

  // We'll walk until we reach neededPrefix; when at a prefix, the left half is the one we take; the right half and any further remaining space becomes remainders
  // We simulate splitting the left-most halves.
  const remainders: AvailableBlock[] = [];

  while (currPrefix < neededPrefix) {
    // size of current block
    const size = Math.pow(2, 32 - currPrefix);
    const half = size / 2;
    // left half
    const leftStart = currStart;
    const leftPrefix = currPrefix + 1;
    const leftBlock: AvailableBlock = {
      cidr: rangeToCidr(leftStart, leftPrefix),
      start: leftStart,
      end: leftStart + half - 1,
      prefix: leftPrefix,
    };
    // right half
    const rightStart = currStart + half;
    const rightBlock: AvailableBlock = {
      cidr: rangeToCidr(rightStart, leftPrefix),
      start: rightStart,
      end: rightStart + half - 1,
      prefix: leftPrefix,
    };

    // We choose left half to continue splitting (greedy chooses first-fit)
    // Add right half to remainders
    remainders.push(rightBlock);

    // Continue with left half
    currStart = leftBlock.start;
    currPrefix = leftBlock.prefix;
  }

  results.take = {
    cidr: rangeToCidr(currStart, currPrefix),
    start: currStart,
    end: currStart + Math.pow(2, 32 - currPrefix) - 1,
    prefix: currPrefix,
  };
  results.remainders = remainders;
  return results;
}

export async function allocateGreedy(rootCidr: string, sites: { id: string; name?: string; hosts: number }[]) {
  // prepare available list with the root block
  const root = cidrToRange(rootCidr);
  let available: AvailableBlock[] = [
    {
      cidr: root.cidr,
      start: root.start,
      end: root.end,
      prefix: root.prefix,
    },
  ];

  const allocations: Allocation[] = [];

  // sort sites by descending hosts
  const sorted = [...sites].sort((a, b) => b.hosts - a.hosts);

  for (const site of sorted) {
    const neededPrefix = minimalPrefixForHosts(site.hosts);
    let allocated: Allocation = {
      siteId: site.id,
      siteName: site.name,
      requestedHosts: site.hosts,
      assignedCidr: null,
      capacity: 0,
    };

    // find first available block that can accommodate neededPrefix
    let foundIndex = -1;
    for (let i = 0; i < available.length; i++) {
      const block = available[i];
      if (block.prefix <= neededPrefix) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex === -1) {
      allocated.error = "Insufficient space in root pool";
      allocations.push(allocated);
      continue;
    }

    // take that block and split until neededPrefix
    const chosen = available.splice(foundIndex, 1)[0]; // remove from available
    const { take, remainders } = splitBlockToPrefix(chosen, neededPrefix);

    // add remainders back into available list
    // we push remainders and keep list sorted by start address
    available = available.concat(remainders);
    available.sort((a, b) => a.start - b.start);

    allocated.assignedCidr = take.cidr;
    allocated.capacity = hostsForPrefix(take.prefix);
    allocations.push(allocated);
  }

  // return allocations in original site order
  const byId = new Map(allocations.map((a) => [a.siteId, a]));
  const ordered = sites.map((s) => byId.get(s.id) || { siteId: s.id, siteName: s.name, requestedHosts: s.hosts, assignedCidr: null, capacity: 0 });
  return { allocations: ordered, available };
}
