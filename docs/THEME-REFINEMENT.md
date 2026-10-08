# FINAL THEME LOCKED — Visual System & Verification

**Project**: AI-Powered Linux Investigation Workspace  
**Status**: Theme Locked & Verified  
**Theme Name**: **DARK CYBER DEFENSE + DIGITAL FORENSICS**

---

## 1. Final Visual Direction

The visual interface is officially finalized and locked under the **Dark Cyber Defense + Digital Forensics** design system.

- **Atmosphere**: Dark charcoal/black foundation with tactical cybersecurity HUD elements, security shield identifiers, fingerprint/forensic cues, and subtle circuit/network telemetry textures.
- **Hierarchy Focus**: Background graphics operate strictly as subtle atmospheric context (15–25% reduced intensity), keeping foreground content—such as log evidence tables, SHA-256 integrity digests, and triage metadata—crisply legible with high contrast.
- **Professional SOC Aesthetic**: High readability, clear boundaries, and clean tabular representations tailored for Linux forensic analysis.

---

## 2. Final Color System

The approved color palette is strictly locked:

| Role | Color / Hex | Usage |
| :--- | :--- | :--- |
| **Primary Base** | `#090d16` (Charcoal / Near-Black) | Core background foundation |
| **Secondary Base** | `#0f1523` / `#141b2d` | Navigation sidebars, panel containers, elevated cards |
| **Primary Accent** | `#06b6d4` / `#38bdf8` (Teal / Cyan) | Active navigation, interactive buttons, identifiers, glowing accents |
| **Verified / Safe** | `#10b981` / `#34d399` (Emerald Green) | Online backend indicator, valid evidence badges, successful hashes |
| **Warning / Notice** | `#f59e0b` / `#fbbf24` (Amber) | Untrusted text boundary notice, connecting states |
| **Threat / Error** | `#f43f5e` / `#fb7185` (Rose / Red) | Error alerts, backend offline indicators, critical severity tags |
| **Text Primary** | `#f8fafc` | High-contrast headers, values, and raw logs |
| **Text Secondary / Muted** | `#94a3b8` / `#64748b` | Subheadings, metadata labels, footnotes |

---

## 3. Background Treatment

- **Ambient Gradients**: Radial background light sources calibrated to a restrained 3% alpha (`rgba(6, 182, 212, 0.03)` / `rgba(99, 102, 241, 0.03)`), providing depth without visual interference.
- **Hero & Card Glows**: Reduced intensity of decorative glow filters (`--accent-cyan-glow: rgba(6, 182, 212, 0.18)` and `box-shadow: 0 0 16px -3px var(--accent-cyan-glow)`).
- **Forensic Panels**: Solid high-contrast backgrounds (`#141b2d`, `#1a233a`) with subtle 1px structural borders (`rgba(255, 255, 255, 0.07)` to `rgba(255, 255, 255, 0.12)`).

---

## 4. UI & Element Treatment

The following primary components maintain maximum clarity and focus:
- **Evidence Intake Header & Controls**: Distinct headers, subheadings, and quick action controls.
- **Intake Mode Selectors**: Three distinct intake pathways (Sample Scenario, Upload `.log`/`.txt`, Paste Linux Logs) with high-contrast active states.
- **Evidence Metadata Grid**: High-visibility labels, byte sizes, event counts, and full SHA-256 hash preview with instant one-click copy.
- **Normalized Events Table**: Sticky header, monospace styling, clear index columns, timestamps, and search filtering.
- **Verbatim Raw Evidence Viewer**: Collapsible safe-text viewport with horizontal scrolling and quick clipboard export.
- **Navigation & Status Indicators**: Responsive sidebar with status badges and live backend connection pulse.

---

## 5. Functionality Preservation

All functional systems and security boundaries remain untouched and fully preserved:
- **FastAPI Endpoints**: `/health`, `/api/evidence/sample`, `/api/evidence/upload`, `/api/evidence/paste`.
- **Security Boundaries**: Raw logs treated as inert untrusted text data; zero execution of scripts or shell commands.
- **Data Pipelines**: SHA-256 byte-level calculation, event candidate normalization, and timestamp extraction.
- **Real Data**: No synthetic fake threat maps, fake AI metrics, or placeholder attack counts introduced.

---

## 6. Verification Results

### Frontend Verification
```bash
cd frontend
npm run build
# Result: 0 errors (tsc + vite build completed successfully)
```

### Backend Verification
```bash
.venv\Scripts\pytest -q
# Result: 31 passed in 0.96s (100% test coverage preserved)
```

### Workflow Checks
1. **Workspace Overview / Dashboard**: Live `/health` polling, architectural matrices, and navigation.
2. **Evidence Intake Navigation**: Smooth switching between Overview and Evidence Intake.
3. **Sample Scenario**: Instant loading of `sample-privilege-escalation.log` (30 normalized events, SHA-256 computed).
4. **File Upload**: Drag-and-drop & file picker validation for `.log` and `.txt` up to 5 MB.
5. **Paste Logs**: Real-time line and byte size counter with instant normalization.
6. **Validation & Metadata**: Event count, byte size, file type badge, and SHA-256 verification.
7. **Search & Filter**: Real-time message query filtering across candidate events.
8. **Raw Evidence Viewer**: Collapsible raw text container with copy functionality.
