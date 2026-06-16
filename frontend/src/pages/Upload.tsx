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

      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 text-center transition-colors",
              isDragActive && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">Drag and drop files here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, PPT, PPTX, DOCX, TXT (max 50MB each)</p>
            </div>
            <Button type="button">Browse Files</Button>
          </div>

          {uploadMutation.isPending && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
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

      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : !documents?.items.length ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
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
                    <tr key={doc.id} className="border-b border-border last:border-0">
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
