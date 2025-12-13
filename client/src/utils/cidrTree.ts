// client/src/utils/cidrTree.ts

export type CidrNode = {
  cidr: string;
  label?: string;
  children: CidrNode[];
};

function cidrContains(parent: string, child: string) {
  const [pAddr, pMask] = parent.split("/");
  const [cAddr, cMask] = child.split("/");

  const p = ipToInt(pAddr);
  const c = ipToInt(cAddr);

  const mask = -1 << (32 - Number(pMask));
  return (p & mask) === (c & mask) && Number(cMask) >= Number(pMask);
}

function ipToInt(ip: string) {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0);
}

export function buildCidrTree(
  root: string,
  allocations: {
    assignedCidr: string | null;
    siteName?: string;
  }[]
): CidrNode {
  const nodes: CidrNode[] = allocations
    .filter((a) => a.assignedCidr)
    .map((a) => ({
      cidr: a.assignedCidr!,
      label: a.siteName,
      children: [],
    }));

  const rootNode: CidrNode = {
    cidr: root,
    children: [],
  };

  // sort smallest prefix first (/8 before /24)
  nodes.sort(
    (a, b) =>
      Number(a.cidr.split("/")[1]) - Number(b.cidr.split("/")[1])
  );

  for (const node of nodes) {
    let parent = rootNode;

    const search = (current: CidrNode): CidrNode => {
      for (const child of current.children) {
        if (cidrContains(child.cidr, node.cidr)) {
          return search(child);
        }
      }
      return current;
    };

    parent = search(rootNode);
    parent.children.push(node);
  }

  return rootNode;
}
