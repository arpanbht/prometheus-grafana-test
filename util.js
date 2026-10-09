import client from "prom-client";

// Random value generator
function getRandomValue(values) {
  return values[Math.floor(Math.random() * values.length)];
}

// Simulates a slow task with random delay and potential error
function defineSlowTask() {
  const ms = getRandomValue([
    100, 150, 200, 300, 500, 600, 1000, 1400, 2500, 3000, 4000, 5000, 6000,
    7000, 8000, 9000, 10000,
  ]);

  const shouldThrowError = getRandomValue([1, 2, 3, 4, 5, 6, 7, 8]) === 8;

  if (shouldThrowError) {
    const randomError = getRandomValue([
      "DB Payment Failure",
      "DB Server is Down",
      "Access Denied",
      "Not Found Error",
      "Internal Server Error",
    ]);

    throw new Error(randomError);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

// Metric colletion function
const collectDefaultMetrics = () => {
  client.collectDefaultMetrics();
};

export { defineSlowTask, collectDefaultMetrics };
