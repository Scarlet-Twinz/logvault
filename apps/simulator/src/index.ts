const API_URL = process.env.API_URL ?? "http://localhost:4000";

const services = [
  "payments",
  "orders",
  "auth",
  "notifications",
];

const normalMessages: Record<string, string[]> = {
  payments: [
    "Payment processed successfully",
    "Payment request completed",
    "Payment gateway response received",
  ],
  orders: [
    "Order processed",
    "Order validation completed",
    "Order successfully created",
  ],
  auth: [
    "User authenticated",
    "Session validated",
    "Authentication request completed",
  ],
  notifications: [
    "Notification delivered",
    "Email notification queued",
    "Push notification sent",
  ],
};

const warningMessages = [
  "Request processing slower than expected",
  "External service response delayed",
  "Queue latency increased",
];

const errorMessages = [
  "Database timeout",
  "Service unavailable",
  "Request processing failed",
];

let spikeMode = process.env.SPIKE_MODE === "true";
let running = true;

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createEvent() {
  const service = randomItem(services);

  let level: "INFO" | "WARN" | "ERROR";
  let message: string;

  if (spikeMode) {
    level = Math.random() < 0.9 ? "ERROR" : "WARN";
    message = randomItem(errorMessages);
  } else {
    const roll = Math.random();

    if (roll < 0.75) {
      level = "INFO";
      message = randomItem(normalMessages[service]);
    } else if (roll < 0.95) {
      level = "WARN";
      message = randomItem(warningMessages);
    } else {
      level = "ERROR";
      message = randomItem(errorMessages);
    }
  }

  return {
    service,
    level,
    message,
    source: "logvault-simulator",
    metadata: {
      simulated: true,
      spikeMode,
    },
  };
}

async function sendEvent() {
  const event = createEvent();

  try {
    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error(
        `[simulator] API returned ${response.status}`,
      );
      return;
    }

    const result = await response.json();

    console.log(
      `[simulator] ${event.level.padEnd(5)} ${event.service.padEnd(15)} ${event.message} | job=${result.jobId}`,
    );
  } catch {
    console.error(
      "[simulator] Failed to send event. Is the API running?",
    );
  }
}

async function run() {
  console.log("LogVault event simulator started");
  console.log(`API: ${API_URL}`);

  if (spikeMode) {
    console.log("🚨 SPIKE MODE ENABLED");
  } else {
    console.log("Normal traffic mode");
  }

  while (running) {
    await sendEvent();

    const delay = spikeMode
      ? 500
      : 1200 + Math.random() * 1800;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

process.on("SIGINT", () => {
  running = false;
  console.log("\n[simulator] Stopped");
  process.exit(0);
});

run();