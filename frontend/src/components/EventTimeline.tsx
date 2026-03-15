import type { TaskEvent } from "../types/types";

type EventTimelineProps = {
  events: TaskEvent[];
};

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return <div className="emptyState">No events recorded yet.</div>;
  }

  return (
    <div className="timeline">
      {events.map((event) => (
        <div className="timelineItem" key={`${event.eventType}-${event.createdAt}`}>
          <div className="timelineDot" />
          <div className="timelineContent">
            <div className="timelineMeta">
              <span>{formatTime(event.createdAt)}</span>
              <strong>{event.eventType}</strong>
            </div>
            <code className="payloadBlock">{event.payloadJson}</code>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}
