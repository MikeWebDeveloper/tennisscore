const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Simple visual comparison tool for screenshots
 * Uses ImageMagick's compare command if available
 */
class VisualCompare {
  constructor() {
    this.baselineDir = path.join(__dirname, '../__tests__/visual-baseline');
    this.currentDir = path.join(__dirname, '../__tests__/visual-current');
    this.diffDir = path.join(__dirname, '../__tests__/visual-diff');
    this.reportPath = path.join(__dirname, '../visual-comparison-report.html');
  }

  compareImages(imageName) {
    const baseline = path.join(this.baselineDir, imageName);
    const current = path.join(this.currentDir, imageName);
    const diff = path.join(this.diffDir, imageName);

    if (!fs.existsSync(baseline)) {
      console.log(`No baseline exists for ${imageName}. Creating baseline from current.`);
      fs.copyFileSync(current, baseline);
      return { status: 'new', difference: 0 };
    }

    try {
      // Try to use ImageMagick compare if available
      const result = execSync(
        `compare -metric AE "${baseline}" "${current}" "${diff}" 2>&1`,
        { encoding: 'utf8' }
      );
      
      const pixelDiff = parseInt(result.trim());
      return { status: 'compared', difference: pixelDiff };
    } catch (error) {
      // If ImageMagick is not available, just check file sizes as a basic comparison
      const baselineStats = fs.statSync(baseline);
      const currentStats = fs.statSync(current);
      
      if (baselineStats.size !== currentStats.size) {
        return { status: 'different', difference: Math.abs(baselineStats.size - currentStats.size) };
      }
      
      return { status: 'same', difference: 0 };
    }
  }

  generateHTMLReport(comparisons) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Comparison Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .comparison {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .comparison h2 {
      margin-top: 0;
      color: #555;
    }
    .images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .image-container {
      text-align: center;
    }
    .image-container img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
    }
    .status.new {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status.same {
      background: #e8f5e9;
      color: #388e3c;
    }
    .status.different {
      background: #ffebee;
      color: #d32f2f;
    }
    .timestamp {
      color: #999;
      font-size: 14px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Comparison Report</h1>
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    
    ${comparisons.map(comp => `
      <div class="comparison">
        <h2>${comp.name}</h2>
        <div class="status ${comp.status}">
          Status: ${comp.status.toUpperCase()}
          ${comp.difference > 0 ? `(${comp.difference} pixels different)` : ''}
        </div>
        <div class="images">
          <div class="image-container">
            <h3>Baseline</h3>
            <img src="file://${comp.baseline}" alt="Baseline">
          </div>
          <div class="image-container">
            <h3>Current</h3>
            <img src="file://${comp.current}" alt="Current">
          </div>
          ${comp.diff ? `
            <div class="image-container">
              <h3>Difference</h3>
              <img src="file://${comp.diff}" alt="Difference">
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;

    fs.writeFileSync(this.reportPath, html);
    console.log(`Report generated: ${this.reportPath}`);
    return this.reportPath;
  }

  runComparison() {
    if (!fs.existsSync(this.currentDir)) {
      console.error('No current screenshots found. Run visual tests first.');
      return;
    }

    // Create directories if they don't exist
    [this.baselineDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const screenshots = fs.readdirSync(this.currentDir).filter(f => f.endsWith('.png'));
    const comparisons = [];

    for (const screenshot of screenshots) {
      console.log(`Comparing ${screenshot}...`);
      const result = this.compareImages(screenshot);
      
      comparisons.push({
        name: screenshot,
        status: result.status,
        difference: result.difference,
        baseline: path.join(this.baselineDir, screenshot),
        current: path.join(this.currentDir, screenshot),
        diff: result.status === 'compared' ? path.join(this.diffDir, screenshot) : null,
      });
    }

    return this.generateHTMLReport(comparisons);
  }
}

// Run if called directly
if (require.main === module) {
  const comparer = new VisualCompare();
  const reportPath = comparer.runComparison();
  
  // Try to open the report in the default browser
  const platform = process.platform;
  const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  
  try {
    execSync(`${openCommand} "${reportPath}"`);
  } catch (e) {
    console.log('Could not open report automatically. Please open:', reportPath);
  }
}

module.exports = VisualCompare;