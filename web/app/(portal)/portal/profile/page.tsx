"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { useGetClientProfileQuery, useUpdateClientProfileMutation, useUpdateMeMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const meSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(1),
  preferred_language: z.string().min(1),
});

const profileSchema = z.object({
  nationality: z.string(),
  current_country: z.string(),
  date_of_birth: z.string().optional(),
  passport_number: z.string(),
  residential_address: z.string(),
  city: z.string(),
  postal_code: z.string(),
  occupation: z.string(),
  employer: z.string(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
});

type MeValues = z.infer<typeof meSchema>;
type ProfileValues = z.infer<typeof profileSchema>;

export default function PortalProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const profile = useGetClientProfileQuery();
  const [updateMe, meRequest] = useUpdateMeMutation();
  const [updateProfile, profileRequest] = useUpdateClientProfileMutation();
  const meForm = useForm<MeValues>({ resolver: zodResolver(meSchema) });
  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) {
      meForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        preferred_language: user.preferred_language,
      });
    }
  }, [meForm, user]);

  useEffect(() => {
    if (profile.data) {
      profileForm.reset({
        nationality: profile.data.nationality,
        current_country: profile.data.current_country,
        date_of_birth: profile.data.date_of_birth ?? "",
        passport_number: profile.data.passport_number,
        residential_address: profile.data.residential_address,
        city: profile.data.city,
        postal_code: profile.data.postal_code,
        occupation: profile.data.occupation,
        employer: profile.data.employer,
        emergency_contact_name: profile.data.emergency_contact_name,
        emergency_contact_phone: profile.data.emergency_contact_phone,
      });
    }
  }, [profile.data, profileForm]);

  if (profile.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">Profile</h1>
        <p className="mt-2 text-sm text-muted">A complete profile helps your consultant prepare a realistic checklist.</p>
        {profile.data ? (
          <div className="mt-4 max-w-md">
            <p className="mb-2 text-xs text-muted">Profile completeness {profile.data.completion_percent}%</p>
            <ProgressBar value={profile.data.completion_percent} />
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Account</h2>
        </CardHeader>
        <CardBody>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={meForm.handleSubmit((values) => void updateMe(values))}
          >
            <Input label="First name" {...meForm.register("first_name")} />
            <Input label="Last name" {...meForm.register("last_name")} />
            <Input label="Phone" {...meForm.register("phone")} />
            <Input label="Preferred language" {...meForm.register("preferred_language")} />
            {meRequest.isError ? <p className="md:col-span-2 text-sm text-red-600">{getErrorMessage(meRequest.error)}</p> : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={meRequest.isLoading}>
                Save account
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Immigration profile</h2>
        </CardHeader>
        <CardBody>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={profileForm.handleSubmit((values) =>
              void updateProfile({ ...values, date_of_birth: values.date_of_birth || null }),
            )}
          >
            <Input label="Nationality" {...profileForm.register("nationality")} />
            <Input label="Current country" {...profileForm.register("current_country")} />
            <Input type="date" label="Date of birth" {...profileForm.register("date_of_birth")} />
            <Input label="Passport number" {...profileForm.register("passport_number")} />
            <Input className="md:col-span-2" label="Residential address" {...profileForm.register("residential_address")} />
            <Input label="City" {...profileForm.register("city")} />
            <Input label="Postal code" {...profileForm.register("postal_code")} />
            <Input label="Occupation" {...profileForm.register("occupation")} />
            <Input label="Employer" {...profileForm.register("employer")} />
            <Input label="Emergency contact" {...profileForm.register("emergency_contact_name")} />
            <Input label="Emergency phone" {...profileForm.register("emergency_contact_phone")} />
            {profileRequest.isError ? <p className="md:col-span-2 text-sm text-red-600">{getErrorMessage(profileRequest.error)}</p> : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={profileRequest.isLoading}>
                Save profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
