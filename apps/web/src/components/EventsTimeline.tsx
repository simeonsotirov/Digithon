import type { Event } from "../api";

type Props = { events: Event[] };

export function EventsTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="empty">No events yet.</p>;
  }

  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id}>
          <time>{new Date(event.created_at).toLocaleTimeString()}</time>
          <span className={event.status}>{event.status}</span>
          <strong>{event.step_name}</strong>
          <small>{event.event_type}</small>
        </li>
      ))}
    </ol>
  );
}
