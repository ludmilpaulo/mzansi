import { createApi } from "@reduxjs/toolkit/query/react";

import type {
  ApplicationBucket,
  ApplicationCreateRequest,
  ApplicationDashboard,
  ApplicationDetail,
  ApplicationList,
  Appointment,
  AppointmentCreateRequest,
  AppointmentSlot,
  ClientProfile,
  ClientProfileUpdate,
  Conversation,
  DetailResponse,
  DeviceToken,
  DeviceTokenRequest,
  DocumentSubmission,
  HomeContent,
  Inquiry,
  InquiryCreateRequest,
  Invoice,
  LoginRequest,
  LoginResponse,
  MarkAllReadResponse,
  MeUpdate,
  MeUser,
  Message,
  Notification,
  Paginated,
  PasswordChangeRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterRequest,
  RegisterResponse,
  SendMessageRequest,
  ServiceList,
  ConsultationType,
} from "../types/api";
import { unwrapEnvelope, unwrapList, unwrapPage } from "../utils/envelope";
import { appendUploadFile, type UploadFile } from "../utils/formData";
import { baseQueryWithReauth } from "./baseQuery";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Application",
    "Document",
    "Appointment",
    "Conversation",
    "Message",
    "Notification",
    "Invoice",
    "Service",
    "ClientProfile",
    "Content",
    "Inquiry",
  ],
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<RegisterResponse>(response),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<LoginResponse>(response),
    }),
    getMe: builder.query<MeUser, void>({
      query: () => "/auth/me",
      transformResponse: (response: unknown) => unwrapEnvelope<MeUser>(response),
      providesTags: ["Auth"],
    }),
    updateMe: builder.mutation<MeUser, MeUpdate>({
      query: (body) => ({ url: "/auth/me", method: "PATCH", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<MeUser>(response),
      invalidatesTags: ["Auth"],
    }),
    changePassword: builder.mutation<DetailResponse, PasswordChangeRequest>({
      query: (body) => ({ url: "/auth/password/change", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<DetailResponse>(response),
    }),
    requestPasswordReset: builder.mutation<DetailResponse, PasswordResetRequest>({
      query: (body) => ({ url: "/auth/password/reset", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<DetailResponse>(response),
    }),
    confirmPasswordReset: builder.mutation<DetailResponse, PasswordResetConfirmRequest>({
      query: (body) => ({ url: "/auth/password/reset/confirm", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<DetailResponse>(response),
    }),
    getDashboard: builder.query<ApplicationDashboard, void>({
      query: () => "/applications/dashboard",
      transformResponse: (response: unknown) => unwrapEnvelope<ApplicationDashboard>(response),
      providesTags: ["Application"],
    }),
    getApplications: builder.query<Paginated<ApplicationList>, { bucket?: ApplicationBucket } | void>({
      query: (args) => ({
        url: "/applications",
        params: args && args.bucket ? { bucket: args.bucket } : undefined,
      }),
      transformResponse: (response: unknown) => unwrapPage<ApplicationList>(response),
      providesTags: ["Application"],
    }),
    getApplication: builder.query<ApplicationDetail, number>({
      query: (id) => `/applications/${id}`,
      transformResponse: (response: unknown) => unwrapEnvelope<ApplicationDetail>(response),
      providesTags: (_result, _error, id) => [{ type: "Application", id }],
    }),
    createApplication: builder.mutation<ApplicationDetail, ApplicationCreateRequest>({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<ApplicationDetail>(response),
      invalidatesTags: ["Application"],
    }),
    getDocuments: builder.query<Paginated<DocumentSubmission>, { application?: number } | void>({
      query: (args) => ({
        url: "/documents",
        params: args && args.application ? { application: args.application } : undefined,
      }),
      transformResponse: (response: unknown) => unwrapPage<DocumentSubmission>(response),
      providesTags: ["Document"],
    }),
    uploadDocument: builder.mutation<DocumentSubmission, { id: number; file: UploadFile }>({
      query: ({ id, file }) => {
        const form = new FormData();
        appendUploadFile(form, file);
        return { url: `/documents/${id}/upload`, method: "POST", body: form };
      },
      transformResponse: (response: unknown) => unwrapEnvelope<DocumentSubmission>(response),
      invalidatesTags: ["Document", "Application"],
    }),
    getAppointments: builder.query<Paginated<Appointment>, void>({
      query: () => "/appointments",
      transformResponse: (response: unknown) => unwrapPage<Appointment>(response),
      providesTags: ["Appointment"],
    }),
    createAppointment: builder.mutation<Appointment, AppointmentCreateRequest>({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<Appointment>(response),
      invalidatesTags: ["Appointment"],
    }),
    getAppointmentSlots: builder.query<
      AppointmentSlot[],
      { consultant_id: number; date: string; consultation_type_id?: number }
    >({
      query: (params) => ({ url: "/appointments/slots", params }),
      transformResponse: (response: unknown) => unwrapEnvelope<AppointmentSlot[]>(response),
    }),
    getConsultationTypes: builder.query<ConsultationType[], void>({
      query: () => "/consultation-types",
      transformResponse: (response: unknown) => unwrapList<ConsultationType>(response),
    }),
    getConversations: builder.query<Paginated<Conversation>, void>({
      query: () => "/conversations",
      transformResponse: (response: unknown) => unwrapPage<Conversation>(response),
      providesTags: ["Conversation"],
    }),
    getMessages: builder.query<Message[], number>({
      query: (id) => `/conversations/${id}/messages`,
      transformResponse: (response: unknown) => unwrapEnvelope<Message[]>(response),
      providesTags: (_result, _error, id) => [{ type: "Message", id }],
    }),
    sendMessage: builder.mutation<Message, { id: number; body: SendMessageRequest }>({
      query: ({ id, body }) => ({ url: `/conversations/${id}/messages`, method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<Message>(response),
      invalidatesTags: (_result, _error, arg) => ["Conversation", { type: "Message", id: arg.id }],
    }),
    createInquiry: builder.mutation<Inquiry, InquiryCreateRequest>({
      query: (body) => ({ url: "/inquiries", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<Inquiry>(response),
      invalidatesTags: ["Inquiry"],
    }),
    getNotifications: builder.query<Paginated<Notification>, void>({
      query: () => "/notifications",
      transformResponse: (response: unknown) => unwrapPage<Notification>(response),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<Notification, number>({
      query: (id) => ({ url: `/notifications/${id}/mark_read`, method: "POST" }),
      transformResponse: (response: unknown) => unwrapEnvelope<Notification>(response),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<MarkAllReadResponse, void>({
      query: () => ({ url: "/notifications/mark_all_read", method: "POST" }),
      transformResponse: (response: unknown) => unwrapEnvelope<MarkAllReadResponse>(response),
      invalidatesTags: ["Notification"],
    }),
    getInvoices: builder.query<Paginated<Invoice>, void>({
      query: () => "/invoices",
      transformResponse: (response: unknown) => unwrapPage<Invoice>(response),
      providesTags: ["Invoice"],
    }),
    getServices: builder.query<ServiceList[], void>({
      query: () => "/services",
      transformResponse: (response: unknown) => unwrapList<ServiceList>(response),
      providesTags: ["Service"],
    }),
    getClientProfile: builder.query<ClientProfile, void>({
      query: () => "/clients/profile/me",
      transformResponse: (response: unknown) => unwrapEnvelope<ClientProfile>(response),
      providesTags: ["ClientProfile"],
    }),
    updateClientProfile: builder.mutation<ClientProfile, ClientProfileUpdate>({
      query: (body) => ({ url: "/clients/profile/me", method: "PATCH", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<ClientProfile>(response),
      invalidatesTags: ["ClientProfile", "Auth"],
    }),
    registerDeviceToken: builder.mutation<DeviceToken, DeviceTokenRequest>({
      query: (body) => ({ url: "/device-tokens", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapEnvelope<DeviceToken>(response),
    }),
    getHomeContent: builder.query<HomeContent, void>({
      query: () => "/content/settings/home",
      transformResponse: (response: unknown) => unwrapEnvelope<HomeContent>(response),
      providesTags: ["Content"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useGetDashboardQuery,
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useGetAppointmentSlotsQuery,
  useGetConsultationTypesQuery,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateInquiryMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetInvoicesQuery,
  useGetServicesQuery,
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
  useRegisterDeviceTokenMutation,
  useGetHomeContentQuery,
} = api;
