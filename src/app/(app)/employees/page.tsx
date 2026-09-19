import EmployeesTable from "@/components/employees/EmployeesTable";

export default function EmployeesPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">Employees</h1>
          <div className="font-mono text-[16px] text-[var(--text-3)] mt-1 tracking-widest">
            Manage and view candidates who have successfully joined the organization
          </div>
        </div>
      </div>
      <EmployeesTable />
    </div>
  );
}
