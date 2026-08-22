export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export function appendUploadFile(form: FormData, file: UploadFile): void {
  // React Native FormData accepts a file descriptor; DOM typings expect Blob.
  form.append("file", file as unknown as Blob);
}
