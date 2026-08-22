import { BookingForm } from "@/components/forms/BookingForm";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function BookConsultationPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Book a consultation</h1>
        <p className="mt-2 text-sm text-muted">Times shown are those still open for the selected consultant.</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Request a time</h2>
        </CardHeader>
        <CardBody>
          <BookingForm />
        </CardBody>
      </Card>
    </div>
  );
}
