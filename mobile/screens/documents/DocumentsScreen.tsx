import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import { useGetApplicationsQuery, useGetDocumentsQuery, useUploadDocumentMutation } from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";
import type { UploadFile } from "../../utils/formData";

function fileFromAsset(asset: ImagePicker.ImagePickerAsset): UploadFile {
  const name = asset.fileName ?? `document-${Date.now()}.jpg`;
  const type = asset.mimeType ?? "image/jpeg";
  return { uri: asset.uri, name, type };
}

export function DocumentsScreen() {
  const applications = useGetApplicationsQuery();
  const [applicationId, setApplicationId] = useState<number | undefined>(undefined);
  const documents = useGetDocumentsQuery(applicationId ? { application: applicationId } : undefined);
  const [upload, uploadState] = useUploadDocumentMutation();
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  async function pickAndUpload(id: number, source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera or photo access to upload a document.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setUploadingId(id);
    try {
      await upload({ id, file: fileFromAsset(result.assets[0]) }).unwrap();
    } catch (error) {
      Alert.alert("Upload failed", getErrorMessage(error));
    } finally {
      setUploadingId(null);
    }
  }

  const items = documents.data?.results ?? [];

  return (
    <Screen
      refreshing={documents.isFetching}
      onRefresh={() => {
        void documents.refetch();
        void applications.refetch();
      }}
    >
      <Text style={styles.title}>Documents</Text>
      <Text style={styles.subtitle}>Upload only when a checklist item is requested. Rejection reasons appear on the item.</Text>
      {applications.data && applications.data.results.length > 1 ? (
        <View style={styles.filters}>
          <Button
            title="All applications"
            variant={applicationId === undefined ? "primary" : "secondary"}
            onPress={() => setApplicationId(undefined)}
          />
          {applications.data.results.map((app) => (
            <Button
              key={app.id}
              title={app.reference}
              variant={applicationId === app.id ? "primary" : "secondary"}
              onPress={() => setApplicationId(app.id)}
            />
          ))}
        </View>
      ) : null}
      {documents.isLoading ? <LoadingState /> : null}
      {documents.isError ? (
        <ErrorState message={getErrorMessage(documents.error)} onRetry={() => void documents.refetch()} />
      ) : null}
      {documents.data && items.length === 0 ? (
        <EmptyState title="No documents yet" message="Checklist items appear after an application is created." />
      ) : null}
      {items.map((doc) => (
        <Card key={doc.id}>
          <Text style={styles.name}>{doc.document_type.name}</Text>
          <StatusBadge status={doc.status} />
          {doc.client_note ? <Text style={styles.body}>{doc.client_note}</Text> : null}
          {doc.rejection_reason ? <Text style={styles.rejection}>Reason: {doc.rejection_reason}</Text> : null}
          {doc.reviews
            .filter((review) => review.client_visible_note || review.reason)
            .map((review) => (
              <Text key={review.id} style={styles.meta}>
                Review: {review.client_visible_note || review.reason}
              </Text>
            ))}
          <Text style={styles.meta}>
            {doc.has_file ? `File: ${doc.original_filename || "Uploaded"}` : "No file uploaded"}
            {doc.uploaded_at ? ` · ${formatDateTime(doc.uploaded_at)}` : ""}
          </Text>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button
                title="Camera"
                variant="secondary"
                onPress={() => void pickAndUpload(doc.id, "camera")}
                loading={uploadState.isLoading && uploadingId === doc.id}
              />
            </View>
            <View style={styles.flex}>
              <Button title="Photo library" onPress={() => void pickAndUpload(doc.id, "library")} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.title,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  subtitle: {
    color: theme.colors.muted,
  },
  filters: {
    gap: 8,
  },
  name: {
    fontWeight: "700",
    fontSize: theme.typography.subtitle,
    color: theme.colors.navy,
    marginBottom: 8,
  },
  body: {
    marginTop: 8,
    color: theme.colors.charcoal,
  },
  rejection: {
    marginTop: 8,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  meta: {
    marginTop: 6,
    color: theme.colors.muted,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
});
