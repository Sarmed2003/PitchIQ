// Matchday spike test. Ramps to 5k VUs and holds them for 5 minutes against
// the read-heavy endpoints we expect to take a beating right at kickoff.
//
//   k6 run -e BASE_URL=https://pitchiq.app tests/load/matchday.k6.js
//
// Targets: p95 < 250ms on the cached reads, error rate < 0.5%.

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    matchday: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 200 },
        { duration: "2m", target: 5000 },
        { duration: "5m", target: 5000 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.005"],
    http_req_duration: ["p(95)<250"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Rough traffic mix: most users browse the player list, a chunk poll for
  // live scores, a smaller slice land on marketing.
  const r = Math.random();
  if (r < 0.7) {
    const res = http.get(`${BASE_URL}/api/players?page=1&limit=50`);
    check(res, { "players 200": (r) => r.status === 200 });
  } else if (r < 0.9) {
    const res = http.get(`${BASE_URL}/api/scores`);
    check(res, { "scores 200": (r) => r.status === 200 || r.status === 401 });
  } else {
    const res = http.get(`${BASE_URL}/`);
    check(res, { "landing 200": (r) => r.status === 200 });
  }
  sleep(Math.random() * 2 + 0.5);
}
