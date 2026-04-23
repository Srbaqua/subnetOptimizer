# 🌐 Subnet Optimizer

A full-stack web application to **design, analyze, and visualize IP subnet allocations** using CIDR and VLSM principles.
Built with a focus on **clean architecture, real-world networking logic, and modern UI/UX**.

---

## 🚀 Features

* 📐 **VLSM-based Subnet Allocation**

  * Automatically assigns optimal CIDR blocks
  * Handles varying host requirements efficiently

* 📊 **Subnet Plan Dashboard**

  * Displays:

    * Requested hosts
    * Assigned CIDR
    * Capacity utilization

* 🌳 **CIDR Hierarchy Visualization**

  * Tree-based representation of subnet structure
  * Expand/collapse for clarity

* ⚠️ **Risk Analysis Engine**

  * Detects allocation inefficiencies
  * Generates a subnet design risk score

* 🖼️ **Export Functionality**

  * Export subnet tree as PNG

* 🎨 **Modern UI**

  * Clean SaaS-style dashboard
  * Responsive and accessible design

---

## 🛠️ Tech Stack

### Frontend (`client/`)

* React (Vite + TypeScript)
* Tailwind CSS (v4)
* shadcn/ui components

### Backend (`server/`)

* Node.js + Express
* TypeScript

### Core Logic

* Custom CIDR allocation engine
* Subnet analysis module

---

## 📂 Project Structure

```bash
subnetOptimizer/
│
├── client/                         # Frontend (React + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI components (shadcn)
│   │   │   └── CidrTree.tsx
│   │   ├── utils/
│   │   │   └── cidrTree.ts         # Tree generation logic
│   │   ├── assets/                 # Background & static assets
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│
├── server/                         # Backend (API + logic)
│   ├── data/
│   │   ├── projects.json           # Stored projects
│   │   └── plans.json              # Generated plans
│   │
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── allocator.ts        # CIDR allocation logic
│   │   │   └── analyzer.ts         # Risk analysis logic
│   │   │
│   │   ├── routes/
│   │   │   ├── projects.ts         # Project APIs
│   │   │   └── plans.ts            # Plan generation APIs
│   │   │
│   │   ├── utils/
│   │   │   └── storage.ts          # File-based storage
│   │   │
│   │   └── index.ts                # Server entry point
│
└── README.md
```

---

## ⚙️ Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/subnet-optimizer.git
cd subnet-optimizer
```

---

### 2️⃣ Start Backend

```bash
cd server
npm install
npm run dev
```

Backend runs at:

```
http://localhost:4000
```

---

### 3️⃣ Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🧪 Sample Input

```json
{
  "nodes": [
    { "id": "n1", "name": "CSE-Lab", "hosts": 120 },
    { "id": "n2", "name": "Admin-Office", "hosts": 30 },
    { "id": "n3", "name": "Guest-WiFi", "hosts": 50 }
  ]
}
```

---

## 🧠 Core Concepts

* CIDR (Classless Inter-Domain Routing)
* VLSM (Variable Length Subnet Masking)
* IP Address Space Optimization
* Tree-based Data Visualization

---

## 🎯 Use Cases

* Networking labs & education
* Subnet planning for small/medium systems
* Interview preparation (Computer Networks)
* Visualizing IP allocation strategies

---


## 👨‍💻 Author

**Saurabh Chaudhary**
B.Tech CSE, NIT Hamirpur

---


