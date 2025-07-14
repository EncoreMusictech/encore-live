import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncLicense } from "@/hooks/useSyncLicenses";
import { format, isSameDay, parseISO } from "date-fns";

interface SyncLicenseCalendarProps {
  licenses: SyncLicense[];
  isLoading: boolean;
}

export const SyncLicenseCalendar = ({ licenses, isLoading }: SyncLicenseCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Inquiry":
        return "bg-blue-100 text-blue-800";
      case "Negotiating":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "Licensed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get all dates that have events
  const getDatesWithEvents = () => {
    const eventDates = new Set<string>();
    
    licenses.forEach(license => {
      if (license.request_received) {
        eventDates.add(license.request_received);
      }
      if (license.term_start) {
        eventDates.add(license.term_start);
      }
      if (license.term_end) {
        eventDates.add(license.term_end);
      }
      if (license.approval_issued) {
        eventDates.add(license.approval_issued);
      }
      if (license.license_issued) {
        eventDates.add(license.license_issued);
      }
      if (license.payment_received) {
        eventDates.add(license.payment_received);
      }
    });

    return Array.from(eventDates).map(date => parseISO(date));
  };

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    const events: { license: SyncLicense; type: string; description: string }[] = [];

    licenses.forEach(license => {
      if (license.request_received && isSameDay(parseISO(license.request_received), date)) {
        events.push({
          license,
          type: "request",
          description: "Request received"
        });
      }
      if (license.term_start && isSameDay(parseISO(license.term_start), date)) {
        events.push({
          license,
          type: "term_start",
          description: "Term starts"
        });
      }
      if (license.term_end && isSameDay(parseISO(license.term_end), date)) {
        events.push({
          license,
          type: "term_end",
          description: "Term ends"
        });
      }
      if (license.approval_issued && isSameDay(parseISO(license.approval_issued), date)) {
        events.push({
          license,
          type: "approval",
          description: "Approval issued"
        });
      }
      if (license.license_issued && isSameDay(parseISO(license.license_issued), date)) {
        events.push({
          license,
          type: "license",
          description: "License issued"
        });
      }
      if (license.payment_received && isSameDay(parseISO(license.payment_received), date)) {
        events.push({
          license,
          type: "payment",
          description: "Payment received"
        });
      }
    });

    return events;
  };

  const eventDates = getDatesWithEvents();
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) {
    return <div className="text-center p-8">Loading calendar view...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border w-full"
          modifiers={{
            hasEvents: eventDates
          }}
          modifiersStyles={{
            hasEvents: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
          }}
        />
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No events for this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {event.license.project_title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.license.synch_id}
                        </div>
                      </div>
                      <Badge className={getStatusColor(event.license.synch_status)}>
                        {event.license.synch_status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium text-primary">
                        {event.description}
                      </div>
                      
                      {event.license.synch_agent && (
                        <div className="text-muted-foreground text-xs mt-1">
                          Agent: {event.license.synch_agent}
                        </div>
                      )}
                      
                      {event.license.media_type && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {event.license.media_type}
                        </Badge>
                      )}
                      
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            (event.license.pub_fee || 0) + (event.license.master_fee || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};