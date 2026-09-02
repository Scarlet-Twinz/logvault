import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../styles/dashboard.module.css";

type EventItem = {
  id: string;
  service: string;
  level: string;
  message: string;
  timestamp: string;
};

type Anomaly = {
  id: string;
  service: string;
  metric: string;
  score: number;
  severity: string;
  description: string;
  detectedAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Dashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [eventsResponse, anomaliesResponse] = await Promise.all([
          fetch(`${API_URL}/events?limit=50`),
          fetch(`${API_URL}/anomalies?limit=20`),
        ]);

        if (!eventsResponse.ok || !anomaliesResponse.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const eventsData = await eventsResponse.json();
        const anomaliesData = await anomaliesResponse.json();

        setEvents(eventsData.events ?? []);
        setAnomalies(anomaliesData.anomalies ?? []);
      } catch (error) {
        console.error("Failed to load initial dashboard data:", error);
      }
    }

    loadInitialData();

    const socket: Socket = io(API_URL);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("event:processed", (event: EventItem) => {
      setEvents((current) => {
        const exists = current.some((item) => item.id === event.id);

        if (exists) {
          return current;
        }

        return [event, ...current].slice(0, 50);
      });
    });

    socket.on("anomaly:detected", (anomaly: Anomaly) => {
      setAnomalies((current) => {
        const exists = current.some((item) => item.id === anomaly.id);

        if (exists) {
          return current;
        }

        return [anomaly, ...current].slice(0, 20);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    const errors = events.filter(
      (event) => event.level === "ERROR",
    ).length;

    const warnings = events.filter(
      (event) => event.level === "WARN",
    ).length;

    const services = new Set(
      events.map((event) => event.service),
    ).size;

    return {
      total: events.length,
      errors,
      warnings,
      anomalies: anomalies.length,
      services,
    };
  }, [events, anomalies]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>LOGVAULT</div>

          <h1>Real-Time Event Intelligence</h1>

          <p>
            Distributed event processing, analytics and anomaly detection.
          </p>
        </div>

        <div
          className={`${styles.status} ${
            connected ? styles.online : styles.offline
          }`}
        >
          <span />
          {connected ? "LIVE" : "DISCONNECTED"}
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <span>Total Events</span>
          <strong>{stats.total}</strong>
        </div>

        <div className={styles.stat}>
          <span>Errors</span>
          <strong>{stats.errors}</strong>
        </div>

        <div className={styles.stat}>
          <span>Warnings</span>
          <strong>{stats.warnings}</strong>
        </div>

        <div className={styles.stat}>
          <span>Anomalies</span>
          <strong>{stats.anomalies}</strong>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Live Event Stream</h2>
              <span>
                Events processed by the worker
              </span>
            </div>

            <span className={styles.counter}>
              {events.length}
            </span>
          </div>

          <div className={styles.eventList}>
            {events.length === 0 ? (
              <div className={styles.empty}>
                Waiting for events...
              </div>
            ) : (
              events.map((event) => (
                <article
                  className={styles.event}
                  key={event.id}
                >
                  <div
                    className={`${styles.level} ${
                      styles[event.level.toLowerCase()]
                    }`}
                  >
                    {event.level}
                  </div>

                  <div className={styles.eventBody}>
                    <div className={styles.eventTop}>
                      <strong>{event.service}</strong>

                      <time>
                        {new Date(
                          event.timestamp,
                        ).toLocaleTimeString()}
                      </time>
                    </div>

                    <p>{event.message}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Anomaly Detection</h2>

              <span>
                Statistical deviations from baseline
              </span>
            </div>

            <span className={styles.counter}>
              {anomalies.length}
            </span>
          </div>

          <div className={styles.anomalyList}>
            {anomalies.length === 0 ? (
              <div className={styles.empty}>
                No anomalies detected.
              </div>
            ) : (
              anomalies.map((anomaly) => (
                <article
                  className={styles.anomaly}
                  key={anomaly.id}
                >
                  <div className={styles.anomalyTop}>
                    <span
                      className={`${styles.severity} ${
                        styles[
                          anomaly.severity.toLowerCase()
                        ]
                      }`}
                    >
                      {anomaly.severity}
                    </span>

                    <span>
                      {new Date(
                        anomaly.detectedAt,
                      ).toLocaleTimeString()}
                    </span>
                  </div>

                  <strong>{anomaly.service}</strong>

                  <p>{anomaly.description}</p>

                  <div className={styles.score}>
                    Score{" "}
                    <b>
                      {anomaly.score.toFixed(2)}x
                    </b>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
