# Release v1.0.0 — Academic Benchmark Artifact: Test Case Prioritization Based on Risk

This release packages the **Rental Property Management Software (MVP)** and its empirical test suite as an open-access research benchmark for the study:

> **"Test Case Prioritization Based on Risk for Small Projects"**  
> *Doan Quoc Kien, Nguyen Khoi Nguyen, Tran Vinh Khang, Dang Vo Tuan Tai, and Nguyen Thi Thanh Truc*  
> *University of Information Technology, VNU-HCM (UIT)*

---

## 🎯 Research Overview & Context

In small Agile projects, full regression testing under tight sprint schedules is often impractical. This release provides the complete source code, automated test suite, specifications, and evaluation artifacts used in **Case Study II** of the paper.

The project acts as an empirical evaluation bed for a lightweight **Risk-Based Testing (RBT)** framework utilizing a $3 \times 3$ Risk Prioritization Matrix based on:
1. **Failure Likelihood ($P$):** Requirement change volatility ($CR$) and Story Point complexity ($FC$).
2. **Failure Impact ($I$):** Architectural forward-coupling ($FI$) and UI workflow critical scope ($UI$).

---

## 📦 Benchmark Artifacts Included

### 1. Automated Test Suite (49 Tests)
- **Framework:** Jest 29 & Supertest with SQLite in-memory / file-based fixtures.
- **Coverage Areas:**
  - **Authentication & Security:** Refresh token rotation, token revocation, RBAC route guards (`TC-AUTH-01` to `TC-AUTH-14`).
  - **Billing & Financial Calculation:** Utility meter indexing, invoice generation, decreasing index rejection, mock payment (`TC-BILLING-01` to `TC-BILLING-10`, `TC-SERVICE-01` to `TC-SERVICE-06`).
  - **Room & Contract Integrity:** Lifecycle status transitions, atomic transaction checks (`TC-ROOM-01` to `TC-ROOM-12`, `TC-CONTRACT-01` to `TC-CONTRACT-04`).
  - **Audit & Notification Services:** Audit event logging, failure handling, notification badge counts (`TC-AUDIT-01` to `TC-AUDIT-03`, `TC-NOTIF-01` to `TC-NOTIF-04`).

### 2. Paper Traceability & Prioritization Mapping
| Requirement ID | Description | Evaluated Tests | Likelihood ($P$) | Impact ($I$) | Risk Score ($RS$) | Zone |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **FR-INV-001** | Billing calculation & meter index validation | `TC-BILLING-03`, `TC-BILLING-04`, `TC-SERVICE-01`, `TC-SERVICE-04` | 3 | 3 | **9** | **Critical** |
| **FR-CFG-004** | Refresh token rotation & revocation | `TC-AUTH-11`, `TC-AUTH-12`, `TC-AUTH-13` | 2 | 3 | **6** | **Critical** |
| **FR-RM-004** | Room deletion & cascade relational integrity | `TC-ROOM-11`, `TC-ROOM-12` | 2 | 3 | **6** | **Critical** |
| **FR-AUD-001/002** | Audit event logging & error handling | `TC-AUDIT-01`, `TC-AUDIT-02` | 2 | 2 | **4** | Standard |
| **FR-CON-001** | Lease contract generation & room binding | Contract creation test suite | 2 | 2 | **4** | Standard |
| **FR-MTR-001** | Previous utility meter lookup | Meter reading retrieval test suite | 2 | 2 | **4** | Standard |
| **FR-RM-008** | Available room filtering | Room listing test suite | 1 | 2 | **2** | Deferral |
| **FR-AUTH-LOW** | Profile editing & basic input validation | Registration / formatting tests | 1 | 1 | **1** | Deferral |

- **Prioritized Validation Subset:** 11 critical tests ($22.4\%$ of the suite).
- **Scenario-based APFD:** **$91.8\%$** detection acceleration across critical failure domains.

### 3. Specifications, Architecture & Deliverables
All core project materials are available in the [`docs/`](docs/) directory:
- [`docs/SRS team 12 (Complete).docx`](docs/SRS%20team%2012%20(Complete).docx) — Software Requirements Specification.
- [`docs/Software Detailed Design.pdf`](docs/Software%20Detailed%20Design.pdf) — Architectural and component design.
- [`docs/Business Rules.pdf`](docs/Business%20Rules.pdf) — Core domain rules and constraints.
- [`docs/Sorted Requirements Worksheet Mapping.xlsx`](docs/Sorted%20Requirements%20Worksheet%20Mapping.xlsx) — Requirements traceability matrix.
- [`docs/TEST_CASE_SUITE_REPORT.pdf`](docs/TEST_CASE_SUITE_REPORT.pdf) — Full test execution suite report.
- [`docs/EVALUATION REPORT.pdf`](docs/EVALUATION%20REPORT.pdf) — Project evaluation report.
- [`docs/SOFTWARE_DEVELOPMENT_PROCESS_AND_TASKSHEET.pdf`](docs/SOFTWARE_DEVELOPMENT_PROCESS_AND_TASKSHEET.pdf) — Agile sprint logs and task allocation.

---

## ⚡ Reproduction & Execution

To reproduce and execute the automated benchmark test cases:

```bash
# Clone the repository
git clone https://github.com/DoanQuocKien/Rental-Property-Management-Software.git
cd Rental-Property-Management-Software

# Install dependencies
npm install
npm run install:all

# Run all 49 backend test cases
npm test

# Run tests with code coverage report
npm run test:coverage
```

---

## 📖 Citation

If you use this software benchmark or its test suite in your research, please cite:

```bibtex
@inproceedings{kien2026testcase,
  author    = {Doan Quoc Kien and Nguyen Khoi Nguyen and Tran Vinh Khang and Dang Vo Tuan Tai and Nguyen Thi Thanh Truc},
  title     = {Test Case Prioritization Based on Risk for Small Projects},
  year      = {2026},
  note      = {Artifact Repository: \url{https://github.com/DoanQuocKien/Rental-Property-Management-Software}}
}
```

Or cite the software release directly via `CITATION.cff`.
