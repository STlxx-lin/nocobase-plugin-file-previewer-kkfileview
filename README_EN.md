# @nocobase/plugin-file-previewer-kkfileview

<p align="left">
  <b>English</b> | <a href="./README.md">简体中文</a>
</p>

[![Views](https://komarev.com/ghpvc/?username=nocobase-file-previewer-kkfileview&color=007ec6&style=flat-square&label=Views)](https://github.com)
[![NocoBase Version](https://img.shields.io/badge/NocoBase-2.1.x%20%7C%202.2.x-brightgreen.svg)](https://www.nocobase.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A high-performance, multi-engine file preview plugin for NocoBase. Deeply integrates four major preview engines: **kkFileView**, **BaseMetas**, **Microsoft Online**, and client-native/offline **File Viewer**. It delivers a comprehensive online and offline document preview solution for NocoBase, supporting Office documents (Word/Excel/PPT), PDF, CAD drawings, 3D models, audio/video, and archives.

---

## 📸 Screenshots & Feature Showcase

### 1. Multi-Engine Online File Preview Modal
Offers an immersive document preview dialog. The bottom toolbar provides one-click seamless switching between four preview engines, multi-page navigation, printing, opening in a new tab, generating embed iframe code, fullscreen/restore toggle, file downloading, and closing.

![Multi-Engine Online File Preview](docs/images/06_preview_modal_demo.png)

### 2. Fullscreen Immersive Preview
Removes edge distractions upon entering fullscreen mode. An intelligent floating "Exit Fullscreen / Minimize" button appears in the top-right corner, highlighting automatically on hover for optimal reading on large displays.

![Fullscreen Immersive Preview](docs/images/07_preview_fullscreen_demo.png)

### 3. Mobile & Small Screen Responsive Adaptation
Automatically detects iPhone, Android smartphones, and tablet viewports. Intelligently enables full-screen layout and touch-friendly controls on mobile devices, optimizing button spacing and touch targets.

![Mobile Responsive Adaptation](docs/images/08_preview_mobile_demo.png)

### 4. Basic Settings Panel
Easily enable/disable specific preview engines, set the system-wide default preferred preview engine, configure global and modal watermarks, and control buttons (print, download, open in new tab, embed code) with granular permission toggles.

![Basic Settings Panel](docs/images/01_settings_basic.png)

### 5. Advanced Settings Panel
Configure public system Host addresses, engine server endpoints, and file extension mappings. Features live service connectivity testing, one-click offline asset extraction, and offline asset bundle downloads.

![Advanced Settings Panel](docs/images/02_settings_advanced.png)

### 6. Configuration Change Audit History
Logs the timestamp, operator, IP address, and before/after comparison of every configuration change to ensure complete system traceability and compliance auditing.

![Configuration History Panel](docs/images/03_settings_modification_records.png)

### 7. File Preview Logs & Access Statistics
Tracks every file preview request with detailed logs: preview timestamp, file name, file URL, operator, and the actual preview engine used. Aggregates file view counts to help administrators analyze document popularity and usage patterns.

![Preview Records Panel](docs/images/04_settings_preview_records.png)

### 8. Smooth Field Migration & Cleanup
Offers smooth schema transitions and one-click legacy field cleanup, keeping your database clean and fully compatible across version upgrades.

![Field Cleanup Panel](docs/images/05_settings_field_cleanup.png)

---

## ✨ Key Features

- 🚀 **4-in-1 Multi-Engine Seamless Switching**:
  - **kkFileView**: Self-hosted preview server for large-scale documents (supports Base64 and encrypted Query parameters).
  - **BaseMetas**: High-performance engine for Office, CAD, and OFD files.
  - **Microsoft Online**: Zero-deploy cloud preview powered by official Microsoft Office Web Viewer.
  - **File Viewer**: Client-side native offline engine, designed specifically for air-gapped and isolated enterprise intranets.
- 📊 **Preview Access Logs & View Count Statistics**:
  - Automatically records timestamp, file name, URL, user, and preview engine for every preview action.
  - Generates document view count statistics and audit logs for administrative oversight and compliance.
- 🎨 **Thoughtful UI & Polished Interactions**:
  - **Standardized Button Sizes & Responsive Bar**: Medium-sized buttons ensure comfortable clicks on both desktop and touch devices.
  - **Floating Minimize Button in Fullscreen**: Automatically appears in the top-right corner during fullscreen for intuitive exiting.
  - **Auto Mobile Fullscreen**: Opens files directly in mobile fullscreen layout on smartphones and tablets.
- 🔄 **NocoBase Full-Version Compatibility**:
  - Seamlessly supports both **NocoBase 2.1.x** and **NocoBase 2.2.x**.
  - Built-in dual-export frontend compatibility layer (Client-V1 & Client-V2) and 2.1.x `filterByTk` action patch without touching core code.
- 🛡️ **Dynamic Security Watermarking**:
  - Supports global screen overlays and preview modal watermarks.
  - Dynamic placeholders supported: `{{user.username}}`, `{{user.nickname}}`, `{{user.department}}`, `{{request.time}}`, etc.
- 📦 **Embed Code Generation with Role Permissions**:
  - Generate ready-to-use `<iframe>` embed codes with customizable width, height, border, and fullscreen properties.
  - Granular visibility control: limit embed code generation to Admin only, normal users, or specific roles.
- 📦 **Dual Packaging for Cloud & Air-Gapped Deployments**:
  - **Lite Package** (~80KB): Excludes static assets; loads assets via CDN (unpkg) or custom endpoints.
  - **Full Package** (~60MB): Includes 170MB+ offline assets; zero external dependencies, perfect for completely disconnected intranets.
  - One-click asset extraction from local `node_modules` directly from the admin panel.

---

## 🛠️ NocoBase Version Compatibility

| NocoBase Version | Compatibility | Remarks |
| :--- | :---: | :--- |
| **NocoBase 2.2.x All Series** | 🟢 Fully Compatible | Native Client-V2 modern frontend architecture and latest APIClient. |
| **NocoBase 2.1.x All Series** (e.g. 2.1.19) | 🟢 Fully Compatible | Dual Client-V1/V2 exports and automatic `filterByTk` action patch to prevent update action errors. |

> [!NOTE]
> Frontend App hook adapters and backend update action filtering patches (`filterByTk`) are loaded automatically based on the host NocoBase runtime. No manual intervention required.

---

## ⚙️ Core Preview Engines Comparison

| Engine | Deployment Type | Recommended Formats | Network / CORS Requirements |
| :--- | :--- | :--- | :--- |
| **kkFileView** | Self-hosted Server | Doc/Docx, Xls/Xlsx, Ppt/Pptx, Pdf, Zip, etc. | Server URL must be configured (Base64 parameter mode supported) |
| **BaseMetas** | Self-hosted / Cloud | Office full suite, CAD, OFD, PDF, etc. | Supports Query parameter mode and Base64 encoded transfers |
| **Microsoft Online** | Public Cloud Service | Office (Docx, Xlsx, Pptx) | Browser requires Internet access; does not support internal isolated domains |
| **File Viewer** | Local Offline / Static Hosting | Office, PDF, 3D Models, Audio/Video, Archives | Ideal for air-gapped intranets (supports one-click local bundle extraction) |

---

## 📥 Installation & Activation

```bash
# 1. Add and enable plugin in your NocoBase project
yarn nocobase pm add @nocobase/plugin-file-previewer-kkfileview
yarn nocobase pm enable @nocobase/plugin-file-previewer-kkfileview

# 2. Upgrade database collections
yarn nocobase upgrade
```

---

## 📦 Dual Packaging & Deployment Guide

To balance **minimal package size** and **air-gapped offline requirements**, this plugin supports dual-package builds:

- **Lite Edition** (`plugin-file-previewer-kkfileview-x.y.z.tgz`, ~80KB): Uses public CDN or custom asset URLs for local rendering engines.
- **Full Edition** (`plugin-file-previewer-kkfileview-x.y.z-full.tgz`, ~60MB): Pre-packages all offline assets locally; loads local assets automatically with zero configuration.

### 1. One-Click Dual Package Build Command
Run the following script in the plugin root directory to generate both `.tgz` packages into `storage/tar/@nocobase/`:
```bash
npm run pack-all
# or
yarn pack-all
```

### 2. Full Edition Deployment in Air-Gapped Intranets
- **Method**: Directly install and enable the **Full Package (`*-full.tgz`)** in your intranet NocoBase environment.
- **Zero Config**: Upon startup, the client automatically detects and serves bundled offline assets without any extra web server setup.

### 3. Lite Edition Deployment in Air-Gapped Intranets (Admin Extraction / Self-Hosting)
If you deploy the **Lite Edition** in an isolated environment:
1. Log in to the NocoBase admin panel, navigate to **FileView Settings -> Advanced Settings**.
2. Click **"Download Static Files" / "Extract Static Files"** in the File Viewer card. Assets will be copied to your local static directory automatically.
3. Alternatively, upload assets to your internal Nginx and set the URL in **File Viewer Asset Base Path**.

---

## 📬 Feedback & Support

For questions, feature requests, or custom consulting:
- **Feedback QQ**: `1414794992`
- **GitHub Issues**: [Open an issue](https://github.com/STlxx-lin/nocobase-plugin-file-previewer-kkfileview/issues)