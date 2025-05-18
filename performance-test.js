// List of URLs to test
const urls = [
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/layouts',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/route-groups',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/loading',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/error',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/not-found',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/use-link-status',
  'https://opennextjs-cloudflare-653.nxsland.workers.dev/context',
];

// Object to store results
const metrics = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  statusCodes: {},
  totalResponseTime: 0,
  minResponseTime: Number.MAX_SAFE_INTEGER,
  maxResponseTime: 0,
  responseTimeByUrl: {},
};

// Initialize metrics for each URL
urls.forEach((url) => {
  metrics.responseTimeByUrl[url] = {
    count: 0,
    totalTime: 0,
    minTime: Number.MAX_SAFE_INTEGER,
    maxTime: 0,
  };
});

// Function to make a single request to a URL
async function makeRequest(url) {
  const startTime = Date.now();
  try {
    const response = await fetch(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Update metrics
    metrics.totalRequests++;
    metrics.totalResponseTime += responseTime;
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

    // Update URL-specific metrics
    const urlMetrics = metrics.responseTimeByUrl[url];
    urlMetrics.count++;
    urlMetrics.totalTime += responseTime;
    urlMetrics.minTime = Math.min(urlMetrics.minTime, responseTime);
    urlMetrics.maxTime = Math.max(urlMetrics.maxTime, responseTime);

    // Collect status code statistics
    const statusCode = response.status;
    metrics.statusCodes[statusCode] =
      (metrics.statusCodes[statusCode] || 0) + 1;

    if (response.ok) {
      metrics.successRequests++;
    } else {
      metrics.failedRequests++;
    }
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    console.error(`Error (${url}): ${error.message}`);
  }
}

// Show progress (every second)
function showProgress(startTime, durationMinutes) {
  const elapsedTime = (Date.now() - startTime) / 1000;
  const totalTime = durationMinutes * 60;
  const progress = Math.min((elapsedTime / totalTime) * 100, 100).toFixed(2);

  process.stdout.write(
    `\rProgress: ${progress}% | Requests: ${metrics.totalRequests} | Success: ${metrics.successRequests} | Failed: ${metrics.failedRequests}`,
  );
}

// Function to display metrics
function displayMetrics() {
  console.log('\n\n===== Test Results =====');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(
    `Success: ${metrics.successRequests} (${((metrics.successRequests / metrics.totalRequests) * 100).toFixed(2)}%)`,
  );
  console.log(
    `Failed: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)`,
  );

  console.log('\n----- Response Time (ms) -----');
  console.log(
    `Average: ${(metrics.totalResponseTime / metrics.totalRequests).toFixed(2)}`,
  );
  console.log(`Minimum: ${metrics.minResponseTime}`);
  console.log(`Maximum: ${metrics.maxResponseTime}`);

  console.log('\n----- Status Codes -----');
  Object.entries(metrics.statusCodes).forEach(([code, count]) => {
    console.log(
      `${code}: ${count} (${((count / metrics.totalRequests) * 100).toFixed(2)}%)`,
    );
  });

  console.log('\n----- Metrics by URL -----');
  urls.forEach((url) => {
    const urlData = metrics.responseTimeByUrl[url];
    if (urlData.count > 0) {
      console.log(`\n${url}`);
      console.log(`  Request count: ${urlData.count}`);
      console.log(
        `  Average response time: ${(urlData.totalTime / urlData.count).toFixed(2)} ms`,
      );
      console.log(`  Minimum: ${urlData.minTime} ms`);
      console.log(`  Maximum: ${urlData.maxTime} ms`);
    }
  });
}

// Main function to run test
async function runTest(durationMinutes = 30, concurrency = 5) {
  console.log(
    `Test started: Running for ${durationMinutes} minutes with ${concurrency} concurrent requests`,
  );

  const startTime = Date.now();
  const endTime = startTime + durationMinutes * 60 * 1000;

  // Interval for showing progress
  const progressInterval = setInterval(() => {
    showProgress(startTime, durationMinutes);
  }, 1000);

  try {
    // Continue until specified time
    while (Date.now() < endTime) {
      // Array for concurrent requests
      const requests = [];

      // Prepare requests for concurrent execution
      for (let i = 0; i < concurrency; i++) {
        // Randomly select a URL
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        requests.push(makeRequest(randomUrl));
      }

      // Execute concurrent requests
      await Promise.all(requests);
    }
  } catch (error) {
    console.error('Error occurred during test execution:', error);
  } finally {
    clearInterval(progressInterval);
    showProgress(startTime, durationMinutes); // Final progress display
    displayMetrics();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const durationMinutes = args[0] ? parseInt(args[0], 10) : 30;
const concurrency = args[1] ? parseInt(args[1], 10) : 5;

// Run the test
runTest(durationMinutes, concurrency);
