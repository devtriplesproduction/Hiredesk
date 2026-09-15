import UploadZone from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Upload Resumes
        </h1>
        <p className="text-xs sm:text-sm text-[#9AA0AA] mt-1.5 leading-relaxed max-w-2xl">
          Upload candidate resumes and let HireDesk automatically parse and organize candidate information.
        </p>
      </div>
      <UploadZone />
    </div>
  );
}
