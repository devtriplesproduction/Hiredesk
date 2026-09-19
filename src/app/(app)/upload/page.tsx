import UploadZone from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-7">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
          Upload Resumes
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text)] mt-1.5 leading-relaxed max-w-2xl">
          Upload candidate resumes and let HireDesk automatically parse and organize candidate information.
        </p>
      </div>
      <UploadZone />
    </div>
  );
}
