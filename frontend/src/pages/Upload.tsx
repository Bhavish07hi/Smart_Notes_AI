import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, Trash2 } from "lucide-react";
import { uploadDocuments, listDocuments, deleteDocument } from "@/api/endpoints";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Loader } from "@/components/ui";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { DocumentStatus } from "@/types";

const statusVariant: Record<DocumentStatus, "default" | "success" | "warning" | "danger"> = {
  uploaded: "default",
  processing: "warning",
  processed: "success",
  failed: "danger",
};

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export default function Upload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(0, 100),
    refetchInterval: 4000,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadDocuments(files, setProgress),
    onSuccess: () => {
      setProgress(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => setProgress(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadMutation.mutate(acceptedFiles);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload PDFs, PowerPoint, Word documents, or text files. We'll extract, chunk, and embed them for AI processing.
        </p>
      </div>

      {/* Change 1: Premium Upload Card with glassmorphism styling */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-6">
          {/* Change 2 & 3: Massive Upload Zone and Sexy Drop States */}
          <div
            {...getRootProps()}
            className={cn(
              "flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] p-12 text-center transition-all duration-300",
              isDragActive && "scale-[1.01] border-blue-500 bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.25)]"
            )}
          >
            <input {...getInputProps()} />
            {/* Change 4: Scaled-up upload icon layout frame */}
            <UploadCloud className="h-20 w-20 text-blue-400" />
            <div>
              {/* Change 5: Premium Headings and Subtext Layout Adjustments */}
              <p className="text-2xl font-semibold text-white">Upload Learning Materials</p>
              <p className="max-w-lg text-sm text-slate-400 mt-1">Supports PDF, PPT, PPTX, DOCX, TXT (max 50MB each)</p>
            </div>
            {/* Change 6: Premium Browse Button */}
            <Button type="button" className="rounded-xl px-6 shadow-lg">Browse Files</Button>
          </div>

          {/* Change 7: Beautiful Multicolored Linear Gradient Progress Bar */}
          {uploadMutation.isPending && (
            <div className="mt-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Uploading... {progress ?? 0}%</p>
            </div>
          )}

          {uploadMutation.isError && (
            <p className="mt-4 text-sm text-destructive">
              {(uploadMutation.error as any)?.response?.data?.detail ?? "Upload failed. Please try again."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Change 8: Premium Documents Workspace Table Glass Frame */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : !documents?.items.length ? (
            /* Change 9: High Visibility Premium Centered Empty State View */
            <p className="py-16 text-center text-base text-slate-400">
              Upload your first document to start generating notes, flashcards, summaries and MCQs.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted-foreground">
                    <th className="py-2 font-medium">File</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Size</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Chunks</th>
                    <th className="py-2 font-medium">Uploaded</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.items.map((doc) => (
                    /* Change 10: Smooth Transition Row Highlighting Layout */
                    <tr
                      key={doc.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="max-w-xs truncate font-medium">{doc.original_filename}</span>
                        </div>
                      </td>
                      <td className="py-3 uppercase text-muted-foreground">{doc.file_type}</td>
                      <td className="py-3 text-muted-foreground">{formatBytes(doc.file_size_bytes)}</td>
                      <td className="py-3">
                        <Badge variant={statusVariant[doc.status]} className="capitalize">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{doc.total_chunks}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(doc.created_at)}</td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}