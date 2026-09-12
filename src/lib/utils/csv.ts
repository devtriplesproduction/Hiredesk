import type { Candidate } from "@/types";

/**
 * Converts a list of candidate records into an RFC 4180-compliant CSV string
 * and triggers a safe native browser download.
 * Uses Blobs instead of data URIs to handle large datasets seamlessly without browser limits.
 */
export function exportCandidatesToCSV(candidates: Candidate[]): void {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Role",
    "Score",
    "Status",
    "City",
    "Gender",
    "Age",
    "Experience",
    "Education",
    "Applied At"
  ];

  const rows = [headers];

  candidates.forEach((c) => {
    rows.push([
      c.name,
      c.email,
      c.phone,
      c.roleName,
      String(c.score.total),
      c.status,
      c.city,
      c.gender,
      String(c.age),
      c.exp,
      c.education,
      c.appliedAt
    ]);
  });

  // Convert to CSV structure and escape double quotes to avoid malformed columns
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const cleanCell = cell ? String(cell).replace(/"/g, '""') : "";
          return `"${cleanCell}"`;
        })
        .join(",")
    )
    .join("\n");

  // Use Blob and URL.createObjectURL for high-performance and high-scale exports
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `TSP_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
